import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./auth";

export type OperationType = "production" | "sortie" | "retour" | "vente";
export type Expense = { id?: string; category: string; amount: number; note?: string; createdAt: string };
export type TeamMember = { id?: string; name: string; commissionPerPack: number; phone?: string; active: boolean };
export type Operation = {
  id?: string; type: OperationType; quantity?: number; returned?: number; driver?: string; client?: string; clientId?: string; amount?: number; paid?: number; balanceDue?: number; unitPrice?: number; invoiceId?: string;
  commissionTotal?: number; workers?: { memberId: string; name: string; rate: number; quantity: number; commission: number }[]; createdAt: string;
};
export type Client = { id?: string; name: string; phone?: string; balance: number; totalPurchased?: number; lastPurchase?: string };

const LOCAL_OPERATIONS_KEY = "eau-pure-de-diallo-operations";
const LOCAL_EXPENSES_KEY = "eau-pure-de-diallo-expenses";
const LOCAL_CLIENTS_KEY = "eau-pure-de-diallo-clients";
const LOCAL_TEAM_KEY = "eau-pure-de-diallo-team";

function ownerId() { return auth.currentUser?.uid || ""; }
function localItems<T>(key: string) { if (typeof window === "undefined") return [] as T[]; return JSON.parse(window.localStorage.getItem(`${key}-${ownerId()}`) || "[]") as T[]; }
function storeLocal<T>(key: string, item: T) { if (typeof window === "undefined") return; const items = localItems<T>(key); window.localStorage.setItem(`${key}-${ownerId()}`, JSON.stringify([item, ...items].slice(0, 100))); }
function removeLocalOperation(createdAt: string) { if (typeof window === "undefined") return; const items = localItems<Operation>(LOCAL_OPERATIONS_KEY).filter((item) => item.createdAt !== createdAt); window.localStorage.setItem(`${LOCAL_OPERATIONS_KEY}-${ownerId()}`, JSON.stringify(items)); }
function readableDate(value: unknown) { if (typeof value === "string") return value; if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate().toISOString(); return new Date().toISOString(); }
function userQuery(name: string) { return query(collection(db, name), where("ownerId", "==", ownerId())); }

export async function saveOperation(operation: Omit<Operation, "createdAt">) {
  const payload: Operation = { ...operation, createdAt: new Date().toISOString() };
  storeLocal(LOCAL_OPERATIONS_KEY, payload);
  try { const reference = await addDoc(collection(db, "operations"), { ...payload, ownerId: ownerId(), createdAt: serverTimestamp() }); removeLocalOperation(payload.createdAt); return { source: "firebase" as const, operation: { ...payload, id: reference.id } }; }
  catch (error) { console.warn("Firestore indisponible, sauvegarde locale utilisée.", error); storeLocal(LOCAL_OPERATIONS_KEY, payload); return { source: "local" as const, operation: payload }; }
}
export async function updateOperation(operation: Operation) {
  if (!operation.id) return;
  if (operation.id.startsWith("local-")) {
    const items = localItems<Operation>(LOCAL_OPERATIONS_KEY).map((item) => item.id === operation.id ? operation : item);
    if (typeof window !== "undefined") window.localStorage.setItem(`${LOCAL_OPERATIONS_KEY}-${ownerId()}`, JSON.stringify(items));
    return;
  }
  const { id, ...data } = operation;
  await updateDoc(doc(db, "operations", id), { ...data, ownerId: ownerId() });
}
export async function deleteOperation(operation: Operation) {
  const matches = (item: Operation) => operation.id ? item.id === operation.id : item.createdAt === operation.createdAt && item.type === operation.type && item.client === operation.client;
  if (!operation.id) {
    if (typeof window !== "undefined") window.localStorage.setItem(`${LOCAL_OPERATIONS_KEY}-${ownerId()}`, JSON.stringify(localItems<Operation>(LOCAL_OPERATIONS_KEY).filter((item) => !matches(item))));
    try {
      const snapshot = await getDocs(userQuery("operations"));
      const existing = snapshot.docs.find((item) => { const data = item.data(); return data.type === operation.type && data.client === operation.client && data.amount === operation.amount && data.quantity === operation.quantity; });
      if (existing) await deleteDoc(existing.ref);
    } catch (error) { console.warn("Ancienne opération non supprimée de Firestore.", error); }
    return;
  }
  if (operation.id.startsWith("local-")) {
    if (typeof window !== "undefined") window.localStorage.setItem(`${LOCAL_OPERATIONS_KEY}-${ownerId()}`, JSON.stringify(localItems<Operation>(LOCAL_OPERATIONS_KEY).filter((item) => !matches(item))));
    return;
  }
  await deleteDoc(doc(db, "operations", operation.id));
}

export async function saveInvoice(invoice: { operationId?: string; clientId?: string; client: string; quantity: number; unitPrice: number; total: number; paid: number; balanceDue: number; createdAt: string }) {
  const local = { ...invoice, id: `local-invoice-${Date.now()}` };
  try { const reference = await addDoc(collection(db, "invoices"), { ...invoice, ownerId: ownerId() }); return { source: "firebase" as const, item: { ...invoice, id: reference.id } }; }
  catch (error) { console.warn("Facture non enregistrée dans Firestore, sauvegarde locale utilisée.", error); storeLocal("eau-pure-de-diallo-invoices", local); return { source: "local" as const, item: local }; }
}
export async function updateInvoice(invoice: { operationId?: string; clientId?: string; client: string; quantity: number; unitPrice: number; total: number; paid: number; balanceDue: number; createdAt?: string }) {
  if (!invoice.operationId) return;
  try {
    const snapshot = await getDocs(userQuery("invoices"));
    const existing = snapshot.docs.find((item) => item.data().operationId === invoice.operationId);
    if (existing) await updateDoc(existing.ref, { ...invoice, ownerId: ownerId() });
  } catch (error) { console.warn("Facture détaillée non mise à jour, l’opération reste la source principale.", error); }
}
export async function deleteInvoice(operationId?: string, operation?: Operation) {
  const sameInvoice = (data: { operationId?: string; client?: string; quantity?: number; total?: number }) => operationId ? data.operationId === operationId : !!operation && data.client === operation.client && data.quantity === operation.quantity && data.total === operation.amount;
  try {
    const snapshot = await getDocs(userQuery("invoices"));
    await Promise.all(snapshot.docs.filter((item) => sameInvoice(item.data())).map((item) => deleteDoc(item.ref)));
  } catch (error) { console.warn("Facture détaillée non supprimée, l’opération reste supprimée.", error); }
  if (typeof window !== "undefined") {
    const key = "eau-pure-de-diallo-invoices";
    window.localStorage.setItem(`${key}-${ownerId()}`, JSON.stringify(localItems<{ operationId?: string; client?: string; quantity?: number; total?: number }>(key).filter((item) => !sameInvoice(item))));
  }
}

export async function saveClient(client: Omit<Client, "id">) {
  const localItem = { ...client, id: `local-${Date.now()}` };
  storeLocal(LOCAL_CLIENTS_KEY, localItem);
  try { const reference = await addDoc(collection(db, "clients"), { ...client, ownerId: ownerId() }); return { source: "firebase" as const, item: { ...client, id: reference.id } }; }
  catch (error) { console.warn("Client non enregistré dans Firestore, sauvegarde locale utilisée.", error); const item = { ...client, id: `local-${Date.now()}` }; storeLocal(LOCAL_CLIENTS_KEY, item); return { source: "local" as const, item }; }
}
export async function updateClient(id: string, client: Partial<Client>) {
  if (id.startsWith("local-")) {
    const items = localItems<Client>(LOCAL_CLIENTS_KEY).map((item) => item.id === id ? { ...item, ...client } : item);
    if (typeof window !== "undefined") window.localStorage.setItem(`${LOCAL_CLIENTS_KEY}-${ownerId()}`, JSON.stringify(items));
    return;
  }
  try { await updateDoc(doc(db, "clients", id), { ...client, ownerId: ownerId() }); }
  catch (error) { console.warn("Client non mis à jour dans Firestore.", error); }
}
export async function saveTeamMember(member: Omit<TeamMember, "id">) {
  const localItem = { ...member, id: `local-${Date.now()}` };
  storeLocal(LOCAL_TEAM_KEY, localItem);
  try { const reference = await addDoc(collection(db, "teamMembers"), { ...member, ownerId: ownerId() }); return { source: "firebase" as const, item: { ...member, id: reference.id } }; }
  catch (error) { console.warn("Membre non enregistré dans Firestore, sauvegarde locale utilisée.", error); const item = { ...member, id: `local-${Date.now()}` }; storeLocal(LOCAL_TEAM_KEY, item); return { source: "local" as const, item }; }
}
export async function deleteTeamMember(member: TeamMember) {
  if (!member.id) return { source: "local" as const };
  if (member.id.startsWith("local-")) {
    if (typeof window !== "undefined") window.localStorage.setItem(`${LOCAL_TEAM_KEY}-${ownerId()}`, JSON.stringify(localItems<TeamMember>(LOCAL_TEAM_KEY).filter((item) => item.id !== member.id)));
    return { source: "local" as const };
  }
  await deleteDoc(doc(db, "teamMembers", member.id));
  return { source: "firebase" as const };
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

export async function saveExpense(expense: Omit<Expense, "createdAt">) {
  const payload: Expense = { ...expense, createdAt: new Date().toISOString() };
  storeLocal(LOCAL_EXPENSES_KEY, payload);
  try { const reference = await addDoc(collection(db, "expenses"), { ...payload, ownerId: ownerId(), createdAt: serverTimestamp() }); removeLocalExpense(payload.createdAt); return { source: "firebase" as const, expense: { ...payload, id: reference.id } }; }
  catch (error) { console.warn("Firestore indisponible, sauvegarde locale de la dépense utilisée.", error); return { source: "local" as const, expense: payload }; }
}

function removeLocalExpense(createdAt: string) {
  if (typeof window === "undefined") return;
  const items = localItems<Expense>(LOCAL_EXPENSES_KEY).filter((item) => item.createdAt !== createdAt);
  window.localStorage.setItem(`${LOCAL_EXPENSES_KEY}-${ownerId()}`, JSON.stringify(items));
}

export async function loadExpenses() {
  const local = localItems<Expense>(LOCAL_EXPENSES_KEY);
  try { const snapshot = await getDocs(userQuery("expenses")); const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: readableDate(item.data().createdAt) })) as Expense[]; return { source: "firebase" as const, items: [...local, ...items] }; }
  catch (error) { console.warn("Lecture des dépenses Firestore indisponible.", error); return { source: "local" as const, items: local }; }
}
