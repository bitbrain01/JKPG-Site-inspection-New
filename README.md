# Site Inspection App

This project is a Vite + React + TypeScript web app for on-site inspections with scoring, photo capture, and PDF export.

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Build production assets: `npm run build`
4. Preview production build: `npm run preview`

## Supabase Setup (optional but recommended)

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_SUPABASE_STORAGE_BUCKET`.
3. Create this table in Supabase SQL editor:

```sql
create table if not exists public.inspection_drafts (
	id text primary key,
	payload jsonb not null,
	created_at timestamptz not null,
	updated_at timestamptz not null
);
```

4. Create a Storage bucket (default name: `inspection-photos`) and allow client uploads/reads for your chosen auth mode.

Photo data URLs are uploaded to Storage during sync and stored in the draft payload as storage references.

When Supabase env variables are not set, the app still works with local autosave and auto-resume.
