# Propcheq

Mobile-first property inspection reports for residential investment properties — replacing the dated Word-table workflow with a fast tap-to-inspect app and a clean, Instagram-style report page for owners.

## Two users, one app

**Property inspector**
- Tap-to-inspect checklist pre-filled from a template (areas → items with Clean / Undamaged / Working tri-state toggles)
- Camera + gallery photo and video capture on-site, with a description field per image
- Quick overall ratings (1–10 sliders) for cleanliness and condition, rolled up to a property score out of 100
- One-tap insertion of oft-used phrases into descriptions (snippet chips)
- Requests to the owner ("approve hedge pruning?") with in-app responses

**Property owner**
- Private report pages — only the inspector and the linked owner can see them
- Ratings dashboard: score gauge, metric bars, per-area issue heat map
- Scrollable photo/video feed with area tags and captions
- One-tap preset responses: **Approve** / **More information required** / **Decline**
- Access via a short owner code shared by the inspector

## Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Hono + tRPC 11 (end-to-end type safety)
- **Database**: MySQL / TiDB via Drizzle ORM
- **Auth**: Kimi OAuth 2.0 (JWT sessions)
- **Deploy**: Docker (see `Dockerfile`)

## Development

```bash
npm install
npm run db:push    # create/sync database tables
npm run dev        # http://localhost:3000
```

## Production

```bash
npm run build      # frontend → dist/public, server → dist/boot.js
npm start
```

The Docker image pushes the schema, seeds demo data (skipped if already seeded) and starts the server:

```bash
docker build -t propcheq .
docker run -p 3000:3000 propcheq
```

## Project layout

| Path | Purpose |
| --- | --- |
| `src/pages` | Dashboard, report editor (inspector), report view (owner) |
| `src/components` | ScoreGauge, RatingSlider, TriToggle, SnippetChips, TopBar |
| `api/` | Hono server, tRPC routers, auth, media upload routes |
| `api/propcheq-router.ts` | All inspection domain procedures |
| `contracts/propcheq.ts` | Shared templates, snippet phrases, scoring |
| `db/schema.ts` | Drizzle schema (users, properties, reports, areas, items, media, action_requests) |
| `db/seed.ts` | Idempotent seed script (reads `db/seed-data.json`, git-ignored) |

## Privacy note

`db/seed-data.json` and `uploads/` are intentionally git-ignored — they may contain real property photos, addresses and tenant names. Keep them out of version control unless you have consent to publish them.
