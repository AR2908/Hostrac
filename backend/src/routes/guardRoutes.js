const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');

/**
 * 1. Sabhi Approved Requests ko fetch karna (Guard Dashboard)
 */
router.get('/approved', async (req, res) => {
    try {
        const approvedLeaves = await LeaveRequest.find({ status: 'Approved' })
        .populate('studentId', 'name roomNo')
        .sort({ updatedAt: -1 });
        
        res.json(approvedLeaves);
    } catch (err) {
        console.error("Error fetching approved leaves:", err);
        res.status(500).json({ message: "Server error: Approved list load nahi ho payi." });
    }
});

/**
 * 2. NEW: QR Scan hone par Automatic IN/OUT Update
 */
router.post('/scan-qr', async (req, res) => {
    const { requestId, studentId } = req.body;

    try {
        const request = await LeaveRequest.findById(requestId);
        
        if (!request) {
            return res.status(404).json({ success: false, message: "Request nahi mili! Invalid QR." });
        }

        const currentTime = new Date();
        let action = "";

        // Agar Entry Time set hai matlab cycle complete ho chuka hai
        if (request.entryTime) {
            return res.status(400).json({ success: false, message: "Outpass already Completed!" });
        }

        // Agar Exit Time NAHI hai, matlab student abhi Gate se bahar ja raha hai (OUT)
        if (!request.exitTime) {
            request.exitTime = currentTime;
            request.gateStatus = 'Out';
            action = "EXIT (OUT)";
        } 
        // Agar Exit Time hai par Entry Time nahi, matlab student wapas aaya hai (IN)
        else if (request.exitTime && !request.entryTime) {
            request.entryTime = currentTime;
            request.gateStatus = 'In';
            action = "ENTRY (IN)";
        }

        await request.save();
        
        res.json({ 
            success: true, 
            message: `Scanned! Student marked ${action} successfully.` 
        });

    } catch (err) {
        console.error("QR Scan Update Error:", err);
        res.status(500).json({ success: false, message: "Server me problem hai QR process karte waqt." });
    }
});

/**
 * 3. Manual Button Click Gate Status Update
 */
router.post('/update-gate', async (req, res) => {
    const { requestId, gateStatus } = req.body;

    try {
        let updateData = { gateStatus: gateStatus };
        const currentTime = new Date();
        
        if (gateStatus === 'Out') {
            updateData.exitTime = currentTime; 
        } 
        else if (gateStatus === 'In') {
            updateData.entryTime = currentTime; 
        }

        const updatedRequest = await LeaveRequest.findByIdAndUpdate(
            requestId, 
            updateData, 
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ success: false, message: "Request nahi mili!" });
        }

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
