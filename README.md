# EAU PURE DE DIALLO — Ma gestion

Maquette simple et mobile-first pour suivre la production et la distribution des packs d’eau.

## Ce que contient cette version

- Accueil simple avec le résumé de la journée ;
- Quatre actions principales : produire, remettre au livreur, enregistrer le retour et enregistrer une vente ;
- Stock disponible, packs en tournée, encaissements et créances ;
- Enregistrement des opérations dans **Firebase Firestore** ;
- Sauvegarde locale automatique si Firestore refuse temporairement l’écriture ;
- Historique des dernières opérations ;
- Menu secondaire pour les clients, dettes, factures, dépenses et paramètres ;
- Logo officiel de **EAU PURE DE DIALLO** intégré.

## Firebase

Le projet Firebase utilisé est `eau-pure-diallo`. La configuration Web se trouve dans `client/src/lib/firebase.ts`. La configuration Web Firebase peut être présente côté frontend ; la sécurité doit être assurée par les règles Firestore et l’authentification Firebase.

Pour permettre l’écriture des opérations, créer la base Firestore dans la console Firebase puis prévoir des règles adaptées. Dans cette maquette, les opérations sont enregistrées dans la collection `operations`.

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
- `client/src/lib/firebase.ts` : initialisation Firebase ;
- `client/src/lib/operations.ts` : sauvegarde Firestore avec secours local ;
- `client/public/eau-pure-de-diallo-logo.png` : logo officiel ;
- `client/index.html` : titre et configuration de la page.

Cette version est encore une **première version connectée** : les opérations de base sont persistées, tandis que les écrans détaillés clients, factures et rapports restent à développer.
