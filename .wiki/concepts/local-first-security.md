---
title: "Local-First Security | உள்ளூர்-முதல் பாதுகாப்பு"
type: "concept"
status: "active"
source_paths: ["utils/cryptoService.ts", "utils/db.ts"]
updated_at: "2026-05-01"
---

# Local-First Security | உள்ளூர்-முதல் பாதுகாப்பு

Privacy and security are the core pillars of i8e10. The application is designed such that no sensitive financial data ever leaves the user's device.

## Core Tenets | முக்கிய கோட்பாடுகள்
1. **No Cloud Sync**: Data is stored exclusively in the browser's IndexedDB.
2. **Client-Side Encryption**: All sensitive fields are encrypted before persistence.
3. **Zero-Knowledge**: The system has no way to recover data without the user's password or recovery phrase.

## Security Layers | பாதுகாப்பு அடுக்குகள்
- **Transport**: Since it's a PWA, all traffic is over HTTPS, but data itself is static and local.
- **Storage**: AES-GCM encryption for all sensitive fields.
- **Access**: PBKDF2-derived keys for session unlocking.

## Interlinks | இணைப்புகள்
- [Auth & Encryption](../flows/auth-and-encryption.md) - Technical details of the crypto implementation.
- [Data Persistence](data-persistence.md) - How encrypted data is stored locally.
