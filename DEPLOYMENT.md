# Deploying the Sakshi Creation backend

This backend stays on **MongoDB** (via MongoDB Atlas) for its database, uses
**Supabase Storage** only for uploaded files, and runs as a normal long-lived
Node/Express server on **Render** (Railway works the same way if you prefer
it instead).

## What changed in this codebase

- `middleware/fileUpload.js`, `controllers/fileUploadController.js`,
  `controllers/fileDownloadController.js`: file uploads/downloads now go
  through Supabase Storage instead of the local `uploads/` folder. This is
  required because Render's (and most PaaS) filesystems are ephemeral —
  anything written to local disk disappears on redeploy/restart, and isn't
  shared across instances.
- `db/connectDB.js`: now logs a real error if the Mongo connection fails,
  instead of silently swallowing it.
- `app.js`: added a `/healthz` endpoint (useful for Render's health checks)
  and made sure the local `uploads/` scratch folder (used only briefly by
  the CSV/Excel bulk-import endpoints) exists on boot.
- Added `lib/supabaseClient.js` and the `@supabase/supabase-js` dependency.
- Added `.env.example` listing every environment variable the app needs.

Nothing about your data model changed — all Mongoose models/controllers are
untouched.

---

## 1. Push this code to GitHub

```bash
cd sakshi-creation-backend-main
git init                     # skip if already a git repo
git add .
git commit -m "Prepare backend for Render + Supabase storage"
git branch -M main
git remote add origin https://github.com/<your-username>/sakshi-creation-backend.git
git push -u origin main
```

## 2. Set up MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. Database Access → add a database user (username/password).
3. Network Access → add IP address `0.0.0.0/0` (allow from anywhere) — Render's
   outbound IPs aren't static on the free tier, so this is the simplest option.
4. Get your connection string (Connect → Drivers), it looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/sakshi?retryWrites=true&w=majority`
   This is your `MONGO_URI`.

## 3. Set up Supabase (Storage only)

1. Create a project at https://supabase.com.
2. Go to **Storage** → create a new bucket, e.g. `sakshi-uploads`, and mark it
   **Public** (so uploaded files/images can be viewed directly via URL).
3. Go to **Project Settings → API**. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (NOT the `anon` key — this one bypasses row-level
     security and must only ever be used server-side) → `SUPABASE_SERVICE_ROLE_KEY`
4. Set `SUPABASE_BUCKET` to whatever you named the bucket (e.g. `sakshi-uploads`).

## 4. Deploy the backend to Render

1. https://render.com → New → Web Service → connect your GitHub repo.
2. Settings:
   - **Root directory**: leave blank (repo root is the backend)
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Health check path**: `/healthz`
3. Add environment variables (Render dashboard → Environment), same as
   `.env.example`:

   | Key | Value |
   |---|---|
   | `PORT` | Render sets this automatically — you can omit it |
   | `MONGO_URI` | from step 2 |
   | `JWT_SECRET` | any long random string |
   | `CORS_ORIGIN` | your Vercel frontend URL, e.g. `https://sakshi-creation.vercel.app` (comma-separate multiple) |
   | `BACK_URL` | your Render URL once assigned, e.g. `https://sakshi-backend.onrender.com` |
   | `SUPABASE_URL` | from step 3 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 3 |
   | `SUPABASE_BUCKET` | from step 3 |

4. Deploy. Once live, note the Render URL — you'll need it for the frontend's
   `NEXT_PUBLIC_API_URL`.

> Railway works almost identically: create a project from your GitHub repo,
> it auto-detects Node, set the same env vars, and it'll assign a public URL.

## 5. After the frontend is deployed

Once you have your real Vercel URL, come back to Render and update
`CORS_ORIGIN` to that URL, then redeploy (or Render will auto-redeploy on env
var change). Without this, the browser will block API calls from your
frontend with a CORS error.

## Troubleshooting

- **"Database connection error" in logs** → check `MONGO_URI` is correct and
  that Atlas Network Access allows `0.0.0.0/0`.
- **File uploads fail with "File storage is not configured"** → double check
  `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are set exactly as shown in
  Supabase's dashboard (no extra quotes/spaces).
- **CORS errors in the browser console** → `CORS_ORIGIN` on Render must
  exactly match your Vercel URL (protocol + domain, no trailing slash).
- **Uploaded images/files 404 when viewed** → confirm the Supabase bucket is
  set to **Public**; private buckets need signed URLs, which this code
  doesn't currently generate.
