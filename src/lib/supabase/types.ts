/**
 * Types générés à partir du schéma Supabase
 * Correspondance directe avec les tables SQL
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          type: string;
          name: string;
          date: string;
          time: string;
          venue: string;
          venue_address: string;
          cover_photo: string;
          theme: string;
          primary_color: string;
          secondary_color: string;
          dress_code: string;
          welcome_message: string;
          allow_companions: boolean;
          max_companions: number;
          plan: 'essentiel' | 'pro' | 'premium';
          meta: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      guests: {
        Row: {
          id: string;
          event_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          group: string;
          rsvp_status: 'pending' | 'confirmed' | 'declined' | 'maybe';
          token: string;
          companions: number;
          table_id: string | null;
          allergies: string;
          dietary_restrictions: string[];
          side: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['guests']['Row'], 'id' | 'token' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['guests']['Insert']>;
      };
      guest_groups: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          emoji: string;
          color: string;
          description: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['guest_groups']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['guest_groups']['Insert']>;
      };
      event_tables: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          capacity: number;
          shape: 'round' | 'rectangular' | 'square';
          position_x: number;
          position_y: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['event_tables']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['event_tables']['Insert']>;
      };
      venues: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          address: string;
          type: string;
          capacity: number;
          contact: string;
          notes: string;
          map_url: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['venues']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['venues']['Insert']>;
      };
      program_items: {
        Row: {
          id: string;
          event_id: string;
          time: string;
          title: string;
          description: string;
          icon: string;
          venue_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['program_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['program_items']['Insert']>;
      };
      menu_categories: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          icon: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['menu_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['menu_categories']['Insert']>;
      };
      menu_items: {
        Row: {
          id: string;
          event_id: string;
          category_id: string;
          name: string;
          description: string;
          tags: string[];
          status: 'active' | 'inactive';
          votes: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['menu_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['menu_items']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          event_id: string;
          table_id: string | null;
          items: Record<string, unknown>[];
          status: 'pending' | 'preparing' | 'ready' | 'served';
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
    };
  };
}
