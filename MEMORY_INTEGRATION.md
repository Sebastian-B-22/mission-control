# Memory Search Integration - Mission Control

**Status:** ✅ Complete  
**Date:** February 18, 2026  
**Built by:** Sebastian subagent  

---

## What Was Built

The Second Brain (standalone memory search app) has been fully integrated into Mission Control as a native "Memory Search" tab. Corinne and Sebastian now have one app instead of two.

---

## Architecture Decision: Option A (Local API Server)

**Decision:** Run a small local API server on the Mac mini that Mission Control calls.

### Why Option A?

| Option | Approach | Verdict |
|--------|----------|---------|
| **A: Local API Server** ✅ | Node.js server on Mac mini, Mission Control proxies to it | **Chosen** |
| B: Sync to Convex | Periodic file sync to Convex database | Too complex, stale data risk |
| C: iframe/link | Mission Control links to second-brain running on localhost:3000 | Not native, two apps still |

**Reasons for Option A:**
1. **Zero stale data** - Files are read live from disk on every search
2. **Zero complexity** - No sync scripts, no duplicate storage, no DB schema
3. **Instant** - New memory files appear immediately without any sync
4. **Simple** - Just a single `server.js` (no dependencies, pure Node.js stdlib)
5. **Secure** - Path validation prevents directory traversal; CORS locked to known origins
6. **Flexible** - Set `MEMORY_API_URL` to any host (local, LAN IP, or tunnel)

### How Vercel Production Works

```
Corinne's browser → Vercel (Mission Control) → Next.js API route → Mac mini (port 3001) → filesystem
```

The Mac mini needs to be accessible from Vercel. Options:
1. **ngrok / Cloudflare Tunnel** (easiest): expose port 3001 via a stable tunnel URL, set `MEMORY_API_URL` in Vercel env vars
2. **Direct IP** (if Mac mini has a static/NAT'd public IP): just set `MEMORY_API_URL=http://your-ip:3001`
3. **Local only** (current default): Works perfectly when browsing Mission Control locally on the Mac mini network (`MEMORY_API_URL=http://localhost:3001`)

For now, Memory Search works locally. If Corinne needs it from her phone/Vercel, set up a tunnel (5 min with ngrok).

---

## File Structure

### New Files Created

```
workspace/
├── memory-api/
│   ├── server.js                         # Memory API server (pure Node.js, no deps)
│   ├── package.json                      # Minimal package.json
│   ├── start.sh                          # Convenience start script
│   ├── com.openclaw.memory-api.plist     # launchd service (auto-start on login)
│   └── logs/                             # Server log output

mission-control/
├── app/api/memory/
│   ├── search/route.ts                   # Proxies to memory-api /api/search
│   └── content/route.ts                  # Proxies to memory-api /api/content
├── components/memory/
│   ├── MemorySearchBar.tsx               # Search input with debounce
│   ├── MemoryFilterBar.tsx               # Type + category + date filters
│   ├── MemoryResultsList.tsx             # Results with grouping + highlighting
│   └── MemoryContentModal.tsx            # Full file viewer with copy button
└── components/MemoryView.tsx             # Main Memory page component
```

### Modified Files

```
mission-control/
├── app/dashboard/page.tsx                # Added: import MemoryView + case "memory"
├── components/SidebarNew.tsx             # Added: Memory Search nav item + Brain icon
└── .env.local                            # Added: MEMORY_API_URL=http://localhost:3001
```

---

## How to Run

### 1. Start the Memory API Server

```bash
cd /Users/sebastian/.openclaw/workspace/memory-api
node server.js
```

Or with the start script:
```bash
./start.sh
```

The server starts on **port 3001** and outputs:
```
🧠 Memory API Server running on port 3001
   Workspace: /Users/sebastian/.openclaw/workspace
   Health:    http://localhost:3001/health
   Search:    http://localhost:3001/api/search?q=your+query
   Content:   http://localhost:3001/api/content?path=MEMORY.md
```

### 2. Auto-Start on Login (Mac mini)

To make the server start automatically when the Mac mini boots:

```bash
# Copy the plist to launchd
cp /Users/sebastian/.openclaw/workspace/memory-api/com.openclaw.memory-api.plist \
   ~/Library/LaunchAgents/

# Load it now
launchctl load ~/Library/LaunchAgents/com.openclaw.memory-api.plist

# Verify it's running
launchctl list | grep memory-api
curl http://localhost:3001/health
```

To stop/unload:
```bash
launchctl unload ~/Library/LaunchAgents/com.openclaw.memory-api.plist
```

### 3. Access in Mission Control

Navigate to Mission Control → click **"Memory Search"** in the sidebar (🧠 icon, at the bottom).

---

## Features Built

### 1. Search
- Full-text search across all `.md` files in the workspace
- Real-time debounced search (300ms) as you type  
- Shows result count
- Handles no-query state (shows all files)

### 2. Filtering
- **Type filters**: All / 🧠 Memories / 📝 Notes / 💬 Conversations
- **Category filters**: Daily Memories, Long-Term Memory, Knowledge Base, Projects, Notes & Guides, Conversations
- **Date range**: From / To date pickers
- All filters combine

### 3. Results
- **Grouped by category** (default): Files organized into 6 categories
- **Flat list** mode: Simple ordered list (toggle button top-right)
- **Search term highlighting**: Query words highlighted in amber in titles and snippets
- **File path breadcrumbs**: Full path shown under each result title
- **Smart date formatting**: "Today", "Yesterday", "3 days ago", etc.
- **Match count**: Shows how many times query appears in file
- Sorted by relevance (match count) then date (newest first)

### 4. Content Modal
- Click any result → opens full file in modal overlay
- **Copy button**: Copies raw markdown to clipboard (with "Copied!" confirmation)
- **File path breadcrumbs** in modal header
- **Last modified date** shown
- Built-in markdown renderer (no external library needed):
  - Headings (H1-H4) with amber H1 underline
  - Bold, italic, strikethrough, inline code
  - Code blocks with syntax highlighting style
  - Lists (ordered + unordered)
  - Blockquotes with amber left border
  - Links (open in new tab)
  - Horizontal rules
- ESC key closes modal
- Click outside modal closes

### 5. Enhancements Over Original Second Brain
| Feature | Original | Mission Control |
|---------|----------|-----------------|
| Copy button | ❌ | ✅ |
| File path breadcrumbs | ❌ | ✅ |
| Search term highlighting | ❌ | ✅ |
| Group by category | ❌ | ✅ |
| Category filter | ❌ | ✅ |
| View mode toggle (grouped/flat) | ❌ | ✅ |
| Debounced real-time search | ❌ | ✅ |
| Error message with fix hint | ❌ | ✅ |

---

## What Gets Searched

The memory-api server scans the workspace recursively and indexes all `.md` files.

**Included:**
- `memory/YYYY-MM-DD.md` → Daily Memories category
- `MEMORY.md` → Long-Term Memory category  
- `knowledge/` directory → Knowledge Base category
- `projects/`, `mission-control/`, `second-brain/` → Projects category
- All other `.md` files → Notes & Guides category

**Excluded (won't appear in search):**
- `node_modules/`
- `.git/`
- `.next/`
- Hidden files (starting with `.`)
- `second-brain/` (avoid self-reference)
- `memory-api/`
- `tmp/`, `slides/`, `public/`, `scripts/`, `_generated/`

---

## API Reference

### Memory API Server (port 3001)

```
GET /health
→ { status: "ok", workspace: "...", time: "..." }

GET /api/search?q=query&type=memory&dateFrom=2026-01-01&dateTo=2026-12-31
→ { results: SearchResult[], count: number }

GET /api/content?path=memory/2026-02-18.md
→ { content: string, path: string, modified: string, size: number }
```

### Mission Control Proxy Routes

```
GET /api/memory/search?q=query&type=memory&dateFrom=...&dateTo=...
GET /api/memory/content?path=relative/path.md
```

These proxy to the memory-api server via `MEMORY_API_URL`.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MEMORY_API_URL` | `http://localhost:3001` | URL of the memory-api server |
| `PORT` (memory-api) | `3001` | Port for the memory-api server |
| `WORKSPACE_PATH` (memory-api) | `/Users/sebastian/.openclaw/workspace` | Root to search |

Set in:
- **Local dev**: `mission-control/.env.local`
- **Vercel prod**: Vercel dashboard → Settings → Environment Variables

---

## Deployment on Vercel

For Memory Search to work when accessed via Vercel (not local network):

### Option 1: Cloudflare Tunnel (Recommended)

```bash
# Install cloudflared
brew install cloudflared

# Create a free tunnel
cloudflared tunnel --url http://localhost:3001

# Note the generated URL (e.g., https://abc123.trycloudflare.com)
# Set in Vercel: MEMORY_API_URL=https://abc123.trycloudflare.com
```

For a stable URL, create a named tunnel with Cloudflare account.

### Option 2: ngrok

```bash
ngrok http 3001
# Note the https URL, set as MEMORY_API_URL in Vercel
```

### Option 3: Local Network Only

If Corinne only uses Mission Control on the Mac mini or same network:
- Set `MEMORY_API_URL=http://<mac-mini-local-ip>:3001`
- Works without any tunnel

---

## Styling Notes

The Memory Search UI is styled to match Mission Control's LifeOS gold/dark theme:
- **Search bar**: White bg, amber focus ring, subtle shadow
- **Active filter pills**: Amber-500 background (matching nav active state)  
- **Result cards**: White bg, amber hover border (`hover:border-amber-200`)
- **Category headings**: Gray-700 with emoji icons
- **Highlighted text**: Amber-100 background with amber-800 text (`<mark>`)
- **Content modal**: White bg, amber H1 underline, amber blockquote border
- **Spinners**: Amber-500 border color (matching Mission Control's loading states)

---

## Future Improvements

1. **Vector search**: Add semantic search using embeddings (OpenAI or local model) for "what does Sebastian know about Allie?" type queries
2. **Favorites**: Bookmark frequently accessed files
3. **Tags**: Parse frontmatter tags for better filtering
4. **Export**: Download search results as markdown
5. **Agent writes**: Sebastian's daily cron can highlight today's memory file
6. **Convex mirror** (optional): For true offline/Vercel access without tunnel, sync key files to Convex `memories` table (as described in GAP_ANALYSIS.md)

---

*Built Feb 18, 2026 | Sebastian subagent*
