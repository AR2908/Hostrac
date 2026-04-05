const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');

/**
 * 1. Sabhi Approved Requests ko fetch karna (Guard Dashboard ke liye)
 */
router.get('/approved', async (req, res) => {
    try {
        // Warden dwara approve ki gayi requests nikalte hain
        // .sort({ updatedAt: -1 }) se latest activity upar dikhegi
        const approvedLeaves = await LeaveRequest.find({ 
            status: 'Approved' 
        })
        .populate('studentId', 'name roomNo') // Active student details load karein
        .sort({ updatedAt: -1 });
        
        res.json(approvedLeaves);
    } catch (err) {
        console.error("Error fetching approved leaves:", err);
        res.status(500).json({ message: "Server error: Approved list load nahi ho payi." });
    }
});

/**
 * 2. Gate Status Update (Exit/Entry Logic with Exact Time)
 */
router.post('/update-gate', async (req, res) => {
    const { requestId, gateStatus } = req.body;

    try {
        let updateData = { gateStatus: gateStatus };

        // --- TIME LOGIC ---
        const currentTime = new Date();
        
        if (gateStatus === 'Out') {
            // Jab Guard "Mark Exit" dabaye
            updateData.exitTime = currentTime; 
        } 
        else if (gateStatus === 'In') {
            // Jab Guard "Mark Entry" dabaye
            updateData.entryTime = currentTime; 
        }

        // Database mein record update karein
        const updatedRequest = await LeaveRequest.findByIdAndUpdate(
            requestId, 
            updateData, 
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ success: false, message: "Request nahi mili!" });
        }

        console.log(`Gate Activity Recorded: ${gateStatus} for Request ID: ${requestId}`);
        
        res.json({ 
            success: true, 
            message: `Student marked ${gateStatus} successfully!`,
            data: updatedRequest 
        });

    } catch (err) {
        console.error("Gate Update Error:", err);
        res.status(500).json({ success: false, message: "Gate status update karne mein error aayi." });
    }
});

module.exports = router;