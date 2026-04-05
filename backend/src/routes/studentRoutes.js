const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Student = require('../models/Student');

// --- 1. APPLY LEAVE ROUTE ---
// Pehle aapne function likha tha par router.post nahi kiya tha
router.post('/apply', async (req, res) => {
    try {
        const { studentId, reason, leaveDate, returnDate } = req.body;

        // Student ka data nikalna backup ke liye
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const newRequest = new LeaveRequest({
            studentId,
            studentName: student.name,   // Backup name
            roomNo: student.roomNo,      // Backup room
            reason,
            leaveDate,
            returnDate,
            status: 'Pending',           // Default status
            gateStatus: 'In'             // Default gate status
        });

        await newRequest.save();
        res.json({ success: true, message: "Application Submitted Successfully" });
    } catch (err) {
        console.error("Apply Leave Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- 2. HISTORY ROUTE ---
router.get('/history/:id', async (req, res) => {
    try {
        const history = await LeaveRequest.find({ studentId: req.params.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching history" });
    }
});

module.exports = router;