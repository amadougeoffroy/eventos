'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Event, Guest, GuestGroup, EventTable, MenuItem, MenuCategory, Order, Venue } from '@/lib/types';
import {
  mockGuests, mockGuestGroups, mockTables,
  mockMenuCategories, mockMenuItems, mockOrders
} from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';
import { dbEventToApp, appEventToDb } from '@/lib/supabase/mappers';

interface AppState {
  events: Event[];
  guests: Guest[];
  guestGroups: GuestGroup[];
  tables: EventTable[];
  tablesReady: boolean;
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  venues: Venue[];
  orders: Order[];
  currentUser: { id: string; name: string; email: string; avatar?: string };
  authLoading: boolean;
}

interface AppActions {
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  removeEvent: (id: string) => void;
  addGuest: (guest: Guest) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  removeGuest: (id: string) => void;
  addGuestGroup: (group: GuestGroup) => void;
  updateGuestGroup: (id: string, updates: Partial<GuestGroup>) => void;
  removeGuestGroup: (id: string) => void;
  addTable: (table: EventTable) => void;
  updateTable: (id: string, updates: Partial<EventTable>) => void;
  removeTable: (id: string) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  addMenuCategory: (cat: MenuCategory) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  addOrder: (order: Order) => void;
  addVenue: (venue: Venue) => void;
  updateVenue: (id: string, updates: Partial<Venue>) => void;
  removeVenue: (id: string) => void;
}

const AppContext = createContext<(AppState & AppActions) | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();

  // ─── Auth user from Supabase ───
  const [currentUser, setCurrentUser] = useState<AppState['currentUser']>({
    id: '', name: '', email: '',
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('id', user.id)
            .single();

          setCurrentUser({
            id: user.id,
            name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            email: profile?.email || user.email || '',
            avatar: profile?.avatar_url || undefined,
          });
        }
      } catch {} finally {
        setAuthLoading(false);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setCurrentUser(prev => ({
          ...prev,
          id: session.user.id,
          email: session.user.email || prev.email,
          name: session.user.user_metadata?.full_name || prev.name,
        }));
      } else {
        setUserId(null);
        setCurrentUser({ id: '', name: '', email: '' });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // EVENTS — Supabase powered 🚀
  // ═══════════════════════════════════════════════════════════
  const [events, setEvents] = useState<Event[]>([]);

  // Load events from Supabase when user is authenticated
  useEffect(() => {
    if (!userId) return;

    const loadEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEvents(data.map(dbEventToApp));
      }
    };
    loadEvents();
  }, [userId]);

  const addEvent = useCallback(async (event: Event) => {
    if (!userId) return;

    // Optimistic update
    setEvents(prev => [event, ...prev]);

    const payload = {
      ...appEventToDb({ ...event, userId }),
      slug: event.slug,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      // Replace the optimistic event with the real one (correct id)
      const realEvent = dbEventToApp(data);
      setEvents(prev => prev.map(e => e.id === event.id ? realEvent : e));
    } else {
      // Rollback on error
      console.error('Error creating event:', error);
      setEvents(prev => prev.filter(e => e.id !== event.id));
    }
  }, [userId, supabase]);

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    // Optimistic update
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));

    const payload = appEventToDb(updates);
    const { error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error updating event:', error);
    }
  }, [supabase]);

  const removeEvent = useCallback(async (id: string) => {
    // Optimistic update
    const backup = events;
    setEvents(prev => prev.filter(e => e.id !== id));

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      setEvents(backup); // Rollback
    }
  }, [supabase, events]);

  // ═══════════════════════════════════════════════════════════
  // OTHER DATA — Still localStorage (will migrate next)
  // ═══════════════════════════════════════════════════════════
  const [guests, setGuests] = useState<Guest[]>(mockGuests);
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>(mockGuestGroups);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(mockMenuCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [venues, setVenues] = useState<Venue[]>([]);

  // ─── Venues localStorage persistence ───
  const VENUES_KEY = 'eventos-venues';
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VENUES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setVenues(parsed);
      }
    } catch {}
  }, []);
  const syncVenues = (next: Venue[]) => {
    try { localStorage.setItem(VENUES_KEY, JSON.stringify(next)); } catch {}
    return next;
  };

  // ─── Guests CRUD ───
  const addGuest = (guest: Guest) => setGuests(prev => [...prev, guest]);
  const updateGuest = (id: string, updates: Partial<Guest>) =>
    setGuests(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  const removeGuest = (id: string) => setGuests(prev => prev.filter(g => g.id !== id));

  // ─── Guest Groups CRUD ───
  const addGuestGroup = (group: GuestGroup) => setGuestGroups(prev => [...prev, group]);
  const updateGuestGroup = (id: string, updates: Partial<GuestGroup>) =>
    setGuestGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  const removeGuestGroup = (id: string) => setGuestGroups(prev => prev.filter(g => g.id !== id));

  // ─── Tables with localStorage persistence ───
  const TABLES_KEY = 'eventos-tables';
  const [tables, setTables] = useState<EventTable[]>(mockTables);
  const [tablesReady, setTablesReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TABLES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTables(parsed);
      }
    } catch {}
    setTablesReady(true);
  }, []);
  const syncTables = (next: EventTable[]) => {
    try { localStorage.setItem(TABLES_KEY, JSON.stringify(next)); } catch {}
    return next;
  };
  const addTable = (table: EventTable) => setTables(prev => {
    if (prev.find(t => t.id === table.id)) return prev;
    return syncTables([...prev, table]);
  });
  const updateTable = (id: string, updates: Partial<EventTable>) => setTables(prev =>
    syncTables(prev.map(t => t.id === id ? { ...t, ...updates } : t))
  );
  const removeTable = (id: string) => setTables(prev =>
    syncTables(prev.filter(t => t.id !== id))
  );

  // ─── Menu CRUD ───
  const addMenuItem = (item: MenuItem) => setMenuItems(prev => [...prev, item]);
  const updateMenuItem = (id: string, updates: Partial<MenuItem>) =>
    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  const addMenuCategory = (cat: MenuCategory) =>
    setMenuCategories(prev => [...prev, cat]);

  // ─── Orders CRUD ───
  const addOrder = (order: Order) => setOrders(prev => [...prev, order]);
  const updateOrder = (id: string, updates: Partial<Order>) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

  // ─── Venues CRUD ───
  const addVenue = (venue: Venue) => setVenues(prev => syncVenues([...prev, venue]));
  const updateVenue = (id: string, updates: Partial<Venue>) =>
    setVenues(prev => syncVenues(prev.map(v => v.id === id ? { ...v, ...updates } : v)));
  const removeVenue = (id: string) => setVenues(prev => syncVenues(prev.filter(v => v.id !== id)));

  return (
    <AppContext.Provider value={{
      events, guests, guestGroups, tables, tablesReady, menuCategories, menuItems, venues, orders,
      currentUser, authLoading,
      addEvent, updateEvent, removeEvent, addGuest, updateGuest, removeGuest,
      addGuestGroup, updateGuestGroup, removeGuestGroup,
      addTable, updateTable, removeTable, addMenuItem, updateMenuItem, addMenuCategory,
      addOrder, updateOrder, addVenue, updateVenue, removeVenue,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
