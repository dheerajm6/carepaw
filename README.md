# CarePaw 🐾

A community-driven street dog care and safety app. CarePaw lets residents register stray dogs in their neighbourhood, log health observations, report aggressive incidents, and build a shared map that helps everyone stay informed and safe.

---

## Features

- **Discover** — Interactive map showing all registered dogs within 500 m of your location, with real-time GPS tracking and a list view
- **Dog Registration** — Photo upload, physical identification markers (ear notch, tail type, coat markings, etc.), gender, size, vaccination and sterilization status, temperament
- **Observation Logging** — Log health updates, aggression reports, bite incidents, injuries, and feeding patterns directly from the map or dog profile
- **AI Insights** — Upload a photo or video with an observation and get an instant AI analysis (powered by Claude) describing what it sees and what action to take
- **Physical Identification** — 22 visual trait markers across 4 groups (Ears, Tail, Coat, Body) to help community members identify the same dog reliably
- **Risk Scoring** — Each dog carries a live risk score based on confirmed aggression and bite reports
- **Alerts** — Community alert feed for high-risk incidents
- **Phone OTP Auth** — Sign in with just a mobile number, no password needed

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| Maps | Leaflet + React Leaflet |
| Auth | Firebase Phone Auth |
| Database | Cloud Firestore |
| Media uploads | Cloudinary |
| AI | Claude claude-opus-4-6 (Anthropic) |
| Mobile | Capacitor (Android / iOS) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Phone Auth and Firestore enabled
- A Cloudinary account (free tier is fine)
- An Anthropic API key

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/dheerajm6/carepaw.git
cd carepaw

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in your keys (see Environment Variables below)

# 4. Start the dev server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=

# Anthropic (Claude AI)
VITE_ANTHROPIC_API_KEY=
```

> **Never commit your `.env` file.** It is already in `.gitignore`.

### Deploy Firestore Rules

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

### Build for Production

```bash
npm run build
```

### Run on Android

```bash
npm run cap:sync
npm run cap:android
```

---

## Project Structure

```
src/
├── components/
│   └── TabBar.tsx          # Bottom navigation
├── lib/
│   ├── ai.ts               # Claude AI integration + video frame extraction
│   ├── cloudinary.ts       # Cloudinary upload helper
│   ├── constants.ts        # Shared observation types
│   ├── firebase.ts         # Firebase initialisation
│   ├── markers.ts          # Physical identification marker definitions
│   ├── store.ts            # Global app state (auth, GPS)
│   └── types.ts            # TypeScript interfaces (Dog, Observation, etc.)
└── pages/
    ├── Alerts.tsx           # Community alerts feed
    ├── Care.tsx             # Care resources
    ├── Discover.tsx         # Map + list view
    ├── DogProfile.tsx       # Dog profile + observation modal
    ├── OTP.tsx              # OTP verification
    ├── Phone.tsx            # Phone number entry
    ├── Register.tsx         # Dog registration form
    └── Splash.tsx           # Splash / loading screen
```

---

## Contributing

All contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR. The short version:

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Push and open a Pull Request against `main`

Direct pushes to `main` are restricted — all changes go through PR review.

---

## License

MIT © [Dheeraj M](https://github.com/dheerajm6)
