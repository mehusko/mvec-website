# Admin panel setup (one time)

The admin lives at `/admin` on the site. It needs a database and three secrets.

1. **Database.** In Vercel: project > Storage > Create > Neon (Postgres). This adds `DATABASE_URL` automatically.
2. **Secrets.** In Vercel: project > Settings > Environment Variables, add:
   - `SESSION_SECRET` – 40+ random characters (keeps logins safe)
   - `SETUP_KEY` – 16+ random characters (used once, to create the first admin)
3. **Redeploy**, then create the first admin with a single request:
   `curl -X POST https://YOUR-SITE/api/admin/auth/setup -H "content-type: application/json" -H "x-setup-key: <SETUP_KEY>" -d '{"email":"you@example.com","password":"a long password","name":"Your name"}'`
4. Open `/admin`, sign in, and set up the 2-step code in Google Authenticator. Save the 10 backup codes.
5. After that, delete `SETUP_KEY` from Vercel. Setup is refused once a user exists anyway.

Public forms (contact, register, apply) now also save into the admin. If the database is down, the forms still work and still send to Telegram.

Local test: `node scripts/dev-server.mjs` (uses a throw-away SQLite file). Tests: `node --test test/auth.test.js test/admin.test.js`.
