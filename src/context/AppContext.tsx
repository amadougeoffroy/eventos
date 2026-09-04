'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Event, Guest, GuestGroup, EventTable, MenuItem, MenuCategory, Order, Venue, GiftItem } from '@/lib/types';
import {
  mockOrders
} from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';
import { dbEventToApp, appEventToDb } from '@/lib/supabase/mappers';

interface AppState {
  events: Event[];
  guests: Guest[];
  guestGroups: GuestGroup[];
  gifts: GiftItem[];
  tables: EventTable[];
  tablesReady: boolean;
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  venues: Venue[];
  orders: Order[];
  currentUser: {
    id: string; name: string; email: string; avatar?: string;
    phone?: string;
    notifEmail?: boolean; notifSms?: boolean; notifRsvp?: boolean; notifReminder?: boolean;
  };
  authLoading: boolean;
  eventsLoading: boolean;
}

interface AppActions {
  addEvent: (event: Event, initialVenues?: Venue[]) => void;
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
  removeMenuItem: (id: string) => void;
  addMenuCategory: (cat: MenuCategory) => void;
  updateMenuCategory: (id: string, updates: Partial<MenuCategory>) => void;
  removeMenuCategory: (id: string) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  addOrder: (order: Order) => void;
  addVenue: (venue: Venue) => void;
  updateVenue: (id: string, updates: Partial<Venue>) => void;
  removeVenue: (id: string) => void;
  addGift: (gift: GiftItem) => void;
  updateGift: (id: string, updates: Partial<GiftItem>) => void;
  removeGift: (id: string) => void;
  updateProfile: (updates: {
    name?: string; email?: string; phone?: string;
    notifEmail?: boolean; notifSms?: boolean; notifRsvp?: boolean; notifReminder?: boolean;
  }) => Promise<void>;
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
          // Fetch profile — try with notif columns, fallback without
          let profile: any = null;
          const { data: p1, error: profileErr } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url, phone, notif_email, notif_sms, notif_rsvp, notif_reminder')
            .eq('id', user.id)
            .single();
          if (!profileErr) {
            profile = p1;
          } else {
            // Columns might not exist yet — fetch basic profile
            const { data: p2 } = await supabase
              .from('profiles')
              .select('full_name, email, avatar_url, phone')
              .eq('id', user.id)
              .single();
            profile = p2;
          }

          setCurrentUser({
            id: user.id,
            name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            email: profile?.email || user.email || '',
            avatar: profile?.avatar_url || undefined,
            phone: profile?.phone || '',
            notifEmail: profile?.notif_email ?? true,
            notifSms: profile?.notif_sms ?? false,
            notifRsvp: profile?.notif_rsvp ?? true,
            notifReminder: profile?.notif_reminder ?? true,
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

  const addEvent = useCallback(async (event: Event, initialVenues?: Venue[]) => {
    if (!userId) return;

    // Optimistic update
    setEvents(prev => [event, ...prev.filter(e => e.id !== event.id)]);

    const payload: Record<string, unknown> = {
      ...appEventToDb({ ...event, userId }),
      slug: event.slug,
    };
    if (event.id) {
      payload.id = event.id;
    }

    const { data, error } = await supabase
      .from('events')
      .upsert(payload)
      .select()
      .single();

    if (!error && data) {
      const realEvent = dbEventToApp(data);

      // Save initial venues if any
      if (initialVenues && initialVenues.length > 0) {
        const venueRows = initialVenues.map(v => ({
          id: v.id,
          event_id: data.id,
          name: v.name,
          address: v.address || '',
          lat: v.lat || null,
          lng: v.lng || null,
          emoji: v.emoji || '📍',
          type: v.type || '',
        }));

        const { data: savedVenues, error: venueError } = await supabase
          .from('venues')
          .upsert(venueRows)
          .select();

        if (!venueError && savedVenues) {
          setVenues(prev => {
            const list = [...prev];
            savedVenues.forEach((sv: any) => {
              const idx = list.findIndex(v => v.id === sv.id);
              const mapped: Venue = {
                id: sv.id,
                eventId: sv.event_id,
                name: sv.name,
                address: sv.address || '',
                lat: sv.lat,
                lng: sv.lng,
                emoji: sv.emoji || '📍',
                type: sv.type || '',
              };
              if (idx !== -1) {
                list[idx] = mapped;
              } else {
                list.push(mapped);
              }
            });
            return list;
          });
        } else if (venueError) {
          console.error('Error creating initial venues:', venueError);
        }
      }

      // Save program items
      if (event.program && event.program.length > 0) {
        // Clean up previous items for this event if updating draft
        await supabase.from('program_items').delete().eq('event_id', data.id);

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
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [venues, setVenues] = useState<Venue[]>([]);

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
          source: row.source || 'manual',
          respondedAt: row.updated_at || undefined,
        })));
      }
    };
    loadGuests();
  }, [userId]);

  // Load menu categories & items from Supabase
  useEffect(() => {
    if (!userId) return;

    const loadMenu = async () => {
      const { data: userEvents } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', userId);

      if (!userEvents || userEvents.length === 0) return;
      const eventIds = userEvents.map(e => e.id);

      // Load categories
      const { data: catRows, error: catErr } = await supabase
        .from('menu_categories')
        .select('*')
        .in('event_id', eventIds)
        .order('sort_order', { ascending: true });

      if (!catErr && catRows) {
        setMenuCategories(catRows.map((row: any) => ({
          id: row.id,
          eventId: row.event_id,
          name: row.name || '',
          icon: row.icon || '🍽️',
          order: row.sort_order ?? 0,
        })));
      }

      // Load items
      const { data: itemRows, error: itemErr } = await supabase
        .from('menu_items')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: true });

      if (!itemErr && itemRows) {
        setMenuItems(itemRows.map((row: any) => ({
          id: row.id,
          eventId: row.event_id,
          categoryId: row.category_id,
          name: row.name || '',
          description: row.description || '',
          tags: row.tags || [],
          status: row.status === 'inactive' ? 'draft' : 'active',
          votes: row.votes ?? 0,
        })));
      }
    };

    loadMenu();
  }, [userId, supabase]);

  // Load gifts from Supabase
  useEffect(() => {
    if (!userId) return;
    const loadGifts = async () => {
      const { data: userEvents } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', userId);
      if (!userEvents || userEvents.length === 0) return;
      const eventIds = userEvents.map(e => e.id);
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setGifts(data.map((row: any) => ({
          id: row.id,
          eventId: row.event_id,
          name: row.name || '',
          description: row.description || '',
          price: row.price ? Number(row.price) : undefined,
          url: row.url || '',
          imageUrl: row.image_url || '',
          reservedBy: row.reserved_by || undefined,
          reservedByName: row.reserved_by_name || undefined,
          reserved: row.reserved || false,
          category: row.category || 'Général',
          createdAt: row.created_at,
        })));
      }
    };
    loadGifts();
  }, [userId]);

  // Load orders from Supabase
  useEffect(() => {
    if (!userId) return;
    const loadOrders = async () => {
      const { data: userEvents } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', userId);
      if (!userEvents || userEvents.length === 0) return;
      const eventIds = userEvents.map(e => e.id);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setOrders(data.map((row: any) => ({
          id: row.id,
          eventId: row.event_id,
          tableId: row.table_id || '',
          items: Array.isArray(row.items) ? row.items : [],
          status: row.status || 'pending',
          createdAt: row.created_at || new Date().toISOString(),
        })));
      }
    };
    loadOrders();
  }, [userId, supabase]);

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

    // Skip persist if already saved (real UUID from direct Supabase insert, e.g. RSVP form)
    const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guest.id);
    if (isRealUuid) return;

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
        source: guest.source || 'manual',
      })
      .select()
      .single();

    if (!error && data) {
      // Replace temp ID with real Supabase ID
      setGuests(prev => prev.map(g =>
        g.id === guest.id ? { ...g, id: data.id } : g
      ));
    } else if (error) {
      console.error('addGuest error:', JSON.stringify(error, null, 2));
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

  // ─── Gifts CRUD ───
  const addGift = useCallback(async (gift: GiftItem) => {
    setGifts(prev => [...prev, gift]);
    const { data, error } = await supabase
      .from('gifts')
      .insert({
        event_id: gift.eventId,
        name: gift.name,
        description: gift.description || '',
        price: gift.price || null,
        url: gift.url || '',
        image_url: gift.imageUrl || '',
        reserved: gift.reserved || false,
        category: gift.category || 'Général',
      })
      .select()
      .single();
    if (!error && data) {
      setGifts(prev => prev.map(g => g.id === gift.id ? { ...g, id: data.id } : g));
    } else if (error) console.error('addGift error:', error);
  }, [supabase]);

  const updateGift = useCallback(async (id: string, updates: Partial<GiftItem>) => {
    setGifts(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.url !== undefined) payload.url = updates.url;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.reserved !== undefined) payload.reserved = updates.reserved;
    if (updates.reservedBy !== undefined) payload.reserved_by = updates.reservedBy;
    if (updates.reservedByName !== undefined) payload.reserved_by_name = updates.reservedByName;
    if (updates.category !== undefined) payload.category = updates.category;
    if (Object.keys(payload).length > 0) {
      const { error } = await supabase.from('gifts').update(payload).eq('id', id);
      if (error) console.error('updateGift error:', error);
    }
  }, [supabase]);

  const removeGift = useCallback(async (id: string) => {
    setGifts(prev => prev.filter(g => g.id !== id));
    const { error } = await supabase.from('gifts').delete().eq('id', id);
    if (error) console.error('removeGift error:', error);
  }, [supabase]);

  // ─── Tables with Supabase persistence ───
  const [tables, setTables] = useState<EventTable[]>([]);
  const [tablesReady, setTablesReady] = useState(false);
  const GUEST_IDS_KEY = 'eventos-table-guestids';

  // Helper: load/save guestIds from localStorage as fallback
  const loadGuestIdsFallback = (): Record<string, string[]> => {
    try { return JSON.parse(localStorage.getItem(GUEST_IDS_KEY) || '{}'); } catch { return {}; }
  };
  const saveGuestIdsFallback = (map: Record<string, string[]>) => {
    try { localStorage.setItem(GUEST_IDS_KEY, JSON.stringify(map)); } catch {}
  };

  // Load tables from Supabase
  useEffect(() => {
    if (!userId) return;
    const loadTables = async () => {
      const userEvents = events.filter(e => e.id && e.id !== 'evt-001' && e.id !== 'evt-002');
      if (userEvents.length === 0) { setTablesReady(true); return; }
      const eventIds = userEvents.map(e => e.id);
      const { data, error } = await supabase
        .from('event_tables')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const fallback = loadGuestIdsFallback();
        setTables(data.map((row: any) => ({
          id: row.id,
          eventId: row.event_id,
          name: row.name,
          capacity: row.capacity || 8,
          shape: row.shape === 'rectangular' ? 'rectangle' : (row.shape || 'round'),
          positionX: row.position_x || 0,
          positionY: row.position_y || 0,
          guestIds: row.guest_ids || fallback[row.id] || [],
        })));
      }
      setTablesReady(true);
    };
    loadTables();
  }, [userId, events.length]);

  const addTable = useCallback(async (table: EventTable) => {
    // Prevent duplicates
    setTables(prev => {
      if (prev.find(t => t.id === table.id)) return prev;
      return [...prev, table];
    });

    // Save guestIds to localStorage fallback
    if (table.guestIds?.length) {
      const fb = loadGuestIdsFallback();
      fb[table.id] = table.guestIds;
      saveGuestIdsFallback(fb);
    }

    const insertPayload: Record<string, unknown> = {
      event_id: table.eventId,
      name: table.name,
      capacity: table.capacity,
      shape: table.shape === 'rectangle' ? 'rectangular' : table.shape,
      position_x: table.positionX || 0,
      position_y: table.positionY || 0,
    };

    // Try with guest_ids first
    const { data, error } = await supabase
      .from('event_tables')
      .insert({ ...insertPayload, guest_ids: table.guestIds || [] })
      .select()
      .single();

    if (!error && data) {
      const real: EventTable = {
        id: data.id,
        eventId: data.event_id,
        name: data.name,
        capacity: data.capacity || 8,
        shape: data.shape === 'rectangular' ? 'rectangle' : (data.shape || 'round'),
        positionX: data.position_x || 0,
        positionY: data.position_y || 0,
        guestIds: data.guest_ids || table.guestIds || [],
      };
      // Update localStorage fallback with real id
      const fb = loadGuestIdsFallback();
      if (fb[table.id]) { fb[real.id] = fb[table.id]; delete fb[table.id]; saveGuestIdsFallback(fb); }
      setTables(prev => prev.map(t => t.id === table.id ? real : t));
    } else if (error?.code === 'PGRST204') {
      // guest_ids column doesn't exist yet, retry without it
      const { data: data2, error: error2 } = await supabase
        .from('event_tables')
        .insert(insertPayload)
        .select()
        .single();
      if (!error2 && data2) {
        const real: EventTable = {
          id: data2.id, eventId: data2.event_id, name: data2.name,
          capacity: data2.capacity || 8,
          shape: data2.shape === 'rectangular' ? 'rectangle' : (data2.shape || 'round'),
          positionX: data2.position_x || 0, positionY: data2.position_y || 0,
          guestIds: table.guestIds || [],
        };
        const fb = loadGuestIdsFallback();
        fb[real.id] = table.guestIds || [];
        if (table.id !== real.id) delete fb[table.id];
        saveGuestIdsFallback(fb);
        setTables(prev => prev.map(t => t.id === table.id ? real : t));
      } else if (error2) {
        console.error('addTable error:', JSON.stringify(error2));
      }
    } else if (error) {
      console.error('addTable error:', JSON.stringify(error));
    }
  }, [supabase]);

  const updateTable = useCallback(async (id: string, updates: Partial<EventTable>) => {
    // Optimistic update
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    // Save guestIds to localStorage fallback
    if (updates.guestIds !== undefined) {
      const fb = loadGuestIdsFallback();
      fb[id] = updates.guestIds;
      saveGuestIdsFallback(fb);
    }

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.capacity !== undefined) payload.capacity = updates.capacity;
    if (updates.shape !== undefined) payload.shape = updates.shape === 'rectangle' ? 'rectangular' : updates.shape;
    if (updates.positionX !== undefined) payload.position_x = updates.positionX;
    if (updates.positionY !== undefined) payload.position_y = updates.positionY;
    if (updates.guestIds !== undefined) payload.guest_ids = updates.guestIds;

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase.from('event_tables').update(payload).eq('id', id);
      if (error?.code === 'PGRST204') {
        // guest_ids column missing, retry without it
        delete payload.guest_ids;
        if (Object.keys(payload).length > 0) {
          await supabase.from('event_tables').update(payload).eq('id', id);
        }
      } else if (error) {
        console.error('updateTable error:', JSON.stringify(error));
      }
    }
  }, [supabase]);

  const removeTable = useCallback(async (id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    const fb = loadGuestIdsFallback();
    delete fb[id];
    saveGuestIdsFallback(fb);
    const { error } = await supabase.from('event_tables').delete().eq('id', id);
    if (error) console.error('removeTable error:', JSON.stringify(error));
  }, [supabase]);

  // ─── Menu CRUD (Supabase) ───
  const addMenuCategory = useCallback(async (cat: MenuCategory) => {
    setMenuCategories(prev => [...prev, cat]);
    const { error } = await supabase.from('menu_categories').insert({
      id: cat.id,
      event_id: cat.eventId,
      name: cat.name,
      icon: cat.icon,
      sort_order: cat.order,
    });
    if (error) console.error('addMenuCategory error:', error);
  }, [supabase]);

  const updateMenuCategory = useCallback(async (id: string, updates: Partial<MenuCategory>) => {
    setMenuCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.icon !== undefined) payload.icon = updates.icon;
    if (updates.order !== undefined) payload.sort_order = updates.order;
    const { error } = await supabase.from('menu_categories').update(payload).eq('id', id);
    if (error) console.error('updateMenuCategory error:', error);
  }, [supabase]);

  const removeMenuCategory = useCallback(async (id: string) => {
    setMenuCategories(prev => prev.filter(c => c.id !== id));
    setMenuItems(prev => prev.filter(i => i.categoryId !== id));
    const { error } = await supabase.from('menu_categories').delete().eq('id', id);
    if (error) console.error('removeMenuCategory error:', error);
  }, [supabase]);

  const addMenuItem = useCallback(async (item: MenuItem) => {
    setMenuItems(prev => [...prev, item]);
    const { error } = await supabase.from('menu_items').insert({
      id: item.id,
      event_id: item.eventId,
      category_id: item.categoryId,
      name: item.name,
      description: item.description || '',
      tags: item.tags || [],
      status: item.status === 'draft' ? 'inactive' : 'active',
      votes: item.votes ?? 0,
    });
    if (error) console.error('addMenuItem error:', error);
  }, [supabase]);

  const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.status !== undefined) payload.status = updates.status === 'draft' ? 'inactive' : 'active';
    if (updates.votes !== undefined) payload.votes = updates.votes;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    const { error } = await supabase.from('menu_items').update(payload).eq('id', id);
    if (error) console.error('updateMenuItem error:', error);
  }, [supabase]);

  const removeMenuItem = useCallback(async (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) console.error('removeMenuItem error:', error);
  }, [supabase]);

  // ─── Orders CRUD (Supabase) ───
  const addOrder = useCallback(async (order: Order) => {
    setOrders(prev => [...prev, order]);
    const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...(isRealUuid ? { id: order.id } : {}),
        event_id: order.eventId,
        table_id: order.tableId || null,
        items: order.items || [],
        status: order.status || 'pending',
      })
      .select()
      .single();

    if (!error && data) {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, id: data.id } : o));
    } else if (error) {
      console.error('addOrder error:', error);
    }
  }, [supabase]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.items !== undefined) payload.items = updates.items;
    if (updates.tableId !== undefined) payload.table_id = updates.tableId;

    const { error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', id);

    if (error) console.error('updateOrder error:', error);
  }, [supabase]);

  // ─── Venues CRUD (Supabase) ───
  const addVenue = useCallback(async (venue: Venue) => {
    setVenues(prev => {
      const idx = prev.findIndex(v => v.id === venue.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = venue;
        return next;
      }
      return [...prev, venue];
    });

    if (!venue.eventId) {
      // Event not yet created in Supabase DB, keep in memory state
      return;
    }

    const { data, error } = await supabase
      .from('venues')
      .upsert({
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
    } else if (error) {
      console.error('Error creating/upserting venue:', error);
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

  // ═══════════════════════════════════════════════════════════
  // PROFILE — Supabase powered
  // ═══════════════════════════════════════════════════════════
  const updateProfile = useCallback(async (updates: {
    name?: string; email?: string; phone?: string;
    notifEmail?: boolean; notifSms?: boolean; notifRsvp?: boolean; notifReminder?: boolean;
  }) => {
    if (!userId) return;
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.full_name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.notifEmail !== undefined) payload.notif_email = updates.notifEmail;
    if (updates.notifSms !== undefined) payload.notif_sms = updates.notifSms;
    if (updates.notifRsvp !== undefined) payload.notif_rsvp = updates.notifRsvp;
    if (updates.notifReminder !== undefined) payload.notif_reminder = updates.notifReminder;

    const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
    if (error) {
      console.error('Error updating profile:', error);
      return;
    }
    setCurrentUser(prev => ({
      ...prev,
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.email !== undefined && { email: updates.email }),
      ...(updates.phone !== undefined && { phone: updates.phone }),
      ...(updates.notifEmail !== undefined && { notifEmail: updates.notifEmail }),
      ...(updates.notifSms !== undefined && { notifSms: updates.notifSms }),
      ...(updates.notifRsvp !== undefined && { notifRsvp: updates.notifRsvp }),
      ...(updates.notifReminder !== undefined && { notifReminder: updates.notifReminder }),
    }));
  }, [supabase, userId]);

  return (
    <AppContext.Provider value={{
      events, guests, guestGroups, tables, tablesReady, menuCategories, menuItems, venues, orders, gifts,
      currentUser, authLoading, eventsLoading,
      addEvent, updateEvent, removeEvent, addGuest, updateGuest, removeGuest,
      addGuestGroup, updateGuestGroup, removeGuestGroup,
      addTable, updateTable, removeTable, addMenuItem, updateMenuItem, removeMenuItem, addMenuCategory, updateMenuCategory, removeMenuCategory,
      addOrder, updateOrder, addVenue, updateVenue, removeVenue,
      addGift, updateGift, removeGift,
      updateProfile,
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
