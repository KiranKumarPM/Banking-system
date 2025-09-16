const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        // Enriched provenance/destination details (non-breaking additions)
        fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        fromName: { type: String, trim: true },
        type: { type: String, enum: ['transfer', 'bill', 'credit'], required: true },
        amount: { type: Number, required: true, min: 1 },
        date: { type: Date, default: Date.now },
        dateIST: { type: String },
        toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        toName: { type: String, trim: true },
        merchant: { type: String },
        note: { type: String },
    },
    { timestamps: false }
);

module.exports = mongoose.model('Transaction', transactionSchema);


