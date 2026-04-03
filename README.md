# Techie4Christ
This is my personal Portfolio site

## Local development
- Install deps: `npm install`
- Run dev server: `npm run dev`

## Supabase CMS (optional)
- Create tables/policies: run `supabase/cms_schema_v2.sql` in Supabase SQL editor
- Set env vars (see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Open admin: `/admin` (sign in with Supabase Auth; add your `user_id` to `cms_admins`)

## Unsplash images (optional)
- Set `VITE_UNSPLASH_ACCESS_KEY` to enable the image picker in `/admin`
