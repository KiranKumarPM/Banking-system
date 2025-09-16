const express = require('express');
const router = express.Router();
const {
    getBalance,
    makeTransfer,
    getMiniStatement,
    getAllTransactions,
    getTransactionById,
} = require('../controllers/transactionController');

// GET /api/transactions/balance/:userId
router.get('/balance/:userId', getBalance);

// POST /api/transactions/transfer
router.post('/transfer', makeTransfer);

// GET /api/transactions/statement/:userId
router.get('/statement/:userId', getMiniStatement);

// GET /api/transactions/all/:userId
router.get('/all/:userId', getAllTransactions);

// GET /api/transactions/lookup/:transactionId
router.get('/lookup/:transactionId', getTransactionById);

module.exports = router;


