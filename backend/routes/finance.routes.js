const express = require('express');
const router = express.Router();
const { getTransactions, createTransaction, deleteTransaction } = require('../controllers/finance.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTransactions);
router.post('/', protect, createTransaction);
router.delete('/:id', protect, deleteTransaction);

module.exports = router;