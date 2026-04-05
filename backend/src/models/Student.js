const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'student' },
    roomNo: { type: String, default: 'Not Assigned' },
    feesStatus: { type: String, default: 'Unpaid' },
    collegeName: { type: String, default: '-' },
    mobile: { type: String, default: '-' },
    fatherName: { type: String, default: '-' },
    motherName: { type: String, default: '-' },
    address: { type: String, default: '-' }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);