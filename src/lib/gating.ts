// n-threshold gating helpers

export const PRIVACY_THRESHOLD = 20;

export function meetsThreshold(count: number): boolean {
  return count >= PRIVACY_THRESHOLD;
}

export function getGatingMessage(count: number): string {
  if (count === 0) {
    return `No submissions yet. We need at least ${PRIVACY_THRESHOLD} to display content while protecting privacy.`;
  }
  
  const remaining = PRIVACY_THRESHOLD - count;
  if (remaining > 0) {
    return `${count} submission${count !== 1 ? 's' : ''} so far. ${remaining} more needed to meet the n≥${PRIVACY_THRESHOLD} privacy threshold.`;
  }
  
  return `${count} submissions. Privacy threshold met.`;
}
