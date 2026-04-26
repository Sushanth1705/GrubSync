const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantName: { type: String },
  status: { 
    type: String, 
    enum: ["open", "ordering", "ordered", "settled"], 
    default: "open" 
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  finalBillTotal: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Round', roundSchema);
