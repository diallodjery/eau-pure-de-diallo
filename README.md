# EAU PURE DE DIALLO — Ma gestion

Application simple et mobile-first pour suivre la production et la distribution des packs d’eau.

## Version actuelle

- Connexion sécurisée du gérant avec Firebase Authentication ;
- Clients, dettes et opérations lus depuis Firestore ;
- Production, sortie, retour et vente enregistrables ;
- Ajout de clients dans la collection `clients` ;
- Logo officiel et interface adaptée au téléphone.

## Première configuration Firebase

Dans Firebase Console, ouvrir **Authentication > Sign-in method**, activer **Email/Password**, puis ouvrir **Authentication > Users** et créer le compte du gérant.

Dans Firestore, les règles temporaires de test peuvent être remplacées par :

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /operations/{operationId} {
      allow read, write: if request.auth != null;
    }

    match /clients/{clientId} {
      allow read, write: if request.auth != null;
    }

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Ces règles autorisent uniquement les utilisateurs connectés. Pour une application multi-utilisateurs, il faudra ensuite limiter les accès par identifiant d’entreprise.

## Développement

```bash
git clone URL_DU_DEPOT
cd eau-pure-de-diallo
pnpm install
pnpm dev
```

Validation :

```bash
pnpm check
pnpm build
```

## Structure principale

- `client/src/pages/Home.tsx` : accueil, actions et écrans métier ;
- `client/src/components/AuthGate.tsx` : protection de l’application ;
- `client/src/components/LoginScreen.tsx` : connexion du gérant ;
- `client/src/lib/firebase.ts` : initialisation Firebase ;
- `client/src/lib/auth.ts` : Firebase Authentication ;
- `client/src/lib/operations.ts` : lecture et écriture Firestore ;
- `client/public/eau-pure-de-diallo-logo.png` : logo officiel.
