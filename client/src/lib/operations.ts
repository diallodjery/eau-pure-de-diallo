import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type OperationType = "production" | "sortie" | "retour" | "vente";

export type Operation = {
  type: OperationType;
  quantity?: number;
  returned?: number;
  driver?: string;
  client?: string;
  amount?: number;
  createdAt: string;
};

const LOCAL_KEY = "eau-pure-de-diallo-operations";

function saveLocally(operation: Operation) {
  if (typeof window === "undefined") return;
  const existing = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]") as Operation[];
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify([operation, ...existing].slice(0, 100)));
}

export async function saveOperation(operation: Omit<Operation, "createdAt">) {
  const payload: Operation = { ...operation, createdAt: new Date().toISOString() };
  try {
    await addDoc(collection(db, "operations"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { source: "firebase" as const, operation: payload };
  } catch (error) {
    console.warn("Firestore indisponible, sauvegarde locale utilisée.", error);
    saveLocally(payload);
    return { source: "local" as const, operation: payload };
  }
}
