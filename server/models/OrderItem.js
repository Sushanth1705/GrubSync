const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Round', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);
