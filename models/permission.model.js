const mongoose = require("mongoose");

// Reusable schema for permission actions
const permissionSchema = new mongoose.Schema(
  {
    account_master: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    assign_task: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    party_call: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    all_orders: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    quality_packaging: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    proforma_invoice: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    reports: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    inventory: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    purchase: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    task:{
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    history:{
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    designer_task: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    printer_task: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    blinder_task: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    booklet_blinder_task: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    setup: {
      view_global: { type: Boolean },
      view_own: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
  },
  { _id: false } // prevents automatic _id for subdocuments
);

module.exports = permissionSchema;
