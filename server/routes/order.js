const express = require('express');
const router = express.Router();
const {
  addItem,
  editItem,
  removeItem,
  getItems
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:roundId', protect, getItems);
router.post('/:roundId', protect, addItem);
router.put('/:orderId', protect, editItem);
router.delete('/:orderId', protect, removeItem);

module.exports = router;
