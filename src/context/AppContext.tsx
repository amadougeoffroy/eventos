'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Event, Guest, GuestGroup, EventTable, MenuItem, MenuCategory, Order, Venue } from '@/lib/types';
import {
  mockTables,
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
  eventsLoading: boolean;
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
  const [eventsLoading, setEventsLoading] = useState(true);

  // Load events + program items from Supabase when user is authenticated
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish first
    if (!userId) { setEventsLoading(false); return; }

    const loadEvents = async () => {
      const { data: eventsData, error: eventsErr } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (eventsErr || !eventsData) return;

      // Load all program items for these events
      const eventIds = eventsData.map(e => e.id);
      const { data: programData } = await supabase
        .from('program_items')
        .select('*')
        .in('event_id', eventIds.length > 0 ? eventIds : ['__none__'])
        .order('sort_order', { ascending: true });

      const programByEvent = new Map<string, Event['program']>();
      (programData || []).forEach((row: any) => {
        const items = programByEvent.get(row.event_id) || [];
        items.push({
          id: row.id,
          time: row.time || '',
          title: row.title || '',
          description: row.description || '',
          icon: row.icon || '🎉',
          venueId: row.venue_id || undefined,
        });
        programByEvent.set(row.event_id, items);
      });

      setEvents(eventsData.map(row => ({
        ...dbEventToApp(row),
        program: programByEvent.get(row.id as string) || [],
      })));
      setEventsLoading(false);
    };
    loadEvents();
  }, [userId, authLoading]);

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
      const realEvent = dbEventToApp(data);

      // Save program items
      if (event.program && event.program.length > 0) {
        const programRows = event.program.map((item, idx) => ({
          event_id: data.id,
          time: item.time || '00:00',
          title: item.title || '',
          description: item.description || '',
          icon: item.icon || '🎉',
          venue_id: item.venueId || null,
          sort_order: idx,
        }));

        const { data: savedProgram } = await supabase
          .from('program_items')
          .insert(programRows)
          .select();

        if (savedProgram) {
          realEvent.program = savedProgram.map((row: any) => ({
            id: row.id,
            time: row.time || '',
            title: row.title || '',
            description: row.description || '',
            icon: row.icon || '🎉',
            venueId: row.venue_id || undefined,
          }));
        }
      }

      setEvents(prev => prev.map(e => e.id === event.id ? realEvent : e));
    } else {
      console.error('Error creating event:', error?.message, error?.code, error?.details, JSON.stringify(error));
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
  const [guests, setGuests] = useState<Guest[]>([]);

  // Load guests from Supabase
  useEffect(() => {
    if (!userId) return;

    const loadGuests = async () => {
      const { data: userEvents } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', userId);

      if (!userEvents || userEvents.length === 0) return;

      const eventIds = userEvents.map(e => e.id);
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setGuests(data.map((row: any) => ({
          id: row.id,
          eventId: row.event_id,
          firstName: row.first_name || '',
          lastName: row.last_name || '',
          email: row.email || '',
          phone: row.phone || '',
          group: row.group || 'Invités',
          rsvpStatus: row.rsvp_status || 'pending',
          token: row.token || '',
          companions: row.companions || 0,
          tableId: row.table_id || undefined,
          allergies: row.allergies || '',
          dietaryRestrictions: row.dietary_restrictions || [],
          side: row.side || undefined,
          respondedAt: row.updated_at || undefined,
        })));
      }
    };
    loadGuests();
  }, [userId]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(mockMenuCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [venues, setVenues] = useState<Venue[]>([]);

  // ═══════════════════════════════════════════════════════════
  // GUEST GROUPS — Supabase powered 🚀
  // ═══════════════════════════════════════════════════════════
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([]);

  // Load guest groups from Supabase
  useEffect(() => {
    if (!userId) return;

    const loadGroups = async () => {
      // Get all event IDs for this user first
      const { data: userEvents } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', userId);

      if (!userEvents || userEvents.length === 0) return;

      const eventIds = userEvents.map(e => e.id);
      const { data, error } = await supabase
        .from('guest_groups')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setGuestGroups(data.map((row: any) => ({
          id: row.id,
          eventId: row.event_id,
          name: row.name,
          emoji: row.emoji || '👥',
          color: row.color || '#C8A96E',
          description: row.description || '',
        })));
      }
    };
    loadGroups();
  }, [userId]);

  const addGuestGroup = useCallback(async (group: GuestGroup) => {
    // Optimistic update
    setGuestGroups(prev => [...prev, group]);

    const { data, error } = await supabase
      .from('guest_groups')
      .insert({
        event_id: group.eventId,
        name: group.name,
        emoji: group.emoji,
        color: group.color,
        description: group.description || '',
      })
      .select()
      .single();

    if (!error && data) {
      // Replace optimistic entry with real one
      const real: GuestGroup = {
        id: data.id,
        eventId: data.event_id,
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        description: data.description || '',
      };
      setGuestGroups(prev => prev.map(g => g.id === group.id ? real : g));
    } else {
      console.error('Error creating group:', error);
      setGuestGroups(prev => prev.filter(g => g.id !== group.id));
    }
  }, [supabase]);

  const updateGuestGroup = useCallback(async (id: string, updates: Partial<GuestGroup>) => {
    // Optimistic update
    setGuestGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.emoji !== undefined) payload.emoji = updates.emoji;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.description !== undefined) payload.description = updates.description;

    const { error } = await supabase
      .from('guest_groups')
      .update(payload)
      .eq('id', id);

    if (error) console.error('Error updating group:', error);
  }, [supabase]);

  const removeGuestGroup = useCallback(async (id: string) => {
    const backup = guestGroups;
    setGuestGroups(prev => prev.filter(g => g.id !== id));

    const { error } = await supabase
      .from('guest_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting group:', error);
      setGuestGroups(backup);
    }
  }, [supabase, guestGroups]);

  // ═══════════════════════════════════════════════════════════
  // VENUES — Supabase powered 🚀
  // ═══════════════════════════════════════════════════════════

  // Load venues from Supabase
  useEffect(() => {
    if (!userId) return;

    const loadVenues = async () => {
      const { data: userEvents } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', userId);

      if (!userEvents || userEvents.length === 0) return;

      const eventIds = userEvents.map(e => e.id);
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .in('event_id', eventIds);

      if (!error && data) {
        setVenues(data.map((v: any) => ({
          id: v.id,
          eventId: v.event_id,
          name: v.name,
          address: v.address || '',
          lat: v.lat,
          lng: v.lng,
          emoji: v.emoji || '📍',
          type: v.type || '',
        })));

        // Migrate localStorage venues that don't exist in Supabase
        try {
          const saved = localStorage.getItem('eventos-venues');
          if (saved) {
            const localVenues = JSON.parse(saved);
            if (Array.isArray(localVenues) && localVenues.length > 0) {
              const supaIds = new Set(data.map((v: any) => v.id));
              const toMigrate = localVenues.filter((v: any) =>
                !supaIds.has(v.id) && eventIds.includes(v.eventId)
              );
              if (toMigrate.length > 0) {
                const rows = toMigrate.map((v: any) => ({
                  id: v.id,
                  event_id: v.eventId,
                  name: v.name,
                  address: v.address || '',
                  lat: v.lat || null,
                  lng: v.lng || null,
                  emoji: v.emoji || '📍',
                  type: v.type || '',
                }));
                await supabase.from('venues').upsert(rows);
                // Reload after migration
                const { data: refreshed } = await supabase
                  .from('venues')
                  .select('*')
                  .in('event_id', eventIds);
                if (refreshed) {
                  setVenues(refreshed.map((v: any) => ({
                    id: v.id, eventId: v.event_id, name: v.name,
                    address: v.address || '', lat: v.lat, lng: v.lng,
                    emoji: v.emoji || '📍', type: v.type || '',
                  })));
                }
                localStorage.removeItem('eventos-venues');
              }
            }
          }
        } catch {}
      }
    };
    loadVenues();
  }, [userId]);

  // ─── Guests CRUD ───
  const addGuest = useCallback(async (guest: Guest) => {
    // Optimistic update
    setGuests(prev => [...prev, guest]);

    // Persist to Supabase
    const { data, error } = await supabase
      .from('guests')
      .insert({
        event_id: guest.eventId,
        first_name: guest.firstName,
        last_name: guest.lastName || '',
        email: guest.email || null,
        phone: guest.phone || null,
        group: guest.group || 'Invités',
        rsvp_status: guest.rsvpStatus || 'pending',
        token: guest.token || `tok-${Date.now()}`,
        companions: guest.companions || 0,
        allergies: guest.allergies || null,
        side: guest.side || null,
      })
      .select()
      .single();

    if (!error && data) {
      // Replace temp ID with real Supabase ID
      setGuests(prev => prev.map(g =>
        g.id === guest.id ? { ...g, id: data.id } : g
      ));
    } else if (error) {
      console.error('addGuest error:', error);
    }
  }, [supabase]);

  const updateGuest = useCallback(async (id: string, updates: Partial<Guest>) => {
    // Optimistic update
    setGuests(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));

    // Persist to Supabase
    const payload: Record<string, unknown> = {};
    if (updates.firstName !== undefined) payload.first_name = updates.firstName;
    if (updates.lastName !== undefined) payload.last_name = updates.lastName;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.group !== undefined) payload.group = updates.group;
    if (updates.rsvpStatus !== undefined) payload.rsvp_status = updates.rsvpStatus;
    if (updates.companions !== undefined) payload.companions = updates.companions;
    if (updates.allergies !== undefined) payload.allergies = updates.allergies;
    if (updates.tableId !== undefined) payload.table_id = updates.tableId;
    if (updates.side !== undefined) payload.side = updates.side;

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase
        .from('guests')
        .update(payload)
        .eq('id', id);
      if (error) console.error('updateGuest error:', error);
    }
  }, [supabase]);

  const removeGuest = useCallback(async (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
    const { error } = await supabase.from('guests').delete().eq('id', id);
    if (error) console.error('removeGuest error:', error);
  }, [supabase]);

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

  // ─── Venues CRUD (Supabase) ───
  const addVenue = useCallback(async (venue: Venue) => {
    setVenues(prev => [...prev, venue]);

    const { data, error } = await supabase
      .from('venues')
      .insert({
        id: venue.id,
        event_id: venue.eventId,
        name: venue.name,
        address: venue.address || '',
        lat: venue.lat || null,
        lng: venue.lng || null,
        emoji: venue.emoji || '📍',
        type: venue.type || '',
      })
      .select()
      .single();

    if (!error && data) {
      const real: Venue = {
        id: data.id, eventId: data.event_id, name: data.name,
        address: data.address || '', lat: data.lat, lng: data.lng,
        emoji: data.emoji || '📍', type: data.type || '',
      };
      setVenues(prev => prev.map(v => v.id === venue.id ? real : v));
    } else {
      console.error('Error creating venue:', error);
      setVenues(prev => prev.filter(v => v.id !== venue.id));
    }
  }, [supabase]);

  const updateVenue = useCallback(async (id: string, updates: Partial<Venue>) => {
    setVenues(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.lat !== undefined) payload.lat = updates.lat;
    if (updates.lng !== undefined) payload.lng = updates.lng;
    if (updates.emoji !== undefined) payload.emoji = updates.emoji;
    if (updates.type !== undefined) payload.type = updates.type;

    const { error } = await supabase.from('venues').update(payload).eq('id', id);
    if (error) console.error('Error updating venue:', error);
  }, [supabase]);

  const removeVenue = useCallback(async (id: string) => {
    const backup = venues;
    setVenues(prev => prev.filter(v => v.id !== id));

    const { error } = await supabase.from('venues').delete().eq('id', id);
    if (error) {
      console.error('Error deleting venue:', error);
      setVenues(backup);
    }
  }, [supabase, venues]);

  return (
    <AppContext.Provider value={{
      events, guests, guestGroups, tables, tablesReady, menuCategories, menuItems, venues, orders,
      currentUser, authLoading, eventsLoading,
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
