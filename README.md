# Le Guide de la Graillance 🍔🔥

> Tu veux graille ? Ouvre l'appli, trouve le bon spot, vérifie les avis certifiés, et évite les
> arnaques d'influenceurs.

MVP mobile (Expo / React Native, iOS + Android + Web) construit autour de 5 écrans clés.

## Écrans

1. **Login** (`src/screens/LoginScreen.tsx`) — connexion email/tél, Facebook, X, avec le message
   d'accueil « Ici, on graille vrai. »
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
- **Données** : couche mock locale (`src/data/spots.ts`) isolée derrière un `AppContext`
  (`src/context/AppContext.tsx`), prête à être branchée sur un backend Node.js + Firebase
  (auth, Firestore, Storage pour les photos) sans changer les écrans.
- **Géolocalisation** : `expo-location`.
- **Photos (preuve d'avis)** : `expo-image-picker`.

## Lancer le projet

```bash
npm install
npm run web     # version web (navigateur)
npm run ios     # nécessite macOS/Xcode ou Expo Go
npm run android # nécessite Android Studio ou Expo Go
```

## Prochaines étapes suggérées

- Brancher Firebase (Auth, Firestore, Storage) à la place des données mock dans `AppContext`.
- Intégrer une vraie carte (Google Maps API / `react-native-maps`) à la place de la carte
  simplifiée utilisée pour ce MVP.
- Modération des avis (vérification automatique/manuelle des tickets) côté backend.
- Paiement Premium (RevenueCat / Stripe) pour les abonnements 4,99 €/mois et 49,99 €/an.
