---
title: "Data Management | தரவு மேலாண்மை"
type: "feature"
status: "active"
source_paths: ["App.tsx", "components/ClearDataConfirmationModal.tsx"]
updated_at: "2026-05-01"
---

# Data Management | தரவு மேலாண்மை

This section covers global data operations, including complete data erasure.

## Delete All Data | அனைத்து தரவையும் நீக்கு
The "Delete All" feature (handled by `handleClearAllData` in `App.tsx`) provides a "factory reset" for the application.

### Process Flow | செயல்முறை ஓட்டம்
1. **Confirmation**: A modal (`ClearDataConfirmationModal`) requires the user to type a specific phrase to prevent accidental deletion.
2. **Key Erasure**: The in-memory session key is cleared from `cryptoService`.
3. **Database Deletion**: The entire IndexedDB (`i8e10DB`) is deleted using `db.delete()`.
4. **Re-Initialization**: A fresh, empty database is opened.
5. **State Reset**: The app status is set back to `SETUP_REQUIRED`, triggering the onboarding and password setup flow.

## Privacy Implications | தனியுரிமை விளைவுகள்
Since i8e10 is local-first, "Delete All" removes all financial records and encryption keys from the device. There is no server-side backup to restore from, ensuring the user has absolute control over their data footprint.

## Interlinks | இணைப்புகள்
- [Core Database](../modules/core-database.md) - The persistence layer being cleared.
- [Auth & Encryption](../flows/auth-and-encryption.md) - The encryption keys being destroyed.
- [User Journey](../flows/user-journey.md) - How the user returns to the setup phase.
