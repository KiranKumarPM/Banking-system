const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get current balance
async function getBalance(req, res) {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json({ balance: user.balance });
    } catch (err) {
        console.error('Get balance error', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// Make a transfer or bill payment (now supports peer transfers and billers)
async function makeTransfer(req, res) {
    try {
        const { userId, type, amount, recipientName, merchant, note } = req.body;
        if (!userId || !type || !amount) {
            return res.status(400).json({ message: 'userId, type, and amount are required' });
        }
        if (!['transfer', 'bill'].includes(type)) {
            return res.status(400).json({ message: 'Invalid type' });
        }
        const numericAmount = Number(amount);
        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.balance < numericAmount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Debit sender
        user.balance -= numericAmount;
        await user.save();

        let debitRecord;
        if (type === 'transfer' && recipientName) {
            const recipient = await User.findOne({ name: recipientName.trim() });
            if (!recipient) {
                return res.status(400).json({ message: 'Recipient not found' });
            }
            recipient.balance += numericAmount;
            await recipient.save();

            // Write enriched details: from/to ids and names
            const now = new Date();
            const dateIST = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            debitRecord = await Transaction.create({
                userId: user._id,
                fromUserId: user._id,
                fromName: user.name,
                toUserId: recipient._id,
                toName: recipient.name,
                type: 'transfer',
                amount: numericAmount,
                date: now,
                dateIST,
                note,
            });
        } else if (type === 'bill') {
            const now = new Date();
            const dateIST = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            debitRecord = await Transaction.create({
                userId: user._id,
                fromUserId: user._id,
                fromName: user.name,
                type: 'bill',
                amount: numericAmount,
                date: now,
                dateIST,
                merchant: merchant || 'Biller',
                note,
            });
        } else {
            // Backward compatibility: simple transfer without a specified recipient
            const now = new Date();
            const dateIST = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            debitRecord = await Transaction.create({
                userId: user._id,
                fromUserId: user._id,
                fromName: user.name,
                type,
                amount: numericAmount,
                date: now,
                dateIST,
                note,
            });
        }

        return res.status(201).json({
            message: 'Transaction successful',
            receipt: {
                transactionId: debitRecord._id,
                userId: user._id,
                type: debitRecord.type,
                amount: debitRecord.amount,
                date: debitRecord.date,
                dateIST: debitRecord.date ? new Date(debitRecord.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
                balanceAfter: user.balance,
                recipientCredited: null,
                from: { id: debitRecord.fromUserId || user._id, name: debitRecord.fromName || user.name },
                to: debitRecord.toUserId ? { id: debitRecord.toUserId, name: debitRecord.toName || null } : null,
                merchant: debitRecord.merchant || null,
                note: debitRecord.note || null,
            },
        });
    } catch (err) {
        console.error('Transfer error', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// Get last 5 transactions
async function getMiniStatement(req, res) {
    try {
        const { userId } = req.params;
        const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(5);
        return res.json({
            transactions: transactions.map((t) => ({
                _id: t._id,
                userId: t.userId,
                type: t.type,
                amount: t.amount,
                date: t.date,
                dateIST: t.date ? new Date(t.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
                fromUserId: t.fromUserId || null,
                fromName: t.fromName || null,
                toUserId: t.toUserId || null,
                toName: t.toName || null,
                merchant: t.merchant || null,
                note: t.note || null,
            })),
        });
    } catch (err) {
        console.error('Statement error', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { getBalance, makeTransfer, getMiniStatement };

// Get all transactions for a user (not just mini statement)
async function getAllTransactions(req, res) {
    try {
        const { userId } = req.params;
        const transactions = await Transaction.find({ userId }).sort({ date: -1 });
        return res.json({
            transactions: transactions.map((t) => ({
                _id: t._id,
                userId: t.userId,
                type: t.type,
                amount: t.amount,
                date: t.date,
                dateIST: t.dateIST || (t.date ? new Date(t.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null),
                fromUserId: t.fromUserId || null,
                fromName: t.fromName || null,
                toUserId: t.toUserId || null,
                toName: t.toName || null,
                merchant: t.merchant || null,
                note: t.note || null,
            })),
        });
    } catch (err) {
        console.error('Get all transactions error', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// Get specific transaction by ID
async function getTransactionById(req, res) {
    try {
        const { transactionId } = req.params;
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        return res.json({
            transaction: {
                _id: transaction._id,
                userId: transaction.userId,
                type: transaction.type,
                amount: transaction.amount,
                date: transaction.date,
                dateIST: transaction.dateIST || (transaction.date ? new Date(transaction.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null),
                fromUserId: transaction.fromUserId || null,
                fromName: transaction.fromName || null,
                toUserId: transaction.toUserId || null,
                toName: transaction.toName || null,
                merchant: transaction.merchant || null,
                note: transaction.note || null,
            },
        });
    } catch (err) {
        console.error('Get transaction by ID error', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports.getAllTransactions = getAllTransactions;
module.exports.getTransactionById = getTransactionById;


