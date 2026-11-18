# FinGuard AI — Project Report

**Title:** FinGuard AI: AI-Based Personal Finance Management and Transaction Risk Monitoring System  
**Stack:** React 19, TypeScript, Tailwind CSS v4, Firebase Authentication (Google OpenID Connect), Cloud Firestore  

---

## Chapter 1: Introduction
Personal finance tracking for students and everyday digital-payment users is often fragmented across UPI apps, bank SMS notifications, and manual spreadsheets. At the same time, rising digital payment volume increases exposure to duplicate billing, unbudgeted spending spikes, and social-engineering scams. FinGuard AI unifies personal cash-flow management, explainable anomaly signals, separated synthetic fraud model evaluation, and scam-awareness education in a single privacy-first web application.

## Chapter 2: Problem Statement and Objectives
- **In Scope:**
  - Google OpenID Connect authentication anchored to an immutable user UID.
  - Strictly isolated multi-user transaction CRUD, CSV import validation, and scoped CSV/JSON export.
  - Automated AI expense category suggestions with full manual user override.
  - Personal INR (`₹`) cash-flow analytics across five interactive visualizations.
  - Explainable personal activity monitors (duplicate detection, configurable daily frequency threshold, and prior-only category baselines).
  - Strictly separated PaySim fraud model demonstration bench (Logistic Regression, Random Forest, Isolation Forest).
  - Rule-based Scam-Awareness Assistant explaining suspicious message patterns without claiming certainty.
- **Deliberately Out of Scope:**
  - Accessing user Gmail or Google Drive files.
  - Scraping live bank credentials, OTPs, UPI PINs, or CVVs.
  - Executing real financial transfers or issuing definitive legal fraud verdicts.

## Chapter 3: Existing and Proposed System
Traditional trackers either operate as single-user local spreadsheets without anomaly detection or require linking sensitive bank credentials to third-party aggregators. FinGuard AI eliminates credential sharing by supporting structured manual entry and validated CSV uploads while enforcing database-level zero-trust ownership rules across accounts.

## Chapter 4: Architecture and Design
- **Frontend Layer:** React + TypeScript SPA organized into an unauthenticated editorial welcome gate (`LandingGate`) and an authenticated multi-view workspace (`WorkspaceShell`).
- **Identity Layer:** Firebase Authentication configured strictly for Google OpenID Connect (`signInWithPopup`), using `uid` as the immutable owner key and `email_verified == true` enforcement.
- **Persistence & Isolation Layer:** Cloud Firestore structured under `/users/{userId}` with subcollections `/transactions/{transactionId}`, `/fraudAssessments/{assessmentId}`, and `/preferences/config`.
- **Domain Engines:** Pure TypeScript modules for TF-IDF categorization, cash-flow analytics, personal risk monitoring, PaySim feature scoring, CSV validation, and regex-based scam pattern inspection.

## Chapter 5: Dataset and Preprocessing
- **Expense Training Taxonomy:** Mapped to 10 personal finance categories (`Uncategorized`, `Food`, `Bills`, `Education`, `Entertainment`, `Healthcare`, `Shopping`, `Transportation`, `Investment`, `Other`).
- **PaySim Fraud Corpus:** Derived from the Kaggle PaySim synthetic mobile-money dataset (`6,362,620` total rows, `8,213` labelled fraud cases), focusing on `TRANSFER` and `CASH_OUT` subsets where fraud occurs in the dataset.
- **Temporal Split Caution:** Train (`1,951,895` rows / `3,643` fraud, `0.19%`), Validation (`410,437` rows / `560` fraud, `0.14%`), and Test (`408,077` rows / `4,010` fraud, `0.98%`). Because test fraud prevalence is roughly 7x higher than validation, threshold tuning is restricted to validation and accuracy alone is never used as the headline metric.
- **Strict Asset Separation:** Synthetic PaySim training data is never merged into personal user ledgers.

## Chapter 6: ML Methodology
1. **TF-IDF + Logistic Regression (Expense Categorizer):** Previously measured at `74.36%` held-out accuracy; computes sublinear term-frequency weights across merchant and intent keywords and always allows manual override.
2. **PaySim Logistic Regression Baseline:** Linear probability baseline highlighting channel and balance-delta relationships.
3. **PaySim Random Forest Classifier:** Non-linear tree scoring on complete PaySim schemas (`step`, `type`, `amount`, `oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest`), documented with leakage and synthetic-shortcut cautions.
4. **Isolation Forest Anomaly Detector:** Unsupervised outlier signal displayed independently from supervised fraud probabilities.

## Chapter 7: Implementation
- **Transaction CRUD & CSV Pipeline:** Validates positive finite amounts, `YYYY-MM-DD` dates, and allowed categories/payment methods in both client validation hooks and Firestore Security Rules.
- **Risk Monitor Separation:** Personal anomaly checks (`duplicates`, `daily frequency`, `unusual category spending`) operate exclusively on the user's own history; the PaySim demo operates solely on explicit PaySim inputs.
- **Scam-Awareness Assistant:** Inspects user-pasted text for `OTP request`, `PIN request`, `Urgent pressure`, `Account threat`, `Link present`, and `Prize claim` indicators with explanatory rationales.

## Chapter 8: Testing and Results
- Automated verification suite (`npm test`) covers:
  - Two-account isolation across risk monitors and CSV exports.
  - Firestore Security Rules assertions and ESLint security-rules audit (`npx eslint firestore.rules`).
  - CSV schema validation (accepted vs. rejected row handling).
  - Prior-only unusual spending baseline calculation (excluding the evaluated transaction from its own baseline).
  - PaySim scoring behavior, TF-IDF category predictions, and all scam-detector tiers.

## Chapter 9: Security, Privacy, and Ethics
- **Zero-Trust Database Rules:** Default-deny catch-all, strict `isOwner(userId)` checks, `hasAll`/`hasOnly` field allowlists, `isValidId` path length bounds, immutable `userId`/`createdAt`, and `request.time` server timestamp validation.
- **Data Minimization:** Never requests bank logins, PINs, CVVs, or OTPs. Users can export all data (CSV/JSON) or permanently erase their stored workspace records at any time.
- **Non-Judgmental UX:** Analytics present neutral cash-flow insights without shaming user spending.

## Chapter 10: Conclusion and Future Work
FinGuard AI fulfills all multi-user isolation, personal analytics, honest ML reporting, scam awareness, and privacy requirements. Future improvements include optional budget goal alerts, consented user-feedback loops to refine category predictions, and localized multilingual scam-awareness rules.
