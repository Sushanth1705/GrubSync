const Round = require('../models/Round');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const calculateSplit = require('../utils/billCalculator');

// @desc    Get calculated bill split for all members
// @route   GET /api/bill/:roundId
// @access  Private
const getBillSplit = async (req, res) => {
  try {
    const round = await Round.findById(req.params.roundId).populate('members', 'name avatar');
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    const orders = await OrderItem.find({ roundId: req.params.roundId });

    // Calculate dynamic split based on current orders + fees
    const splits = calculateSplit(
      round.members, 
      orders, 
      round.finalBillTotal, 
      round.deliveryFee, 
      round.taxes
    );

    // Sync with DB: Create or update Payment records
    for (const split of splits) {
      await Payment.findOneAndUpdate(
        { roundId: round._id, userId: split.userId },
        { amountOwed: split.amountOwed },
        { upsert: true, new: true }
      );
    }

    // Fetch full payment statuses
    const payments = await Payment.find({ roundId: round._id }).populate('userId', 'name avatar upiId');
    
    res.status(200).json({ 
      roundInfo: {
        finalBillTotal: round.finalBillTotal,
        deliveryFee: round.deliveryFee,
        taxes: round.taxes
      },
      payments 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark yourself as paid
// @route   PATCH /api/bill/:roundId/pay
// @access  Private
const payBill = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      roundId: req.params.roundId,
      userId: req.user._id
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    payment.status = 'paid';
    payment.paidAt = Date.now();
    payment.amountPaid = payment.amountOwed; // Assuming full payment
    await payment.save();

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Host confirms payment received
// @route   PATCH /api/bill/:roundId/confirm/:userId
// @access  Private (Host only)
const confirmPayment = async (req, res) => {
  try {
    const round = await Round.findById(req.params.roundId);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    if (round.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can confirm payments' });
    }

    const payment = await Payment.findOne({
      roundId: req.params.roundId,
      userId: req.params.userId
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    payment.status = 'confirmed';
    await payment.save();

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBillSplit,
  payBill,
  confirmPayment
};
