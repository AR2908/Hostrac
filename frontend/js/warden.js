/**
 * Hostrac - Warden Dashboard (Final Professional Version)
 */
const API_BASE_URL = 'https://hostrac.onrender.com';
const user = JSON.parse(localStorage.getItem('user'));
let studentsCache = [];
let lastRequestCount = 0; 
const bell = new Audio('bell.mp3'); 

// Authentication Check
if (!user || user.role !== 'warden') {
    window.location.href = 'login.html';
} else {
    const nameDisp = document.getElementById('wNameDisp');
    if(nameDisp) nameDisp.innerText = user.name;
}

// Sidebar Navigation Logic
function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('panel-' + id);
    if(target) target.classList.add('active');
    
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
    
    if (id === 'outpass') loadOutpass();
    if (id === 'records') loadRecords();
}

/**
 * Load All Students Records with Live Status
 */
async function loadRecords() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/warden/all-students`);
        if (!res.ok) throw new Error("Failed to fetch students");
        
        studentsCache = await res.json();
        const tbody = document.getElementById('recordsBody');
        if(!tbody) return;
        tbody.innerHTML = '';

        // Stats Calculation
        const outStudentsCount = studentsCache.filter(s => s.currentStatus === 'Out').length;
        const total = studentsCache.length;

        if(document.getElementById('count-total')) document.getElementById('count-total').innerText = total;
        if(document.getElementById('count-out')) document.getElementById('count-out').innerText = outStudentsCount;
        if(document.getElementById('count-in')) document.getElementById('count-in').innerText = total - outStudentsCount;

        studentsCache.forEach((s, i) => {
            const isOut = s.currentStatus === 'Out';
            const statusLabel = isOut ? 'OUT 🚩' : 'IN ✅';
            const statusStyle = isOut 
                ? "background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2;" 
                : "background: #f0fff4; color: #38a169; border: 1px solid #9ae6b4;";

            tbody.innerHTML += `
                <tr>
                    <td><b>${s.name}</b></td>
                    <td>${s.roomNo || 'N/A'}</td>
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
 * Load Outpass Requests with Sound Notification
 */
async function loadOutpass() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/warden/leave-requests`);
        const data = await res.json();
        
        const pendingRequests = data.filter(r => r.status === 'Pending');
        
        // Sound Alert for New Pending Requests
        if (pendingRequests.length > lastRequestCount && lastRequestCount !== 0) {
            bell.play().catch(e => console.log("User must click on page first for sound"));
        }
        lastRequestCount = pendingRequests.length;

        const tbody = document.getElementById('outpassBody');
        if(!tbody) return;
        tbody.innerHTML = '';

        [...data].reverse().forEach(req => {
            let displayName = req.studentId ? req.studentId.name : `EX- ${req.studentName || ''}`;
            let displayRoom = req.studentId ? req.studentId.roomNo : (req.roomNo || 'Left');
            
            let actionHtml = '';
            if (req.status === 'Pending') {
                actionHtml = `
                    <button class="btn btn-primary" style="padding:5px 10px; font-size:11px;" onclick="updateReq('${req._id}', 'Approved')">Approve</button>
                    <button class="btn" style="background:#ff7675; color:white; padding:5px 10px; font-size:11px;" onclick="updateReq('${req._id}', 'Rejected')">Reject</button>
                `;
            } else {
                const cls = req.status === 'Approved' ? 'fees-paid' : 'fees-unpaid';
                actionHtml = `<span class="${cls}">${req.status}</span>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td><b>${displayName}</b></td>
                    <td>${displayRoom}</td>
                    <td class="reason-text">${req.reason}</td>
                    <td>
                        <small>L: ${new Date(req.leaveDate).toLocaleDateString('en-GB')}</small><br>
                        <small>R: ${new Date(req.returnDate).toLocaleDateString('en-GB')}</small>
                    </td>
                    <td style="text-align:center;">${actionHtml}</td>
                </tr>`;
        });
    } catch (err) {
        console.error("Error loading outpasses:", err);
    }
}

async function updateReq(id, status) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/warden/update-leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: id, status })
        });
        if(res.ok) {
            loadOutpass();
            loadRecords(); 
        }
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

// AUTO REFRESH LOGIC (Every 10 Seconds)
setInterval(() => {
    loadOutpass();
    loadRecords();
}, 10000);

window.onload = () => {
    loadOutpass(); 
    loadRecords(); 
};
