# Content Pipeline API

Agents can submit content drafts to Mission Control programmatically. Corinne reviews and approves from the Content Pipeline tab.

## Base URLs

| Environment | URL |
|-------------|-----|
| Dev (local) | `https://healthy-flamingo-415.convex.site` |
| Production  | `https://harmless-salamander-44.convex.site` |

## Authentication

All requests require the agent API key header:

```
X-Agent-Key: sk-sebastian-mc-2026
```

> To set a different key, update `AGENT_API_KEY` in the Convex environment variables:
> https://dashboard.convex.dev/d/healthy-flamingo-415/settings/environment-variables

---

## Endpoints

### POST `/content/create` — Submit a draft

Submit a new piece of content to the pipeline.

**Required fields:**
- `title` — Human-readable title (e.g., "HTA Launch Tweet #1")
- `content` — The actual text/copy (this is what Corinne copies)
- `type` — Content type (see values below)

**Optional fields:**
- `stage` — Starting stage (default: `"draft"`)
- `createdBy` — Agent name (default: `"sebastian"`)
- `assignedTo` — Reviewer (default: `"corinne"`)
- `notes` — Agent notes/context for the reviewer

**Content types:** `x-post` | `email` | `blog` | `landing-page` | `other`

**Stages:** `idea` | `draft` | `review` | `approved` | `published`

**Response:**
```json
{ "success": true, "contentId": "j572hj..." }
```

**Example — X post ready for Corinne's review:**
```bash
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "HTA Launch Announcement",
    "content": "🎉 Excited to announce Home Training Academy — structured at-home learning for homeschool families!\n\nWhat you get:\n✅ Weekly activity boxes\n✅ Curriculum-aligned projects\n✅ Parent guides included\n\nLaunch special: 20% off first box → hta.com\n\n#homeschool #homeeducation #HTAlaunch",
    "type": "x-post",
    "stage": "review",
    "createdBy": "maven",
    "notes": "Targeting homeschool hashtag communities. 280 chars. Ready for Corinne review."
  }' \
  https://healthy-flamingo-415.convex.site/content/create
```

**Example — Email draft in progress:**
```bash
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome Email - HTA Subscribers",
    "content": "Subject: Your HTA journey starts here!\n\nHi [FirstName],\n\nWelcome to Home Training Academy...",
    "type": "email",
    "stage": "draft",
    "createdBy": "maven",
    "notes": "First draft. Needs subject line review and CTA refinement."
  }' \
  https://healthy-flamingo-415.convex.site/content/create
```

---

### POST `/content/update-stage` — Move through pipeline

Advance or change the stage of a content item.

**Required fields:**
- `contentId` — The Convex ID returned from create
- `stage` — New stage

**Optional fields:**
- `notes` — Feedback or context for the stage change
- `publishedUrl` — When moving to `"published"`, the live URL

**Response:**
```json
{ "success": true }
```

**Example — Move to review:**
```bash
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "j572hj...",
    "stage": "review",
    "notes": "Second pass done. Ready for Corinne."
  }' \
  https://healthy-flamingo-415.convex.site/content/update-stage
```

**Example — Mark as published:**
```bash
curl -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "j572hj...",
    "stage": "published",
    "publishedUrl": "https://x.com/aspiresoccer/status/12345"
  }' \
  https://healthy-flamingo-415.convex.site/content/update-stage
```

---

### GET `/content/list` — List content items

Retrieve content with optional filters.

**Query params (all optional):**
- `stage` — Filter by stage
- `type` — Filter by content type
- `createdBy` — Filter by agent name

**Response:**
```json
{
  "items": [
    {
      "_id": "j572hj...",
      "title": "HTA Launch Tweet",
      "content": "🎉 Excited to announce...",
      "type": "x-post",
      "stage": "review",
      "createdBy": "maven",
      "assignedTo": "corinne",
      "notes": "Ready for review",
      "createdAt": 1739900000000,
      "updatedAt": 1739900000000
    }
  ],
  "count": 1
}
```

**Example — Get all items waiting for review:**
```bash
curl -H "X-Agent-Key: sk-sebastian-mc-2026" \
  "https://healthy-flamingo-415.convex.site/content/list?stage=review"
```

**Example — Get all X posts:**
```bash
curl -H "X-Agent-Key: sk-sebastian-mc-2026" \
  "https://healthy-flamingo-415.convex.site/content/list?type=x-post"
```

**Example — Get Maven's drafts:**
```bash
curl -H "X-Agent-Key: sk-sebastian-mc-2026" \
  "https://healthy-flamingo-415.convex.site/content/list?createdBy=maven&stage=draft"
```

---

## Agent Workflow

### Typical Maven flow (HTA X post):

```bash
# 1. Create a draft
RESULT=$(curl -s -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d '{"title":"HTA Tweet #3","content":"...","type":"x-post","stage":"draft","createdBy":"maven"}' \
  https://healthy-flamingo-415.convex.site/content/create)

CONTENT_ID=$(echo $RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['contentId'])")

# 2. When ready for Corinne review:
curl -s -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\":\"$CONTENT_ID\",\"stage\":\"review\",\"notes\":\"Draft 2 done. Optimized for engagement.\"}" \
  https://healthy-flamingo-415.convex.site/content/update-stage

# 3. Corinne approves in Mission Control UI (or sends feedback back to draft)

# 4. After publishing, mark it:
curl -s -X POST \
  -H "X-Agent-Key: sk-sebastian-mc-2026" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\":\"$CONTENT_ID\",\"stage\":\"published\",\"publishedUrl\":\"https://x.com/...\"}" \
  https://healthy-flamingo-415.convex.site/content/update-stage
```

### Using npx convex run (alternative for agents with local access):

```bash
# Submit content directly (no HTTP needed)
npx convex run contentPipeline:createContent \
  --args '{"title":"HTA Tweet","content":"...","type":"x-post","stage":"review","createdBy":"maven","assignedTo":"corinne"}'

# Move stage
npx convex run contentPipeline:updateStage \
  --args '{"id":"j572hj...","stage":"approved"}'

# List by stage
npx convex run contentPipeline:listByStage \
  --args '{"stage":"review"}'
```

---

## Content Types Reference

| Type | Use Case | Example |
|------|----------|---------|
| `x-post` | Twitter/X posts | HTA launch tweets, Aspire announcements |
| `email` | Email campaigns | Welcome sequences, newsletters |
| `blog` | Blog articles | HTA curriculum posts, Aspire coach guides |
| `landing-page` | Landing page copy | HTA signup page, Aspire camp landing |
| `other` | Anything else | Social bios, ad copy, scripts |

## Stage Reference

| Stage | Meaning | Who acts |
|-------|---------|----------|
| `idea` | Rough concept, not drafted yet | Sebastian/Maven |
| `draft` | Written but needs work | Sebastian/Maven |
| `review` | Ready for Corinne's eyes | **Corinne** (in Mission Control) |
| `approved` | Corinne approved it | Ready to publish |
| `published` | Live on the internet | Done - add `publishedUrl` |

---

## UI Location

Corinne reviews content at:
**Mission Control → Content Pipeline tab** (sidebar, between Sebastian and Memory Search)

The Review column pulses with a "Needs review!" badge when items are waiting.
Each card has a big **Copy to Clipboard** button - one tap copies the full text.

---

*Last updated: Feb 18, 2026*  
*Convex deployment: healthy-flamingo-415*
