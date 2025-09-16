const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        pin: { type: String, required: true }, // For simplicity; in production hash this
        balance: { type: Number, required: true, default: 1000 },
        // Stored IST timestamps (for reporting convenience)
        createdAtIST: { type: String },
        updatedAtIST: { type: String },
    },
    { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// Maintain IST representations on create/update
userSchema.pre('save', function (next) {
    try {
        const now = this.isNew ? this.createdAt || new Date() : this.updatedAt || new Date();
        const ist = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        if (this.isNew) {
            this.createdAtIST = ist;
        }
        this.updatedAtIST = ist;
        next();
    } catch (e) {
        next(e);
    }
});

module.exports = mongoose.model('User', userSchema);


