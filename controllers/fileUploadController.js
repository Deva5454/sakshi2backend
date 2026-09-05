const { supabase, BUCKET_NAME } = require("../lib/supabaseClient");

function sanitizeFolder(folder) {
  return (folder || "general").toString().replace(/^\/+|\/+$/g, "");
}

function buildStorageFilename(originalname) {
  const dotIndex = originalname.lastIndexOf(".");
  const ext = dotIndex !== -1 ? originalname.slice(dotIndex) : "";
  const base =
    dotIndex !== -1 ? originalname.slice(0, dotIndex) : originalname;
  const safeBase = base.replace(/[^a-zA-Z0-9-_]/g, "_");
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  return `${safeBase}-${uniqueSuffix}${ext}`;
}

async function uploadBufferToSupabase(file, folderName) {
  const storageFilename = buildStorageFilename(file.originalname);
  const storagePath = `${folderName}/${storageFilename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    filename: storageFilename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    folder: folderName,
    url: publicUrlData.publicUrl,
    path: publicUrlData.publicUrl, // kept for backward-compatibility with existing frontend code
    storagePath,
  };
}

// Upload single file
exports.uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message:
          "File storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      });
    }

    const folderName = sanitizeFolder(req.body.folder);
    const data = await uploadBufferToSupabase(req.file, folderName);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data,
    });
  } catch (error) {
    console.error("❌ File upload error:", error);
    res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error.message,
    });
  }
};

// Upload multiple files
exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message:
          "File storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      });
    }

    const folderName = sanitizeFolder(req.body.folder);

    const uploadedFiles = await Promise.all(
      req.files.map((file) => uploadBufferToSupabase(file, folderName))
    );

    res.status(200).json({
      success: true,
      message: `${req.files.length} files uploaded successfully to ${folderName} folder`,
      data: uploadedFiles,
    });
  } catch (error) {
    console.error("❌ Multiple file upload error:", error);
    res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error.message,
    });
  }
};

// Delete file. Accepts either the storage path (folder/filename) or a full
// public Supabase URL for :filename (URL-encoded by the caller).
exports.deleteFile = async (req, res) => {
  try {
    const { folder, filename } = req.params;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "File storage is not configured.",
      });
    }

    const decodedFilename = decodeURIComponent(filename);
    // Support passing a full public URL as `filename` as well as a plain name
    const storagePath = decodedFilename.includes(`/${BUCKET_NAME}/`)
      ? decodedFilename.split(`/${BUCKET_NAME}/`)[1]
      : `${folder}/${decodedFilename}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      return res.status(404).json({
        success: false,
        message: "File not found or could not be deleted",
        error: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("❌ File delete error:", error);
    res.status(500).json({
      success: false,
      message: "File deletion failed",
      error: error.message,
    });
  }
};

// Get file info
exports.getFileInfo = async (req, res) => {
  try {
    const { folder, filename } = req.params;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "File storage is not configured.",
      });
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, { search: filename });

    const fileEntry = data && data.find((f) => f.name === filename);

    if (error || !fileEntry) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`${folder}/${filename}`);

    res.status(200).json({
      success: true,
      data: {
        filename,
        folder,
        size: fileEntry.metadata?.size,
        url: publicUrlData.publicUrl,
        path: publicUrlData.publicUrl,
        createdAt: fileEntry.created_at,
        modifiedAt: fileEntry.updated_at,
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

// List all folders and files (for debugging)
exports.listUploads = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "File storage is not configured.",
      });
    }

    const { data: rootEntries, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list("", { limit: 1000 });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to list uploads",
        error: error.message,
      });
    }

    // Entries without an `id` are "folders" in Supabase Storage's virtual filesystem
    const folderEntries = (rootEntries || []).filter((e) => e.id === null);

    const folders = await Promise.all(
      folderEntries.map(async (folderEntry) => {
        const { data: files } = await supabase.storage
          .from(BUCKET_NAME)
          .list(folderEntry.name, { limit: 1000 });

        return {
          folder: folderEntry.name,
          fileCount: (files || []).length,
          files: (files || []).map((f) => f.name),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalFolders: folders.length,
        folders,
      },
    });
  } catch (error) {
    console.error("❌ List uploads error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list uploads",
      error: error.message,
    });
  }
};
