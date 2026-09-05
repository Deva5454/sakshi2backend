const path = require("path");
const { supabase, BUCKET_NAME } = require("../lib/supabaseClient");

const CONTENT_TYPE_MAP = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
};

// Normalizes whatever the frontend sends (a full Supabase URL, a legacy
// "/uploads/folder/file.ext" path, or a bare "folder/file.ext" path) down to
// a storage path relative to the bucket.
function toStoragePath(rawPath) {
  const decoded = decodeURIComponent(rawPath);

  if (decoded.startsWith("http")) {
    const marker = `/${BUCKET_NAME}/`;
    const idx = decoded.indexOf(marker);
    if (idx !== -1) {
      return decoded.slice(idx + marker.length);
    }
    return null; // external URL, not one of our storage files
  }

  return decoded.replace(/^\/?uploads\//, "").replace(/^\/+/, "");
}

exports.downloadFile = async (req, res) => {
  try {
    const { filePath, view } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: "File path is required",
      });
    }

    const decoded = decodeURIComponent(filePath);

    // Case 1: fully external URL not hosted in our Supabase bucket — just
    // redirect/fetch it directly.
    if (decoded.startsWith("http") && toStoragePath(decoded) === null) {
      const upstream = await fetch(decoded);
      if (!upstream.ok) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }
      const buffer = Buffer.from(await upstream.arrayBuffer());
      const fileName = path.basename(new URL(decoded).pathname);
      const ext = path.extname(fileName).toLowerCase();
      res.setHeader(
        "Content-Type",
        upstream.headers.get("content-type") ||
          CONTENT_TYPE_MAP[ext] ||
          "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        `${view === "true" ? "inline" : "attachment"}; filename="${fileName}"`
      );
      return res.send(buffer);
    }

    // Case 2: file lives in our Supabase Storage bucket.
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "File storage is not configured.",
      });
    }

    const storagePath = toStoragePath(decoded);
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const fileName = path.basename(storagePath);
    const ext = path.extname(fileName).toLowerCase();

    res.setHeader(
      "Content-Type",
      data.type || CONTENT_TYPE_MAP[ext] || "application/octet-stream"
    );
    res.setHeader("Content-Length", buffer.length);
    res.setHeader(
      "Content-Disposition",
      `${view === "true" ? "inline" : "attachment"}; filename="${fileName}"`
    );

    res.send(buffer);
  } catch (error) {
    console.error("❌ Download error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "File download failed",
        error: error.message,
      });
    }
  }
};

// Get file info
exports.getFileInfo = async (req, res) => {
  try {
    const { filePath } = req.params;
    const storagePath = toStoragePath(filePath);

    if (!supabase || !storagePath) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const folder = path.dirname(storagePath);
    const fileName = path.basename(storagePath);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder === "." ? "" : folder, { search: fileName });

    const fileEntry = data && data.find((f) => f.name === fileName);

    if (error || !fileEntry) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        fileName,
        filePath: storagePath,
        size: fileEntry.metadata?.size,
        extension: path.extname(fileName).toLowerCase(),
        createdAt: fileEntry.created_at,
        modifiedAt: fileEntry.updated_at,
        isFile: true,
        isDirectory: false,
      },
    });
  } catch (error) {
    console.error("❌ Get file info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get file info",
      error: error.message,
    });
  }
};

// List files in a "directory" (folder) of the bucket
exports.listFiles = async (req, res) => {
  try {
    const { directory } = req.params || { directory: "" };

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "File storage is not configured.",
      });
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(directory || "", { limit: 1000 });

    if (error) {
      return res.status(404).json({
        success: false,
        message: "Directory not found",
      });
    }

    const fileList = (data || []).map((entry) => ({
      name: entry.name,
      path: directory ? `${directory}/${entry.name}` : entry.name,
      isFile: entry.id !== null,
      isDirectory: entry.id === null,
      size: entry.metadata?.size,
      createdAt: entry.created_at,
      modifiedAt: entry.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        directory: directory || "",
        files: fileList,
        totalFiles: fileList.filter((f) => f.isFile).length,
        totalDirectories: fileList.filter((f) => f.isDirectory).length,
      },
    });
  } catch (error) {
    console.error("❌ List files error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list files",
      error: error.message,
    });
  }
};
