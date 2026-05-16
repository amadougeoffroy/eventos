'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, Guest, GuestGroup, EventTable, MenuItem, MenuCategory, Order, Venue } from '@/lib/types';
import {
  mockEvents, mockGuests, mockGuestGroups, mockTables,
  mockMenuCategories, mockMenuItems, mockOrders
} from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch profile from profiles table
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
      } catch {
        // Not authenticated — currentUser stays empty
      } finally {
        setAuthLoading(false);
      }
    };

    fetchUser();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(prev => ({
          ...prev,
          id: session.user.id,
          email: session.user.email || prev.email,
          name: session.user.user_metadata?.full_name || prev.name,
        }));
      } else {
        setCurrentUser({ id: '', name: '', email: '' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Events (localStorage for now, will migrate to Supabase) ───
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const EVENTS_KEY = 'eventos-events';
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EVENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map((e: Event) => e.id));
          const mockById = new Map(mockEvents.map(e => [e.id, e]));
          const merged = [
            ...parsed.map((e: Event) => ({
              ...e,
              plan: e.plan || mockById.get(e.id)?.plan,
            })),
            ...mockEvents.filter(e => !savedIds.has(e.id)),
          ];
          setEvents(merged);
        }
      }
    } catch {}
  }, []);
  const syncEvents = (next: Event[]) => {
    try { localStorage.setItem(EVENTS_KEY, JSON.stringify(next)); } catch {}
    return next;
  };

  // ─── Other state (mock for now) ───
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

  // ─── Events CRUD ───
  const addEvent = (event: Event) => setEvents(prev => syncEvents([event, ...prev]));
  const updateEvent = (id: string, updates: Partial<Event>) =>
    setEvents(prev => syncEvents(prev.map(e => e.id === id ? { ...e, ...updates } : e)));
  const removeEvent = (id: string) => setEvents(prev => syncEvents(prev.filter(e => e.id !== id)));

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
