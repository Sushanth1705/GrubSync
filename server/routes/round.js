const express = require('express');
const router = express.Router();
const {
  createRound,
  getRoundDetails,
  joinRound,
  updateStatus,
  enterBill,
  getMyHistory
} = require('../controllers/roundController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRound);
router.get('/history/me', protect, getMyHistory);
router.get('/:roomCode', protect, getRoundDetails);
router.post('/:roomCode/join', protect, joinRound);
router.patch('/:roomCode/status', protect, updateStatus);
router.patch('/:roomCode/bill', protect, enterBill);

module.exports = router;
