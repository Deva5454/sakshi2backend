const mongoose = require("mongoose")
const baseStatusSchema = require("./BaseStatus.model")

const orderStatusSchema = baseStatusSchema.clone()

orderStatusSchema.add({
  statusType: {
    type: String,
    default: "order",
    immutable: true, 
  },
})

orderStatusSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany({ _id: { $ne: this._id }, isDefault: true }, { $set: { isDefault: false } })
  }
  next()
})

const OrderStatus = mongoose.model("OrderStatus", orderStatusSchema)

module.exports = OrderStatus
