const mongoose = require('mongoose');
const Student = require('./src/models/Student'); 
const dotenv = require('dotenv');
dotenv.config();

const generateStudents = () => {
    let students = [];
    const startID = 2511401; 
    const totalStudents = 78; 

    for (let i = 0; i < totalStudents; i++) {
        const currentID = startID + i;
        students.push({
            name: `MCA B ${currentID}`, 
            email: `${currentID}@scsit.com`, 
            password: "pass123",            
            role: "student",
            roomNo: "Not Assigned",         
            collegeName: "SCSIT DAVV INDORE", 
            feesStatus: "unpaid",
            mobile: "9893xxxxxx",
            fatherName: "-",
            motherName: "-",
            address: "My Permanent Address"
        });
    }
    return students;
};

const importData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env file");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected...");

        const allStudents = generateStudents();
        await Student.insertMany(allStudents);
        
        console.log(`🚀 SUCCESS: 78 Students (2511401 to 2511478) inserted!`);
        process.exit(); 
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

importData();