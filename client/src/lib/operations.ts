import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./auth";

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

function ownerId() { return auth.currentUser?.uid || ""; }
function localItems<T>(key: string) { if (typeof window === "undefined") return [] as T[]; return JSON.parse(window.localStorage.getItem(`${key}-${ownerId()}`) || "[]") as T[]; }
function storeLocal<T>(key: string, item: T) { if (typeof window === "undefined") return; const items = localItems<T>(key); window.localStorage.setItem(`${key}-${ownerId()}`, JSON.stringify([item, ...items].slice(0, 100))); }
function removeLocalOperation(createdAt: string) { if (typeof window === "undefined") return; const items = localItems<Operation>(LOCAL_OPERATIONS_KEY).filter((item) => item.createdAt !== createdAt); window.localStorage.setItem(`${LOCAL_OPERATIONS_KEY}-${ownerId()}`, JSON.stringify(items)); }
function readableDate(value: unknown) { if (typeof value === "string") return value; if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); return "Aujourd’hui"; }
function userQuery(name: string) { return query(collection(db, name), where("ownerId", "==", ownerId())); }

export async function saveOperation(operation: Omit<Operation, "createdAt">) {
  const payload: Operation = { ...operation, createdAt: new Date().toISOString() };
  storeLocal(LOCAL_OPERATIONS_KEY, payload);
  try { await addDoc(collection(db, "operations"), { ...payload, ownerId: ownerId(), createdAt: serverTimestamp() }); removeLocalOperation(payload.createdAt); return { source: "firebase" as const, operation: payload }; }
  catch (error) { console.warn("Firestore indisponible, sauvegarde locale utilisée.", error); storeLocal(LOCAL_OPERATIONS_KEY, payload); return { source: "local" as const, operation: payload }; }
}
export async function saveClient(client: Omit<Client, "id">) {
  const localItem = { ...client, id: `local-${Date.now()}` };
  storeLocal(LOCAL_CLIENTS_KEY, localItem);
  try { const reference = await addDoc(collection(db, "clients"), { ...client, ownerId: ownerId() }); return { source: "firebase" as const, item: { ...client, id: reference.id } }; }
  catch (error) { console.warn("Client non enregistré dans Firestore, sauvegarde locale utilisée.", error); const item = { ...client, id: `local-${Date.now()}` }; storeLocal(LOCAL_CLIENTS_KEY, item); return { source: "local" as const, item }; }
}
export async function saveTeamMember(member: Omit<TeamMember, "id">) {
  const localItem = { ...member, id: `local-${Date.now()}` };
  storeLocal(LOCAL_TEAM_KEY, localItem);
  try { const reference = await addDoc(collection(db, "teamMembers"), { ...member, ownerId: ownerId() }); return { source: "firebase" as const, item: { ...member, id: reference.id } }; }
  catch (error) { console.warn("Membre non enregistré dans Firestore, sauvegarde locale utilisée.", error); const item = { ...member, id: `local-${Date.now()}` }; storeLocal(LOCAL_TEAM_KEY, item); return { source: "local" as const, item }; }
}
export async function loadTeamMembers() {
  try { const snapshot = await getDocs(userQuery("teamMembers")); const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as TeamMember[]; return { source: "firebase" as const, items }; }
  catch (error) { console.warn("Lecture équipe Firestore indisponible.", error); return { source: "local" as const, items: localItems<TeamMember>(LOCAL_TEAM_KEY) }; }
}
export async function loadClients() {
  try { const snapshot = await getDocs(userQuery("clients")); const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Client[]; return { source: "firebase" as const, items }; }
  catch (error) { console.warn("Lecture clients Firestore indisponible.", error); return { source: "local" as const, items: localItems<Client>(LOCAL_CLIENTS_KEY) }; }
}
export async function loadOperations() {
  const local = localItems<Operation>(LOCAL_OPERATIONS_KEY);
  try { const snapshot = await getDocs(userQuery("operations")); const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: readableDate(item.data().createdAt) })) as Operation[]; return { source: "firebase" as const, items: [...local, ...items] }; }
  catch (error) { console.warn("Lecture opérations Firestore indisponible.", error); return { source: "local" as const, items: local }; }
}
