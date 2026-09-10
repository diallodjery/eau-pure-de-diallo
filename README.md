# EAU PURE DE DIALLO — Ma gestion

Maquette simple et mobile-first pour suivre la production et la distribution des packs d’eau.

## Ce que contient cette version

- Accueil simple avec le résumé de la journée ;
- Quatre actions principales : produire, remettre au livreur, enregistrer le retour et enregistrer une vente ;
- Stock disponible, packs en tournée, encaissements et créances ;
- Historique des dernières opérations ;
- Menu secondaire pour les clients, dettes, factures, dépenses et paramètres ;
- Logo officiel de **EAU PURE DE DIALLO** intégré.

## Ouvrir le projet sur un ordinateur

Installer [Node.js](https://nodejs.org/) puis exécuter :

```bash
git clone URL_DU_DEPOT
cd eau-pure-de-diallo
pnpm install
pnpm dev
```

Pour vérifier le projet :

```bash
pnpm check
pnpm build
```

## Structure principale

- `client/src/pages/Home.tsx` : écran principal et interactions ;
- `client/src/index.css` : styles et responsive mobile ;
- `client/src/App.tsx` : point d’entrée React ;
- `client/public/eau-pure-de-diallo-logo.png` : logo officiel ;
- `client/index.html` : titre et configuration de la page.

Cette version est une **maquette frontend** : les chiffres affichés sont des exemples et ne sont pas encore enregistrés dans une base de données.
