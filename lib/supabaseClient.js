const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. File upload/download endpoints will fail until these are configured."
  );
}

// Server-side client using the service role key (never expose this key to the frontend).
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

// Name of the storage bucket used for all app file uploads.
// Create this bucket (as "public") in your Supabase project before deploying.
const BUCKET_NAME = process.env.SUPABASE_BUCKET || "sakshi-uploads";

module.exports = { supabase, BUCKET_NAME };
