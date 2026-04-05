const mongoose = require('mongoose');

const exStudentSchema = new mongoose.Schema({
    name: String,
    email: String,
    collegeName: String,
    mobile: String,
    roomNo: String,
    exitDate: String, // Kab gaya
    exitTime: String, // Kis time gaya
    leftAt: { type: Date, default: Date.now } // System entry date
});

module.exports = mongoose.model('ExStudent', exStudentSchema);