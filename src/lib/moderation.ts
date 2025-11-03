// PII and profanity scrubbing for user-generated content

const PROFANITY_LIST = [
  "damn", "hell", "crap", "shit", "fuck", "ass", "bastard", "bitch",
  // Add more as needed - keeping it minimal
];

const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  url: /https?:\/\/[^\s]+/g,
  // School names often follow pattern
  school: /\b[A-Z][a-z]+\s+(Elementary|Junior|High|Secondary|School)\b/g,
};

const BLOCKED_CONTENT = [
  "strike now",
  "walk out",
  "illegal action",
  "coordinate",
  "organize walkout",
];

export function scrubPII(text: string): string {
  let scrubbed = text;
  
  // Remove emails
  scrubbed = scrubbed.replace(PII_PATTERNS.email, "[email redacted]");
  
  // Remove phone numbers
  scrubbed = scrubbed.replace(PII_PATTERNS.phone, "[phone redacted]");
  
  // Remove URLs
  scrubbed = scrubbed.replace(PII_PATTERNS.url, "[link redacted]");
  
  // Remove school names
  scrubbed = scrubbed.replace(PII_PATTERNS.school, "[school name redacted]");
  
  return scrubbed;
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
} {
  // Check for blocked content first
  if (containsBlockedContent(text)) {
    return { 
      clean: text, 
      blocked: true, 
      reason: "Content contains calls for coordinated action" 
    };
  }
  
  // Scrub PII
  const scrubbed = scrubPII(text);
  
  // Check for profanity (warning but not blocking)
  const hasProfanity = containsProfanity(scrubbed);
  
  return {
    clean: scrubbed,
    blocked: false,
    reason: hasProfanity ? "Contains profanity - pending review" : undefined,
  };
}
