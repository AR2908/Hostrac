const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
    // Original link (Ye student delete hone par null ho jayega)
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    
    // --- BACKUP FIELDS (Zaroori badlav) ---
    // Inhe hum application ke time hi bhar denge taaki record hamesha rahe
    studentName: { type: String }, 
    roomNo: { type: String },

    reason: { type: String, required: true },
    leaveDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    exitTime: { type: Date }, 
    entryTime: { type: Date },
    gateStatus: { type: String, enum: ['In', 'Out'], default: 'In' }
}, { timestamps: true }); // timestamps se sorting aasan ho jati hai

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);