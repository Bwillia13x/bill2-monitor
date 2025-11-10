// PII and profanity scrubbing for user-generated content

const PROFANITY_LIST = [
  "damn", "hell", "crap", "shit", "fuck", "ass", "bastard", "bitch",
  "dammit", "goddamn", "piss", "prick", "slut", "whore", "cunt", "dick",
  // Add more as needed - keeping it minimal but comprehensive
];

// Temporal patterns to exclude from PII detection
// Note: No global flag to avoid stateful regex issues with .test()
const TEMPORAL_PATTERNS = {
  isoDate: /\b\d{4}-\d{2}-\d{2}\b/,
  isoDateTime: /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\b/,
  time: /\b\d{1,2}:\d{2}(?::\d{2})?\b/,
  year: /\b(19|20)\d{2}\b/,
};

// Alberta cities and towns for location redaction
const ALBERTA_CITIES = [
  'Edmonton', 'Calgary', 'Red Deer', 'Lethbridge', 'Medicine Hat',
  'Grande Prairie', 'Airdrie', 'Spruce Grove', 'Leduc', 'Fort McMurray',
  'St. Albert', 'Sherwood Park', 'Okotoks', 'Cochrane', 'Chestermere',
  'Camrose', 'Brooks', 'Cold Lake', 'Wetaskiwin', 'Lacombe',
  'High River', 'Sylvan Lake', 'Beaumont', 'Lloydminster', 'Canmore',
  'Stony Plain', 'Strathmore', 'Devon', 'Hinton', 'Jasper',
  'Banff', 'Drumheller', 'Olds', 'Innisfail', 'Ponoka',
  'Taber', 'Peace River', 'Slave Lake', 'Whitecourt', 'Drayton Valley',
  'Athabasca', 'Edson', 'Provost', 'Vegreville', 'Vermilion',
  'Wainwright', 'Morinville', 'Penhold', 'Blackfalds', 'Coaldale',
  'Picture Butte', 'Raymond', 'Magrath', 'Cardston', 'Pincher Creek',
  'Claresholm', 'Nanton', 'Vulcan', 'Three Hills', 'Didsbury',
  'Carstairs', 'Crossfield', 'Beiseker', 'Irricana', 'Bassano',
  'Rosemary', 'Bow Island', 'Redcliff', 'Foremost', 'Milk River',
  'Coutts', 'Warner', 'Stirling', 'Barnwell', 'Vauxhall'
];

const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone patterns - more specific to avoid matching dates
  // NANP format: (XXX) XXX-XXXX or XXX-XXX-XXXX or XXX.XXX.XXXX  
  // Negative lookbehind to exclude ISO dates (YYYY-MM-DD)
  phoneNANP: /(?<!\d{4}-)(?<!\d-)\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b(?!-\d)/g,
  // E.164 format: +1XXXXXXXXXX
  phoneE164: /\b\+1[2-9]\d{9}\b/g,
  // International format with country code
  phoneInternational: /\b\+(?!1-?\d{3}-?\d{2}-?\d{2}\b)\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
  // Toll-free numbers
  phoneTollFree: /\b1[-.\s]?(?:800|888|877|866|855|844|833)[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  url: /https?:\/\/[^\s]+/g,
  // School names often follow pattern
  school: /\b[A-Z][a-z]+\s+(Elementary|Junior|High|Secondary|School|College|University|Academy|Institute)\b/g,
  // Alberta-specific school patterns
  albertaSchool: /\b[A-Z][a-z]+\s+(School|Elementary|Junior High|Senior High|Composite High|High School)\s+(No\.\s*\d+)?\b/g,
  // Names - common patterns that might indicate personal names
  fullName: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
  // Student IDs, employee IDs - more specific patterns
  employeeId: /\b(EMP|STF|STAFF)[-\s]?\d{5,10}\b/gi,
  studentId: /\b(STU|STUDENT)[-\s]?\d{5,10}\b/gi,
  healthcareId: /\b\d{3,4}[-\s]\d{4}[-\s]\d{4}\b/g,
  ssn: /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // Postal codes (Canadian) - with word boundaries
  postalCode: /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi,
  // Address patterns
  streetAddress: /\b\d+\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)(?:\s+(?:NW|NE|SW|SE))?\b/gi,
  poBox: /\bP\.?O\.?\s*Box\s+\d+\b/gi,
  ruralRoute: /\bR\.?R\.?\s*\d+(?:,?\s*Site\s+\d+)?(?:,?\s*Box\s+\d+)?\b/gi,
  unitSuite: /\b(?:Unit|Suite|Apt|Apartment|#)\s*\d+[-,]?\s*/gi,
  // Alberta-specific locations (cities/towns) - dynamically constructed
  get albertaLocation() {
    return new RegExp(`\\b(?:${ALBERTA_CITIES.join('|').replace(/\./g, '\\.')})(?:,?\\s*(?:AB|Alberta))?\\b`, 'g');
  }
};

const BLOCKED_CONTENT = [
  // Coordinated action patterns - must be in action context
  "organize.*strike",
  "plan.*strike",
  "strike.*action",
  "walk.*out.*(?:tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday|next week)",
  "everyone.*walk.*out",
  "coordinate.*(?:with|schools|teachers|action)",
  "organize.*walkout",
  "illegal.*action",
  // Violence and threats
  "violence.*answer",
  "threat.*against",
  "harm.*(?:students|teachers|staff|administration)",
];

// Helper function to check blocked content with context
function containsBlockedContentContext(text: string): boolean {
  const lower = text.toLowerCase();
  
  // Check regex patterns for coordinated action
  const actionPatterns = [
    /organize\s+(?:a\s+)?(?:strike|walkout|protest)/i,
    /plan\s+(?:the\s+)?(?:strike|walkout)/i,
    /strike\s+(?:now|action)/i,
    /(?:walk|walking)\s+out\s+(?:at|on|tomorrow|next)/i,
    /everyone\s+(?:walk|walking)\s+out/i,
    /coordinate\s+(?:with|schools|teachers|action|protests?)/i,
    /illegal\s+action/i,
    /violence\s+(?:is\s+)?(?:the\s+)?answer/i,
    /threat\s+against/i,
  ];
  
  return actionPatterns.some(pattern => pattern.test(text));
}

const SAFE_CONTEXTS = [
  // Phrases that contain blocked words but are safe in context
  /strike\s+(?:a\s+)?balance/i,
  /walk\s+out\s+(?:to|of)\s+(?:your|the)\s+(?:car|building|room)/i,
  /coordinate\s+(?:our\s+)?(?:lesson|plans|curriculum|schedules?)/i,
];

const SENSITIVE_KEYWORDS = [
  "confidential",
  "private",
  "internal",
  "restricted",
  "classified",
  "official use only",
];

/**
 * Helper to check if a string is a temporal expression (date/time)
 * This helps avoid false positives in PII detection
 */
function isTemporalExpression(text: string): boolean {
  return TEMPORAL_PATTERNS.isoDate.test(text) ||
         TEMPORAL_PATTERNS.isoDateTime.test(text) ||
         TEMPORAL_PATTERNS.time.test(text);
}

export function scrubPII(text: string): string {
  let scrubbed = text;
  
  // Remove emails
  scrubbed = scrubbed.replace(PII_PATTERNS.email, "[email redacted]");
  
  // Remove credit cards
  scrubbed = scrubbed.replace(PII_PATTERNS.creditCard, "[id redacted]");
  
  // Remove SSN
  scrubbed = scrubbed.replace(PII_PATTERNS.ssn, "[id redacted]");
  
  // Remove healthcare IDs
  scrubbed = scrubbed.replace(PII_PATTERNS.healthcareId, "[id redacted]");
  
  // Remove employee/student IDs
  scrubbed = scrubbed.replace(PII_PATTERNS.employeeId, "[id redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.studentId, "[id redacted]");
  
  // Remove phone numbers (in order of specificity to avoid conflicts)
  // First remove toll-free
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneTollFree, "[phone redacted]");
  // Then E.164 format
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneE164, "[phone redacted]");
  // Then NANP format
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneNANP, "[phone redacted]");
  // Finally international (most permissive, so last)
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneInternational, "[phone redacted]");
  
  // Remove URLs
  scrubbed = scrubbed.replace(PII_PATTERNS.url, "[link redacted]");
  
  // Remove addresses
  scrubbed = scrubbed.replace(PII_PATTERNS.streetAddress, "[address redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.poBox, "[address redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.ruralRoute, "[address redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.unitSuite, "[address redacted] ");
  
  // Remove school names (various patterns)
  scrubbed = scrubbed.replace(PII_PATTERNS.school, "[school name redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.albertaSchool, "[school name redacted]");
  
  // Remove postal codes
  scrubbed = scrubbed.replace(PII_PATTERNS.postalCode, "[postal code redacted]");
  
  // Remove Alberta-specific locations (but keep general Alberta references)
  scrubbed = scrubbed.replace(PII_PATTERNS.albertaLocation, "[location redacted]");
  
  // Remove context-based ID numbers (only if preceded by ID/number/#)
  scrubbed = scrubbed.replace(/\b(id|number|#|license|lic|dl)\s*[:]?\s*\d{5,10}\b/gi, "[id redacted]");
  
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
  // First check if it's a safe context
  if (SAFE_CONTEXTS.some(pattern => pattern.test(text))) {
    return false;
  }
  
  // Then check for blocked content with context
  return containsBlockedContentContext(text);
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
