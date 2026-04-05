/**
 * Global Login & Logout Logic
 */

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
            // Redirect based on role
            if (data.user.role === 'admin') window.location.href = 'admin-dashboard.html';
            else if (data.user.role === 'warden') window.location.href = 'warden-dashboard.html';
            else if (data.user.role === 'guard') window.location.href = 'guard-dashboard.html';
            else window.location.href = 'student-dashboard.html';
        } else {
            alert("Invalid Credentials!");
        }
    } catch (err) { alert("Connection Error!"); }
}

// --- LOGOUT FUNCTION ---
function logout() {
    if (confirm("Do you want to logout?")) {
        localStorage.removeItem('user');
        // 'login.html' par bhej raha hai. 
        // Agar dashboard folder ke andar hai toh ye apne aap login page dhoond lega.
        window.location.href = 'login.html';
    }
}