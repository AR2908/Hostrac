const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const ExStudent = require('../models/ExStudent');
const Warden = require('../models/Warden');
const Guard = require('../models/Guard');
const LeaveRequest = require('../models/LeaveRequest'); // <--- Naya Model Import kiya

// --- 1. Create User (Student/Staff) ---
router.post('/create-user', async (req, res) => {
    try {
        const { role, email } = req.body;

        const checkStudent = await Student.findOne({ email });
        const checkWarden = await Warden.findOne({ email });
        const checkGuard = await Guard.findOne({ email });

        if (checkStudent || checkWarden || checkGuard) {
            return res.status(400).json({ success: false, message: "Email already registered in system!" });
        }

        let newUser;
        if (role === 'student') {
            newUser = new Student(req.body);
        } else if (role === 'warden') {
            newUser = new Warden(req.body);
        } else if (role === 'guard') {
            newUser = new Guard(req.body);
        } else {
            return res.status(400).json({ success: false, message: "Invalid Role" });
        }

        await newUser.save();
        res.json({ success: true, message: "User registered successfully" });
    } catch (err) {
        console.error("Create User Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- 2. Permanent Exit Logic ---
router.post('/mark-ex-student', async (req, res) => {
    try {
        const { studentId, exitDate, exitTime } = req.body;
        const student = await Student.findById(studentId);
        
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });

        const exData = new ExStudent({
            name: student.name,
            email: student.email,
            collegeName: student.collegeName || "N/A",
            mobile: student.mobile || "N/A",
            roomNo: student.roomNo,
            exitDate,
            exitTime
        });

        await exData.save();
        await Student.findByIdAndDelete(studentId);
        
        res.json({ success: true });
    } catch (err) { 
        console.error("Exit Error:", err);
        res.status(500).json({ success: false, message: "Server Error during exit process" }); 
    }
});

// --- 3. Fees Update ---
router.post('/update-fees', async (req, res) => {
    try {
        const { studentId, feesStatus } = req.body;
        const updatedStudent = await Student.findByIdAndUpdate(
            studentId, 
            { feesStatus }, 
            { new: true }
        );
        
        if (!updatedStudent) return res.status(404).json({ success: false, message: "Student not found" });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- 4. Get Lists (UPDATED WITH LIVE STATUS) ---
router.get('/students', async (req, res) => {
    try {
        // Sabhi active students nikalte hain
        const students = await Student.find().sort({ name: 1 }).lean();

        // Har student ke liye uska latest status check karte hain
        const studentsWithStatus = await Promise.all(students.map(async (student) => {
            // Latest approved leave request check karein
            const lastLeave = await LeaveRequest.findOne({ 
                studentId: student._id,
                status: 'Approved' 
            }).sort({ createdAt: -1 });

            return {
                ...student,
                // Agar status 'Out' hai toh Out, warna hamesha 'In'
                currentStatus: (lastLeave && lastLeave.gateStatus === 'Out') ? 'Out' : 'In'
            };
        }));

        res.json(studentsWithStatus);
    } catch (err) {
        console.error("Fetch Students Error:", err);
        res.status(500).json([]);
    }
});

// Get exit history
router.get('/ex-students-list', async (req, res) => {
    try {
        const exStudents = await ExStudent.find().sort({ exitDate: -1 });
        res.json(exStudents);
    } catch (err) {
        res.status(500).json([]);
    }
});

// Get all staff members
router.get('/staff', async (req, res) => {
    try {
        const wardens = await Warden.find();
        const guards = await Guard.find();
        res.json({ wardens, guards });
    } catch (err) {
        res.status(500).json({ wardens: [], guards: [] });
    }
});

router.delete('/delete-staff/:role/:id', async (req, res) => {
    try {
        const { role, id } = req.params;
        let result;

        if (role === 'warden') {
            result = await Warden.findByIdAndDelete(id);
        } else if (role === 'guard') {
            result = await Guard.findByIdAndDelete(id);
        } else {
            return res.status(400).json({ success: false, message: "Invalid Role" });
        }

        if (!result) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }

        res.json({ success: true, message: "Staff removed successfully" });
    } catch (err) {
        console.error("Delete Staff Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});


module.exports = router;