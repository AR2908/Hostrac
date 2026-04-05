const mongoose = require('mongoose');

const exitStudentSchema = new mongoose.Schema({
    name: String,
    email: String,
    collegeName: String,
    mobile: String,
    fatherName: String,
    roomNo: String,
    exitDate: { type: String }, 
    exitTime: { type: String }
});

module.exports = mongoose.model('ExitStudent', exitStudentSchema);