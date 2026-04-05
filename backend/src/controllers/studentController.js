const LeaveRequest = require('../models/LeaveRequest');
const Student = require('../models/Student'); // Ye line zaroor add karein

exports.applyLeave = async (req, res) => {
    try {
        const { studentId, reason, leaveDate, returnDate } = req.body;

        // --- BACKUP LOGIC: Pehle student ka data fetch karein ---
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student record not found" });
        }

        const newLeave = new LeaveRequest({ 
            studentId, 
            studentName: student.name,   // Model mein ye field save hogi (Backup)
            roomNo: student.roomNo,      // Model mein ye field save hogi (Backup)
            reason, 
            leaveDate, 
            returnDate,
            status: 'Pending',
            gateStatus: 'In'
        });

        await newLeave.save();
        res.status(201).json({ message: "Leave Requested Successfully", success: true });

    } catch (err) {
        console.error("Apply Leave Error:", err);
        res.status(500).json({ error: err.message, success: false });
    }
};