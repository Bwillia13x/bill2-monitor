# Digital Strike V2.0 Implementation Plan

## Overview
Transform the current Digital Strike prototype into a viral, engaging digital activism platform based on the comprehensive report recommendations.

## Current State Analysis
- Clean aesthetic with gauge ("Digital Strike Meter") 
- Basic "Add your voice" CTA
- Limited interactive elements
- Minimal storytelling or emotional hooks
- No referral/sharing mechanics
- Basic data visualization (gauge + velocity graph)

## V2.0 Enhancement Priorities

### Phase 1: Enhanced Storytelling & Emotional Hooks
**Goal:** Humanize the issue and create personal relevance

**Implementation:**
- [ ] Create "Teacher Stories" section with anonymized quotes
- [ ] Add personal impact narratives on homepage
- [ ] Implement story carousel component for Instagram/TikTok-style slides
- [ ] Add emotional hooks throughout the user journey

**Components to Create:**
- `StoryCarousel.tsx` - Rotating teacher stories
- `ImpactNarrative.tsx` - Personal story display
- `StorySubmission.tsx` - Form for teachers to submit stories

### Phase 2: Referral Chain & Gamification
**Goal:** Create viral sharing mechanics and network effects

**Implementation:**
- [ ] Unique referral links for each participant
- [ ] "Network snowball count" showing indirect impact
- [ ] Progress bars for sharing goals
- [ ] Badge/achievement system
- [ ] Weekly/regional mini-campaigns
- [ ] Daily "pulse" check with emoji/slider

**Components to Create:**
- `ReferralDashboard.tsx` - Personal referral stats
- `NetworkImpact.tsx` - Visualization of referral chain
- `BadgeSystem.tsx` - Achievement display
- `DailyPulse.tsx` - Daily sentiment tracker
- `ChallengeCard.tsx` - Weekly campaign display

### Phase 3: Interactive Data Visualizations
**Goal:** Make movement scale tangible and shareable

**Implementation:**
- [ ] Alberta province heatmap showing signature density by district
- [ ] Time-lapse growth animation
- [ ] Privacy-preserving filters (n≥20 threshold)
- [ ] Enhanced velocity graphs with animations
- [ ] Real-time updates

**Components to Create:**
- `ProvinceHeatmap.tsx` - Interactive Alberta map
- `GrowthTimelapse.tsx` - Animated growth visualization
- `FilteredMetrics.tsx` - Demographic breakdowns with privacy
- `RealTimeCounter.tsx` - Live signature counter

### Phase 4: Enhanced CTA Design
**Goal:** Drive higher engagement with urgent, aspirational messaging

**Implementation:**
- [ ] Replace "Add your voice" with urgent CTAs
- [ ] Suggested copy: "Stand Up for Your Rights – Pledge Anonymously"
- [ ] Alternative: "Help Us Reach 10,000 Voices for Fairness"
- [ ] Contrasting colors and motion (pulsing button)
- [ ] Privacy protections prominently displayed below CTA
- [ ] Multiple CTA placements throughout page

**Components to Update:**
- `PledgePanel.tsx` - Enhanced with new copy and animations
- Add `PulsingCTA.tsx` - Animated call-to-action button
- `PrivacyBadge.tsx` - Trust indicators near CTA

### Phase 5: Social Sharing Tools
**Goal:** Provide ready-made content for viral spread

**Implementation:**
- [ ] Instagram-friendly infographic carousels (10 slides)
- [ ] Personalized sharing cards with QR codes
- [ ] Pre-written captions and hashtags
- [ ] Auto-generated shareables
- [ ] Social media preview optimization

**Components to Create:**
- `ShareableGenerator.tsx` - Create personalized cards
- `InfographicCarousel.tsx` - Educational slide decks
- `SocialCaptionTool.tsx` - Pre-written content
- `QRCodeCard.tsx` - Personal referral cards

### Phase 6: Media & Political Engagement
**Goal:** Channel momentum into policy impact

**Implementation:**
- [ ] Letter-to-MLA generator
- [ ] Press kit with live embeds
- [ ] Real-time dashboard for journalists
- [ ] Anonymized quote database
- [ ] Media contact tools

**Components to Create:**
- `MLALetterGenerator.tsx` - Automated letter tool
- `PressKit.tsx` - Media resources page
- `JournalistDashboard.tsx` - Live embeds and data
- `QuoteDatabase.tsx` - Shareable teacher quotes

### Phase 7: Gamified Progress & Goals
**Goal:** Motivate through milestones and collective achievements

**Implementation:**
- [ ] Specific targets with rewards (e.g., "1,000 = full-page ad")
- [ ] Progress bars for collective goals
- [ ] Countdown timers for campaigns
- [ ] Milestone celebrations
- [ ] District-level competitions

**Components to Create:**
- `MilestoneTracker.tsx` - Goal progress display
- `CollectiveGoals.tsx` - Community targets
- `DistrictLeaderboard.tsx` - Friendly competition
- `CelebrationModal.tsx` - Milestone achievements

### Phase 8: Enhanced Methodology & Privacy
**Goal:** Build trust through transparency

**Implementation:**
- [ ] Prominent methodology explainer page
- [ ] Data collection process documentation
- [ ] Anonymization methods detail
- [ ] n≥20 threshold explanation
- [ ] Privacy-by-design messaging

**Pages to Create:**
- `/methodology` - Detailed methodology page
- `/privacy` - Enhanced privacy documentation
- `/faq` - Common questions about data protection

## Technical Implementation Notes

### Database Schema Updates
- Add `referral_codes` table for tracking referral chains
- Add `stories` table for teacher narratives
- Add `badges` table for achievement system
- Add `daily_pulse` table for sentiment tracking
- Add `campaigns` table for weekly challenges

### API Endpoints Needed
- `/api/referral/generate` - Create unique referral link
- `/api/referral/stats` - Get referral chain data
- `/api/stories/submit` - Submit anonymized story
- `/api/stories/fetch` - Get approved stories
- `/api/pulse/submit` - Daily sentiment check
- `/api/heatmap/data` - Geographic distribution
- `/api/shareables/generate` - Create sharing cards

### Design System Updates
- Add pulsing/animated button variants
- Create badge/achievement icon set
- Design Instagram-friendly templates
- Create QR code styling
- Add heatmap color schemes

## Success Metrics
- Referral rate (% of users who share)
- Network multiplier (avg referrals per user)
- Story submission rate
- Social media shares
- Time on site
- Return visitor rate
- Geographic coverage
- Media mentions

## Priority Order
1. **Phase 4** - Enhanced CTA (quick win, high impact)
2. **Phase 2** - Referral chain (core viral mechanic)
3. **Phase 1** - Storytelling (emotional connection)
4. **Phase 3** - Data visualizations (shareability)
5. **Phase 5** - Social sharing tools (amplification)
6. **Phase 7** - Gamification (sustained engagement)
7. **Phase 6** - Political tools (policy impact)
8. **Phase 8** - Enhanced transparency (trust building)
