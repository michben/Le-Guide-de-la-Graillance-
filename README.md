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
- **Spots et avis en temps réel (Firestore)** : la liste des spots et leurs avis sont lus depuis
  Firestore (`onSnapshot`, mise à jour live) une fois connecté, et la publication d'un avis
  (`src/firebase/firestore.ts`) recalcule note moyenne et nombre d'avis dans une transaction
  atomique. Sans Firebase configuré, l'app retombe sur les mêmes données mockées qu'avant
  (`src/data/spots.ts`) pour rester testable en mode démo.
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
- **Authentification** : Firebase Auth (`firebase` SDK JS, `src/firebase/auth.ts`).
- **Données spots/avis** : Firestore (`firebase` SDK JS, `src/firebase/firestore.ts`), avec repli
  sur les données mock locales (`src/data/spots.ts`) en mode démo — le tout isolé derrière
  `AppContext` (`src/context/AppContext.tsx`) donc les écrans ne connaissent pas la source des
  données.
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

### Activer Firestore (spots + avis)

1. Dans la console Firebase, va dans **Firestore Database** et crée une base (mode production).
2. Colle le contenu de `firestore.rules` (racine du repo) dans l'onglet **Règles** de Firestore,
   puis publie. Ces règles : autorisent la lecture de `spots/*` à tout utilisateur connecté,
   n'autorisent la mise à jour que des champs `reviews`/`rating`/`reviewCount` (impossible de
   modifier le nom, l'adresse ou les badges d'un spot depuis l'app), et interdisent la création/
   suppression de spots depuis le client (réservé au script d'admin ci-dessous).
3. Génère une clé de compte de service : **Paramètres du projet > Comptes de service > Générer une
   nouvelle clé privée**. Garde ce fichier JSON en dehors du repo (ne jamais le commiter).
4. Charge les spots de démo dans Firestore :

   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/ta-cle.json npm run seed:firestore
   ```

   Ce script (`scripts/seed-firestore.ts`) réutilise `src/data/spots.ts` comme source unique de
   vérité et écrit un document par spot dans la collection `spots`.
5. Recharge l'app connectée : la carte/liste et le détail d'un spot lisent maintenant Firestore en
   temps réel, et "Publier mon avis" écrit dans Firestore au lieu de l'état local.

## Lancer le projet

```bash
npm install
npm run web     # version web (navigateur)
npm run ios     # nécessite macOS/Xcode ou Expo Go
npm run android # nécessite Android Studio ou Expo Go
```

## Prochaines étapes suggérées

- Brancher Firebase Storage pour les vraies photos de preuve (actuellement un simple booléen
  `ticketPhoto`/`dishPhoto` sur chaque avis, aussi bien en mode démo qu'en Firestore).
- Persister `reviewsPosted` / `rank` / `isPremium` par utilisateur dans Firestore (`users/{uid}`)
  au lieu de l'état React local, pour que ça survive à une reconnexion.
- Migrer `reviews` d'un tableau dénormalisé sur le document `spots/{id}` vers une sous-collection
  (`spots/{id}/reviews/{reviewId}`) si le nombre d'avis par spot devient important — le tableau
  actuel est simple et suffisant pour un MVP mais grossit le document à chaque avis.
- Facebook/X : créer les apps OAuth correspondantes puis les brancher via `expo-auth-session` +
  les fournisseurs Firebase Auth `FacebookAuthProvider` / OIDC pour X.
- Intégrer une vraie carte (Google Maps API / `react-native-maps`) à la place de la carte
  simplifiée utilisée pour ce MVP.
- Modération des avis (vérification automatique/manuelle des tickets) côté backend (Cloud
  Functions).
- Paiement Premium (RevenueCat / Stripe) pour les abonnements 4,99 €/mois et 49,99 €/an.
