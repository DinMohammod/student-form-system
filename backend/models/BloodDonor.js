const mongoose = require('mongoose');

const bloodDonorSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        required: true,
        unique: true
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Rather not say'],
        required: true
    },
    hasDonatedBefore: {
        type: Boolean,
        required: true
    },
    lastDonationDate: {
        type: Date,
        default: null
    },
    nextAvailableDate: {
        type: Date,
        default: null
    },
    isAvailable: {
        type: Boolean,
        default: null
    },
    wantsToBeDonor: {
        type: Boolean,
        default: null
    }
}, {
    timestamps: true // এটাই createdAt, updatedAt Automatic ভাবে যোগ করে দেয়
});

module.exports = mongoose.model('BloodDonor', bloodDonorSchema);