/**
 * Hostrac - Security Guard Dashboard (With QR Scanner & Sound)
 */

const API_BASE_URL = 'https://hostrac.onrender.com';
const user = JSON.parse(localStorage.getItem('user'));
let html5QrCode;
const scanSound = new Audio('../qrsound.mp3');

// Authentication Check
if (!user || user.role !== 'guard') {
    window.location.href = 'login.html';
} else {
    if(document.getElementById('guardName')) document.getElementById('guardName').innerText = user.name;
}

// Panel Toggling
function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('panel-' + id);
    if(target) target.classList.add('active');
    
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');

    if(id === 'gate') loadApprovedLeaves();
}

// Load Gate Records
async function loadApprovedLeaves() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/guard/approved`);
        const leaves = await res.json();
        
        const tbody = document.getElementById('guardTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';

        let outCount = 0;
        let inCount = 0;

        leaves.forEach(req => {
            if(!req.studentId) return;

            let currentStatus = "Waiting at Gate";
            let actionHtml = `<button class="btn" style="background:#f52f46; color:white;" onclick="markGate('${req._id}', 'Out')">Mark EXIT (OUT)</button>`;
            
            if (req.exitTime && !req.entryTime) {
                currentStatus = `<b style="color:#d63031">OUT 🚩</b>`;
                actionHtml = `<button class="btn" style="background:#27ae60; color:white;" onclick="markGate('${req._id}', 'In')">Mark ENTRY (IN)</button>`;
                outCount++;
            } else if (req.entryTime) {
                currentStatus = `<b style="color:#27ae60">IN ✅ (Completed)</b>`;
                actionHtml = `---`;
                inCount++;
            }

            tbody.innerHTML += `
                <tr>
                    <td><b>${req.studentId.name}</b></td>
                    <td>${req.studentId.roomNo}</td>
                    <td>${new Date(req.leaveDate).toLocaleDateString('en-GB')}</td>
                    <td>${currentStatus}</td>
                    
                </tr>`;
        });

        if(document.getElementById('countApproved')) document.getElementById('countApproved').innerText = leaves.length;
        if(document.getElementById('countOut')) document.getElementById('countOut').innerText = outCount;
        if(document.getElementById('countIn')) document.getElementById('countIn').innerText = inCount;

    } catch (err) { console.error(err); }
}

// Mark Gate (Manual Button)

// --- QR SCANNER LOGIC ---
async function startScanner() {
    const reader = document.getElementById('reader');
    const btn = document.getElementById('toggleScanner');
    
    if (reader.style.display === 'none') {
        reader.style.display = 'block';
        btn.innerText = "Close Camera";
        
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        // --- BROWSER AUDIO UNLOCK TRICK ---
        // Button click hote hi ek micro-second ke liye sound play-pause karein
        scanSound.play().then(() => {
            scanSound.pause();
            scanSound.currentTime = 0;
        }).catch(err => console.log("Audio unlock pending:", err));
        // -----------------------------------
        
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess);
    } else {
        stopScanner();
    }
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            document.getElementById('toggleScanner').innerText = "Open Camera";
        }).catch(err => console.error("Scanner stop error:", err));
    }
}

// FINAL FIXED SCAN SUCCESS FUNCTION
async function onScanSuccess(decodedText) {
    // 🔊 1. Play Sound & Vibrate
    try {
        scanSound.currentTime = 0; // Sound ko wapas start pe laye
        scanSound.play(); // Play kare
        
        if ("vibrate" in navigator) {
            navigator.vibrate(200); 
        }
    } catch (e) {
        console.error("Audio Error:", e);
    }

    try {
        // 🛑 2. Stop Scanner
        stopScanner();
        
        console.log("Scan Result: ", decodedText);

        // 🧠 3. Process QR Data
        const data = JSON.parse(decodedText); 
        
        const res = await fetch(`${API_BASE_URL}/api/guard/scan-qr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        
        if (result.success) {
            document.getElementById('scanResult').innerText = "✅ " + result.message;
            loadApprovedLeaves(); 
            setTimeout(() => { document.getElementById('scanResult').innerText = ""; }, 4000);
        } else {
            document.getElementById('scanResult').innerText = "❌ " + result.message;
        }
    } catch (err) {
        console.error("Scan Error:", err);
        document.getElementById('scanResult').innerText = "❌ Invalid QR Code!";
        stopScanner();
    }
}

// Logout
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Init
window.onload = loadApprovedLeaves;
