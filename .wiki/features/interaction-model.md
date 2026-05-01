---
title: "Interaction Model | தொடர்பு மாதிரி"
type: "feature"
status: "active"
source_paths: ["components/AddTransactionButton.tsx", "hooks/useScrollDirection.ts", "components/InstallAppBanner.tsx"]
updated_at: "2026-05-01"
---

# Interaction Model | தொடர்பு மாதிரி

The interaction model of i8e10 is optimized for mobile-first, low-friction financial logging.

## Floating Action Button (FAB) | மிதக்கும் செயல் பொத்தான்
The primary interaction point for adding data is the multi-state FAB.

### 1. Dual-Action Logic | இரட்டை-செயல் தர்க்கம்
The FAB distinguishes between a quick tap and a long press to balance speed and power.
- **Quick Tap**: Triggers the "Smart Default" action based on the current view (e.g., "Add Expense" if in Transactions view).
- **Long Press (350ms)**: Rotates the FAB by 45° and expands a radial menu with all entry types (Transaction, Bulk, Debt, Investment).

### 2. Visibility & Focus | தெரிவுநிலை மற்றும் கவனம்
- **Scroll-to-Hide**: To maximize screen real estate, the FAB automatically hides when the user scrolls down and slides back in when they scroll up.
- **Animations**: Uses `framer-motion` for spring-based physics, giving the UI a tactile, responsive feel.

## Progressive Web App (PWA) | முற்போக்கான இணைய பயன்பாடு
i8e10 is designed to feel like a native app.
- **Offline Ready**: Uses service workers to cache all assets, allowing the app to load instantly even without an internet connection.
- **Installability**: An `InstallAppBanner` prompts users to add the app to their home screen for a full-screen, standalone experience.
- **Update Logic**: When a new version is available, the `UpdateAvailableBanner` allows the user to refresh and apply the update without losing data.

## Gestures & Tactile Feedback | சைகைகள் மற்றும் தொட்டுணரக்கூடிய பின்னூட்டம்
- **List Animations**: Items slide in and out using `animate-fadeInUp`, providing visual cues for data changes.
- **Button Press**: All primary buttons use a `btn-press` utility that mimics physical button compression.

## Interlinks | இணைப்புகள்
- [[User Journey]] - How these interactions map to the user's goals.
- [[UI Architecture]] - The technical structure behind these components.
