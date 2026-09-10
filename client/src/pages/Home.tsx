import { useState } from "react";
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
import { saveOperation } from "@/lib/operations";

type Action = "production" | "sortie" | "retour" | "vente" | null;
type Page = "home" | "clients" | "dettes" | "operations" | "factures" | "depenses" | "parametres";

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

function DetailPage({ page, onBack, onAction }: { page: Exclude<Page, "home">; onBack: () => void; onAction: (action: Action) => void }) {
  const config = {
    clients: { title: "Mes clients", subtitle: "Retrouvez vos clients et leurs achats", icon: Users, color: "blue" },
    dettes: { title: "Dettes clients", subtitle: "Les paiements qui restent à récupérer", icon: CreditCard, color: "purple" },
    operations: { title: "Mes opérations", subtitle: "Tout ce qui a été enregistré aujourd’hui", icon: ClipboardList, color: "green" },
    factures: { title: "Mes factures", subtitle: "Les reçus et factures de vos clients", icon: Receipt, color: "orange" },
    depenses: { title: "Mes dépenses", subtitle: "Notez les dépenses de l’activité", icon: CircleDollarSign, color: "orange" },
    parametres: { title: "Paramètres", subtitle: "Les réglages de votre entreprise", icon: Settings, color: "blue" },
  }[page];
  const Icon = config.icon;
  return <div className="detail-page"><button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Accueil</button><div className="detail-title"><div className={`detail-icon ${config.color}`}><Icon size={23} /></div><div><h1>{config.title}</h1><p>{config.subtitle}</p></div></div>{page === "clients" && <><div className="detail-toolbar"><input placeholder="Rechercher un client..." /><button className="detail-primary" onClick={() => onAction("vente")}><Plus size={16} /> Nouveau client</button></div><div className="detail-list"><div className="detail-row"><div className="row-avatar blue-bg">BA</div><div><strong>Boutique Alpha</strong><small>20 packs achetés aujourd’hui</small></div><b>6 250 F</b></div><div className="detail-row"><div className="row-avatar purple-bg">RX</div><div><strong>Restaurant X</strong><small>Dernier achat · 08 septembre</small></div><b>12 000 F</b></div><div className="detail-row"><div className="row-avatar green-bg">BY</div><div><strong>Boutique Y</strong><small>Dernier achat · 06 septembre</small></div><b>3 500 F</b></div></div></>}{page === "dettes" && <><div className="debt-summary"><span>Total à récupérer</span><strong>21 750 F</strong><small>5 clients ont une dette</small></div><div className="detail-list"><div className="detail-row"><div className="row-avatar blue-bg">BA</div><div><strong>Boutique Alpha</strong><small>Dette depuis aujourd’hui</small></div><b>6 250 F</b><button className="row-action" onClick={() => toast("Paiement client", { description: "Le formulaire de paiement sera ajouté ici." })}>Payer</button></div><div className="detail-row"><div className="row-avatar purple-bg">RX</div><div><strong>Restaurant X</strong><small>Dette depuis le 08 septembre</small></div><b>12 000 F</b><button className="row-action" onClick={() => toast("Relance préparée pour WhatsApp")}>Relancer</button></div></div></>}{page === "operations" && <div className="detail-list"><div className="detail-row"><div className="row-icon blue-bg"><Droplets size={17} /></div><div><strong>250 packs produits</strong><small>Aujourd’hui à 08:42</small></div><b>+250</b></div><div className="detail-row"><div className="row-icon orange-bg"><Truck size={17} /></div><div><strong>150 packs remis à Moussa</strong><small>Aujourd’hui à 09:18</small></div><b>-150</b></div><div className="detail-row"><div className="row-icon green-bg"><CreditCard size={17} /></div><div><strong>Paiement Boutique Alpha</strong><small>Aujourd’hui à 10:06</small></div><b>+5 000 F</b></div></div>}{page === "factures" && <div className="empty-detail"><Receipt size={30} /><strong>Aucune facture pour le moment</strong><small>Les factures créées après une vente apparaîtront ici.</small><button className="detail-primary" onClick={() => onAction("vente")}><Plus size={16} /> Enregistrer une vente</button></div>}{page === "depenses" && <><div className="detail-toolbar"><span className="period-label">Dépenses du jour : <strong>0 F</strong></span><button className="detail-primary" onClick={() => toast("Nouvelle dépense", { description: "Le formulaire détaillé sera ajouté ici." })}><Plus size={16} /> Ajouter</button></div><div className="empty-detail compact"><CircleDollarSign size={30} /><strong>Aucune dépense aujourd’hui</strong><small>Ajoutez le carburant, le transport ou une autre dépense.</small></div></>}{page === "parametres" && <div className="settings-list"><label>Nom de l’entreprise<input value="EAU PURE DE DIALLO" readOnly /></label><label>Ville / quartier<input placeholder="Ex. Bamako" /></label><label>Nom du gérant<input value="Mamadou Ndiaye" readOnly /></label><button className="detail-primary save-settings" onClick={() => toast("Paramètres enregistrés") }><Check size={16} /> Enregistrer les paramètres</button></div>}</div>;
}

export default function Home() {
  const [activeAction, setActiveAction] = useState<Action>(null);
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [quantity, setQuantity] = useState("250");
  const [retours, setRetours] = useState("95");
  const [stock, setStock] = useState(1085);

  const openAction = (action: Action) => setActiveAction(action);
  const closeAction = () => setActiveAction(null);

  const saveAction = async () => {
    const messages = {
      production: `Production enregistrée : ${quantity} packs.`,
      sortie: "Sortie enregistrée : 150 packs confiés à Moussa.",
      retour: `Retour enregistré : ${retours} packs revenus, 55 écoulés.`,
      vente: "Vente enregistrée. La facture est prête.",
    };
    if (!activeAction) return;
    const result = await saveOperation({
      type: activeAction,
      quantity: activeAction === "production" ? Number(quantity) : activeAction === "sortie" ? 150 : activeAction === "retour" ? 150 : undefined,
      returned: activeAction === "retour" ? Number(retours) : undefined,
      driver: activeAction === "sortie" || activeAction === "retour" ? "Moussa" : undefined,
    });
    if (activeAction === "production") setStock(value => value + Number(quantity || 0));
    const storageMessage = result.source === "firebase" ? "Enregistré dans Firebase." : "Enregistré sur cet appareil. Firebase sera réessayé automatiquement.";
    toast(messages[activeAction], { description: storageMessage });
    closeAction();
  };

  if (page !== "home") return <div className="simple-app"><header className="simple-header"><div className="simple-brand"><img className="simple-logo-image" src="/eau-pure-de-diallo-logo.png" alt="EAU PURE DE DIALLO" /><div><strong>EAU PURE</strong><small>DE DIALLO · MA GESTION</small></div></div><div className="simple-header-actions"><button className="simple-profile" onClick={() => setPage("home")}>M</button></div></header><main className="simple-main"><DetailPage page={page} onBack={() => setPage("home")} onAction={setActiveAction} /></main>{activeAction && <div className="simple-modal-backdrop" onMouseDown={closeAction}><div className="simple-modal" onMouseDown={e => e.stopPropagation()}><div className="simple-modal-head"><div className={`modal-action-icon ${actions.find(a => a.id === activeAction)?.color}`}><Receipt size={21} /></div><button onClick={closeAction}><X size={19} /></button></div><p className="modal-kicker">NOUVELLE OPÉRATION</p><h2>J’ai vendu à un client</h2><p className="modal-help">Remplissez seulement ce qui est nécessaire.</p><label>Nom du client<input placeholder="Ex. Boutique Alpha" /></label><div className="two-inputs"><label>Quantité<input type="number" placeholder="20" /></label><label>Prix du pack<input type="number" placeholder="225 F" /></label></div><div className="simple-modal-actions"><button className="cancel-button" onClick={closeAction}>Annuler</button><button className="save-button" onClick={saveAction}><Check size={17} /> Enregistrer</button></div></div></div>}</div>;

  return <div className="simple-app">
    <header className="simple-header">
      <div className="simple-brand"><img className="simple-logo-image" src="/eau-pure-de-diallo-logo.png" alt="EAU PURE DE DIALLO" /><div><strong>EAU PURE</strong><small>DE DIALLO · MA GESTION</small></div></div>
      <div className="simple-header-actions"><button className="simple-icon-button" onClick={() => toast("Tout est à jour", { description: "Aucune notification importante." })} aria-label="Notifications"><Bell size={20} /><i /></button><button className="simple-profile" onClick={() => setMenuOpen(true)}>M</button></div>
    </header>

    {menuOpen && <><button className="simple-overlay" onClick={() => setMenuOpen(false)} aria-label="Fermer" /><aside className="simple-menu"><div className="menu-head"><div><span className="menu-kicker">MON ENTREPRISE</span><strong>EAU PURE DE DIALLO</strong><small>Production et distribution d’eau</small></div><button onClick={() => setMenuOpen(false)}><X size={19} /></button></div><div className="menu-links"><button onClick={() => { setPage("clients"); setMenuOpen(false); }}><Users size={19} /> Mes clients <ChevronRight size={16} /></button><button onClick={() => { setPage("dettes"); setMenuOpen(false); }}><CreditCard size={19} /> Dettes clients <span className="menu-count">5</span></button><button onClick={() => { setPage("factures"); setMenuOpen(false); }}><Receipt size={19} /> Mes factures <ChevronRight size={16} /></button><button onClick={() => { setPage("depenses"); setMenuOpen(false); }}><CircleDollarSign size={19} /> Mes dépenses <ChevronRight size={16} /></button><button onClick={() => { setPage("parametres"); setMenuOpen(false); }}><Settings size={19} /> Paramètres <ChevronRight size={16} /></button></div><div className="menu-footer"><div className="menu-user">M</div><div><strong>Mamadou Ndiaye</strong><small>Gérant</small></div></div></aside></>}

    <main className="simple-main">
      <div className="simple-greeting"><div><p>EAU PURE DE DIALLO · JEUDI 10 SEPTEMBRE 2026</p><h1>Bonjour Mamadou</h1><span>Qu’est-ce qu’on fait aujourd’hui ?</span></div><button className="date-chip"><span className="green-dot" /> Journée en cours <ChevronDown size={14} /></button></div>

      <section className="today-card"><div><span className="today-label"><span className="green-dot" /> RÉSUMÉ D’AUJOURD’HUI</span><h2>Votre activité se passe bien.</h2><p>Vous avez encore <strong>{stock.toLocaleString("fr-FR")} packs</strong> disponibles.</p></div><div className="today-bottle"><div className="bottle-cap" /><div className="bottle-body"><Droplets size={24} /></div></div></section>

      <section className="simple-section"><div className="simple-section-head"><div><h2>Que voulez-vous faire ?</h2><p>Appuyez sur une action pour commencer</p></div></div><div className="simple-actions-grid">{actions.map(action => <ActionButton key={action.id} action={action} onClick={() => openAction(action.id)} />)}</div></section>

      <section className="numbers-section"><div className="simple-section-head"><div><h2>En un coup d’œil</h2><p>Les chiffres importants du jour</p></div><button className="see-all" onClick={() => setPage("operations")}>Voir plus <ArrowRight size={15} /></button></div><div className="numbers-grid"><div className="number-card blue-line"><div className="number-card-top"><Package size={18} /><span>Stock</span></div><strong>{stock.toLocaleString("fr-FR")}</strong><small>packs disponibles</small></div><div className="number-card orange-line"><div className="number-card-top"><Truck size={18} /><span>En tournée</span></div><strong>150</strong><small>packs avec Moussa</small></div><div className="number-card green-line"><div className="number-card-top"><Wallet size={18} /><span>Encaissé</span></div><strong><Money>9 000</Money></strong><small>aujourd’hui</small></div><div className="number-card purple-line"><div className="number-card-top"><CreditCard size={18} /><span>À récupérer</span></div><strong><Money>21 750</Money></strong><small>chez 5 clients</small></div></div></section>

      <section className="bottom-sections"><div className="simple-list-card"><div className="simple-section-head"><div><h2>Dernières opérations</h2><p>Ce qui vient d’être enregistré</p></div><button className="round-arrow" onClick={() => setPage("operations")}><ArrowRight size={16} /></button></div><div className="simple-list">{recent.map(item => { const Icon = item.icon; return <div className="simple-list-item" key={item.text}><div className={`list-icon ${item.tone}`}><Icon size={16} /></div><strong>{item.text}</strong><time>{item.time}</time></div>; })}</div></div><div className="debt-card"><div className="simple-section-head"><div><h2>Qui doit payer ?</h2><p>Les créances à suivre</p></div><div className="debt-total">21 750 F</div></div><div className="debt-main"><div className="debt-avatar">BA</div><div><strong>Boutique Alpha</strong><small>Doit encore 6 250 F</small></div><button onClick={() => toast("Relance préparée pour WhatsApp", { description: "Le message est prêt à être envoyé." })}>Relancer</button></div><button className="full-light-button" onClick={() => setPage("dettes")}><Users size={16} /> Voir les 5 clients endettés <ArrowRight size={15} /></button></div></section>
    </main>

    <nav className="simple-bottom-nav"><button className="active" onClick={() => setPage("home")}><ClipboardList size={20} /><span>Accueil</span></button><button onClick={() => openAction("production")}><Plus size={22} /><span>Ajouter</span></button><button onClick={() => setPage("clients")}><UserRound size={20} /><span>Clients</span></button><button onClick={() => setMenuOpen(true)}><Menu size={20} /><span>Menu</span></button></nav>

    {activeAction && <div className="simple-modal-backdrop" onMouseDown={closeAction}><div className="simple-modal" onMouseDown={e => e.stopPropagation()}><div className="simple-modal-head"><div className={`modal-action-icon ${actions.find(a => a.id === activeAction)?.color}`}>{activeAction === "production" ? <Droplets size={21} /> : activeAction === "sortie" ? <Truck size={21} /> : activeAction === "retour" ? <Package size={21} /> : <Receipt size={21} />}</div><button onClick={closeAction}><X size={19} /></button></div><p className="modal-kicker">NOUVELLE OPÉRATION</p><h2>{activeAction === "production" ? "J’ai produit des packs" : activeAction === "sortie" ? "J’ai remis au livreur" : activeAction === "retour" ? "Le livreur est revenu" : "J’ai vendu à un client"}</h2><p className="modal-help">Remplissez seulement ce qui est nécessaire. Le reste est calculé automatiquement.</p>{activeAction === "production" && <label>Combien de packs avez-vous produits ?<div className="simple-input-wrap"><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} /><span>packs</span></div></label>}{activeAction === "sortie" && <><label>Quel livreur ?<div className="simple-select">Moussa <ChevronDown size={16} /></div></label><label>Combien de packs remis ?<div className="simple-input-wrap"><input type="number" defaultValue="150" /><span>packs</span></div></label></>}{activeAction === "retour" && <><div className="two-inputs"><label>Packs sortis<input value="150" readOnly /></label><label>Packs retournés<input type="number" value={retours} onChange={e => setRetours(e.target.value)} /></label></div><div className="simple-calculation"><span>Packs écoulés</span><strong>{150 - Number(retours || 0)} packs</strong></div></>}{activeAction === "vente" && <><label>Nom du client<input placeholder="Ex. Boutique Alpha" /></label><div className="two-inputs"><label>Quantité<input type="number" placeholder="20" /></label><label>Prix du pack<input type="number" placeholder="225 F" /></label></div></>}<div className="simple-modal-actions"><button className="cancel-button" onClick={closeAction}>Annuler</button><button className="save-button" onClick={saveAction}><Check size={17} /> Enregistrer</button></div></div></div>}
  </div>;
}
