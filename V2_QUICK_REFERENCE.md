# Digital Strike V2.0 - Quick Reference Guide

## 🎯 What's New in V2.0

Digital Strike v2.0 transforms the basic sentiment tracker into a comprehensive viral activism platform with emotional storytelling, gamification, and social sharing tools.

## 📍 Where to Find Features

### Homepage (/)
- **Story Carousel**: Rotating anonymized teacher testimonials
- **Impact Narrative**: Four-panel explanation of why this matters
- **Pulsing CTA**: Enhanced call-to-action with progress tracking
- **Engage Link**: Prominent call-out to explore new features

### Engage Page (/engage)
Central hub with 6 tabs:

1. **Network Tab**
   - Your unique referral link
   - Direct/indirect referral tracking
   - Network impact statistics
   - Rank and leaderboard position
   - One-click social sharing

2. **Pulse Tab**
   - Daily sentiment check (5 emoji options)
   - Aggregate mood visualization
   - Downloadable pulse cards
   - 7-day trend analysis

3. **Badges Tab**
   - 12 achievement badges
   - Progress tracking
   - Collection completion percentage
   - Next badge spotlight

4. **Map Tab**
   - Interactive Alberta heatmap
   - District-level signature density
   - Geographic coverage stats
   - Privacy-preserving (n≥20) display

5. **Growth Tab**
   - Animated timeline of movement growth
   - Play/pause controls
   - Milestone celebrations
   - Growth rate projections

6. **Share Tab**
   - 4 shareable graphic templates
   - Platform-specific captions (Twitter, Facebook, Instagram, Email)
   - Pre-written hashtags
   - One-click download and share

## 🚀 Key Features

### Referral System
- **Unique Links**: Each user gets a trackable referral code
- **Network Snowball**: See direct + indirect impact
- **Progress Bars**: Visual goals (e.g., "20 referrals to unlock badge")
- **Rank Tracking**: Compare your impact with others

### Gamification
- **12 Badges**: First Voice, Network Builder, Pulse Tracker, etc.
- **Progress Tracking**: See how close you are to unlocking
- **Milestones**: Collective goals with rewards
- **Leaderboards**: Friendly competition

### Storytelling
- **Teacher Stories**: Anonymized quotes from real educators
- **Impact Narratives**: Emotional connection to the cause
- **Visual Design**: Engaging gradients and animations

### Data Visualization
- **Heatmap**: Geographic spread across Alberta
- **Growth Animation**: Watch the movement grow over time
- **Real-time Stats**: Live counters and updates

### Social Sharing
- **Ready-Made Graphics**: Download in multiple formats
- **Pre-Written Captions**: Copy-paste for each platform
- **Hashtags**: Curated tags for maximum reach
- **QR Codes**: Printable cards for offline sharing

## 💡 Best Practices for Virality

### For Educators
1. **Sign the pledge** → Get your unique referral link
2. **Share your link** with 3-5 colleagues
3. **Check daily pulse** to maintain engagement
4. **Download and share** graphics on social media
5. **Track your impact** on the Network tab
6. **Unlock badges** by hitting milestones

### For Organizers
1. **Promote the Engage page** as the action hub
2. **Highlight badges** to encourage competition
3. **Share growth visualizations** to show momentum
4. **Use pre-written captions** for consistent messaging
5. **Celebrate milestones** when thresholds are reached
6. **Feature top referrers** (with permission) to inspire others

## 🔐 Privacy Features

All v2.0 features maintain privacy-by-design:
- **Anonymous referral tracking** (no personal data exposed)
- **n≥20 threshold** for all district-level data
- **Aggregated pulse data** only
- **Generalized story details** (no identifying information)
- **Privacy badges** prominently displayed

## 📊 Metrics to Watch

### Engagement Metrics
- Daily active users
- Return visitor rate
- Time on Engage page
- Pulse check completion rate

### Viral Metrics
- Referral conversion rate
- Network multiplier (avg referrals per user)
- Social media shares
- Badge unlock rate

### Movement Metrics
- Total signatures
- Geographic coverage
- Growth velocity
- Media mentions

## 🎨 Design Elements

### Color Coding
- **Primary (Blue)**: Main actions and highlights
- **Red**: High dissatisfaction, urgent matters
- **Amber**: Moderate concern, warnings
- **Green**: Positive milestones, achievements

### Animations
- **Pulsing CTA**: Draws attention to main action
- **Progress bars**: Visual feedback on goals
- **Growth timeline**: Animated movement history
- **Hover effects**: Interactive elements

## 🔧 Technical Notes

### Component Structure
```
/src/components/
  - StoryCarousel.tsx          (Homepage storytelling)
  - ImpactNarrative.tsx        (Homepage impact grid)
  - PulsingCTA.tsx             (Enhanced call-to-action)
  - ReferralDashboard.tsx      (Network tracking)
  - DailyPulse.tsx             (Sentiment check)
  - BadgeSystem.tsx            (Achievements)
  - ProvinceHeatmap.tsx        (Geographic viz)
  - GrowthTimelapse.tsx        (Timeline animation)
  - ShareableGenerator.tsx     (Social tools)
```

### Routes
- `/` - Homepage with meter + new storytelling
- `/engage` - Central hub for all v2.0 features
- `/voices` - Existing voices page
- `/pulse` - Existing pulse page
- `/press` - Media kit
- `/studio/signs` - Sign generator

### Data Requirements (for production)
- `referral_codes` table
- `stories` table
- `badges` table
- `daily_pulse` table
- API endpoints for tracking

## 📱 Mobile Optimization

All v2.0 features are fully responsive:
- Touch-friendly tap targets
- Swipe gestures for carousels
- Collapsible navigation
- Optimized image sizes
- Fast loading animations

## 🎯 Call-to-Action Hierarchy

1. **Primary**: "Stand Up for Your Rights - Pledge Anonymously"
2. **Secondary**: "Explore Engage Tools"
3. **Tertiary**: Share buttons, download buttons
4. **Supporting**: Navigation links, info buttons

## 🌟 Success Indicators

You'll know v2.0 is working when:
- ✅ Referral rate exceeds 30%
- ✅ Daily pulse check rate above 20%
- ✅ Average 5+ referrals per active user
- ✅ Social media shares increase 10x
- ✅ Geographic coverage reaches 80%+ districts
- ✅ Return visitor rate above 40%

## 📞 Support & Iteration

Monitor these for continuous improvement:
- User feedback on Engage page
- Drop-off points in referral flow
- Most/least popular badges
- Social sharing conversion rates
- Mobile vs desktop usage patterns

---

**Remember**: The goal is to make participation easy, impactful, and shareable. Every feature should answer: "Why should I engage?" and "How can I help grow this?"
