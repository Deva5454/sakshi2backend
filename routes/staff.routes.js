const express = require("express");
const StaffController = require("../controllers/staff.controller");
const { authenticateToken } = require("../middleware/auth");
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Without this, the login endpoint had no limit on attempts at all — anyone
// could script through thousands of password guesses per minute against any
// known email address. This caps it to 10 attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in a few minutes.",
  },
});

router.post("/create", StaffController.createStaff);

router.get("/getall", StaffController.getStaff);

router.get("/getbyid/:id", StaffController.getStaffById);

router.patch("/update/:id", StaffController.updateStaff);

router.patch("/updatestatus/:id", StaffController.updateStaffStatus);

router.delete("/delete/:id", StaffController.deleteStaff);

router.post("/login", loginLimiter, StaffController.loginStaff);

router.post("/getrol", StaffController.getrol);

router.post(
  "/bulk",
  upload.fields([{ name: "file", maxCount: 1 }]),
  StaffController.bulkCreateStaff
);
router.patch(
  "/updatepassword/:id",
  authenticateToken,
  StaffController.updateStaffPassword
);
router.get("/permissions/:id", StaffController.getStaffPermission);
module.exports = router;
