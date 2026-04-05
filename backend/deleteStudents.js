const mongoose = require('mongoose');
const Student = require('./src/models/Student'); 
require('dotenv').config();

const clearDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB...");

        // {} ka matlab hai "Saare Records"
        const result = await Student.deleteMany({});
        
        console.log(`🗑️ SUCCESS: ${result.deletedCount} Students deleted from database!`);
        process.exit();
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

clearDatabase();