import { Event, Guest, GuestGroup, EventTable, MenuItem, MenuCategory, Order } from "./types";

// ─── MOCK EVENTS ────────────────────────────────────────────────────────────
export const mockEvents: Event[] = [
  {
    id: "evt-001",
    slug: "mariage-amadou-et-fatou-2026",
    type: "wedding",
    name: "Mariage Amadou & Fatou",
    date: "2026-08-15",
    time: "14:00",
    venue: "Hôtel Ivoire",
    venueAddress: "Boulevard de France, Abidjan, Côte d'Ivoire",
    theme: "romantic",
    primaryColor: "#D4AF37",
    secondaryColor: "#F7C5CC",
    dressCode: "Tenue de soirée — Tons champagne & or",
    welcomeMessage: "Nous sommes ravis de partager ce moment magique avec vous.",
    allowCompanions: true,
    maxCompanions: 3,
    coverPhoto: "",
    program: [
      { id: "p1", time: "14:00", title: "Cérémonie civile", description: "Mairie du Plateau", icon: "🏛️" },
      { id: "p2", time: "16:00", title: "Cérémonie religieuse", description: "Cathédrale Saint-Paul", icon: "⛪" },
      { id: "p3", time: "18:30", title: "Cocktail de bienvenue", description: "Jardins de l'hôtel", icon: "🥂" },
      { id: "p4", time: "20:00", title: "Dîner de gala", description: "Grande salle de réception", icon: "🍽️" },
      { id: "p5", time: "22:00", title: "Soirée dansante", description: "DJ & Animation live", icon: "🎵" },
    ],
    meta: {
      brideName: "Fatou",
      groomName: "Amadou",
      coupleStory: "Rencontrés en 2021 à Paris, fiancés en 2024 au bord de la mer...",
    },
    plan: 'pro',
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "evt-002",
    slug: "anniversaire-kofi-30ans",
    type: "birthday",
    name: "Les 30 ans de Kofi 🎂",
    date: "2026-06-20",
    time: "19:00",
    venue: "Villa Cocody",
    venueAddress: "Cocody, Abidjan",
    theme: "nature",
    primaryColor: "#6B8E23",
    secondaryColor: "#F5F5DC",
    dressCode: "Smart casual — Tons verts & crème",
    welcomeMessage: "30 ans ça se fête ! Venez nombreux !",
    program: [
      { id: "p1", time: "19:00", title: "Accueil", description: "Cocktail de bienvenue", icon: "🥂" },
      { id: "p2", time: "20:00", title: "Dîner", description: "Buffet dînatoire", icon: "🍽️" },
      { id: "p3", time: "21:30", title: "Gâteau & discours", description: "", icon: "🎂" },
      { id: "p4", time: "22:00", title: "Soirée", description: "DJ set", icon: "🎵" },
    ],
    meta: {
      celebrantName: "Kofi",
      age: 30,
    },
    plan: 'essentiel',
    createdAt: "2026-05-10T09:00:00Z",
  },
];

// ─── MOCK GUESTS ─────────────────────────────────────────────────────────────
export const mockGuests: Guest[] = [
  { id: "g-001", eventId: "evt-001", firstName: "Jean-Baptiste", lastName: "Koné", email: "jbkone@gmail.com", phone: "+225 07 12 34 56", group: "Famille de la mariée", rsvpStatus: "confirmed", token: "tok-001", companions: 1, tableId: "t-001", allergies: "", dietaryRestrictions: [], side: "bride" },
  { id: "g-002", eventId: "evt-001", firstName: "Aya", lastName: "Bamba", email: "aya.bamba@yahoo.fr", phone: "+225 05 98 76 54", group: "Amis de la mariée", rsvpStatus: "confirmed", token: "tok-002", companions: 0, tableId: "t-001", dietaryRestrictions: ["vegetarian"], side: "bride" },
  { id: "g-003", eventId: "evt-001", firstName: "Mohamed", lastName: "Coulibaly", email: "", phone: "+225 01 23 45 67", group: "Famille du marié", rsvpStatus: "pending", token: "tok-003", companions: 2, dietaryRestrictions: ["halal"], side: "groom" },
  { id: "g-004", eventId: "evt-001", firstName: "Sophie", lastName: "Martin", email: "s.martin@email.fr", phone: "+33 6 12 34 56 78", group: "Amis du marié", rsvpStatus: "declined", token: "tok-004", companions: 0, dietaryRestrictions: [], side: "groom" },
  { id: "g-005", eventId: "evt-001", firstName: "Aminata", lastName: "Diallo", email: "aminata@email.com", phone: "+225 07 55 44 33", group: "Famille de la mariée", rsvpStatus: "confirmed", token: "tok-005", companions: 1, tableId: "t-002", dietaryRestrictions: [], side: "bride" },
  { id: "g-006", eventId: "evt-001", firstName: "Kévin", lastName: "Assi", email: "kassi@gmail.com", phone: "+225 05 66 77 88", group: "Collègues du marié", rsvpStatus: "maybe", token: "tok-006", companions: 0, dietaryRestrictions: [], side: "groom" },
  { id: "g-007", eventId: "evt-001", firstName: "Nathalie", lastName: "Traoré", email: "nathalie.t@email.com", phone: "+225 07 11 22 33", group: "Famille de la mariée", rsvpStatus: "confirmed", token: "tok-007", companions: 3, tableId: "t-002", dietaryRestrictions: ["gluten-free"], side: "bride" },
  { id: "g-008", eventId: "evt-001", firstName: "Ibrahim", lastName: "Sanogo", email: "", phone: "+225 01 44 55 66", group: "Famille du marié", rsvpStatus: "pending", token: "tok-008", companions: 1, dietaryRestrictions: ["halal"], side: "groom" },
];

// ─── MOCK GUEST GROUPS ───────────────────────────────────────────────────────
export const mockGuestGroups: GuestGroup[] = [
  { id: "grp-001", eventId: "evt-001", name: "Famille de la mariée", emoji: "👰", color: "#F7C5CC", description: "Parents, frères, sœurs et famille élargie de Fatou" },
  { id: "grp-002", eventId: "evt-001", name: "Amis de la mariée", emoji: "💃", color: "#C084FC", description: "Amies proches et cercle d'amitié de Fatou" },
  { id: "grp-003", eventId: "evt-001", name: "Collègues de la mariée", emoji: "💼", color: "#60A5FA", description: "Collègues de travail de Fatou" },
  { id: "grp-004", eventId: "evt-001", name: "Famille du marié", emoji: "🤵", color: "#C8A96E", description: "Parents, frères, sœurs et famille élargie d'Amadou" },
  { id: "grp-005", eventId: "evt-001", name: "Amis du marié", emoji: "🕺", color: "#4ADE80", description: "Amis proches et cercle d'amitié d'Amadou" },
  { id: "grp-006", eventId: "evt-001", name: "Collègues du marié", emoji: "🏢", color: "#FB923C", description: "Collègues de travail d'Amadou" },
];

// ─── MOCK TABLES ─────────────────────────────────────────────────────────────
export const mockTables: EventTable[] = [
  { id: "t-001", eventId: "evt-001", name: "Table des Mariés", capacity: 8, shape: "round", positionX: 400, positionY: 200, guestIds: ["g-001", "g-002"] },
  { id: "t-002", eventId: "evt-001", name: "Table Famille Mariée", capacity: 10, shape: "round", positionX: 150, positionY: 350, guestIds: ["g-005", "g-007"] },
  { id: "t-003", eventId: "evt-001", name: "Table Famille Marié", capacity: 10, shape: "round", positionX: 650, positionY: 350, guestIds: [] },
  { id: "t-004", eventId: "evt-001", name: "Table Amis", capacity: 8, shape: "round", positionX: 400, positionY: 480, guestIds: [] },
];

// ─── MOCK MENU CATEGORIES ────────────────────────────────────────────────────
export const mockMenuCategories: MenuCategory[] = [
  { id: "cat-001", eventId: "evt-001", name: "Cocktail de bienvenue", icon: "🥂", order: 1 },
  { id: "cat-002", eventId: "evt-001", name: "Entrées", icon: "🥗", order: 2 },
  { id: "cat-003", eventId: "evt-001", name: "Plats principaux", icon: "🍖", order: 3 },
  { id: "cat-004", eventId: "evt-001", name: "Desserts", icon: "🍰", order: 4 },
  { id: "cat-005", eventId: "evt-001", name: "Vins & Champagne", icon: "🍷", order: 5 },
  { id: "cat-006", eventId: "evt-001", name: "Bières", icon: "🍺", order: 6 },
];

export const mockMenuItems: MenuItem[] = [
  { id: "mi-001", eventId: "evt-001", categoryId: "cat-002", name: "Salade de crevettes", description: "Crevettes fraîches, avocat, mangue, vinaigrette agrumes", tags: ["seafood"], status: "active", votes: 12 },
  { id: "mi-002", eventId: "evt-001", categoryId: "cat-002", name: "Velouté de potimarron", description: "Crème de courge, noix de muscade, crème fraîche", tags: ["vegetarian"], status: "active", votes: 8 },
  { id: "mi-003", eventId: "evt-001", categoryId: "cat-002", name: "Foie gras mi-cuit", description: "Foie gras de canard, chutney de figues, brioche toastée", tags: [], status: "active", votes: 15 },
  { id: "mi-004", eventId: "evt-001", categoryId: "cat-003", name: "Poulet yassa", description: "Poulet mariné citron-oignon, riz jollof, légumes sautés", tags: ["halal"], status: "active", votes: 22 },
  { id: "mi-005", eventId: "evt-001", categoryId: "cat-003", name: "Thiéboudiène royal", description: "Riz au poisson sénégalais, légumes du jardin", tags: ["seafood", "halal"], status: "active", votes: 18 },
  { id: "mi-006", eventId: "evt-001", categoryId: "cat-003", name: "Filet de bœuf en croûte", description: "Filet Wellington, sauce bordelaise, gratin dauphinois", tags: [], status: "active", votes: 14 },
  { id: "mi-007", eventId: "evt-001", categoryId: "cat-004", name: "Pièce montée", description: "Croquembouche vanille-caramel", tags: [], status: "active", votes: 0 },
  { id: "mi-008", eventId: "evt-001", categoryId: "cat-004", name: "Fondant chocolat", description: "Coulant chocolat noir 70%, glace vanille Bourbon", tags: ["vegetarian"], status: "active", votes: 20 },
];

// ─── MOCK ORDERS (Jour J) ────────────────────────────────────────────────────
export const mockOrders: Order[] = [
  {
    id: "ord-001", tableId: "t-001", guestId: "g-001",
    items: [
      { id: "oi-001", menuItemId: "mi-003", menuItemName: "Foie gras mi-cuit", quantity: 1, status: "served" },
      { id: "oi-002", menuItemId: "mi-004", menuItemName: "Poulet yassa", quantity: 1, status: "served" },
    ],
    status: "served", createdAt: "2026-08-15T20:10:00Z"
  },
  {
    id: "ord-002", tableId: "t-002", guestId: "g-005",
    items: [
      { id: "oi-003", menuItemId: "mi-001", menuItemName: "Salade de crevettes", quantity: 2, status: "ready" },
      { id: "oi-004", menuItemId: "mi-006", menuItemName: "Filet de bœuf", quantity: 2, status: "preparing" },
    ],
    status: "preparing", createdAt: "2026-08-15T20:15:00Z"
  },
  {
    id: "ord-003", tableId: "t-003",
    items: [
      { id: "oi-005", menuItemId: "mi-002", menuItemName: "Velouté de potimarron", quantity: 3, status: "pending" },
      { id: "oi-006", menuItemId: "mi-005", menuItemName: "Thiéboudiène royal", quantity: 3, status: "pending" },
    ],
    status: "pending", createdAt: "2026-08-15T20:20:00Z"
  },
];

// ─── EVENT TYPE CONFIG ────────────────────────────────────────────────────────
export const eventTypeConfig = {
  wedding:     { label: "Mariage",          emoji: "💍", color: "#D4AF37", particle: "petals",   gradient: "from-rose-950 via-pink-900 to-rose-900" },
  birthday:    { label: "Anniversaire",     emoji: "🎂", color: "#FF6B6B", particle: "balloons", gradient: "from-purple-950 via-pink-900 to-orange-900" },
  baptism:     { label: "Baptême",          emoji: "🕊️", color: "#87CEEB", particle: "doves",    gradient: "from-sky-950 via-blue-900 to-cyan-900" },
  party:       { label: "Soirée / Gala",    emoji: "🥂", color: "#C0C0C0", particle: "stars",    gradient: "from-slate-950 via-zinc-900 to-slate-900" },
  babyshower:  { label: "Baby Shower",      emoji: "👶", color: "#FFB6C1", particle: "hearts",   gradient: "from-pink-950 via-rose-900 to-pink-900" },
  corporate:   { label: "Fête d'entreprise",emoji: "🏢", color: "#4169E1", particle: "confetti", gradient: "from-blue-950 via-indigo-900 to-blue-900" },
  custom:      { label: "Personnalisé",     emoji: "✨", color: "#9B59B6", particle: "confetti", gradient: "from-violet-950 via-purple-900 to-violet-900" },
};

export const planConfig: Record<string, { label: string; color: string; icon: string }> = {
  essentiel: { label: 'Essentiel', color: '#60A5FA', icon: '⭐' },
  pro:       { label: 'Pro',       color: '#C8A96E', icon: '🚀' },
  premium:   { label: 'Premium',   color: '#A78BFA', icon: '💎' },
};
