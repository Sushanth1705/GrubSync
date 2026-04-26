const Round = require('../models/Round');
const User = require('../models/User');
const generateRoomCode = require('../utils/generateRoomCode');

// @desc    Create a new round
// @route   POST /api/rounds
// @access  Private
const createRound = async (req, res) => {
  try {
    const { restaurantName } = req.body;
    
    let roomCode;
    let codeExists = true;
    while(codeExists) {
      roomCode = generateRoomCode();
      const existingRound = await Round.findOne({ roomCode });
      if (!existingRound) {
        codeExists = false;
      }
    }

    const round = await Round.create({
      roomCode,
      host: req.user._id,
      restaurantName,
      members: [req.user._id]
    });

    // Update the user's joined rounds
    await User.findByIdAndUpdate(req.user._id, {
      $push: { roundsJoined: round._id }
    });

    res.status(201).json(round);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get round details
// @route   GET /api/rounds/:roomCode
// @access  Private
const getRoundDetails = async (req, res) => {
  try {
    const round = await Round.findOne({ roomCode: req.params.roomCode })
      .populate('host', 'name email avatar upiId')
      .populate('members', 'name email avatar');

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    res.status(200).json(round);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a round
// @route   POST /api/rounds/:roomCode/join
// @access  Private
const joinRound = async (req, res) => {
  try {
    const round = await Round.findOne({ roomCode: req.params.roomCode });

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    if (!round.members.includes(req.user._id)) {
      round.members.push(req.user._id);
      await round.save();

      await User.findByIdAndUpdate(req.user._id, {
        $push: { roundsJoined: round._id }
      });
    }

    res.status(200).json(round);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update round status
// @route   PATCH /api/rounds/:roomCode/status
// @access  Private (Host only)
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const round = await Round.findOne({ roomCode: req.params.roomCode });

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    if (round.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can update status' });
    }

    round.status = status;
    await round.save();

    res.status(200).json(round);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enter final bill total
// @route   PATCH /api/rounds/:roomCode/bill
// @access  Private (Host only)
const enterBill = async (req, res) => {
  try {
    const { finalBillTotal, deliveryFee, taxes } = req.body;
    const round = await Round.findOne({ roomCode: req.params.roomCode });

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    if (round.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can update bill' });
    }

    round.finalBillTotal = finalBillTotal || round.finalBillTotal;
    round.deliveryFee = deliveryFee || round.deliveryFee;
    round.taxes = taxes || round.taxes;
    
    await round.save();

    res.status(200).json(round);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's past rounds
// @route   GET /api/rounds/history/me
// @access  Private
const getMyHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'roundsJoined',
      populate: { path: 'host', select: 'name avatar' },
      options: { sort: { createdAt: -1 } }
    });

    res.status(200).json(user.roundsJoined);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRound,
  getRoundDetails,
  joinRound,
  updateStatus,
  enterBill,
  getMyHistory
};
