/**
 * Hostrac - Security Guard Dashboard (With QR Scanner)
 */

const API_BASE_URL = 'https://hostrac.onrender.com';
const user = JSON.parse(localStorage.getItem('user'));
let html5QrCode;

if (!user || user.role !== 'guard') {
    window.location.href = 'login.html';
} else {
    if(document.getElementById('guardName')) document.getElementById('guardName').innerText = user.name;
}

function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('panel-' + id);
    if(target) target.classList.add('active');
    
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');

    if(id === 'gate') loadApprovedLeaves();
}

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
            let actionHtml = `<button class="btn btn-primary" onclick="markGate('${req._id}', 'Out')">Mark EXIT (OUT)</button>`;
            
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
                    <td style="text-align:center;">${actionHtml}</td>
                </tr>`;
        });

        if(document.getElementById('countApproved')) document.getElementById('countApproved').innerText = leaves.length;
        if(document.getElementById('countOut')) document.getElementById('countOut').innerText = outCount;
        if(document.getElementById('countIn')) document.getElementById('countIn').innerText = inCount;

    } catch (err) { console.error(err); }
}

async function markGate(requestId, status) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/guard/update-gate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, gateStatus: status })
        });
        if(res.ok) {
            loadApprovedLeaves();
        }
    } catch (err) { console.error("Error marking gate", err); }
}

// --- QR SCANNER LOGIC ---
async function startScanner() {
    const reader = document.getElementById('reader');
    const btn = document.getElementById('toggleScanner');
    
    if (reader.style.display === 'none') {
        reader.style.display = 'block';
        btn.innerText = "Close Camera";
        
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

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
        });
    }
}

async function onScanSuccess(decodedText) {
    try {
        // Scanner ruk jaye success hone par
        stopScanner();
        
        // QR text ko JSON me badalna
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

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

window.onload = loadApprovedLeaves;
