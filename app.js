require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./db/connectDB");
const createError = require("http-errors");

const app = express();

// Baseline HTTP security headers (X-Frame-Options, X-Content-Type-Options,
// etc). Safe no-op for a JSON API; disable CSP since this server doesn't
// serve the frontend's HTML.
app.use(helmet({ contentSecurityPolicy: false }));

// Ensure the local "uploads" scratch directory exists. This is only used as
// a short-lived staging area for CSV/Excel bulk-import endpoints (the files
// are parsed and deleted immediately) — persistent file storage lives in
// Supabase Storage, not on local disk, since the filesystem here may be
// ephemeral and is not shared across instances.
const scratchUploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(scratchUploadsDir)) {
  fs.mkdirSync(scratchUploadsDir, { recursive: true });
}


// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));

// Define allowed origins
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:3000"];

// Apply CORS middleware globally
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// // Middleware to add CORS headers for static files
// app.use("/uploads", (req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000"); // Explicitly allow the frontend origin
//   res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
//   next();
// });

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require("./middleware/sanitizeInput"));
app.use(express.static(path.join(__dirname, "public")));

const AllRoutes = require("./routes/index");
app.use("/api", AllRoutes);

app.get("/", (request, response) => {
  response.send("sakshi creation api is working .....111!");
});

// Health check endpoint used by hosting platforms (Render/Railway) to verify
// the service is up.
app.get("/healthz", (request, response) => {
  response.status(200).json({ status: "ok" });
});

connectDB();



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// SECURITY: the previous handler used res.render("error"), an EJS view that
// prints the raw error stack trace into the HTML response
// (`<pre><%= error.stack %></pre>`) whenever NODE_ENV isn't exactly
// "production". Since this env var was never explicitly set on the hosting
// platform, Express was defaulting to development mode — meaning any
// unhandled server error leaked internal file paths and stack traces to
// whoever triggered it. This also makes far more sense for an API-only
// backend: the frontend expects JSON error bodies, not an HTML page.
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  console.error(`❌ [${status}]`, err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }
  res.status(status).json({
    success: false,
    message: status === 404 ? "Not found" : "Something went wrong",
  });
});

module.exports = app;