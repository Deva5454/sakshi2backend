const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

const CompanyRouter = require("./companyName.routes");
const StaffRouter = require("./staff.routes");
const AccountMasterRouter = require("./accountMaster.routes");
const AssignTaskRouter = require("./assignTask.routes");
const Order = require("./order.routes");
const Lead = require("./lead.routes");
const Purchase = require("./purchase.routes");
const productItem = require("./productItem.routes");
const Inventory = require("./inventory.routes");
const fileUpload = require("./filesUpload.routes");
const status =  require("./status.routes");
const Roles = require("./role.routes");
const filedownloadRouter = require("./fileDownload.routes");
const MaterialRouter = require("./material.routes");
const RoleDepartmentRouter = require("./roleDepartment.routes");
const RoleDepartmentCompanyRouter = require("./roleDepartmentCompany.routes");
const performanceInvoiceRoutes = require("./performanceInvoice.route");
const Vendor = require("./vendor.routes");

// SECURITY: previously, most route files below had no authentication
// middleware at all, meaning almost every endpoint (orders, purchases,
// accounts, vendors, staff records, etc.) was readable and writable by
// anyone on the internet with no login required. This blanket gate closes
// that gap by requiring a valid JWT for every /api/* request except the
// login endpoint itself (which obviously must stay public — that's how you
// get a token in the first place).
const PUBLIC_PATHS = new Set(["/staff/login"]);

router.use((req, res, next) => {
  if (PUBLIC_PATHS.has(req.path)) {
    return next();
  }
  return authenticateToken(req, res, next);
});

router.use("/company", CompanyRouter);
router.use("/staff", StaffRouter);
router.use("/account-master", AccountMasterRouter);
router.use("/assign-task", AssignTaskRouter);
router.use("/orders", Order);
router.use("/lead", Lead);
router.use("/purchase", Purchase);
router.use("/inventory", Inventory);
router.use("/vendor", Vendor);
router.use("/productItem", productItem);
router.use("/fileUpload",fileUpload);
router.use("/status",status);
router.use("/role",Roles);
router.use("/filedownload",filedownloadRouter);
router.use("/material",MaterialRouter);
router.use("/roleDepartment",RoleDepartmentRouter);
router.use("/roleDepartmentCompany",RoleDepartmentCompanyRouter);
router.use("/performance-invoice", performanceInvoiceRoutes);
module.exports = router;
