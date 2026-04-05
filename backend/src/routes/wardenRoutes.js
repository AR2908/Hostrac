const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const LeaveRequest = require('../models/LeaveRequest');

// 1. Get All Outpass (History + Pending)
router.get('/leave-requests', async (req, res) => {
    try {
        const requests = await LeaveRequest.find()
            .populate('studentId', 'name roomNo mobile collegeName fatherName address feesStatus')
            .sort({ createdAt: -1 });
        
        res.json(requests);
    } catch (err) { 
        console.error("Warden Leave Request Error:", err);
        res.status(500).json({ success: false, message: "Server Error" }); 
    }
});

// 2. Get All Active Students (UPDATED WITH LIVE STATUS)
router.get('/all-students', async (req, res) => {
    try {
        // Sabhi students nikalte hain
        const students = await Student.find({ role: 'student' }).sort({ name: 1 }).lean();

        // Har student ke liye uska Current Status (IN/OUT) calculate karein
        const studentsWithStatus = await Promise.all(students.map(async (student) => {
            // Latest approved leave request check karein
            const lastLeave = await LeaveRequest.findOne({ 
                studentId: student._id,
                status: 'Approved' 
            }).sort({ createdAt: -1 });

            return {
                ...student,
                // Agar latest approved outpass 'Out' hai, toh status 'Out', warna 'In'
                currentStatus: (lastLeave && lastLeave.gateStatus === 'Out') ? 'Out' : 'In'
            };
        }));

        res.json(studentsWithStatus);
    } catch (err) { 
        console.error("Warden Student List Error:", err);
        res.status(500).json({ success: false }); 
    }
});

// 3. Update Leave Status (Approve/Reject)
router.post('/update-leave', async (req, res) => {
    const { requestId, status } = req.body;
    try {
        const updatedRequest = await LeaveRequest.findByIdAndUpdate(
            requestId, 
            { status }, 
            { new: true }
        );
        
        if (!updatedRequest) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        res.json({ success: true });
    } catch (err) { 
        console.error("Update Status Error:", err);
        res.status(500).json({ success: false }); 
    }
});

module.exports = router;