/**
 * Global Login & Logout Logic (Updated for QR Code Safety)
 */

const BASE_URL = "https://hostrac.onrender.com"; // yaha apna backend URL

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        const data = await res.json();

        if (data.success) {
            let userData = data.user;

            // 🚀 ULTIMATE FIX: Agar backend '_id' ki jagah sirf 'id' bhej raha hai, toh hum use fix kar lenge
            if (!userData._id && userData.id) {
                userData._id = userData.id;
            }

            // Debugging ke liye (Browser ke Console me dikhega ki ID aayi ya nahi)
            console.log("✅ Login Success! User Data:", userData);

            // Local Storage me save karna
            localStorage.setItem('user', JSON.stringify(userData));

            // Redirect based on role
            if (userData.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (userData.role === 'warden') {
                window.location.href = 'warden-dashboard.html';
            } else if (userData.role === 'guard') {
                window.location.href = 'guard-dashboard.html';
            } else {
                window.location.href = 'student-dashboard.html';
            }

        } else {
            alert("❌ Invalid Credentials! " + (data.message || ""));
        }

    } catch (err) {
        console.error("Login Error:", err);
        alert("Connection Error! Backend not reachable");
    }
}

// --- LOGOUT FUNCTION ---
function logout() {
    if (confirm("Do you want to logout?")) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}
