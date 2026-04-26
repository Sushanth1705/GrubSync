const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Round', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amountOwed: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ["pending", "paid", "confirmed"], 
    default: "pending" 
  },
  paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
