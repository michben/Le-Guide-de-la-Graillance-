# Le Guide de la Graillance 🍔🔥

> Tu veux graille ? Ouvre l'appli, trouve le bon spot, vérifie les avis certifiés, et évite les
> arnaques d'influenceurs.

MVP mobile (Expo / React Native, iOS + Android + Web) construit autour de 5 écrans clés.

## Écrans

1. **Login** (`src/screens/LoginScreen.tsx`) — inscription/connexion par email + mot de passe via
   **Firebase Authentication**, avec le message d'accueil « Ici, on graille vrai. » Facebook et X
   sont affichés en boutons désactivés ("Bientôt") : ils nécessitent la création d'apps OAuth côté
   Meta/X que je ne peux pas provisionner à ta place.
2. **Localisation** (`src/screens/LocationScreen.tsx`) — géolocalisation GPS (`expo-location`) ou
   saisie manuelle d'adresse.
3. **Catégories** (`src/screens/CategoriesScreen.tsx`) — grille Pizza / Kebab / Sushi / Burger /
   Halal / Tacos / Poulet / Asiatique, ou "montre-moi tout".
4. **Carte + Liste** (`src/screens/MapListScreen.tsx`) — bascule carte/liste des spots à proximité,
   avec distance, note et badges (Halal, AVS, Achahada).
5. **Détail du spot + avis** (`src/screens/SpotDetailScreen.tsx`) — infos du spot, avis certifiés
   (badge de preuve ticket + plat), et le bouton **« J'ai graillé ici »** qui ouvre le formulaire
   d'avis : impossible de publier sans photo du ticket **et** photo du plat.

## Fonctionnalités clés implémentées

- **Authentification réelle (Firebase Auth)** : inscription et connexion par email/mot de passe,
  état de session persistant (`onAuthStateChanged`), déconnexion depuis le profil dans l'en-tête.
  Tant que Firebase n'est pas configuré, l'app bascule automatiquement en **mode démo** (banneau
  jaune sur l'écran de login + bouton "Continuer en mode démo") pour rester testable sans
  compte — voir `src/firebase/config.ts` et `src/context/AppContext.tsx`.
- **Preuve obligatoire** : le bouton "Publier mon avis" reste désactivé tant que la photo du
  ticket, la photo du plat et un commentaire ne sont pas fournis (`ImagePicker` réel via
  `expo-image-picker`).
- **Badges utilisateurs / gamification** : Grailleur Bronze → Validateur (3+ avis) → Premium,
  visible dans l'en-tête de chaque écran (`src/components/RankBadge.tsx`,
  `src/context/AppContext.tsx`).
- **Certifications resto** : Halal, AVS, Achahada affichées en pastilles colorées
  (`src/components/BadgePill.tsx`).
- **Simulation Premium** : modal accessible depuis l'en-tête, présente l'offre 4,99 €/mois ou
  49,99 €/an (`src/components/HeaderProfile.tsx`).

## Stack technique

- **Frontend** : Expo / React Native + React Native Web (déploiement iOS, Android, Web depuis une
  seule base de code), `@react-navigation/native-stack`.
- **Authentification** : Firebase Auth (`firebase` SDK JS, `src/firebase/`).
- **Données spots/avis** : couche mock locale (`src/data/spots.ts`) isolée derrière un
  `AppContext` (`src/context/AppContext.tsx`) — prête à être branchée sur Firestore (voir
  "Prochaines étapes").
- **Géolocalisation** : `expo-location`.
- **Photos (preuve d'avis)** : `expo-image-picker`.

## Configurer Firebase

L'app fonctionne sans configuration (mode démo), mais pour activer l'authentification réelle :

1. Crée un projet sur [console.firebase.google.com](https://console.firebase.google.com).
2. Dans **Authentication > Sign-in method**, active le fournisseur **Email/Password**.
3. Dans **Paramètres du projet > Vos applications**, ajoute une application **Web** et copie sa
   config.
4. Copie `.env.example` vers `.env` et renseigne les valeurs :

   ```bash
   cp .env.example .env
   ```

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```

5. Relance `npm run web` (ou `ios`/`android`) : l'écran de login affiche alors le vrai formulaire
   email + mot de passe (connexion/inscription) au lieu du bandeau "mode démo".

`.env` n'est jamais commité (voir `.gitignore`) — chaque développeur/environnement garde sa propre
config Firebase.

## Lancer le projet

```bash
npm install
npm run web     # version web (navigateur)
npm run ios     # nécessite macOS/Xcode ou Expo Go
npm run android # nécessite Android Studio ou Expo Go
```

## Prochaines étapes suggérées

- Brancher Firestore pour les spots/avis (actuellement mockés dans `src/data/spots.ts`) et
  Firebase Storage pour les photos de preuve (actuellement un simple booléen).
- Persister `reviewsPosted` / `rank` / `isPremium` par utilisateur dans Firestore (`users/{uid}`)
  au lieu de l'état React local, pour que ça survive à une reconnexion.
- Facebook/X : créer les apps OAuth correspondantes puis les brancher via `expo-auth-session` +
  les fournisseurs Firebase Auth `FacebookAuthProvider` / OIDC pour X.
- Intégrer une vraie carte (Google Maps API / `react-native-maps`) à la place de la carte
  simplifiée utilisée pour ce MVP.
- Modération des avis (vérification automatique/manuelle des tickets) côté backend (Cloud
  Functions).
- Paiement Premium (RevenueCat / Stripe) pour les abonnements 4,99 €/mois et 49,99 €/an.
