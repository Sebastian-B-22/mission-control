# Email Drafts (Phase 1)

Mission Control includes a lightweight **Email Draft Editor** for drafting, reviewing, and approving outbound emails.

## Where to find it

In Mission Control:

- Left sidebar
- **Sebastian** section
- Click **Email Drafts**

## Workflow

Each email draft has a `status`:

- `draft` - initial working state
- `review` - optional (not enforced yet, but available)
- `approved` - ready to send/copy into your email client
- `sent` - optional (manual for now)

Typical flow:

1. Create a new draft
2. Write subject/title + body (markdown)
3. Optionally add tags
4. Copy to clipboard when ready
5. Mark **Approved** once finalized

## Suggestions

Drafts can store an array of **suggestions** (minimal Phase 1 support).

Each suggestion contains:

- `proposedBodyMarkdown` - full replacement body text
- `author`
- `createdAt`
- `status` (`pending` | `accepted` | `rejected`)

In the UI you can:

- Add a suggestion (manual/stubbed for now)
- **Accept & Apply** - marks suggestion accepted and replaces the draft body with the proposed markdown
- Reject - marks suggestion rejected

## Notes / Future improvements

Planned enhancements (not required for Phase 1):

- Rich markdown rendering preview
- Diff view for suggestions
- Agent-created suggestions (auto-populated)
- One-click "Send" integration (Gmail/SMTP)
