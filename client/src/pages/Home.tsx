import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Box,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Droplets,
  FileText,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PackageCheck,
  PackageOpen,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Truck,
  UserRound,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Section = "dashboard" | "production" | "stock" | "tournees" | "clients" | "credits" | "factures" | "caisse" | "achats" | "depenses" | "rapports" | "parametres";

const navGroups = [
  {
    label: "Pilotage",
    items: [
      { id: "dashboard" as Section, label: "Tableau de bord", icon: LayoutDashboard },
      { id: "production" as Section, label: "Production", icon: Droplets },
      { id: "stock" as Section, label: "Stock", icon: Box, badge: "1 085" },
      { id: "tournees" as Section, label: "Tournées", icon: Truck, badge: "En cours" },
    ],
  },
  {
    label: "Clients & ventes",
    items: [
      { id: "clients" as Section, label: "Clients", icon: UsersRound },
      { id: "credits" as Section, label: "Crédits", icon: CreditCard, badge: "5" },
      { id: "factures" as Section, label: "Factures", icon: ReceiptText },
    ],
  },
  {
    label: "Finances",
    items: [
      { id: "caisse" as Section, label: "Caisse", icon: Wallet },
      { id: "achats" as Section, label: "Achats", icon: ShoppingCart },
      { id: "depenses" as Section, label: "Dépenses", icon: CircleDollarSign },
      { id: "rapports" as Section, label: "Rapports", icon: BarChart3 },
    ],
  },
];

const formatMoney = (value: number) => `${value.toLocaleString("fr-FR")} F`;

const activity = [
  { icon: Droplets, color: "blue", title: "Production enregistrée", detail: "+250 packs · Atelier", time: "08:42" },
  { icon: Truck, color: "amber", title: "Sortie tournée #T-024", detail: "150 packs · Moussa", time: "09:18" },
  { icon: CreditCard, color: "green", title: "Paiement reçu", detail: "Boutique Alpha · 5 000 F", time: "10:06" },
  { icon: ReceiptText, color: "violet", title: "Facture envoyée", detail: "Restaurant X · WhatsApp", time: "10:34" },
];

const receivables = [
  { initials: "BA", name: "Boutique Alpha", detail: "Dernier achat · Aujourd’hui", amount: 6250, tone: "coral" },
  { initials: "RX", name: "Restaurant X", detail: "Dernier achat · 08 sept.", amount: 12000, tone: "blue" },
  { initials: "BY", name: "Boutique Y", detail: "Dernier achat · 06 sept.", amount: 3500, tone: "mint" },
];

function MetricCard({ icon: Icon, label, value, note, accent, trend }: { icon: typeof Box; label: string; value: string; note: string; accent: string; trend?: string }) {
  return (
    <div className="metric-card group">
      <div className="flex items-start justify-between gap-3">
        <div className={`metric-icon ${accent}`}><Icon size={19} strokeWidth={2.2} /></div>
        {trend && <span className="trend"><ArrowUpRight size={13} /> {trend}</span>}
      </div>
      <div className="mt-5">
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-note">{note}</div>
      </div>
    </div>
  );
}

function StatusPill({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "amber" | "coral" | "blue" }) {
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{children}</span>;
}

function EmptySection({ section, onAction }: { section: Section; onAction: () => void }) {
  const titles: Record<Section, string> = {
    dashboard: "Tableau de bord", production: "Production", stock: "Stock", tournees: "Tournées", clients: "Clients", credits: "Crédits", factures: "Factures", caisse: "Caisse", achats: "Achats", depenses: "Dépenses", rapports: "Rapports", parametres: "Paramètres",
  };
  const descriptions: Record<Section, string> = {
    dashboard: "Votre activité en un coup d’œil", production: "Suivre les productions quotidiennes", stock: "Mouvements et disponibilité des packs", tournees: "Préparer et clôturer les tournées", clients: "Fiches clients et historique d’achats", credits: "Créances et paiements en attente", factures: "Factures et reçus clients", caisse: "Encaissements et solde de caisse", achats: "Achats liés à la production", depenses: "Dépenses générales de l’activité", rapports: "Analyse de l’activité par période", parametres: "Configurer votre entreprise",
  };
  return (
    <div className="section-placeholder">
      <div className="placeholder-orbit"><Sparkles size={27} /></div>
      <p className="eyebrow">Module en préparation</p>
      <h2>{titles[section]}</h2>
      <p>{descriptions[section]}</p>
      <button className="primary-button" onClick={onAction}><Plus size={17} /> Ajouter une opération</button>
      <span className="placeholder-footnote">Cette première maquette montre la structure et les parcours prioritaires.</span>
    </div>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showProduction, setShowProduction] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [productionQty, setProductionQty] = useState("250");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeTitle = useMemo(() => {
    const found = navGroups.flatMap(group => group.items).find(item => item.id === activeSection);
    return found?.label ?? "Tableau de bord";
  }, [activeSection]);

  const navigate = (section: Section) => {
    setActiveSection(section);
    setMobileNavOpen(false);
  };

  const handlePlaceholderAction = () => {
    setToastMessage("Le parcours sera disponible dans la prochaine version.");
    toast("Parcours en préparation", { description: "La maquette est prête pour validation." });
  };

  const saveProduction = () => {
    setShowProduction(false);
    toast("Production enregistrée", { description: `${Number(productionQty || 0).toLocaleString("fr-FR")} packs ajoutés au stock.` });
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark"><Droplets size={20} strokeWidth={2.5} /></div>
          <div><div className="brand-name">Aqua<span>Flow</span></div><div className="brand-caption">Gestion des packs</div></div>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Fermer le menu"><X size={19} /></button>
        </div>

        <div className="business-switcher">
          <div className="business-avatar">AE</div>
          <div className="min-w-0"><div className="business-name">Aqua Étoile</div><div className="business-place">Dakar · Atelier</div></div>
          <ChevronDown size={15} className="ml-auto text-slate-400" />
        </div>

        <nav className="nav-scroll">
          {navGroups.map(group => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map(item => {
                const Icon = item.icon;
                const selected = activeSection === item.id;
                return <button key={item.id} className={`nav-item ${selected ? "selected" : ""}`} onClick={() => navigate(item.id)}>
                  <Icon size={18} strokeWidth={selected ? 2.2 : 1.8} /><span>{item.label}</span>{item.badge && <span className={`nav-badge ${item.badge === "En cours" ? "live" : ""}`}>{item.badge}</span>}
                </button>;
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className={`nav-item ${activeSection === "parametres" ? "selected" : ""}`} onClick={() => navigate("parametres")}><Settings size={18} /><span>Paramètres</span></button>
          <div className="profile-card"><div className="profile-avatar">M</div><div className="min-w-0"><div className="profile-name">Mamadou Ndiaye</div><div className="profile-role">Gérant</div></div><MoreHorizontal size={17} className="ml-auto text-slate-400" /></div>
          <div className="sidebar-help"><div className="help-dot"><Sparkles size={13} /></div><div><strong>Besoin d’aide ?</strong><span>Voir le guide rapide</span></div></div>
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-overlay" onClick={() => setMobileNavOpen(false)} aria-label="Fermer le menu" />}

      <main className="main-area">
        <header className="topbar">
          <div className="flex items-center gap-3"><button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Ouvrir le menu"><Menu size={21} /></button><div className="breadcrumb"><span>Aqua Étoile</span><span className="breadcrumb-sep">/</span><strong>{activeTitle}</strong></div></div>
          <div className="topbar-actions"><div className="search-box"><Search size={17} /><input placeholder="Rechercher..." aria-label="Rechercher" /></div><button className="icon-button notification-button" aria-label="Notifications" onClick={() => toast("Aucune nouvelle notification", { description: "Tout est à jour pour le moment." })}><Bell size={18} /><span /></button><div className="top-avatar">MN</div></div>
        </header>

        <div className="page-content">
          {activeSection === "dashboard" ? <>
            <section className="welcome-row">
              <div><p className="eyebrow">Jeudi 10 septembre 2026 <span className="eyebrow-dot" /> Journée en cours</p><h1>Bonjour Mamadou <span className="wave">✦</span></h1><p className="page-subtitle">Voici ce qui se passe dans votre activité aujourd’hui.</p></div>
              <div className="header-ctas"><button className="secondary-button" onClick={() => toast("Rapport en préparation", { description: "Le rapport du jour sera bientôt disponible." })}><FileText size={16} /> Rapport du jour</button><button className="primary-button" onClick={() => setShowProduction(true)}><Plus size={17} /> Nouvelle opération</button></div>
            </section>

            <section className="hero-strip">
              <div className="hero-copy"><div className="hero-kicker"><span className="live-dot" /> Activité du jour</div><h2>Une journée bien maîtrisée<br /><em>commence ici.</em></h2><p>Production, tournées et encaissements réunis au même endroit.</p><div className="hero-progress"><div className="progress-track"><div className="progress-fill" style={{ width: "72%" }} /></div><span>72% de l’objectif journalier</span></div></div>
              <div className="hero-art"><div className="hero-sun" /><div className="pack pack-back"><span /></div><div className="pack pack-front"><span /></div><div className="hero-ring ring-one" /><div className="hero-ring ring-two" /></div>
            </section>

            <div className="section-heading"><div><h2>Vue d’ensemble</h2><p>Les indicateurs essentiels de votre activité</p></div><button className="date-filter"><CalendarDays size={15} /> Aujourd’hui <ChevronDown size={14} /></button></div>
            <section className="metrics-grid">
              <MetricCard icon={PackageCheck} label="Packs produits" value="250" note="Objectif : 300 packs" accent="blue" trend="+12%" />
              <MetricCard icon={Box} label="Stock disponible" value="1 085" note="+250 depuis ce matin" accent="mint" />
              <MetricCard icon={Truck} label="Sortie livreur" value="150" note="Moussa · En tournée" accent="amber" />
              <MetricCard icon={PackageOpen} label="Packs écoulés" value="55" note="sur 150 sortis" accent="violet" trend="+8%" />
              <MetricCard icon={CircleDollarSign} label="Ventes théoriques" value="12 375 F" note="Valeur des packs écoulés" accent="coral" />
              <MetricCard icon={Wallet} label="Encaissé aujourd’hui" value="9 000 F" note="72,7% des ventes" accent="green" trend="+18%" />
            </section>

            <section className="content-grid">
              <div className="panel chart-panel">
                <div className="panel-heading"><div><h3>Activité de la semaine</h3><p>Packs produits et écoulés</p></div><button className="more-button" onClick={handlePlaceholderAction}><MoreHorizontal size={18} /></button></div>
                <div className="chart-legend"><span><i className="legend-swatch blue" /> Produits</span><span><i className="legend-swatch coral" /> Écoulés</span><span className="chart-period">Cette semaine <ChevronDown size={14} /></span></div>
                <div className="bar-chart">
                  <div className="y-axis"><span>300</span><span>200</span><span>100</span><span>0</span></div>
                  <div className="bars-area">
                    <div className="grid-line line-1" /><div className="grid-line line-2" /><div className="grid-line line-3" /><div className="bars-row">
                      {[{ d: "Lun", p: 54, e: 22 }, { d: "Mar", p: 66, e: 29 }, { d: "Mer", p: 47, e: 19 }, { d: "Jeu", p: 83, e: 34 }, { d: "Ven", p: 64, e: 26 }, { d: "Sam", p: 72, e: 31 }, { d: "Dim", p: 24, e: 11 }].map(item => <div className="bar-column" key={item.d}><div className="bar-pair"><div className="bar product" style={{ height: `${item.p}%` }} /><div className="bar sold" style={{ height: `${item.e * 2.1}%` }} /></div><span>{item.d}</span></div>)}
                  </div>
                </div></div>
              </div>
              <div className="panel activity-panel"><div className="panel-heading"><div><h3>Activité récente</h3><p>Les dernières opérations</p></div><button className="text-button" onClick={() => navigate("rapports")}>Voir tout <ArrowUpRight size={14} /></button></div><div className="activity-list">{activity.map(item => { const Icon = item.icon; return <div className="activity-item" key={item.title}><div className={`activity-icon ${item.color}`}><Icon size={16} /></div><div className="activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div><time>{item.time}</time></div>; })}</div></div>
            </section>

            <section className="content-grid bottom-grid">
              <div className="panel tour-panel"><div className="panel-heading"><div><div className="heading-with-status"><h3>Tournée en cours</h3><StatusPill tone="amber">En cours</StatusPill></div><p>Jeudi 10 septembre · Moussa</p></div><button className="more-button" onClick={() => setShowTour(true)}><MoreHorizontal size={18} /></button></div><div className="tour-stats"><div><span className="tour-stat-label">Packs remis</span><strong>150</strong></div><div className="tour-divider" /><div><span className="tour-stat-label">Retours estimés</span><strong>95</strong></div><div className="tour-divider" /><div><span className="tour-stat-label">Écoulés</span><strong className="text-coral">55</strong></div></div><div className="tour-progress"><div className="flex justify-between"><span>Progression de la tournée</span><strong>37%</strong></div><div className="progress-track"><div className="progress-fill amber-fill" style={{ width: "37%" }} /></div></div><button className="outline-wide-button" onClick={() => setShowTour(true)}><ClipboardList size={16} /> Ouvrir le contrôle de tournée <ArrowUpRight size={15} /></button></div>
              <div className="panel receivable-panel"><div className="panel-heading"><div><h3>Créances clients</h3><p>Montant total à récupérer</p></div><div className="receivable-total">21 750 F</div></div><div className="receivable-list">{receivables.map(client => <div className="receivable-item" key={client.name}><div className={`client-initials ${client.tone}`}>{client.initials}</div><div className="client-copy"><strong>{client.name}</strong><span>{client.detail}</span></div><div className="client-amount"><strong>{formatMoney(client.amount)}</strong><button onClick={() => toast("Relance préparée", { description: `Message WhatsApp prêt pour ${client.name}.` })}>Relancer</button></div></div>)}</div><button className="outline-wide-button" onClick={() => navigate("credits")}><UsersRound size={16} /> Voir toutes les créances <ArrowUpRight size={15} /></button></div>
            </section>
          </> : <><section className="welcome-row simple"><div><p className="eyebrow">Aqua Étoile <span className="eyebrow-dot" /> Module métier</p><h1>{activeTitle}</h1><p className="page-subtitle">Gérez cette partie de votre activité depuis un espace simple et lisible.</p></div><div className="header-ctas"><button className="primary-button" onClick={activeSection === "production" ? () => setShowProduction(true) : handlePlaceholderAction}><Plus size={17} /> Nouvelle opération</button></div></section><EmptySection section={activeSection} onAction={activeSection === "production" ? () => setShowProduction(true) : handlePlaceholderAction} /></>}
        </div>
        <div className="mobile-bottom-nav"><button className={activeSection === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}><LayoutDashboard size={19} /><span>Accueil</span></button><button onClick={() => setShowProduction(true)}><Plus size={19} /><span>Ajouter</span></button><button className={activeSection === "tournees" ? "active" : ""} onClick={() => navigate("tournees")}><Truck size={19} /><span>Tournées</span></button><button className={activeSection === "clients" ? "active" : ""} onClick={() => navigate("clients")}><UserRound size={19} /><span>Clients</span></button></div>
      </main>

      {showProduction && <div className="modal-backdrop" onMouseDown={() => setShowProduction(false)}><div className="modal-card" onMouseDown={e => e.stopPropagation()}><div className="modal-top"><div className="modal-icon blue"><Droplets size={20} /></div><button className="close-button" onClick={() => setShowProduction(false)}><X size={18} /></button></div><p className="eyebrow">Mouvement de stock</p><h2>Enregistrer une production</h2><p className="modal-description">Ajoutez les packs produits aujourd’hui. Ils seront automatiquement ajoutés à votre stock.</p><label className="form-label">Date de production<input className="form-input" type="date" defaultValue="2026-09-10" /></label><label className="form-label">Quantité produite<div className="input-with-suffix"><input className="form-input" type="number" value={productionQty} onChange={e => setProductionQty(e.target.value)} /><span>packs</span></div></label><label className="form-label">Observation <textarea className="form-input textarea" placeholder="Ex. Production du matin..." /></label><div className="modal-summary"><span>Nouveau stock estimé</span><strong>1 335 packs</strong></div><div className="modal-actions"><button className="secondary-button" onClick={() => setShowProduction(false)}>Annuler</button><button className="primary-button" onClick={saveProduction}><Check size={16} /> Enregistrer</button></div></div></div>}
      {showTour && <div className="modal-backdrop" onMouseDown={() => setShowTour(false)}><div className="modal-card tour-modal" onMouseDown={e => e.stopPropagation()}><div className="modal-top"><div className="modal-icon amber"><Truck size={20} /></div><button className="close-button" onClick={() => setShowTour(false)}><X size={18} /></button></div><p className="eyebrow">Contrôle de tournée · T-024</p><h2>Retour du livreur</h2><p className="modal-description">Moussa est actuellement en tournée avec 150 packs remis ce matin.</p><div className="tour-form-grid"><label className="form-label">Packs sortis<input className="form-input" value="150" readOnly /></label><label className="form-label">Packs retournés<input className="form-input" defaultValue="95" /></label></div><div className="calculation-card"><div><span>Packs écoulés</span><strong>55 packs</strong></div><div><span>Valeur théorique</span><strong>12 375 F</strong></div><StatusPill tone="green">Écart cohérent</StatusPill></div><div className="modal-actions"><button className="secondary-button" onClick={() => setShowTour(false)}>Plus tard</button><button className="primary-button" onClick={() => { setShowTour(false); toast("Tournée mise à jour", { description: "Les retours ont été enregistrés." }); }}><Check size={16} /> Enregistrer le retour</button></div></div></div>}
      {toastMessage && <button className="toast-note" onClick={() => setToastMessage(null)}>{toastMessage}<X size={14} /></button>}
    </div>
  );
}
