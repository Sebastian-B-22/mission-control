# Maven Feedback System

## Overview

The feedback system helps Maven learn Corinne's voice and preferences over time. Every rejection and edit in the Content Pipeline is tracked and analyzed.

## How It Works

### Rejecting Content

When content doesn't meet your standards, click **Reject** and select a reason:

| Reason | When to Use |
|--------|-------------|
| 💰 **Too Salesy** | Content feels pushy or promotional |
| 🎨 **Off-Brand** | Doesn't match your voice/brand |
| 🗣️ **Wrong Tone** | Tone doesn't fit the context |
| ❌ **Factually Wrong** | Contains incorrect information |
| ✏️ **Other...** | Custom reason - describe what's wrong |

Rejected content moves back to Ideas with your feedback attached.

### Editing Content

When you edit Maven's drafts before approving, the system automatically:
1. Captures the **original** content
2. Captures your **edited** version
3. Stores the comparison for Maven to learn from

No action needed - just edit and save!

### Where Feedback Goes

1. **Convex Database** - All feedback stored in `mavenFeedback` table
2. **voice-feedback.json** - Summary exported to `/workspace/agents/maven/voice-feedback.json`
3. **SOUL.md Updates** - Every 10 feedback items, patterns are summarized and suggested updates to Maven's SOUL.md are generated

## Viewing Feedback Stats

In the Content Pipeline, you'll see a counter like:
> 🎯 12 voice feedback items

This shows how much training data Maven has to learn from.

## Engagement Habits Dashboard

The **Engagement** section in Mission Control helps you track:

- **Daily Goal**: 3-5 engagements per day (configurable)
- **Streak**: Consecutive days with activity
- **Week View**: Visual of this week's engagement
- **Quick Log**: One-tap logging for comments, posts, replies, etc.

### Activity Types

| Type | Description |
|------|-------------|
| 💬 Comment | Commented on someone's post |
| 📝 Post | Published original content |
| 🔁 Reply | Replied to a comment/thread |
| ❤️ Like | Liked/favorited content |
| 🔗 Share | Shared/retweeted content |

### Tips for Consistency

1. **Morning routine**: Comment on 2-3 posts with coffee
2. **Lunch break**: Quick scroll and engage
3. **Evening**: Post 1 piece of content if you haven't
4. **Batch logging**: Use "+Log" to record multiple at once

## For Maven (Technical)

The feedback is stored in Convex and can be queried:

```typescript
// Get all feedback
const feedback = await ctx.runQuery(api.mavenFeedback.listAll, {});

// Get stats
const stats = await ctx.runQuery(api.mavenFeedback.getFeedbackStats, {});
```

Pattern detection triggers every 10 items. Check `stats.recentPatterns` for common rejection reasons.

---

*Built with ❤️ for Corinne by the Agent Squad*
