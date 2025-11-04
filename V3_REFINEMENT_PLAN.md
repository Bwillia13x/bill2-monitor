# V3 Refinement Plan - Evidence-Based Optimization

## Goal
Refine V3 to maximize the viral loop: **tap → instant progress → share with 3 → unlock districts**

## Key Changes from Current V3

### 1. Simplify Hero (One Screen, Mobile-First)

**Current**: Two large tiles side-by-side
**New**: Single column, vertical stack

```
┌─────────────────────────────┐
│ Digital Strike Meter        │
│                             │
│        67                   │
│      (+2.3)                 │
│                             │
│ 100% anonymous · n≥20 rule  │
│ 1,034 days until imposed    │
│ agreement ends (Bill 2)     │
│                             │
│ [Add Anonymous Signal]      │
│ [Share With 3 Colleagues]   │
│                             │
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │Unlock│ │Veloc │ │Cover │ │
│ └──────┘ └──────┘ └──────┘ │
└─────────────────────────────┘
```

**Changes**:
- Remove countdown ring (too much visual weight)
- Countdown becomes slim text line
- Big number dominates
- Two full-width CTAs
- Three compact tiles below

### 2. Enhanced Share Flow

**Current**: Generic share with multiple platforms
**New**: Specific "3 colleagues" ask with progress feedback

**After Signal Submitted**:
1. Confetti + "You're signal #68. +1 today."
2. **Progress card**: "Red Deer: 19/20 (1 more to unlock)"
3. **Share prompt**: "Share with 3 colleagues to unlock your district faster"
4. Prefilled message optimized for K-factor

**Share Copy**:
```
I just added my anonymous signal to the Alberta Digital Strike Meter—privacy-safe, evidence-based. Add yours + help unlock your district: [link]
```

### 3. District Unlock Progress

**Current**: Simple locked/unlocked grid
**New**: Progress indicators showing proximity to threshold

**Display**:
- Unlocked (≥20): "Calgary 1: 45 signals"
- Near threshold (15-19): "Lethbridge: 18/20 (2 more needed)"
- Locked (<15): "Medicine Hat: Locked"

**Feedback Loop**:
- Show user which district they're in
- Highlight their district's progress
- Encourage sharing to unlock

### 4. Auto-Generated Press PNG

**Specifications**:
- 1200×630px (Twitter/Facebook optimal)
- Updated daily
- Contains: Big number, date, unlocked map
- Downloadable with one click
- Shareable to seed media/union accounts

**Content**:
```
┌────────────────────────────┐
│ Alberta Educator           │
│ Dissatisfaction Signals    │
│                            │
│         67                 │
│                            │
│ [Mini map of unlocked      │
│  districts]                │
│                            │
│ Nov 4, 2025                │
│ digitalstrike.ca           │
└────────────────────────────┘
```

### 5. Methodology Modal

**Current**: Link to separate /methodology page
**New**: Modal overlay with plain-English bullets

**Content**:
- We store only a dated, salted hash
- Display only when n≥20 (k-anonymity)
- Non-coordinative: evidence collection only
- Links to privacy sources

### 6. Copy Refinements

**Current**: Various messaging
**New**: Tight, evidence-based copy

**H1**: "Alberta Educator Dissatisfaction (Anonymous, Real-Time)"
**Sub**: "A privacy-safe, non-coordinative signal of working-conditions sentiment."
**Microcopy**: "100% anonymous · n≥20 privacy rule · evidence-based, non-coordinative"
**Countdown**: "1,034 days until imposed agreement ends (Bill 2)"
**Post-signal**: "Thanks. Your share helps unlock your district faster."
**Locked district**: "2 more signals needed to unlock Lethbridge"

## Implementation Checklist

### Phase 1: Simplify Hero ✓
- [ ] Remove CountdownRing component (keep as slim text)
- [ ] Simplify V3Hero to single column
- [ ] Make big number more dominant
- [ ] Add microcopy row
- [ ] Slim countdown text

### Phase 2: Enhance Viral Loop
- [ ] Update ConfirmationAnimation with signal number
- [ ] Add district progress card
- [ ] Update ShareModal with "3 colleagues" messaging
- [ ] Optimize share copy for K-factor
- [ ] Add native share sheet option

### Phase 3: District Progress
- [ ] Update BelowFold with progress indicators
- [ ] Show "X/20" for near-threshold districts
- [ ] Add "X more needed" messaging
- [ ] Highlight user's district
- [ ] Add unlock celebration

### Phase 4: Press PNG
- [ ] Create PressKitTile component
- [ ] Canvas generation with map
- [ ] Daily auto-update logic
- [ ] One-click download
- [ ] Add to below-fold section

### Phase 5: Methodology Modal
- [ ] Create MethodologyModal component
- [ ] Plain-English bullets
- [ ] Privacy sources links
- [ ] Replace /methodology link with modal trigger

### Phase 6: Copy Refinement
- [ ] Update all H1/H2 text
- [ ] Refine microcopy
- [ ] Update toast messages
- [ ] Optimize share copy
- [ ] Add tooltips

### Phase 7: Testing
- [ ] Test one-screen mobile view
- [ ] Verify share flow
- [ ] Check district progress display
- [ ] Test press PNG generation
- [ ] Validate methodology modal
- [ ] Cross-browser testing

## Success Metrics

### Behavioral Triggers
- **Social proof**: "X teachers have already signaled"
- **Progress visibility**: "19/20 signals in your district"
- **Deadline urgency**: "1,034 days until imposed agreement ends"
- **Goal gradient**: Visual proximity to unlocking

### Conversion Targets
- **Submission rate**: 15-20% (up from ~8%)
- **Share rate**: ≥90% (up from ~30%)
- **K-factor**: >1.0 (up from ~0.4)
- **Specific referrals**: Average 3 per share

### Engagement Metrics
- **District unlock rate**: % of districts reaching threshold
- **Repeat visits**: Users checking district progress
- **Press tile downloads**: Media/union usage
- **Share completion**: % who complete 3-colleague ask

## Evidence-Based Rationale

### Social Proof (Cialdini)
- Display "X teachers have signaled" prominently
- Show district participation rates
- Leverage descriptive norms

### Goal-Gradient Effect
- Show proximity to threshold (18/20)
- Accelerate sharing as goal approaches
- Celebrate unlocks

### Temporal Motivation Theory
- Countdown creates urgency
- Deadline visibility increases perceived utility
- "Why now" is clear

### K-Factor Optimization
- Specific ask (3 colleagues)
- Prefilled message
- Progress feedback
- Unlock reward

### Privacy (k-Anonymity)
- n≥20 threshold prevents re-identification
- Statistical disclosure control
- Plain-English explanation

## Technical Considerations

### Performance
- Remove heavy countdown ring animation
- Simplify hero for faster LCP
- Lazy load below-fold
- Optimize PNG generation

### Accessibility
- Maintain WCAG 2.2 AA
- Simplified layout easier to navigate
- Clear focus order
- Reduced cognitive load

### Mobile-First
- Single column stack
- Full-width CTAs (44px height)
- Compact tiles
- Thumb-friendly spacing

## Next Steps

1. Implement simplified hero
2. Enhance share flow
3. Add district progress
4. Create press PNG generator
5. Build methodology modal
6. Refine all copy
7. Test and validate

## Timeline

- Phase 1-2: 1-2 hours
- Phase 3-4: 1-2 hours
- Phase 5-6: 1 hour
- Phase 7: 1 hour
- **Total**: 4-6 hours

## Conclusion

These refinements optimize V3 for the core loop: **tap → progress → share with 3 → unlock districts**. By simplifying the hero, enhancing the viral mechanics, and adding district unlock feedback, we maximize conversion while maintaining privacy and non-coordination principles.
