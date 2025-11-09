// PII and profanity scrubbing for user-generated content

const PROFANITY_LIST = [
  "damn", "hell", "crap", "shit", "fuck", "ass", "bastard", "bitch",
  "dammit", "goddamn", "piss", "prick", "slut", "whore", "cunt", "dick",
  // Add more as needed - keeping it minimal but comprehensive
];

const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  internationalPhone: /\b\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
  url: /https?:\/\/[^\s]+/g,
  // School names often follow pattern
  school: /\b[A-Z][a-z]+\s+(Elementary|Junior|High|Secondary|School|College|University|Academy|Institute)\b/g,
  // Alberta-specific school patterns
  albertaSchool: /\b[A-Z][a-z]+\s+(School|Elementary|Junior High|Senior High|Composite High|High School)\s+(No\.\s*\d+)?\b/g,
  // Names - common patterns that might indicate personal names
  fullName: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
  // Student IDs, employee IDs
  idNumber: /\b\d{5,10}\b/g,
  // Postal codes (Canadian)
  postalCode: /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi,
  // Alberta-specific locations
  albertaLocation: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*)?Alberta\b/g,
};

const BLOCKED_CONTENT = [
  "strike now",
  "walk out",
  "illegal action",
  "coordinate",
  "organize walkout",
  "protest",
  "boycott",
  "sabotage",
  "violence",
  "threat",
  "blackmail",
];

const SENSITIVE_KEYWORDS = [
  "confidential",
  "private",
  "internal",
  "restricted",
  "classified",
  "official use only",
];

export function scrubPII(text: string): string {
  let scrubbed = text;
  
  // Remove emails
  scrubbed = scrubbed.replace(PII_PATTERNS.email, "[email redacted]");
  
  // Remove phone numbers (both US/Canada and international)
  scrubbed = scrubbed.replace(PII_PATTERNS.phone, "[phone redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.internationalPhone, "[phone redacted]");
  
  // Remove URLs
  scrubbed = scrubbed.replace(PII_PATTERNS.url, "[link redacted]");
  
  // Remove school names (various patterns)
  scrubbed = scrubbed.replace(PII_PATTERNS.school, "[school name redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.albertaSchool, "[school name redacted]");
  
  // Remove postal codes
  scrubbed = scrubbed.replace(PII_PATTERNS.postalCode, "[postal code redacted]");
  
  // Remove Alberta-specific locations (but keep general Alberta references)
  scrubbed = scrubbed.replace(PII_PATTERNS.albertaLocation, "[location redacted]");
  
  // Remove ID numbers (be careful not to remove legitimate numbers)
  // Only remove if surrounded by context suggesting it's an ID
  scrubbed = scrubbed.replace(/\b(id|number|#)\s*[:]?\s*\d{5,10}\b/gi, "[id redacted]");
  
  return scrubbed;
}

export function detectPotentialNames(text: string): Array<{name: string; position: number}> {
  const matches = text.match(PII_PATTERNS.fullName);
  if (!matches) return [];
  
  return matches.map(name => ({
    name,
    position: text.indexOf(name),
  })).filter(({name}) => {
    // Filter out common false positives
    const lower = name.toLowerCase();
    const commonWords = ['school', 'high', 'elementary', 'junior', 'senior', 'public', 'private', 'catholic'];
    return !commonWords.some(word => lower.includes(word));
  });
}

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(lower)
  );
}

export function containsBlockedContent(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_CONTENT.some(phrase => lower.includes(phrase));
}

export function moderateContent(text: string): { 
  clean: string; 
  blocked: boolean; 
  reason?: string;
  flags?: string[];
  riskScore?: number;
} {
  const flags: string[] = [];
  let riskScore = 0;
  
  // Check for blocked content first (highest risk)
  if (containsBlockedContent(text)) {
    return { 
      clean: text, 
      blocked: true, 
      reason: "Content contains calls for coordinated action",
      flags: ["blocked_content"],
      riskScore: 1.0,
    };
  }
  
  // Check for sensitive keywords
  const hasSensitiveContent = SENSITIVE_KEYWORDS.some(keyword => 
    text.toLowerCase().includes(keyword)
  );
  if (hasSensitiveContent) {
    flags.push("sensitive_keywords");
    riskScore += 0.3;
  }
  
  // Scrub PII
  const scrubbed = scrubPII(text);
  const hadPII = scrubbed !== text;
  if (hadPII) {
    flags.push("pii_detected");
    riskScore += 0.2;
  }
  
  // Check for profanity
  const hasProfanity = containsProfanity(scrubbed);
  if (hasProfanity) {
    flags.push("profanity");
    riskScore += 0.1;
  }
  
  // Detect potential names (higher risk)
  const potentialNames = detectPotentialNames(scrubbed);
  if (potentialNames.length > 0) {
    flags.push("potential_names");
    riskScore += 0.4;
  }
  
  // Auto-block if risk score is too high
  const blocked = riskScore >= 0.8;
  
  return {
    clean: scrubbed,
    blocked,
    reason: blocked ? "Content flagged for manual review due to high risk score" : undefined,
    flags: flags.length > 0 ? flags : undefined,
    riskScore: Math.min(riskScore, 1.0),
  };
}

export interface StoryScanResult {
  text: string;
  cleanText: string;
  blocked: boolean;
  riskScore: number;
  flags: string[];
  moderationAction: 'auto_approve' | 'auto_reject' | 'manual_review';
  detectedPii?: Array<{
    type: string;
    position: number;
    length: number;
  }>;
  detectedNames?: Array<{
    name: string;
    position: number;
  }>;
}

export async function scanStory(text: string): Promise<StoryScanResult> {
  const moderation = moderateContent(text);
  
  // Build detailed scan result
  const scanResult: StoryScanResult = {
    text,
    cleanText: moderation.clean,
    blocked: moderation.blocked,
    riskScore: moderation.riskScore || 0,
    flags: moderation.flags || [],
    moderationAction: 'manual_review', // default
  };
  
  // Determine moderation action based on risk score and flags
  if (moderation.blocked) {
    scanResult.moderationAction = 'auto_reject';
  } else if (!moderation.flags || moderation.flags.length === 0) {
    scanResult.moderationAction = 'auto_approve';
  } else if (moderation.riskScore && moderation.riskScore < 0.5) {
    scanResult.moderationAction = 'auto_approve';
  } else {
    scanResult.moderationAction = 'manual_review';
  }
  
  // Add detailed PII detection if present
  if (moderation.flags?.includes('pii_detected')) {
    // This would be enhanced with more specific pattern matching
    scanResult.detectedPii = [];
  }
  
  // Add detected names if present
  if (moderation.flags?.includes('potential_names')) {
    scanResult.detectedNames = detectPotentialNames(text);
  }
  
  return scanResult;
}

// Batch scanning for moderation queue
export async function batchScanStories(stories: Array<{id: string; text: string}>): Promise<Map<string, StoryScanResult>> {
  const results = new Map<string, StoryScanResult>();
  
  for (const story of stories) {
    const scanResult = await scanStory(story.text);
    results.set(story.id, scanResult);
  }
  
  return results;
}
