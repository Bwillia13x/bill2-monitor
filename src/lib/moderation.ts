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
  // Email - now includes accented characters
  email: /\b[A-Za-zÀ-ÿ0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Student IDs, employee IDs - more specific patterns (moved up to process before phone numbers)
  employeeId: /\b(EMP|STF|STAFF)[-\s]?\d{5,10}\b/gi,
  // Student ID patterns - match the number, not the label
  studentIdWithLabel: /\b(?:Student\s+)?ID:\s*(\d{5,10})\b/gi,
  studentId: /\b(STU|STUDENT)[-\s]\d{5,10}\b/gi,
  // Phone patterns - more specific to avoid matching dates
  // 7-digit local format: XXX-XXXX
  phoneLocal: /\b\d{3}[-.\s]\d{4}\b/g,
  // NANP format: (XXX) XXX-XXXX or XXX-XXX-XXXX or XXX.XXX.XXXX  
  // Negative lookbehind to exclude ISO dates (YYYY-MM-DD)
  // Now properly captures opening parenthesis
  phoneNANP: /(?<!\d{4}-)(?<!\d-)(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b(?!-\d)/g,
  // E.164 format: +1XXXXXXXXXX (includes the + sign)
  phoneE164: /\+1[2-9]\d{9}\b/g,
  // UK phone numbers: +44 followed by area code and number (includes the + sign)
  phoneUK: /\+44\s*\d{2,4}\s*\d{4}\s*\d{4}/g,
  // International dialing prefix format: 011-XX-XX-XXX-XXXX
  phoneIntlDialing: /\b011[-.\s]\d{1,3}[-.\s]\d{1,4}[-.\s]\d{4}[-.\s]\d{4}\b/g,
  // International format with country code (broader pattern for various countries)
  // Now includes the + sign
  phoneInternational: /\+(?!1\b)\d{1,4}(?:[-.\s]?\d{1,4}){1,4}\b/g,
  // Toll-free numbers
  phoneTollFree: /(?:\+?1[-.\s]?)?(?:800|888|877|866|855|844|833)[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  // URLs - avoid capturing trailing sentence punctuation
  url: /https?:\/\/[^\s]+?(?=[.,;!?]?(?:\s|$))/g,
  // School names - need to capture city prefix (e.g., "Calgary Elementary No. 23")
  schoolWithCityAndNumber: /\b[A-Z][a-z]+\s+(?:Elementary|Junior|High|Secondary|Composite|School)(?:\s+School)?\s+No\.\s*\d+\b/g,
  // Board of Education patterns
  schoolBoard: /\b[A-Z][a-z]+\s+(?:Board\s+of\s+Education|Public\s+Schools?)(?:\s+School\s+No\.\s*\d+|-\s+[A-Z][a-z]+|\s+facility)?\b/g,
  // CBE/other abbreviation patterns
  schoolAbbreviation: /\b[A-Z]{2,}\s+(?:Elementary|Junior|High|Secondary|School|Composite)\s+(?:School\s+)?No\.\s*\d+\b/g,
  // School names often follow pattern - including suffix variations
  school: /\b[A-Z][a-z]+\s+(Elementary|Junior|High|Secondary|School|College|University|Academy|Institute)(?:\s+(?:No\.\s*\d+|School))?\b/g,
  // Alberta-specific school patterns - more comprehensive
  albertaSchool: /\b(?:[A-Z][a-z]+\s+)?(?:Public\s+)?Schools?\s+(?:No\.\s*\d+|-\s*[A-Z][a-z]+)\b/g,
  // School with number pattern (e.g., "CBE Elementary No. 12")
  schoolWithNumber: /\b(?:[A-Z]+\s+)?(?:Elementary|Junior|High|Secondary|School|Composite)\s+(?:School\s+)?No\.\s*\d+\b/g,
  // Names - common patterns that might indicate personal names
  fullName: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
  healthcareId: /\b\d{3,4}[-\s]\d{4}[-\s]\d{4}\b/g,
  ssn: /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g,
  // Canadian SIN with spaces
  sinSpaces: /\b\d{3}\s+\d{3}\s+\d{3}\b/g,
  // Canadian SIN without spaces (traditional)
  sin: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // License numbers with various formats
  licenseNumber: /\b(?:License|Lic|DL)(?:\s*#)?[:\s]+[A-Z]{0,2}-?\d{6,12}\b/gi,
  // Driver license format: DL-123456789
  driverLicense: /\bDL[-\s]?\d{6,12}\b/gi,
  // Postal codes (Canadian) - with word boundaries
  postalCode: /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi,
  // Address patterns
  streetAddress: /\b\d+\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)(?:\s+(?:NW|NE|SW|SE))?\b/gi,
  poBox: /\bP\.?O\.?\s*Box\s+\d+\b/gi,
  ruralRoute: /\bR\.?R\.?\s*\d+(?:,?\s*Site\s+\d+)?(?:,?\s*Box\s+\d+)?\b/gi,
  unitSuite: /\b(?:Unit|Suite|Apt|Apartment|#)\s*\d+[-,]?\s*/gi,
  // Specific dates that could identify individuals (e.g., "September 15, 2023")
  specificDate: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g,
  // Alberta-specific locations with ", Alberta" suffix - should always be redacted
  // Note: Only escaping dots because city names don't contain regex metacharacters except '.'
  // ALBERTA_CITIES is a controlled constant, not user input
  albertaLocationWithSuffix: new RegExp(`\\b(?:${ALBERTA_CITIES.join('|').replace(/\./g, '\\.')})(?:,\\s*(?:AB|Alberta))\\b`, 'g'),
  // Alberta-specific locations (cities/towns) - context-aware
  // Only match when followed by identifying context (address, postal code, school name)
  get albertaLocationStrict() {
    return new RegExp(`\\b(?:${ALBERTA_CITIES.join('|').replace(/\./g, '\\.')})(?=\\s+(?:Elementary|High|School|[A-Z]\\d[A-Z]))\\b`, 'g');
  },
  // Neighborhoods (common Alberta neighborhoods)
  neighborhood: /\b(Beltline|Kensington|Inglewood|Mission|Bridgeland|Downtown|Oliver|Whyte\s+Avenue|Garneau)\s+(?:neighborhood|area|district)\b/gi,
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
    /organize\s+(?:a\s+)?(?:strike|walkout|walk\s+out|protest)/i,
    /plan\s+(?:the\s+)?(?:strike|walkout|walk\s+out)/i,
    /strike\s+(?:now|action)/i,
    /(?:walk|walking)\s+out\s+(?:at|on|tomorrow|next|for)/i,
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
  
  // Remove SSN (traditional format)
  scrubbed = scrubbed.replace(PII_PATTERNS.ssn, "[id redacted]");
  
  // Remove Canadian SIN (handles both with and without spaces)
  scrubbed = scrubbed.replace(PII_PATTERNS.sin, "[id redacted]");
  
  // Remove healthcare IDs
  scrubbed = scrubbed.replace(PII_PATTERNS.healthcareId, "[id redacted]");
  
  // Remove driver license format (DL-123456789) - before generic license pattern
  scrubbed = scrubbed.replace(PII_PATTERNS.driverLicense, "[id redacted]");
  
  // Remove license numbers (before general ID patterns)
  scrubbed = scrubbed.replace(PII_PATTERNS.licenseNumber, "[id redacted]");
  
  // Remove employee/student IDs (BEFORE phone numbers to avoid conflicts)
  scrubbed = scrubbed.replace(PII_PATTERNS.employeeId, "[id redacted]");
  // Student ID with label - preserve the label but redact the number
  scrubbed = scrubbed.replace(PII_PATTERNS.studentIdWithLabel, (match, number) => {
    // Preserve "Student ID:" or "ID:" prefix
    const prefix = match.substring(0, match.lastIndexOf(number));
    return prefix + "[id redacted]";
  });
  scrubbed = scrubbed.replace(PII_PATTERNS.studentId, "[id redacted]");
  
  // Remove phone numbers (in order of specificity to avoid conflicts)
  // First remove toll-free
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneTollFree, "[phone redacted]");
  // Then international dialing prefix format (011-XX-...)
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneIntlDialing, "[phone redacted]");
  // Then UK phone numbers
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneUK, "[phone redacted]");
  // Then E.164 format
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneE164, "[phone redacted]");
  // Then international format
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneInternational, "[phone redacted]");
  // Then NANP format
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneNANP, "[phone redacted]");
  // Finally local 7-digit format (after all others to avoid conflicts)
  scrubbed = scrubbed.replace(PII_PATTERNS.phoneLocal, "[phone redacted]");
  
  // Remove URLs
  scrubbed = scrubbed.replace(PII_PATTERNS.url, "[link redacted]");
  
  // Remove addresses
  scrubbed = scrubbed.replace(PII_PATTERNS.streetAddress, "[address redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.poBox, "[address redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.ruralRoute, "[address redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.unitSuite, "[address redacted] ");
  
  // Remove school names (various patterns) - more specific patterns first
  scrubbed = scrubbed.replace(PII_PATTERNS.schoolBoard, "[school name redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.schoolAbbreviation, "[school name redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.schoolWithCityAndNumber, "[school name redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.schoolWithNumber, "[school name redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.school, "[school name redacted]");
  scrubbed = scrubbed.replace(PII_PATTERNS.albertaSchool, "[school name redacted]");
  
  // Remove postal codes
  scrubbed = scrubbed.replace(PII_PATTERNS.postalCode, "[postal code redacted]");
  
  // Remove specific dates that could identify individuals
  scrubbed = scrubbed.replace(PII_PATTERNS.specificDate, "[date redacted]");
  
  // Remove neighborhoods
  scrubbed = scrubbed.replace(PII_PATTERNS.neighborhood, "[location redacted]");
  
  // Remove Alberta cities with ", Alberta" or ", AB" suffix (always redact)
  scrubbed = scrubbed.replace(PII_PATTERNS.albertaLocationWithSuffix, "[location redacted]");
  
  // Context-aware Alberta location redaction
  // Only redact cities in strict contexts (followed by school names, postal codes)
  scrubbed = scrubbed.replace(PII_PATTERNS.albertaLocationStrict, "[location redacted]");
  
  // Remove context-based ID numbers (only if preceded by ID/number/#)
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
