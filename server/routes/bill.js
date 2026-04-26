const express = require('express');
const router = express.Router();
const {
  getBillSplit,
  payBill,
  confirmPayment
} = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:roundId', protect, getBillSplit);
router.patch('/:roundId/pay', protect, payBill);
router.patch('/:roundId/confirm/:userId', protect, confirmPayment);

module.exports = router;
