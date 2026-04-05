const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest' },
    exitTime: { type: Date, default: Date.now },
    entryTime: { type: Date }, // Jab wapas aayega tab fill hoga
    status: { type: String, default: 'Out' } // Out ya In
});

module.exports = mongoose.model('Movement', movementSchema);