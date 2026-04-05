/**
 * Hostrac - Warden Dashboard (Updated with Live Table Status)
 */

const user = JSON.parse(localStorage.getItem('user'));
let studentsCache = [];

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = isLocal ? 'https://hostrac.onrender.com' : 'https://your-ngrok-id.ngrok-free.app';

if (!user || user.role !== 'warden') {
    window.location.href = 'login.html';
} else {
    document.getElementById('wNameDisp').innerText = user.name;
}

// Sidebar Navigation
function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + id).classList.add('active');
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
    
    if (id === 'outpass') loadOutpass();
    if (id === 'records') loadRecords();
}

/**
 * 1. Load Records with Live Status Column
 */
async function loadRecords() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/warden/all-students`);
        studentsCache = await res.json();

        const tbody = document.getElementById('recordsBody');
        tbody.innerHTML = '';

        // Stats Calculation
        const outStudentsCount = studentsCache.filter(s => s.currentStatus === 'Out').length;
        const totalStudentsCount = studentsCache.length;
        const inStudentsCount = totalStudentsCount - outStudentsCount;

        if(document.getElementById('count-total')) document.getElementById('count-total').innerText = totalStudentsCount;
        if(document.getElementById('count-out')) document.getElementById('count-out').innerText = outStudentsCount;
        if(document.getElementById('count-in')) document.getElementById('count-in').innerText = inStudentsCount;

        studentsCache.forEach((s, i) => {
            // --- LIVE STATUS LOGIC ---
            const isOut = s.currentStatus === 'Out';
            const statusLabel = isOut ? 'OUT 🚩' : 'IN ✅';
            const statusStyle = isOut 
                ? "background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2;" 
                : "background: #f0fff4; color: #38a169; border: 1px solid #9ae6b4;";

            tbody.innerHTML += `
                <tr>
                    <td><b>${s.name}</b></td>
                    <td>${s.roomNo}</td>
                    <td>
                        <span style="padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; display: inline-block; ${statusStyle}">
                            ${statusLabel}
                        </span>
                    </td>
                    <td><span class="${s.feesStatus === 'Paid' ? 'fees-paid' : 'fees-unpaid'}">${s.feesStatus}</span></td>
                    <td><button class="btn btn-primary" style="padding:5px 12px; font-size:11px;" onclick="openProfile(${i})">View Profile</button></td>
                </tr>`;
        });
    } catch (err) {
        console.error("Error loading records:", err);
    }
}

/**
 * 2. Load Outpass Requests
 */
async function loadOutpass() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/warden/leave-requests`);
        const data = await res.json();
        const tbody = document.getElementById('outpassBody');
        tbody.innerHTML = '';

        data.reverse().forEach(req => {
            let displayName = "";
            let displayRoom = "";
            let nameStyle = "";

            if (req.studentId) {
                displayName = req.studentId.name;
                displayRoom = req.studentId.roomNo;
            } else {
                displayName = `EX- ${req.studentName || ''}`;
                displayRoom = req.roomNo || 'Left';
                nameStyle = "color: #d63031; font-weight: bold;"; 
            }

            let action = '';
            if (req.status === 'Pending') {
                action = `
                    <button class="btn btn-primary" style="padding:5px 10px; font-size:11px;" onclick="updateReq('${req._id}', 'Approved')">Approve</button>
                    <button class="btn" style="background:#ff7675; color:white; padding:5px 10px; font-size:11px;" onclick="updateReq('${req._id}', 'Rejected')">Reject</button>
                `;
            } else {
                const cls = req.status === 'Approved' ? 'fees-paid' : 'fees-unpaid';
                action = `<span class="${cls}">${req.status}</span>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td><b style="${nameStyle}">${displayName}</b></td>
                    <td>${displayRoom}</td>
                    <td class="reason-text">${req.reason}</td>
                    <td>
                        <span class="date-box">Leave ${new Date(req.leaveDate).toLocaleDateString('en-GB')}</span>
                        <span class="date-box">Return ${new Date(req.returnDate).toLocaleDateString('en-GB')}</span>
                    </td>
                    <td style="text-align:center;">${action}</td>
                </tr>`;
        });
    } catch (err) {
        console.error("Error loading outpasses:", err);
    }
}

async function updateReq(id, status) {
    try {
        await fetch(`${API_BASE_URL}/api/warden/update-leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: id, status })
        });
        loadOutpass();
        loadRecords(); 
    } catch (err) {
        console.error("Update failed:", err);
    }
}

function openProfile(i) {
    const s = studentsCache[i];
    document.getElementById('modalBody').innerHTML = `
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">COLLEGE</label><br><span>${s.collegeName || '-'}</span></div>
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">MOBILE</label><br><span>${s.mobile || '-'}</span></div>
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">FATHER NAME</label><br><span>${s.fatherName || '-'}</span></div>
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">MOTHER NAME</label><br><span>${s.motherName || '-'}</span></div>
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">FEES STATUS</label><br><span class="${s.feesStatus === 'Paid' ? 'fees-paid' : 'fees-unpaid'}">${s.feesStatus}</span></div>
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">ADDRESS</label><br><span>${s.address || '-'}</span></div>
    `;
    document.getElementById('profileModal').style.display = 'block';
}

function closeModal() { document.getElementById('profileModal').style.display = 'none'; }

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

window.onload = () => {
    loadOutpass(); 
    loadRecords(); 
};
