export type ScamRiskLevel =
  | 'High review priority'
  | 'Review recommended'
  | 'No obvious warning signs detected'
  | 'Unknown';

export interface ScamWarningDetail {
  label: string;
  matchedPhrase: string;
  explanation: string;
}

export interface ScamAnalysisResult {
  riskLevel: ScamRiskLevel;
  warnings: string[];
  details: ScamWarningDetail[];
  message: string;
}

interface PatternSpec {
  label: string;
  patterns: RegExp[];
  explanation: string;
}

const WARNING_SPECS: PatternSpec[] = [
  {
    label: 'OTP request',
    patterns: [/\botp\b/i, /\bone[\s-]*time[\s-]*password\b/i],
    explanation:
      'Legitimate banks and payment providers never ask you to share a one-time password over SMS, WhatsApp, or phone.',
  },
  {
    label: 'PIN request',
    patterns: [/\bupi\s*pin\b/i, /\batm\s*pin\b/i, /\bcard\s*pin\b/i, /\bcvv\b/i],
    explanation:
      'Requesting a UPI PIN, ATM PIN, card PIN, or CVV is a major red flag—no verification or refund requires your PIN.',
  },
  {
    label: 'Urgent pressure',
    patterns: [/\bimmediately\b/i, /\burgent\s*payment\b/i, /\bact\s*now\b/i, /\bwithin\s*\d+\s*(min|minute|minutes|hour|hours)\b/i],
    explanation:
      'Artificial urgency is commonly used to rush victims into clicking or transferring money before verifying with an official channel.',
  },
  {
    label: 'Account threat',
    patterns: [/\baccount\s*blocked\b/i, /\baccount\s*suspended\b/i, /\bkyc\s*expired\b/i, /\bpan\s*update\b/i, /\baccount\s*frozen\b/i],
    explanation:
      'Threatening account suspension or expired KYC aims to trigger panic. Always check status directly inside your official banking app.',
  },
  {
    label: 'Link present',
    patterns: [/https?:\/\/\S+/i, /\bwww\.\S+/i],
    explanation:
      'A link alone does not prove a message is fraudulent, but unexpected payment or KYC links often lead to lookalike phishing sites.',
  },
  {
    label: 'Prize claim',
    patterns: [/\byou\s*have\s*won\b/i, /\bclaim\s*your\s*prize\b/i, /\blottery\s*winner\b/i, /\bcash\s*reward\b/i],
    explanation:
      'Unsolicited lottery, cashback, or prize claims frequently attempt to collect processing fees or steal credentials.',
  },
];

export function analyzeScamMessage(message: string): ScamAnalysisResult {
  if (typeof message !== 'string' || !message.trim()) {
    return {
      riskLevel: 'Unknown',
      warnings: [],
      details: [],
      message: 'Enter a message to analyze.',
    };
  }

  const warnings: string[] = [];
  const details: ScamWarningDetail[] = [];

  for (const spec of WARNING_SPECS) {
    for (const pattern of spec.patterns) {
      const match = message.match(pattern);
      if (match) {
        warnings.push(spec.label);
        details.push({
          label: spec.label,
          matchedPhrase: match[0],
          explanation: spec.explanation,
        });
        break;
      }
    }
  }

  let riskLevel: ScamRiskLevel;
  if (warnings.length >= 3) {
    riskLevel = 'High review priority';
  } else if (warnings.length > 0) {
    riskLevel = 'Review recommended';
  } else {
    riskLevel = 'No obvious warning signs detected';
  }

  return {
    riskLevel,
    warnings,
    details,
    message:
      'Heuristic result only; not a definitive verdict. No warning match does not guarantee a message is safe.',
  };
}
