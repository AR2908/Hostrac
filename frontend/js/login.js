/**
 * Global Login & Logout Logic
 */

const BASE_URL = "https://hostrac.onrender.com"; //  yaha apna backend URL

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
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (data.user.role === 'warden') {
                window.location.href = 'warden-dashboard.html';
            } else if (data.user.role === 'guard') {
                window.location.href = 'guard-dashboard.html';
            } else {
                window.location.href = 'student-dashboard.html';
            }

        } else {
            alert("Invalid Credentials!");
        }

    } catch (err) {
        console.error(err);
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
