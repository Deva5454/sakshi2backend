const multer = require("multer");

// Files are kept in memory as buffers and streamed straight to Supabase
// Storage in the controller — nothing is written to local disk. This is
// required for hosts with ephemeral/read-only filesystems, and keeps files
// consistent across multiple backend instances/restarts.
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow all file types for now, you can add restrictions here
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit per file
    files: 10, // Maximum 10 files at once
  },
});

module.exports = upload;
