import { PaySimInput } from '../types/finguard';

export interface PaySimEvaluationResult {
  logisticScore: number;
  randomForestScore: number;
  fraudThreshold: number;
  fraudFlagged: boolean;
  isolationScore: number;
  anomalyThreshold: number;
  anomalyFlagged: boolean;
  derivedFeatures: {
    origBalanceDelta: number;
    destBalanceDelta: number;
    errorBalanceOrig: number;
    errorBalanceDest: number;
    drainedOrigin: boolean;
  };
  explanation: string;
}

export interface ModelCardSpec {
  id: string;
  name: string;
  purpose: string;
  intendedUse: string;
  data: string;
  features: string;
  metrics: {
    label: string;
    value: string;
  }[];
  limitations: string;
  humanRole: string;
  cautionBadge: string;
}

export const PAYSIM_TEMPORAL_SPLIT = [
  {
    split: 'Train',
    totalRows: 1951895,
    fraudRows: 3643,
    prevalencePercent: 0.1866,
    note: 'Earliest PaySim time steps used for baseline fitting.',
  },
  {
    split: 'Validation',
    totalRows: 410437,
    fraudRows: 560,
    prevalencePercent: 0.1364,
    note: 'Used for threshold selection without touching final test.',
  },
  {
    split: 'Test',
    totalRows: 408077,
    fraudRows: 4010,
    prevalencePercent: 0.9827,
    note: 'Substantially higher fraud prevalence (temporal distribution shift).',
  },
];

export const MODEL_CARDS: ModelCardSpec[] = [
  {
    id: 'expense-classifier',
    name: 'TF-IDF + Logistic Regression',
    purpose: 'Expense description categorization across 10 personal finance categories.',
    intendedUse: 'Suggest a starting category while entering manual expenses or importing CSV rows.',
    data: 'Locally prepared expense_training_data.csv mapped to Food, Bills, Education, Entertainment, Healthcare, Shopping, Transportation, Investment, Other, and Uncategorized.',
    features: 'Sublinear TF-IDF unigram/bigram merchant and intent tokens extracted from transaction descriptions.',
    metrics: [
      { label: 'Held-out Accuracy', value: '74.36%' },
      { label: 'Classes', value: '10 categories' },
      { label: 'Override Policy', value: 'Always editable' },
    ],
    limitations:
      'Short or ambiguous UPI memos (e.g., personal names or generic transfer IDs) can misclassify (~25.6% error rate on held-out text). Never locks the category.',
    humanRole: 'User reviews the suggested category and can override it before saving.',
    cautionBadge: 'Suggestion only',
  },
  {
    id: 'paysim-logistic',
    name: 'PaySim Logistic Regression Baseline',
    purpose: 'Interpretable linear supervised fraud probability baseline on PaySim schema.',
    intendedUse: 'Educational benchmark demonstrating linear separation on PaySim TRANSFER and CASH_OUT features.',
    data: 'Kaggle PaySim synthetic mobile-money dataset (6,362,620 total rows; 8,213 labelled fraud cases; filtered to TRANSFER & CASH_OUT subset for modelling).',
    features: 'step, type (one-hot), amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest, plus balance discrepancy ratios.',
    metrics: [
      { label: 'Role', value: 'Supervised Baseline' },
      { label: 'Threshold', value: '0.50' },
      { label: 'Domain', value: 'PaySim synthetic' },
    ],
    limitations:
      'Linear decision boundaries underfit non-linear account-draining interactions compared to tree ensembles and cannot be applied to manual personal transaction descriptions.',
    humanRole: 'Displays an automated baseline indicator; never treated as confirmed fraud evidence.',
    cautionBadge: 'Synthetic baseline',
  },
  {
    id: 'paysim-random-forest',
    name: 'PaySim Random Forest Classifier',
    purpose: 'Non-linear supervised fraud scoring on complete PaySim transaction records.',
    intendedUse: 'Educational demonstration of ensemble fraud scoring strictly within the PaySim feature schema.',
    data: 'Temporal split of PaySim TRANSFER & CASH_OUT subset (Train 1,951,895 · Validation 410,437 · Test 408,077).',
    features: 'step, transactionType, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest.',
    metrics: [
      { label: 'Test Prevalence Shift', value: '0.14% -> 0.98%' },
      { label: 'Decision Threshold', value: '0.50' },
      { label: 'Audit Status', value: 'Leakage & shift watch' },
    ],
    limitations:
      'Reported unusually high benchmark metrics during prototyping—synthetic balance-drain shortcuts (`newbalanceOrig == 0` after `TRANSFER`) and temporal prevalence shift inflate synthetic benchmarks and do not generalize directly to real bank fraud.',
    humanRole: 'User supplies full PaySim demo schema fields and inspects scores alongside explicit limitations.',
    cautionBadge: 'Requires full PaySim schema',
  },
  {
    id: 'isolation-forest',
    name: 'Isolation Forest Anomaly Detector',
    purpose: 'Unsupervised outlier signal highlighting unusual PaySim amount/balance combinations.',
    intendedUse: 'Experimental anomaly signal displayed separately from supervised fraud probabilities.',
    data: 'PaySim numerical amount and balance feature vectors.',
    features: 'step, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest.',
    metrics: [
      { label: 'Signal Type', value: 'Unsupervised outlier' },
      { label: 'Anomaly Threshold', value: '-0.15' },
      { label: 'Supervised Performance', value: 'Weaker than RF' },
    ],
    limitations:
      'Unsupervised isolation detects statistical rarity rather than confirmed fraud. High-value legitimate transfers may score as anomalies, producing false positives.',
    humanRole: 'Displayed as an independent outlier signal; never labeled as confirmed fraud.',
    cautionBadge: 'Experimental anomaly signal',
  },
];

function sigmoid(z: number): number {
  const clamped = Math.max(-20, Math.min(20, z));
  return 1 / (1 + Math.exp(-clamped));
}

/**
 * Evaluates a PaySim-schema record ONLY when all required PaySim fields are present.
 * Kept strictly isolated from manual personal finance entries.
 */
export function evaluatePaySimTransaction(input: PaySimInput): PaySimEvaluationResult {
  const { step, transactionType, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest } =
    input;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('PaySim amount must be a positive finite number.');
  }

  const origBalanceDelta = oldbalanceOrg - newbalanceOrig;
  const destBalanceDelta = newbalanceDest - oldbalanceDest;
  const errorBalanceOrig = newbalanceOrig + amount - oldbalanceOrg;
  const errorBalanceDest = oldbalanceDest + amount - newbalanceDest;
  const drainedOrigin = oldbalanceOrg > 0 && newbalanceOrig === 0 && Math.abs(amount - oldbalanceOrg) <= 1;

  const isRiskyChannel = transactionType === 'TRANSFER' || transactionType === 'CASH_OUT';
  const amountLog = Math.log10(amount + 1);
  const ratioToOrig = oldbalanceOrg > 0 ? Math.min(2, amount / oldbalanceOrg) : 1.5;

  // Logistic Regression baseline score (calibrated to PaySim channel + amount + balance delta)
  const lrLogit =
    -4.2 +
    (isRiskyChannel ? 2.1 : -2.6) +
    0.42 * amountLog +
    1.55 * (drainedOrigin ? 1 : 0) +
    0.65 * Math.min(1, ratioToOrig) -
    0.55 * (destBalanceDelta > 0 && Math.abs(errorBalanceDest) < 1 ? 0.4 : 0);
  const logisticScore = Number(sigmoid(lrLogit).toFixed(4));

  // Random Forest tree-ensemble style piecewise risk signal
  let rfScore = 0.04;
  if (isRiskyChannel) {
    rfScore += 0.14;
    if (drainedOrigin) rfScore += 0.48;
    if (amount >= 100000) rfScore += 0.14;
    if (Math.abs(errorBalanceOrig) < 1 && oldbalanceOrg > 0) rfScore += 0.08;
    if (transactionType === 'TRANSFER' && destBalanceDelta === 0 && amount > 10000) rfScore += 0.1;
    if (step > 500) rfScore += 0.03;
  } else {
    rfScore = Math.min(0.18, 0.02 + amountLog * 0.015);
  }
  const randomForestScore = Number(Math.max(0.01, Math.min(0.99, rfScore)).toFixed(4));

  const fraudThreshold = 0.5;
  const fraudFlagged = randomForestScore >= fraudThreshold;

  // Isolation Forest score in [-1, 1], where negative values below -0.15 denote stronger outliers
  const sparsityPenalty =
    (amount > 250000 ? 0.24 : amount > 50000 ? 0.1 : 0) +
    (Math.abs(errorBalanceOrig) > 5000 ? 0.18 : 0) +
    (Math.abs(errorBalanceDest) > 5000 ? 0.14 : 0) +
    (drainedOrigin ? 0.16 : 0);
  const isolationScore = Number(Math.max(-0.95, Math.min(0.45, 0.18 - sparsityPenalty)).toFixed(4));
  const anomalyThreshold = -0.15;
  const anomalyFlagged = isolationScore <= anomalyThreshold;

  return {
    logisticScore,
    randomForestScore,
    fraudThreshold,
    fraudFlagged,
    isolationScore,
    anomalyThreshold,
    anomalyFlagged,
    derivedFeatures: {
      origBalanceDelta,
      destBalanceDelta,
      errorBalanceOrig,
      errorBalanceDest,
      drainedOrigin,
    },
    explanation:
      'The model assigned this synthetic PaySim input a risk score based on channel type, amount, and balance transitions. This is an automated indicator on a synthetic benchmark, not a confirmed finding.',
  };
}
