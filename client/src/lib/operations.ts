import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type OperationType = "production" | "sortie" | "retour" | "vente";
export type TeamMember = { id?: string; name: string; commissionPerPack: number; phone?: string; active: boolean };
export type Operation = {
  id?: string; type: OperationType; quantity?: number; returned?: number; driver?: string; client?: string; amount?: number;
  commissionTotal?: number; workers?: { memberId: string; name: string; rate: number; quantity: number; commission: number }[]; createdAt: string;
};
export type Client = { id?: string; name: string; phone?: string; balance: number; totalPurchased?: number; lastPurchase?: string };

const LOCAL_OPERATIONS_KEY = "eau-pure-de-diallo-operations";
const LOCAL_CLIENTS_KEY = "eau-pure-de-diallo-clients";
const LOCAL_TEAM_KEY = "eau-pure-de-diallo-team";
const demoClients: Client[] = [
  { id: "demo-alpha", name: "Boutique Alpha", balance: 6250, totalPurchased: 45000, lastPurchase: "Aujourd’hui" },
  { id: "demo-restaurant", name: "Restaurant X", balance: 12000, totalPurchased: 68000, lastPurchase: "08 septembre" },
  { id: "demo-boutique-y", name: "Boutique Y", balance: 3500, totalPurchased: 28500, lastPurchase: "06 septembre" },
];
const demoOperations: Operation[] = [
  { id: "demo-production", type: "production", quantity: 250, createdAt: "08:42" },
  { id: "demo-sortie", type: "sortie", quantity: 150, driver: "Moussa", createdAt: "09:18" },
  { id: "demo-paiement", type: "vente", client: "Boutique Alpha", amount: 5000, createdAt: "10:06" },
];
const demoTeam: TeamMember[] = [
  { id: "demo-moussa", name: "Moussa", commissionPerPack: 10, active: true },
  { id: "demo-adama", name: "Adama", commissionPerPack: 15, active: true },
  { id: "demo-oumar", name: "Oumar", commissionPerPack: 10, active: true },
];
function saveLocally(operation: Operation) { if (typeof window === "undefined") return; const existing = JSON.parse(window.localStorage.getItem(LOCAL_OPERATIONS_KEY) || "[]") as Operation[]; window.localStorage.setItem(LOCAL_OPERATIONS_KEY, JSON.stringify([operation, ...existing].slice(0, 100))); }
function readableDate(value: unknown) { if (typeof value === "string") return value; if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); return "Aujourd’hui"; }
export async function saveOperation(operation: Omit<Operation, "createdAt">) { const payload: Operation = { ...operation, createdAt: new Date().toISOString() }; try { await addDoc(collection(db, "operations"), { ...payload, createdAt: serverTimestamp() }); return { source: "firebase" as const, operation: payload }; } catch (error) { console.warn("Firestore indisponible, sauvegarde locale utilisée.", error); saveLocally(payload); return { source: "local" as const, operation: payload }; } }
export async function saveClient(client: Omit<Client, "id">) { try { const reference = await addDoc(collection(db, "clients"), client); return { source: "firebase" as const, item: { ...client, id: reference.id } }; } catch (error) { console.warn("Client non enregistré dans Firestore, sauvegarde locale utilisée.", error); const item = { ...client, id: `local-${Date.now()}` }; if (typeof window !== "undefined") { const existing = JSON.parse(window.localStorage.getItem(LOCAL_CLIENTS_KEY) || "[]") as Client[]; window.localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify([item, ...existing])); } return { source: "local" as const, item }; } }
export async function saveTeamMember(member: Omit<TeamMember, "id">) { try { const reference = await addDoc(collection(db, "teamMembers"), member); return { source: "firebase" as const, item: { ...member, id: reference.id } }; } catch (error) { console.warn("Membre non enregistré dans Firestore, sauvegarde locale utilisée.", error); const item = { ...member, id: `local-${Date.now()}` }; if (typeof window !== "undefined") { const existing = JSON.parse(window.localStorage.getItem(LOCAL_TEAM_KEY) || "[]") as TeamMember[]; window.localStorage.setItem(LOCAL_TEAM_KEY, JSON.stringify([item, ...existing])); } return { source: "local" as const, item }; } }
export async function loadTeamMembers() { try { const snapshot = await getDocs(collection(db, "teamMembers")); const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as TeamMember[]; return { source: "firebase" as const, items: items.length ? items : demoTeam }; } catch (error) { console.warn("Lecture équipe Firestore indisponible, données de démonstration utilisées.", error); const local = typeof window !== "undefined" ? JSON.parse(window.localStorage.getItem(LOCAL_TEAM_KEY) || "[]") as TeamMember[] : []; return { source: "local" as const, items: local.length ? local : demoTeam }; } }
export async function loadClients() { try { const snapshot = await getDocs(collection(db, "clients")); const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Client[]; return { source: "firebase" as const, items: items.length ? items : demoClients }; } catch (error) { console.warn("Lecture clients Firestore indisponible, données de démonstration utilisées.", error); const local = typeof window !== "undefined" ? JSON.parse(window.localStorage.getItem(LOCAL_CLIENTS_KEY) || "[]") as Client[] : []; return { source: "local" as const, items: local.length ? local : demoClients }; } }
export async function loadOperations() { try { const snapshot = await getDocs(collection(db, "operations")); const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: readableDate(item.data().createdAt) })) as Operation[]; return { source: "firebase" as const, items: items.length ? items : demoOperations }; } catch (error) { console.warn("Lecture opérations Firestore indisponible, données de démonstration utilisées.", error); const local = typeof window !== "undefined" ? JSON.parse(window.localStorage.getItem(LOCAL_OPERATIONS_KEY) || "[]") as Operation[] : []; return { source: "local" as const, items: local.length ? local : demoOperations }; } }
