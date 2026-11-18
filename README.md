# FinGuard AI — Personal Finance & Transaction Risk Intelligence

FinGuard AI is a multi-user personal finance management, transaction risk monitoring, PaySim fraud model demonstration, and scam-awareness web application built with **React**, **TypeScript**, **Tailwind CSS**, **Firebase Authentication (Google OIDC)**, and **Cloud Firestore**.

## Core Features

- **Google Identity & Strict Two-Account Isolation**: Uses Google OpenID Connect sign-in (`signInWithPopup`) with zero Gmail or Drive API scopes. Every transaction, risk preference, and PaySim assessment is stored under `/users/{uid}/...` and enforced by zero-trust Firestore Security Rules (`firestore.rules`).
- **Transaction Manager & CSV Pipeline**: Add, search, filter (date range, category, type), edit, and delete INR (`₹`) records. Includes live TF-IDF + Logistic Regression expense category suggestions with manual override, row-validated CSV import preview, and user-scoped CSV export.
- **Personal Finance Analytics**: Interactive cash-flow KPIs and five INR charts (Income vs. Expenses by Month, Expenses by Category, Monthly Savings Trend, Transaction Timeline, and Top Expense Categories) with month-over-month guards and empty states.
- **Risk Monitor & Separated PaySim Fraud Bench**:
  - *Personal Activity Monitors*: Possible duplicate detection with review actions, configurable daily frequency threshold, and category outlier detection using strictly prior records.
  - *PaySim Fraud & Anomaly Demo*: Strictly separated evaluation of Logistic Regression, Random Forest, and Isolation Forest on the complete PaySim schema without fabricating balance fields for manual entries.
- **Scam-Awareness Assistant**: Heuristic text analyzer inspecting suspicious messages for OTP requests, PIN/CVV requests, urgent pressure, account threats, links, and prize claims with clear educational explanations.
- **Model Cards, Temporal Split Audit & Project Report**: Interactive model transparency cards documenting the PaySim temporal split shift (`0.14% -> 0.98%` fraud prevalence), leakage cautions, a 10-chapter Project Report outline, and a live demo checklist.
- **Account & Privacy Controls**: Displays verified UID identity binding, full CSV/JSON data export, and permanent user-scoped data deletion.

## Repository Structure

- `src/App.tsx` — Root auth gate, real-time user-scoped Firestore subscriptions, and workspace router
- `src/lib/` — Deterministic domain engines (`expenseClassifier.ts`, `riskMonitor.ts`, `paysimModels.ts`, `scamDetector.ts`, `csvUtils.ts`, `firebase.ts`)
- `src/services/firestoreService.ts` — Strictly user-scoped Firestore CRUD & batch operations
- `src/components/` — Landing page, workspace shell, and all 7 functional views
- `firestore.rules` & `firebase-blueprint.json` — Hardened Firestore schema & security rules
- `security_spec.md` — Phase 0 data invariants and adversarial payload specifications
- `tests/finguard.test.ts` — Automated tests for two-account isolation, CSV validation, risk baselines, and scam heuristics

## Local Setup & Verification

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure environment**:
   Ensure `firebase-applet-config.json` points to your Firebase project with Google Sign-In enabled and Firestore rules deployed (`firestore.rules`). Never commit `.env` or secret credentials.
3. **Run development server**:
   ```bash
   npm run dev
   ```
4. **Run automated tests, typecheck, build, and rules audit**:
   ```bash
   npm test
   npm run lint
   npm run build
   npx eslint firestore.rules
   ```

## Security & Model Disclaimers

- FinGuard AI never asks for bank login credentials, card PINs, UPI PINs, CVVs, or OTPs.
- PaySim fraud scores are educational demonstrations trained on synthetic Kaggle PaySim data and do not represent real-world banking fraud proof.
- Scam-awareness assessments are heuristic pattern checks and do not guarantee a message is safe or fraudulent.
