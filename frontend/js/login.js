/**
 * HOSTRAC - Premium Login, Registration & Animation Logic
 */

const BASE_URL = "https://hostrac.onrender.com"; // Yaha apna backend URL

// ==========================================
// 1. LOGIN API LOGIC
// ==========================================
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const btn = document.getElementById('loginBtn');

    if (!role) {
        alert("Please select your role first!");
        return;
    }

    // Button par loading effect
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    btn.disabled = true;

    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        const data = await res.json();

        if (data.success) {
            let userData = data.user;

            // ID fix for backend
            if (!userData._id && userData.id) userData._id = userData.id;

            localStorage.setItem('user', JSON.stringify(userData));

            // Dashboard redirection
            if (userData.role === 'admin') window.location.href = 'admin-dashboard.html';
            else if (userData.role === 'warden') window.location.href = 'warden-dashboard.html';
            else if (userData.role === 'guard') window.location.href = 'guard-dashboard.html';
            else window.location.href = 'student-dashboard.html';

        } else {
            alert("❌ Invalid Credentials! " + (data.message || ""));
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Connection Error! Backend is not reachable.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function logout() {
    if (confirm("Do you want to logout?")) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// ==========================================
// 2. PARTICLE ANIMATION LOGIC
// ==========================================
const canvas = document.getElementById('bgCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];

    function initCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.5;
            this.speedX = Math.random() * 0.4 - 0.2;
            this.speedY = Math.random() * 0.4 - 0.2;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width || this.x < 0 || this.y > canvas.height || this.y < 0) this.reset();
        }
        draw() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function setupParticles() {
        particles = [];
        for (let i = 0; i < 120; i++) particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => { initCanvas(); setupParticles(); });
    initCanvas();
    setupParticles();
    animate();
}

// ==========================================
// 3. SECURITY LOGIC
// ==========================================
document.addEventListener('contextmenu', (e) => { e.preventDefault(); });
document.onkeydown = function(e) {
    if(e.keyCode == 123) return false;
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;
    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
};

// ==========================================
// 4. AUTO-LOAD FOOTER COMPONENT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const footerDiv = document.getElementById('footer-placeholder');
    
    if (footerDiv) {
        fetch('footer.html') 
            .then(response => {
                if(!response.ok) throw new Error("Footer file not found");
                return response.text();
            })
            .then(htmlData => {
                footerDiv.innerHTML = htmlData;
            })
            .catch(err => console.log("Footer loading info (Ignore if on landing page):", err));
    }
});

// ==========================================
// 5. REGISTRATION & FORM TOGGLE LOGIC
// ==========================================
function toggleForms(type) {
    const loginSec = document.getElementById('loginSection'); 
    const regSec = document.getElementById('registerSection');
    
    if(type === 'register') {
        if(loginSec) loginSec.style.display = 'none';
        if(regSec) regSec.style.display = 'block';
    } else {
        if(loginSec) loginSec.style.display = 'block';
        if(regSec) regSec.style.display = 'none';
    }
}

const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('regPassword').value;
        const confirmPass = document.getElementById('regConfirm').value;

        // Validation: Password match
        if (password !== confirmPass) {
            alert("❌ Passwords do not match! Please check again.");
            return;
        }

        // Student Data Object (Room Number is intentionally MISSING)
        const studentData = {
            name: document.getElementById('regName').value,
            college: document.getElementById('regCollege').value,
            fatherName: document.getElementById('regFather').value,
            motherName: document.getElementById('regMother').value,
            address: document.getElementById('regAddress').value,
            email: document.getElementById('regEmail').value,
            password: password,
            role: 'student',
            status: 'Pending' // Backend isko "Pending" set karke block rakhega
        };

        try {
            // FIX: Use BASE_URL insted of API_BASE_URL
            const res = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });

            const data = await res.json();

            if (res.ok) {
                alert("✅ Registration Successful!\nYour request has been sent to the Admin. You can login once your details are veridied.");
                registerForm.reset();
                toggleForms('login'); // Form submit hone ke baad wapas login page dikhao
            } else {
                alert("❌ Registration Failed: " + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Server Error! Check backend connection.");
        }
    });
}
