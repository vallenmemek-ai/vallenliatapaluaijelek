# VALLEN Admin Console

Web panel buat manage license key mod VALLEN. Next.js + Vercel Postgres, deploy ke Vercel.

## Fitur
- Login admin (1 password).
- Generate key (durasi 1 / 7 / 30 hari), key format `VALLEN-XXXX-XXXX-XXXX`.
- 1 key = 1 device (bind ANDROID_ID pas validasi pertama).
- Revoke key, filter (active/expired/revoked), search.
- Halaman Devices (device yang bind), Activity (log), Settings (test validasi + info integrasi).
- API `/api/validate` buat mod client (rate-limited).
- Cache offline 24 jam di sisi mod (lihat integrasi).

## Struktur
```
app/
  layout.jsx, globals.css        # root + design tokens
  page.jsx                       # login
  (panel)/
    layout.jsx                   # auth guard + shell
    dashboard/                   # manage keys
    devices/  activity/  settings/
  api/
    validate/route.js            # mod client
    admin/login|logout|keys|activity/
components/                      # Sidebar, Topbar, KeysTable, GenerateModal, Badge, Toast, LoginForm
lib/                             # store (Postgres/JSON), auth, keys, status
schema.sql                       # Postgres schema
```

## Dev (tanpa database)
```bash
npm install
npm run dev
```
Buka http://localhost:3000 — login `vallen123`. Tanpa `POSTGRES_URL`, data disimpan di `data/keys.json` (dev only).

## Deploy Vercel
1. Push repo ke GitHub.
2. Import ke Vercel (framework auto-detect Next.js).
3. Add **Vercel Postgres** database (otomatis set `POSTGRES_URL`).
4. Set env vars: `ADMIN_PASSWORD` (ganti!), `SESSION_SECRET` (random panjang).
5. Deploy. Schema dibikin otomatis pas first request.

## Integrasi Mod (C++)
Mod kirim POST pas start:
```
POST https://<domain>/api/validate
Content-Type: application/json
{ "key": "VALLEN-...", "device_id": "<android_id>" }
```
Response sukses: `{ "ok": true, "expires_at": 1735689600000, "label": "..." }`
Gagal: `{ "ok": false, "reason": "invalid|expired|revoked|device_mismatch|rate_limited" }`

Mod cache hasil validasi lokal (`/data/local/tmp/.vallen_lic`) buat offline grace 24 jam.

## Security
- Key di-hash SHA256 buat lookup; plain key disimpan buat admin copy.
- Admin password + session secret di env (jangan default di production).
- Session cookie HMAC-signed, httpOnly, 7 hari.
- Rate-limit validate 30 req/menit per IP.
