import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Droplets,
  Menu,
  Package,
  Plus,
  Receipt,
  Settings,
  Truck,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { loadClients, loadOperations, loadTeamMembers, saveClient, saveInvoice, saveOperation, saveTeamMember, updateClient, updateOperation, type Client, type Operation, type TeamMember } from "@/lib/operations";
import { auth } from "@/lib/auth";
import { signOut, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Action = "production" | "sortie" | "retour" | "vente" | null;
type Page = "home" | "clients" | "dettes" | "operations" | "team" | "factures" | "depenses" | "parametres";

const actions = [
  { id: "production" as const, label: "J’ai produit", sub: "Ajouter des packs", icon: Droplets, color: "blue" },
  { id: "sortie" as const, label: "J’ai remis", sub: "Donner au livreur", icon: Truck, color: "orange" },
  { id: "retour" as const, label: "Le livreur est revenu", sub: "Compter les retours", icon: Package, color: "green" },
  { id: "vente" as const, label: "J’ai vendu", sub: "Enregistrer un client", icon: Receipt, color: "purple" },
];

const recent = [
  { icon: Droplets, tone: "blue", text: "250 packs produits", time: "08:42" },
  { icon: Truck, tone: "orange", text: "150 packs remis à Moussa", time: "09:18" },
  { icon: CreditCard, tone: "green", text: "5 000 F reçus de Boutique Alpha", time: "10:06" },
];

function Money({ children }: { children: ReactNode }) {
  return <span>{children}<small> F</small></span>;
}

function ActionButton({ action, onClick }: { action: typeof actions[number]; onClick: () => void }) {
  const Icon = action.icon;
  return <button className="simple-action" onClick={onClick}><div className={`simple-action-icon ${action.color}`}><Icon size={24} strokeWidth={2.1} /></div><div className="simple-action-copy"><strong>{action.label}</strong><span>{action.sub}</span></div><ChevronRight size={18} className="simple-action-arrow" /></button>;
}

function isInPeriod(value: string, period: "day" | "week" | "month") { const date = new Date(value); if (Number.isNaN(date.getTime())) return false; const now = new Date(); if (period === "day") return date.toDateString() === now.toDateString(); if (period === "month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(); const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0); return date >= start; }

function ReceiptPreview({ operation, onClose }: { operation: Operation; onClose: () => void }) {
  const invoiceNumber = `EPD-${operation.createdAt.replace(/\D/g, "").slice(-8)}`;
  return <div className="receipt-backdrop" onMouseDown={onClose}><article className="receipt-preview" onMouseDown={(event) => event.stopPropagation()}><div className="receipt-head"><div><div className="receipt-logo">EAU PURE</div><strong>DE DIALLO</strong><small>Production et distribution d’eau</small><small>Facture générée par EAU PURE DE DIALLO</small></div><span className="receipt-badge">REÇU<br /><small>N° {invoiceNumber}</small></span></div><div className="receipt-line" /><p className="receipt-section">— INFORMATIONS CLIENT</p><div className="receipt-client"><div className="receipt-avatar">{(operation.client || "C").slice(0, 1).toUpperCase()}</div><div><strong>Client : {operation.client || "Client"}</strong><small>Code facture : {invoiceNumber}</small><small>{new Date(operation.createdAt).toLocaleString("fr-FR")}</small></div></div><p className="receipt-section">— DÉTAIL DES ARTICLES</p><div className="receipt-table"><div><b>DÉSIGNATION</b><b>QTÉ</b><b>PRIX UNIT.</b><b>MONTANT</b></div><div><span>Pack d’eau</span><span>{operation.quantity || 0}</span><span>{(operation.unitPrice || 0).toLocaleString("fr-FR")} F</span><strong>{(operation.amount || 0).toLocaleString("fr-FR")} F</strong></div></div><div className="receipt-total"><span>Total</span><strong>{(operation.amount || 0).toLocaleString("fr-FR")} F</strong><span>Payé à ce jour</span><b>{(operation.paid || 0).toLocaleString("fr-FR")} F</b><span>Reste à payer</span><strong>{(operation.balanceDue || 0).toLocaleString("fr-FR")} F</strong></div><div className="receipt-actions"><button className="cancel-button" onClick={onClose}>Fermer</button><button className="save-button" onClick={() => window.print()}>Imprimer / PDF</button></div></article></div>;
}

function DetailPage({ page, onBack, onAction, onAddMember, onEditOperation, clients, operations, team }: { page: Exclude<Page, "home">; onBack: () => void; onAction: (action: Action) => void; onAddMember: () => void; onEditOperation: (operation: Operation) => void; clients: Client[]; operations: Operation[]; team: TeamMember[] }) {
  const [managerName, setManagerName] = useState(auth.currentUser?.displayName || "");
  const [managerPhone, setManagerPhone] = useState("");
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [selectedReceipt, setSelectedReceipt] = useState<Operation | null>(null);
  const visibleOperations = operations.filter((operation) => isInPeriod(operation.createdAt, period));
  const config = {
    clients: { title: "Mes clients", subtitle: "Retrouvez vos clients et leurs achats", icon: Users, color: "blue" },
    dettes: { title: "Dettes clients", subtitle: "Les paiements qui restent à récupérer", icon: CreditCard, color: "purple" },
    operations: { title: "Mes opérations", subtitle: "Tout ce qui a été enregistré aujourd’hui", icon: ClipboardList, color: "green" },
    factures: { title: "Mes factures", subtitle: "Les reçus et factures de vos clients", icon: Receipt, color: "orange" },
    depenses: { title: "Mes dépenses", subtitle: "Notez les dépenses de l’activité", icon: CircleDollarSign, color: "orange" },
    team: { title: "Mon équipe", subtitle: "Les personnes présentes à la production", icon: Users, color: "green" },
    parametres: { title: "Paramètres", subtitle: "Les réglages de votre entreprise", icon: Settings, color: "blue" },
  }[page];
  const Icon = config.icon;
  const saveProfile = async () => {
    const user = auth.currentUser;
    if (!user || !managerName.trim()) return;
    await updateProfile(user, { displayName: managerName.trim() });
    await setDoc(doc(db, "users", user.uid), { name: managerName.trim(), phone: managerPhone.trim(), email: user.email || "" }, { merge: true });
    toast("Profil enregistré", { description: "Le nom du gérant a été mis à jour." });
  };
  return <div className="detail-page"><button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Accueil</button><div className="detail-title"><div className={`detail-icon ${config.color}`}><Icon size={23} /></div><div><h1>{config.title}</h1><p>{config.subtitle}</p></div></div>{(page === "operations" || page === "factures") && <div className="period-tabs"><button className={period === "day" ? "active" : ""} onClick={() => setPeriod("day")}>Aujourd’hui</button><button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>Cette semaine</button><button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>Ce mois</button></div>}{page === "clients" && <><div className="detail-toolbar"><input placeholder="Rechercher un client..." /><button className="detail-primary" onClick={() => onAction("vente")}><Plus size={16} /> Nouveau client</button></div><div className="detail-list">{clients.map((client, index) => <button className="detail-row client-row-button" key={client.id || client.name} onClick={() => onAction("vente")}><div className={`row-avatar ${index % 3 === 0 ? "blue-bg" : index % 3 === 1 ? "purple-bg" : "green-bg"}`}>{client.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div><div><strong>{client.name}</strong><small>{client.totalPurchased ? `${client.totalPurchased.toLocaleString("fr-FR")} F achetés` : "Client enregistré"} · {client.lastPurchase || "Pas encore d’achat"}</small></div><b>{client.balance.toLocaleString("fr-FR")} F</b><ChevronRight size={16} /></button>)}</div></>}{page === "dettes" && <><div className="debt-summary"><span>Total à récupérer</span><strong>{clients.reduce((sum, client) => sum + (client.balance || 0), 0).toLocaleString("fr-FR")} F</strong><small>{clients.filter((client) => client.balance > 0).length} clients ont une dette</small></div><div className="detail-list">{clients.filter((client) => client.balance > 0).map((client, index) => <div className="detail-row" key={client.id || client.name}><div className={`row-avatar ${index % 2 ? "purple-bg" : "blue-bg"}`}>{client.name.slice(0, 2).toUpperCase()}</div><div><strong>{client.name}</strong><small>Solde à récupérer</small></div><b>{client.balance.toLocaleString("fr-FR")} F</b><button className="row-action" onClick={() => toast("Paiement client", { description: `Enregistrer le paiement de ${client.name}.` })}>Payer</button></div>)}</div></>}{page === "operations" && <div className="detail-list">{visibleOperations.map((operation) => <div className="detail-row" key={operation.id || `${operation.type}-${operation.createdAt}`}><div className={`row-icon ${operation.type === "production" ? "blue-bg" : operation.type === "sortie" ? "orange-bg" : "green-bg"}`}>{operation.type === "production" ? <Droplets size={17} /> : operation.type === "sortie" ? <Truck size={17} /> : <CreditCard size={17} />}</div><div><strong>{operation.type === "production" ? `${operation.quantity || 0} packs produits` : operation.type === "sortie" ? `${operation.quantity || 0} packs remis à ${operation.driver || "un livreur"}` : operation.type === "retour" ? `${operation.returned || 0} packs retournés` : `Vente${operation.client ? ` · ${operation.client}` : " enregistrée"}`}</strong><small>{operation.createdAt}{operation.commissionTotal ? ` · Commission ${operation.commissionTotal.toLocaleString("fr-FR")} F` : ""}</small></div><b>{operation.type === "production" ? `+${operation.quantity || 0}` : operation.type === "sortie" ? `-${operation.quantity || 0}` : operation.amount ? `+${operation.amount.toLocaleString("fr-FR")} F` : ""}</b>{operation.type !== "vente" && <button className="row-action" onClick={() => onEditOperation(operation)}>Modifier</button>}</div>)}</div>}{page === "team" && <><div className="detail-toolbar"><span className="period-label">Chaque personne est payée sur chaque pack produit.</span><button className="detail-primary" onClick={onAddMember}><Plus size={16} /> Ajouter</button></div><div className="detail-list">{team.map((member) => <div className="detail-row" key={member.id || member.name}><div className="row-avatar green-bg">{member.name.slice(0, 2).toUpperCase()}</div><div><strong>{member.name}</strong><small>{member.active ? "Actif" : "Désactivé"} · commission de production</small></div><b>{member.commissionPerPack} F / pack</b></div>)}</div></>}{page === "factures" && <div className="detail-list">{visibleOperations.filter((operation) => operation.type === "vente").map((operation) => <div className="detail-row" key={operation.id || operation.createdAt}><div className="row-icon orange-bg"><Receipt size={17} /></div><div><strong>Facture · {operation.client || "Client"}</strong><small>{operation.quantity || 0} packs · {operation.createdAt}</small></div><b>{(operation.amount || 0).toLocaleString("fr-FR")} F</b><button className="row-action" onClick={() => setSelectedReceipt(operation)}>Voir reçu</button><button className="row-action" onClick={() => { const phone = clients.find((client) => client.name === operation.client)?.phone?.replace(/\D/g, ""); const message = `Bonjour ${operation.client || ""}, voici votre facture EAU PURE DE DIALLO : ${operation.quantity || 0} packs x ${(operation.unitPrice || 0).toLocaleString("fr-FR")} F = ${(operation.amount || 0).toLocaleString("fr-FR")} F. Payé : ${(operation.paid || 0).toLocaleString("fr-FR")} F. Reste : ${(operation.balanceDue || 0).toLocaleString("fr-FR")} F.`; if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank"); else toast("Numéro du client manquant", { description: "Ajoutez son téléphone dans la fiche client." }); }}>WhatsApp</button></div>)}{visibleOperations.filter((operation) => operation.type === "vente").length === 0 && <div className="empty-detail"><Receipt size={30} /><strong>Aucune facture pour le moment</strong><small>Les factures créées après une vente apparaîtront ici.</small><button className="detail-primary" onClick={() => onAction("vente")}><Plus size={16} /> Enregistrer une vente</button></div>}</div>}{selectedReceipt && <ReceiptPreview operation={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}{page === "depenses" && <><div className="detail-toolbar"><span className="period-label">Dépenses du jour : <strong>0 F</strong></span><button className="detail-primary" onClick={() => toast("Nouvelle dépense", { description: "Le formulaire détaillé sera ajouté ici." })}><Plus size={16} /> Ajouter</button></div><div className="empty-detail compact"><CircleDollarSign size={30} /><strong>Aucune dépense aujourd’hui</strong><small>Ajoutez le carburant, le transport ou une autre dépense.</small></div></>}{page === "parametres" && <div className="settings-list"><label>Nom de l’entreprise<input value="EAU PURE DE DIALLO" readOnly /></label><label>Ville / quartier<input placeholder="Ex. Bamako" /></label><label>Nom du gérant<input value={managerName} onChange={event => setManagerName(event.target.value)} placeholder="Ex. Mamadou Ndiaye" /></label><label>Téléphone<input value={managerPhone} onChange={event => setManagerPhone(event.target.value)} placeholder="Ex. 70 00 00 00" /></label><button className="detail-primary save-settings" onClick={() => void saveProfile()}><Check size={16} /> Enregistrer les paramètres</button></div>}</div>;
}

export default function Home() {
  const managerDisplayName = auth.currentUser?.displayName || "Gérant";
  const [activeAction, setActiveAction] = useState<Action>(null);
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [quantity, setQuantity] = useState("250");
  const [retours, setRetours] = useState("95");
  const [stock, setStock] = useState(0);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleUnitPrice, setSaleUnitPrice] = useState("225");
  const [salePaid, setSalePaid] = useState("0");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberRate, setMemberRate] = useState("10");
  const [presentMembers, setPresentMembers] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const sales = operations.filter((operation) => operation.type === "vente");
  const packsOnRoute = operations.filter((operation) => operation.type === "sortie").reduce((total, operation) => total + (operation.quantity || 0), 0) - operations.filter((operation) => operation.type === "retour").reduce((total, operation) => total + (operation.returned || 0), 0);
  const collectedToday = sales.reduce((total, operation) => total + (operation.paid || 0), 0);
  const debtTotal = clients.reduce((total, client) => total + (client.balance || 0), 0);

  useEffect(() => {
    void Promise.all([loadClients(), loadOperations(), loadTeamMembers()]).then(([clientResult, operationResult, teamResult]) => {
      setClients(clientResult.items);
      setOperations(operationResult.items);
      setTeam(teamResult.items);
      setStock(operationResult.items.reduce((total, operation) => total + (operation.type === "production" ? operation.quantity || 0 : operation.type === "retour" ? operation.returned || 0 : operation.type === "sortie" ? -(operation.quantity || 0) : 0), 0));
    });
  }, []);

  const openAction = (action: Action) => setActiveAction(action);
  const closeAction = () => setActiveAction(null);

  const saveMember = async () => {
    if (!memberName.trim() || !Number(memberRate)) return;
    const result = await saveTeamMember({ name: memberName.trim(), commissionPerPack: Number(memberRate), active: true });
    setTeam((items) => [...items, result.item]);
    setMemberName("");
    setMemberRate("10");
    setAddMemberOpen(false);
    toast("Personne ajoutée", { description: `${result.item.name} : ${result.item.commissionPerPack} F par pack produit.` });
  };

  const editStockOperation = async (operation: Operation) => {
    const label = operation.type === "production" ? "packs produits" : operation.type === "sortie" ? "packs remis" : "packs retournés";
    const current = operation.type === "retour" ? operation.returned || 0 : operation.quantity || 0;
    const value = window.prompt(`Nouveau nombre de ${label}`, String(current));
    if (value === null) return;
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) { toast("Valeur incorrecte", { description: "Saisissez un nombre positif." }); return; }
    const updated: Operation = { ...operation };
    if (operation.type === "production") {
      updated.quantity = next;
      updated.workers = operation.workers?.map((worker) => ({ ...worker, quantity: next, commission: next * worker.rate }));
      updated.commissionTotal = updated.workers?.reduce((sum, worker) => sum + worker.commission, 0);
    } else if (operation.type === "retour") updated.returned = next;
    else updated.quantity = next;
    await updateOperation(updated);
    setOperations((items) => items.map((item) => item.id === operation.id || (!operation.id && item.createdAt === operation.createdAt) ? updated : item));
    setStock((items) => items + (updated.type === "production" ? next - (operation.quantity || 0) : updated.type === "sortie" ? -(next - (operation.quantity || 0)) : updated.type === "retour" ? next - (operation.returned || 0) : 0));
    toast("Opération modifiée", { description: "Le stock et les commissions ont été recalculés." });
  };

  const saveAction = async () => {
    const messages = {
      production: `Production enregistrée : ${quantity} packs.`,
      sortie: "Sortie enregistrée : 150 packs confiés à Moussa.",
      retour: `Retour enregistré : ${retours} packs revenus, 55 écoulés.`,
      vente: "Vente enregistrée. La facture est prête.",
    };
    if (!activeAction) return;
    if (activeAction === "vente" && clientName.trim()) {
      const saleQuantityNumber = Number(saleQuantity || 0);
      const saleUnitPriceNumber = Number(saleUnitPrice || 0);
      const total = saleQuantityNumber * saleUnitPriceNumber;
      const paid = Math.min(Number(salePaid || 0), total);
      const balanceDue = Math.max(0, total - paid);
      const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");
      const phone = clientPhone.trim().replace(/\D/g, "");
      const existing = clients.find((item) => normalize(item.name) === normalize(clientName) || (phone && item.phone?.replace(/\D/g, "") === phone));
      const updatedClient = existing ? { ...existing, phone: clientPhone.trim() || existing.phone, balance: (existing.balance || 0) + balanceDue, totalPurchased: (existing.totalPurchased || 0) + total, lastPurchase: new Date().toLocaleDateString("fr-FR") } : null;
      if (existing && existing.id && updatedClient) { await updateClient(existing.id, updatedClient); setClients((items) => items.map((item) => item.id === existing.id ? updatedClient : item)); }
      else { const result = await saveClient({ name: clientName.trim(), phone: clientPhone.trim(), balance: balanceDue, totalPurchased: total, lastPurchase: new Date().toLocaleDateString("fr-FR") }); setClients((items) => [result.item, ...items]); }
      const operation = await saveOperation({ type: "vente", quantity: saleQuantityNumber, unitPrice: saleUnitPriceNumber, amount: total, paid, balanceDue, client: existing?.name || clientName.trim(), clientId: existing?.id });
      setOperations((items) => [operation.operation, ...items]);
      await saveInvoice({ client: clientName.trim(), quantity: saleQuantityNumber, unitPrice: saleUnitPriceNumber, total, paid, balanceDue, createdAt: new Date().toISOString() });
      toast(balanceDue > 0 ? "Vente enregistrée avec dette" : "Vente enregistrée", { description: `${total.toLocaleString("fr-FR")} F · ${balanceDue > 0 ? `reste ${balanceDue.toLocaleString("fr-FR")} F` : "payé"}. Facture prête.` });
      setClientName("");
      setClientPhone("");
      setSaleQuantity("1"); setSaleUnitPrice("225"); setSalePaid("0");
      closeAction();
      return;
    }
    const producedQuantity = Number(quantity || 0);
    const workers = activeAction === "production" ? team.filter((member) => presentMembers.includes(member.id || member.name)).map((member) => ({ memberId: member.id || member.name, name: member.name, rate: member.commissionPerPack, quantity: producedQuantity, commission: producedQuantity * member.commissionPerPack })) : undefined;
    const result = await saveOperation({
      type: activeAction,
      quantity: activeAction === "production" ? producedQuantity : activeAction === "sortie" ? 150 : activeAction === "retour" ? 150 : undefined,
      returned: activeAction === "retour" ? Number(retours) : undefined,
      driver: activeAction === "sortie" || activeAction === "retour" ? "Moussa" : undefined,
      workers,
      commissionTotal: workers?.reduce((total, worker) => total + worker.commission, 0),
    });
    if (activeAction === "production") setStock(value => value + Number(quantity || 0));
    setOperations((items) => [result.operation, ...items]);
    const storageMessage = result.source === "firebase" ? "Enregistré dans Firebase." : "Enregistré sur cet appareil. Firebase sera réessayé automatiquement.";
    toast(messages[activeAction], { description: storageMessage });
    setPresentMembers([]);
    closeAction();
  };

  if (page !== "home") return <div className="simple-app"><header className="simple-header"><div className="simple-brand"><img className="simple-logo-image" src="/eau-pure-de-diallo-logo.png" alt="EAU PURE DE DIALLO" /><div><strong>EAU PURE</strong><small>DE DIALLO · MA GESTION</small></div></div><div className="simple-header-actions"><button className="simple-profile" onClick={() => setPage("home")}>M</button></div></header><main className="simple-main"><DetailPage page={page} onBack={() => setPage("home")} onAction={setActiveAction} onAddMember={() => setAddMemberOpen(true)} onEditOperation={editStockOperation} clients={clients} operations={operations} team={team} /></main>{addMemberOpen && <div className="simple-modal-backdrop" onMouseDown={() => setAddMemberOpen(false)}><div className="simple-modal" onMouseDown={e => e.stopPropagation()}><div className="simple-modal-head"><div className="modal-action-icon green"><Users size={21} /></div><button onClick={() => setAddMemberOpen(false)}><X size={19} /></button></div><p className="modal-kicker">MON ÉQUIPE</p><h2>Ajouter une personne</h2><p className="modal-help">Son tarif sera conservé sur chaque production.</p><label>Nom<input value={memberName} onChange={event => setMemberName(event.target.value)} placeholder="Ex. Moussa" /></label><label>Commission par pack<div className="simple-input-wrap"><input type="number" min="0" value={memberRate} onChange={event => setMemberRate(event.target.value)} /><span>F / pack</span></div></label><div className="simple-modal-actions"><button className="cancel-button" onClick={() => setAddMemberOpen(false)}>Annuler</button><button className="save-button" onClick={() => void saveMember()}><Check size={17} /> Enregistrer</button></div></div></div>}{activeAction && <div className="simple-modal-backdrop" onMouseDown={closeAction}><div className="simple-modal" onMouseDown={e => e.stopPropagation()}><p className="modal-kicker">NOUVELLE OPÉRATION</p><h2>J’ai vendu à un client</h2><label>Nom du client<input value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Ex. Boutique Alpha" /></label><label>Téléphone<input value={clientPhone} onChange={event => setClientPhone(event.target.value)} placeholder="Ex. 70 00 00 00" /></label><div className="two-inputs"><label>Quantité<input type="number" min="1" value={saleQuantity} onChange={event => setSaleQuantity(event.target.value)} /></label><label>Prix du pack<input type="number" min="0" value={saleUnitPrice} onChange={event => setSaleUnitPrice(event.target.value)} /></label></div><label>Montant payé<div className="simple-input-wrap"><input type="number" min="0" value={salePaid} onChange={event => setSalePaid(event.target.value)} /><span>F</span></div></label><div className="simple-calculation"><span>Reste à payer</span><strong>{Math.max(0, Number(saleQuantity || 0) * Number(saleUnitPrice || 0) - Number(salePaid || 0)).toLocaleString("fr-FR")} F</strong></div><div className="simple-modal-actions"><button className="cancel-button" onClick={closeAction}>Annuler</button><button className="save-button" onClick={saveAction}><Check size={17} /> Enregistrer</button></div></div></div>}</div>;

  return <div className="simple-app">
    <header className="simple-header">
      <div className="simple-brand"><img className="simple-logo-image" src="/eau-pure-de-diallo-logo.png" alt="EAU PURE DE DIALLO" /><div><strong>EAU PURE</strong><small>DE DIALLO · MA GESTION</small></div></div>
      <div className="simple-header-actions"><button className="simple-icon-button" onClick={() => toast("Tout est à jour", { description: "Aucune notification importante." })} aria-label="Notifications"><Bell size={20} /><i /></button><button className="simple-profile" onClick={() => setMenuOpen(true)}>M</button></div>
    </header>

    {menuOpen && <><button className="simple-overlay" onClick={() => setMenuOpen(false)} aria-label="Fermer" /><aside className="simple-menu"><div className="menu-head"><div><span className="menu-kicker">MON ENTREPRISE</span><strong>EAU PURE DE DIALLO</strong><small>Production et distribution d’eau</small></div><button onClick={() => setMenuOpen(false)}><X size={19} /></button></div><div className="menu-links"><button onClick={() => { setPage("clients"); setMenuOpen(false); }}><Users size={19} /> Mes clients <ChevronRight size={16} /></button><button onClick={() => { setPage("dettes"); setMenuOpen(false); }}><CreditCard size={19} /> Dettes clients <span className="menu-count">5</span></button><button onClick={() => { setPage("team"); setMenuOpen(false); }}><Users size={19} /> Mon équipe <ChevronRight size={16} /></button><button onClick={() => { setPage("factures"); setMenuOpen(false); }}><Receipt size={19} /> Mes factures <ChevronRight size={16} /></button><button onClick={() => { setPage("depenses"); setMenuOpen(false); }}><CircleDollarSign size={19} /> Mes dépenses <ChevronRight size={16} /></button><button onClick={() => { setPage("parametres"); setMenuOpen(false); }}><Settings size={19} /> Paramètres <ChevronRight size={16} /></button></div><div className="menu-footer"><div className="menu-user">{managerDisplayName.slice(0, 1).toUpperCase()}</div><div><strong>{managerDisplayName}</strong><small>Gérant</small></div><button className="logout-button" onClick={() => void signOut(auth)}>Sortir</button></div></aside></>}

    <main className="simple-main">
      <div className="simple-greeting"><div><p>EAU PURE DE DIALLO · JEUDI 10 SEPTEMBRE 2026</p><h1>Bonjour {managerDisplayName.split(" ")[0]}</h1><span>Qu’est-ce qu’on fait aujourd’hui ?</span></div><button className="date-chip"><span className="green-dot" /> Journée en cours <ChevronDown size={14} /></button></div>

      <section className="today-card"><div><span className="today-label"><span className="green-dot" /> RÉSUMÉ D’AUJOURD’HUI</span><h2>Votre activité se passe bien.</h2><p>Vous avez encore <strong>{stock.toLocaleString("fr-FR")} packs</strong> disponibles.</p></div><div className="today-bottle"><div className="bottle-cap" /><div className="bottle-body"><Droplets size={24} /></div></div></section>

      <section className="simple-section"><div className="simple-section-head"><div><h2>Que voulez-vous faire ?</h2><p>Appuyez sur une action pour commencer</p></div></div><div className="simple-actions-grid">{actions.map(action => <ActionButton key={action.id} action={action} onClick={() => openAction(action.id)} />)}</div></section>

      <section className="numbers-section"><div className="simple-section-head"><div><h2>En un coup d’œil</h2><p>Les chiffres importants du jour</p></div><button className="see-all" onClick={() => setPage("operations")}>Voir plus <ArrowRight size={15} /></button></div><div className="numbers-grid"><div className="number-card blue-line"><div className="number-card-top"><Package size={18} /><span>Stock</span></div><strong>{stock.toLocaleString("fr-FR")}</strong><small>packs disponibles</small></div><div className="number-card orange-line"><div className="number-card-top"><Truck size={18} /><span>En tournée</span></div><strong>{packsOnRoute.toLocaleString("fr-FR")}</strong><small>packs avec le livreur</small></div><div className="number-card green-line"><div className="number-card-top"><Wallet size={18} /><span>Encaissé</span></div><strong><Money>{collectedToday.toLocaleString("fr-FR")}</Money></strong><small>aujourd’hui</small></div><div className="number-card purple-line"><div className="number-card-top"><CreditCard size={18} /><span>À récupérer</span></div><strong><Money>{debtTotal.toLocaleString("fr-FR")}</Money></strong><small>chez {clients.filter((client) => client.balance > 0).length} client(s)</small></div></div></section>

      <section className="bottom-sections"><div className="simple-list-card"><div className="simple-section-head"><div><h2>Dernières opérations</h2><p>Ce qui vient d’être enregistré</p></div><button className="round-arrow" onClick={() => setPage("operations")}><ArrowRight size={16} /></button></div><div className="simple-list">{operations.length ? operations.slice(0, 3).map(item => <div className="simple-list-item" key={item.id || `${item.type}-${item.createdAt}`}><div className="list-icon blue"><Droplets size={16} /></div><strong>{item.type === "production" ? `${item.quantity || 0} packs produits` : item.type === "sortie" ? `${item.quantity || 0} packs remis` : item.type === "retour" ? `${item.returned || 0} packs retournés` : "Vente enregistrée"}</strong><time>{item.createdAt}</time></div>) : <div className="empty-inline">Aucune opération pour le moment.</div>}</div></div><div className="debt-card"><div className="simple-section-head"><div><h2>Qui doit payer ?</h2><p>Les créances à suivre</p></div><div className="debt-total">0 F</div></div><div className="empty-inline">Aucune dette client.</div><button className="full-light-button" onClick={() => setPage("dettes")}><Users size={16} /> Voir les dettes <ArrowRight size={15} /></button></div></section>
    </main>

    <nav className="simple-bottom-nav"><button className="active" onClick={() => setPage("home")}><ClipboardList size={20} /><span>Accueil</span></button><button onClick={() => openAction("production")}><Plus size={22} /><span>Ajouter</span></button><button onClick={() => setPage("clients")}><UserRound size={20} /><span>Clients</span></button><button onClick={() => setMenuOpen(true)}><Menu size={20} /><span>Menu</span></button></nav>

    {activeAction && <div className="simple-modal-backdrop" onMouseDown={closeAction}><div className="simple-modal" onMouseDown={e => e.stopPropagation()}><div className="simple-modal-head"><div className={`modal-action-icon ${actions.find(a => a.id === activeAction)?.color}`}>{activeAction === "production" ? <Droplets size={21} /> : activeAction === "sortie" ? <Truck size={21} /> : activeAction === "retour" ? <Package size={21} /> : <Receipt size={21} />}</div><button onClick={closeAction}><X size={19} /></button></div><p className="modal-kicker">NOUVELLE OPÉRATION</p><h2>{activeAction === "production" ? "J’ai produit des packs" : activeAction === "sortie" ? "J’ai remis au livreur" : activeAction === "retour" ? "Le livreur est revenu" : "J’ai vendu à un client"}</h2><p className="modal-help">Remplissez seulement ce qui est nécessaire. Le reste est calculé automatiquement.</p>{activeAction === "production" && <><label>Combien de packs avez-vous produits ?<div className="simple-input-wrap"><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} /><span>packs</span></div></label><div className="worker-picker"><strong>Qui était présent ?</strong>{team.length === 0 && <small>Ajoutez les personnes dans Menu → Mon équipe.</small>}{team.filter(member => member.active).map(member => <label key={member.id || member.name} className="worker-option"><input type="checkbox" checked={presentMembers.includes(member.id || member.name)} onChange={event => setPresentMembers((items) => event.target.checked ? [...items, member.id || member.name] : items.filter(item => item !== (member.id || member.name)))} /><span>{member.name}</span><b>{member.commissionPerPack} F / pack</b></label>)}{presentMembers.length > 0 && <div className="simple-calculation"><span>Commission totale</span><strong>{team.filter(member => presentMembers.includes(member.id || member.name)).reduce((total, member) => total + Number(quantity || 0) * member.commissionPerPack, 0).toLocaleString("fr-FR")} F</strong></div>}</div></>}{activeAction === "sortie" && <><label>Quel livreur ?<div className="simple-select">Moussa <ChevronDown size={16} /></div></label><label>Combien de packs remis ?<div className="simple-input-wrap"><input type="number" defaultValue="150" /><span>packs</span></div></label></>}{activeAction === "retour" && <><div className="two-inputs"><label>Packs sortis<input value="150" readOnly /></label><label>Packs retournés<input type="number" value={retours} onChange={e => setRetours(e.target.value)} /></label></div><div className="simple-calculation"><span>Packs écoulés</span><strong>{150 - Number(retours || 0)} packs</strong></div></>}{activeAction === "vente" && <><label>Nom du client<input value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Ex. Boutique Alpha" /></label><label>Téléphone<input value={clientPhone} onChange={event => setClientPhone(event.target.value)} placeholder="Ex. 70 00 00 00" /></label><div className="two-inputs"><label>Quantité<input type="number" min="1" value={saleQuantity} onChange={event => setSaleQuantity(event.target.value)} /></label><label>Prix du pack<input type="number" min="0" value={saleUnitPrice} onChange={event => setSaleUnitPrice(event.target.value)} /></label></div><label>Montant payé<div className="simple-input-wrap"><input type="number" min="0" value={salePaid} onChange={event => setSalePaid(event.target.value)} /><span>F</span></div></label><div className="simple-calculation"><span>Reste à payer</span><strong>{Math.max(0, Number(saleQuantity || 0) * Number(saleUnitPrice || 0) - Number(salePaid || 0)).toLocaleString("fr-FR")} F</strong></div></>}<div className="simple-modal-actions"><button className="cancel-button" onClick={closeAction}>Annuler</button><button className="save-button" onClick={saveAction}><Check size={17} /> Enregistrer</button></div></div></div>}
  </div>;
}
