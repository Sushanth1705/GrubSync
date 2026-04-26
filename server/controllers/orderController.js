const OrderItem = require('../models/OrderItem');
const Round = require('../models/Round');

// @desc    Add item to round
// @route   POST /api/orders/:roundId
// @access  Private
const addItem = async (req, res) => {
  try {
    const { itemName, quantity, price } = req.body;
    
    // Check if round exists and user is a member
    const round = await Round.findById(req.params.roundId);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }
    if (!round.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Must join round to add items' });
    }
    if (round.status !== 'open' && round.status !== 'ordering') {
      return res.status(400).json({ message: 'Ordering is closed for this round' });
    }

    const orderItem = await OrderItem.create({
      roundId: req.params.roundId,
      userId: req.user._id,
      itemName,
      quantity,
      price
    });

    res.status(201).json(orderItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit an item
// @route   PUT /api/orders/:orderId
// @access  Private
const editItem = async (req, res) => {
  try {
    const { itemName, quantity, price } = req.body;
    const orderItem = await OrderItem.findById(req.params.orderId);

    if (!orderItem) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    if (orderItem.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this item' });
    }

    const round = await Round.findById(orderItem.roundId);
    if (round.status !== 'open' && round.status !== 'ordering') {
      return res.status(400).json({ message: 'Ordering is closed' });
    }

    orderItem.itemName = itemName || orderItem.itemName;
    orderItem.quantity = quantity || orderItem.quantity;
    orderItem.price = price || orderItem.price;

    await orderItem.save();
    res.status(200).json(orderItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove an item
// @route   DELETE /api/orders/:orderId
// @access  Private
const removeItem = async (req, res) => {
  try {
    const orderItem = await OrderItem.findById(req.params.orderId);

    if (!orderItem) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    if (orderItem.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    const round = await Round.findById(orderItem.roundId);
    if (round.status !== 'open' && round.status !== 'ordering') {
      return res.status(400).json({ message: 'Ordering is closed' });
    }

    await orderItem.deleteOne();
    res.status(200).json({ id: req.params.orderId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all items in a round
// @route   GET /api/orders/:roundId
// @access  Private
const getItems = async (req, res) => {
  try {
    const items = await OrderItem.find({ roundId: req.params.roundId }).populate('userId', 'name avatar');
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addItem,
  editItem,
  removeItem,
  getItems
};
