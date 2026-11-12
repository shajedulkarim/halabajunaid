# Hala Bajunaid Boutique

Static site (HTML, CSS, vanilla JS) plus a staff admin at `/admin/`. Backend: Supabase. Hosting: GitHub Pages.

## Run the database setup (Supabase SQL Editor, in this order)
1. `supabase/001_schema.sql` tables, RLS, storage bucket, seed content
2. `supabase/002_staff_permissions.sql` staff table, permission checks, write policies
3. `supabase/003_user_management.sql` owner-only user creation and password reset

Then create the owner login (Authentication > Users > Add user), and run once:

```sql
select public.bootstrap_owner('owner@email.com');
```

Put the project URL and publishable key in `config.js`. Never commit a secret / service_role key.

## Cache busting
Assets use `?v=N`. Bump N in `index.html` and `admin/index.html` when you change a file.

## Local preview
`python3 -m http.server 8000` then open http://localhost:8000/
