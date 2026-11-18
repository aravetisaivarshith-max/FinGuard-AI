# FinGuard AI - Current Project Status

## Environment
- Stack: React 19, TypeScript, Vite, Tailwind CSS v4, Firebase Auth (Google OIDC), Cloud Firestore
- Run: `npm run dev` (Port 3000)
- Test: `npm test` (`npx tsx --test tests/finguard.test.ts`)

## Completed and Verified
- [x] Google Sign-In works (OpenID Connect identity only, zero Workspace scopes)
- [x] `firebase-blueprint.json` & hardened `firestore.rules` created, ESLint-audited, and deployed
- [x] Per-user `users/{uid}` subcollection isolation enforced at database rules layer
- [x] Two-account isolation verified in automated tests and Firestore security rules
- [x] Transaction CRUD is user-scoped (with AI TF-IDF category suggestion + manual override)
- [x] CSV import preview/validation and user-scoped CSV export completed
- [x] Personal Finance Analytics dashboard completed (5 INR charts + date filter + MoM guard)
- [x] Risk monitors are user-scoped (Duplicates, Frequency, Prior-only Category Baseline)
- [x] PaySim Fraud & Isolation Forest Demo strictly separated from manual transactions
- [x] Scam-awareness module completed (`scamDetector.ts` + educational UI)
- [x] Interactive Model Cards, PaySim temporal split audit & 10-chapter Report view completed
- [x] Full standalone `docs/PROJECT_REPORT.md` & `docs/USER_GUIDE.md` completed
- [x] Stylish deep navy obsidian + crisp white + teal fintech UI completed
- [x] GitHub hygiene (`.gitignore`, `README.md`, `security_spec.md`, automated CRUD & security test suites) completed

## Security & Isolation Notes
- Every read, list, create, update, and delete operation under `/users/{userId}` validates `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
- `npx eslint firestore.rules` runs with `@firebase/eslint-plugin-security-rules` and passes with zero errors.
