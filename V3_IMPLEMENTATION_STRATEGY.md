# Digital Strike V3 "Visual Viral" - Implementation Strategy

## Overview

V3 is a complete visual redesign focused on simplicity, impact, and viral sharing. The goal is to maximize anonymous signal submissions through a streamlined, one-screen experience that immediately pushes users into a share flow.

## Key Differences from V2

| Aspect | V2 | V3 |
|--------|----|----|
| Focus | Comprehensive engagement platform | Single-purpose conversion funnel |
| Homepage | Multiple sections, complex | Two-tile hero, ultra-simple |
| Submission | Multi-field form | Single slider |
| Post-Submit | Return to page | Instant confetti + share modal |
| Visual Style | Clean, professional | Dark, neon, high-impact |
| Navigation | Multi-page with tabs | Single landing + methodology page |
| Target Metric | Engagement depth | Submission + share rate |

## Architecture Decision

### Option 1: Replace Homepage (Chosen)
- Create new simplified Index page for v3
- Move existing v2 features to /v2 or /dashboard route
- Preserve all v2 work while implementing v3 vision

### Option 2: New Route
- Keep existing homepage as-is
- Create /v3 route for new design
- Allow A/B testing between versions

**Decision: Option 1** - The v3 instructions clearly indicate this should be the primary landing experience.

## Implementation Plan

### Phase 1: Hero Section
**Components to Create:**
1. `V3Hero.tsx` - Two-tile layout (meter + countdown)
2. `LiveMeter.tsx` - Big number with sparkline
3. `CountdownRing.tsx` - Circular countdown timer
4. `V3Layout.tsx` - Dark theme wrapper

**Features:**
- Left tile: Dissatisfaction meter (large number + 7-day sparkline)
- Right tile: Strike window countdown (circular ring)
- Primary CTA: "Add My Anonymous Signal"
- Secondary CTA: "See Evidence & Voices"
- Methodology link
- Responsive grid layout

### Phase 2: Submit Modal
**Component:** `SubmitModal.tsx`

**Features:**
- Single 0-100 slider with labeled anchors
- Optional role/region dropdown
- Privacy copy with threshold explanation
- Submit button
- Keyboard accessible
- Screen reader friendly

### Phase 3: Confirmation & Share Flow
**Components:**
1. `ConfirmationAnimation.tsx` - Confetti effect
2. `ShareModal.tsx` - Viral sharing interface
3. `ShareCardGenerator.tsx` - PNG generation

**Features:**
- Confetti animation on submit
- "You moved the needle by +X" message
- Auto-open share modal
- Two card themes: Meter or Countdown
- One-tap sharing: X, Facebook, WhatsApp, Email, Copy
- Prefilled copy with referral code
- Personal referral tracking

### Phase 4: Below-Fold Content
**Components:**
1. `DistrictsMap.tsx` - Privacy-threshold map
2. `DailyVelocityCard.tsx` - Bar chart + 7-day avg
3. `CoverageCard.tsx` - % districts unlocked
4. `VoicesCard.tsx` - Anonymized quotes

**Features:**
- Districts shown only where threshold met
- "Locked" indicator for suppressed data
- Privacy shield icons with tooltips
- Mini-cards for key metrics

### Phase 5: Visual Design System
**Files to Create:**
1. `v3-theme.css` - Dark theme variables
2. `v3-animations.css` - Motion system

**Specifications:**
- Dark background (#0a0a0a or similar)
- Neon accent color (electric blue or similar)
- Glow effects on interactive elements
- Strong sans-serif (Inter)
- Number flip animations (250-350ms)
- Ring sweep animation
- Reduced motion support

### Phase 6: Accessibility
**Requirements:**
- WCAG 2.2 AA contrast (≥4.5:1)
- Large text AAA where feasible (≥7:1)
- Proper landmarks and ARIA labels
- Focus indicators on all interactive elements
- Logical tab order
- Screen reader text for charts
- 65ch max body text width
- Large hit areas (44x44px minimum)

### Phase 7: Performance
**Targets:**
- LCP < 2.5s
- CLS < 0.02
- Font-display: swap
- Lazy load below-fold images
- Static first paint for hero tiles
- Code splitting
- Optimized bundle size

### Phase 8: Social & SEO
**Components:**
1. `SocialMetaTags.tsx` - Dynamic OG/Twitter cards
2. `/api/share-card` - PNG generation endpoint

**Features:**
- Dynamic OG tags per state
- Twitter summary_large_image cards
- Share endpoint for PNG generation
- Watermarked share cards
- Dynamic titles: "Alberta Dissatisfaction: 62 — Add Yours"

### Phase 9: Analytics
**Tracking Events:**
- Page view
- CTA click
- Submit complete
- Share modal open
- Share button by channel
- Referrals accepted per code

**Privacy-Respecting:**
- No PII collected
- Aggregate metrics only
- K-estimate for viral coefficient
- Admin dashboard (not public)

## File Structure

```
src/
├── pages/
│   ├── V3Index.tsx (new v3 landing)
│   ├── V2Dashboard.tsx (moved v2 features)
│   └── Methodology.tsx (privacy page)
├── components/
│   └── v3/
│       ├── V3Hero.tsx
│       ├── LiveMeter.tsx
│       ├── CountdownRing.tsx
│       ├── SubmitModal.tsx
│       ├── ConfirmationAnimation.tsx
│       ├── ShareModal.tsx
│       ├── ShareCardGenerator.tsx
│       ├── DistrictsMap.tsx
│       ├── DailyVelocityCard.tsx
│       ├── CoverageCard.tsx
│       └── VoicesCard.tsx
├── styles/
│   ├── v3-theme.css
│   └── v3-animations.css
└── lib/
    ├── shareCardGenerator.ts
    └── referralTracking.ts
```

## Migration Strategy

### Preserve V2 Work
1. Rename current `Index.tsx` to `V2Dashboard.tsx`
2. Update route from `/` to `/dashboard` or `/v2`
3. Keep all v2 components intact
4. Maintain Engage page at `/engage`

### Implement V3
1. Create new `Index.tsx` with v3 design
2. Build v3-specific components
3. Implement dark theme
4. Add share card generation
5. Set up analytics tracking

### Navigation
- V3 landing: `/` (primary entry point)
- V2 features: `/dashboard` or `/engage` (power users)
- Methodology: `/methodology` (privacy details)
- Press: `/press` (media resources)

## Technical Considerations

### Share Card Generation
**Options:**
1. **Client-side canvas** - Use HTML5 canvas to generate PNG
2. **Server-side** - Use Puppeteer or similar to render
3. **Edge function** - Cloudflare Workers or Vercel Edge

**Recommendation:** Client-side canvas for simplicity and speed

### Referral Tracking
**Implementation:**
1. Generate unique code on first submission
2. Store in localStorage
3. Append to all share URLs
4. Track conversions in database
5. Display viral coefficient to admins

### Dark Theme
**Approach:**
1. Create v3-specific CSS variables
2. Use Tailwind dark mode utilities
3. Ensure AA contrast on all text
4. Test with color contrast analyzer

### Animations
**Libraries:**
1. Framer Motion for complex animations
2. CSS transitions for simple effects
3. Canvas confetti library for celebration

## Success Metrics

### Performance
- [ ] LCP < 2.5s (desktop & mobile)
- [ ] CLS < 0.02
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s

### Accessibility
- [ ] WCAG 2.2 AA contrast verified
- [ ] Keyboard navigation complete
- [ ] Screen reader tested
- [ ] Focus indicators visible
- [ ] Reduced motion respected

### Conversion
- [ ] Share modal opens on ≥90% of submissions
- [ ] Social unfurls validated on X and FB
- [ ] Referral tracking functional
- [ ] Viral coefficient > 1.0 (target)

### User Experience
- [ ] One-click submission flow
- [ ] Instant feedback (confetti)
- [ ] Smooth animations (60fps)
- [ ] Mobile-optimized
- [ ] Clear privacy messaging

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Hero Section | 2-3 hours | None |
| 2. Submit Modal | 1-2 hours | Hero |
| 3. Share Flow | 2-3 hours | Submit Modal |
| 4. Below-Fold | 2-3 hours | Hero |
| 5. Visual Design | 2-3 hours | All components |
| 6. Accessibility | 1-2 hours | All components |
| 7. Performance | 1-2 hours | All components |
| 8. Social/SEO | 1-2 hours | Share Flow |
| **Total** | **12-20 hours** | |

## Risks & Mitigation

### Risk: Breaking V2 Features
**Mitigation:** Move v2 to separate route, maintain all existing components

### Risk: Performance Targets
**Mitigation:** Implement code splitting, lazy loading, optimize assets

### Risk: Accessibility Compliance
**Mitigation:** Use automated testing tools, manual keyboard/screen reader testing

### Risk: Share Card Quality
**Mitigation:** Test PNG generation on multiple devices, provide fallbacks

### Risk: Dark Theme Contrast
**Mitigation:** Use contrast checker tools, test with actual users

## Next Steps

1. ✅ Create implementation strategy (this document)
2. ⏳ Build hero section with meter and countdown
3. ⏳ Implement submit modal with slider
4. ⏳ Create share flow with card generation
5. ⏳ Add below-fold content
6. ⏳ Apply dark theme and animations
7. ⏳ Implement social cards and SEO
8. ⏳ Test performance and accessibility
9. ⏳ Document and deploy

## Conclusion

V3 represents a focused, conversion-optimized redesign that prioritizes simplicity and viral sharing over comprehensive features. By streamlining the submission flow and immediately rewarding users with shareable content, we aim to maximize both signal collection and organic growth.

The implementation preserves all v2 work while creating a new primary landing experience that aligns with the "Visual Viral" vision.
