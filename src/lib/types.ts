export type EventType =
  | "wedding"
  | "birthday"
  | "baptism"
  | "party"
  | "babyshower"
  | "corporate"
  | "custom";

export type RSVPStatus = "pending" | "confirmed" | "declined" | "maybe";

export type GuestMenuChoiceStatus = "pending" | "chosen";

export interface EventMeta {
  // Wedding
  brideName?: string;
  groomName?: string;
  coupleStory?: string;
  // Birthday
  celebrantName?: string;
  age?: number;
  // Baptism
  babyName?: string;
  godFatherName?: string;
  godMotherName?: string;
  // Generic
  hostName?: string;
  // Menu survey
  menuSurveyEnabled?: boolean;
}

export interface Event {
  id: string;
  slug: string;
  type: EventType;
  name: string;
  date: string;
  time: string;
  venue: string;
  venueAddress?: string;
  coverPhoto?: string;
  heroImages?: string[];
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  dressCode?: string;
  welcomeMessage?: string;
  allowCompanions?: boolean;
  maxCompanions?: number;
  program: ProgramItem[];
  meta: EventMeta;
  plan?: 'essentiel' | 'pro' | 'premium';
  templateId?: string;
  heroType?: 'image' | 'slideshow' | 'video';
  heroVideo?: string;
  heroMedia?: { url: string; type: 'image' | 'video' }[];
  backgroundMusicUrl?: string;
  sectionsOrder?: string[];
  customFonts?: { display?: string; body?: string; script?: string };
  createdAt: string;
}

export interface ProgramItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  icon: string;
  venueId?: string;
}

export interface Venue {
  id: string;
  eventId?: string;
  name: string;
  address: string;
  type?: string;
  lat?: number;
  lng?: number;
  emoji?: string;
}

export interface Guest {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  group: string;
  rsvpStatus: RSVPStatus;
  tableId?: string;
  token: string;
  allergies?: string;
  dietaryRestrictions?: string[];
  companions: number;
  privateMessage?: string;
  respondedAt?: string;
  menuChoices?: Record<string, string>; // categoryId -> menuItemId
  profilePhoto?: string;
  side?: "bride" | "groom" | "both";
}

export interface GuestGroup {
  id: string;
  eventId: string;
  name: string;
  emoji: string;
  color: string;
  description?: string;
}

export interface EventTable {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  shape: "round" | "rectangle" | "square";
  positionX: number;
  positionY: number;
  guestIds: string[];
}

export interface MenuCategory {
  id: string;
  eventId: string;
  name: string;
  icon: string;
  order: number;
}

export interface MenuItem {
  id: string;
  eventId: string;
  categoryId: string;
  name: string;
  description?: string;
  photo?: string;
  tags: string[];
  status: "active" | "draft";
  votes?: number;
}

export interface MenuSurvey {
  id: string;
  eventId: string;
  status: "draft" | "open" | "closed";
  deadline?: string;
}

export interface Order {
  id: string;
  tableId: string;
  guestId?: string;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "served";
  createdAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  status: "pending" | "preparing" | "ready" | "served";
}

export interface GiftItem {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price?: number;
  url?: string;
  imageUrl?: string;
  reservedBy?: string;
  reservedByName?: string;
  reserved: boolean;
  category: string;
  createdAt?: string;
}
