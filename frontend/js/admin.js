const user = JSON.parse(localStorage.getItem('user'));
let selectedStudentId = null;

// Render ka URL yahan dalein (e.g., 'https://hostrac-backend.onrender.com')
const API_BASE_URL = 'https://hostrac.onrender.com';

if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
} else {
    document.getElementById('adminDisplayName').innerText = user.name;
}

// Helper Function: Date ko readable banane ke liye
function formatDate(dateString) {
    if (!dateString) return "-";
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
}

// Sidebar Navigation
function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + id).classList.add('active');
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    el.classList.add('active');

    if (id === 'add-user') loadActiveStudents();
    if (id === 'ex-students') loadExStudents();
    if (id === 'staff') loadStaffMembers();
}
document.getElementById('studentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        role: 'student',
        name: document.getElementById('sName').value,
        email: document.getElementById('sEmail').value,
        collegeName: document.getElementById('sCollege').value,
        mobile: document.getElementById('sMobile').value,
        fatherName: document.getElementById('sFather').value,
        motherName: document.getElementById('sMother').value,
        roomNo: document.getElementById('sRoom').value,
        address: document.getElementById('sAddress').value,
        password: document.getElementById('sPass').value 
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/create-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            alert("✅ Student Registered Successfully!");
            document.getElementById('studentForm').reset();
            loadActiveStudents();
        } else {
            alert("❌ Error: " + data.message);
        }
    } catch (err) { alert("Server Down!"); }
});

async function loadActiveStudents() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/students`);
        const students = await res.json();
        const tbody = document.getElementById('activeStudentTable');
        tbody.innerHTML = '';

        students.forEach(s => {
            const isPaid = s.feesStatus === 'Paid';
            const nextStatus = isPaid ? 'Unpaid' : 'Paid';

            // --- LIVE STATUS LOGIC ---
            const isOut = s.currentStatus === 'Out';
            const statusLabel = isOut ? 'OUT 🚩' : 'IN ✅';
            const statusStyle = isOut 
                ? "background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2;" 
                : "background: #f0fff4; color: #38a169; border: 1px solid #9ae6b4;";
            
            tbody.innerHTML += `
                <tr>
                    <td><b>${s.name}</b><br><small style="color:#636e72;">ID: ${s.email}</small></td>
                    <td>${s.roomNo}</td>
                    <td>
                        <span style="padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; ${statusStyle}">
                            ${statusLabel}
                        </span>
                    </td>
                    <td><span class="${isPaid ? 'fees-paid' : 'fees-unpaid'}">${s.feesStatus}</span></td>
                    <td>
                        <button class="btn" style="background:var(--primary); color:white; padding:5px 10px; font-size:10px; margin-right:5px;" 
                            onclick="updateFeesStatus('${s._id}', '${nextStatus}')">Mark ${nextStatus}</button>
                        <button class="btn-danger" style="padding:5px 10px; font-size:10px;" 
                            onclick="openExitModal('${s._id}')">Mark EX-Student</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) { console.error("Load Students Failed", err); }
}

async function updateFeesStatus(id, newStatus) {
    const res = await fetch(`${API_BASE_URL}/api/admin/update-fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id, feesStatus: newStatus })
    });
    if ((await res.json()).success) loadActiveStudents();
}

// ==========================================
// 2. PERMANENT EXIT & EX-STUDENTS
// ==========================================

function openExitModal(id) {
    selectedStudentId = id;
    document.getElementById('exitModal').style.display = 'block';
}

function closeModal() { document.getElementById('exitModal').style.display = 'none'; }

async function confirmPermanentExit() {
    const date = document.getElementById('exitDate').value;
    const time = document.getElementById('exitTime').value;
    if(!date || !time) return alert("Select Date & Time!");

    const res = await fetch(`${API_BASE_URL}/api/admin/mark-ex-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId, exitDate: date, exitTime: time })
    });
    if ((await res.json()).success) {
        alert("🚪 Moved to EX-Student");
        closeModal();
        loadActiveStudents();
    }
}

async function loadExStudents() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/ex-students-list`);
        const list = await res.json();
        const tbody = document.getElementById('exStudentTable');
        tbody.innerHTML = '';
        list.forEach(s => {
            tbody.innerHTML += `
                <tr>
                    <td><b>${s.name}</b></td>
                    <td>${s.roomNo}</td>
                    <td>${s.collegeName}</td>
                    <td>${formatDate(s.exitDate)}</td>
                    <td>${s.exitTime}</td>
                </tr>`;
        });
    } catch (err) { console.error("Load Ex-Students Failed", err); }
}

// ==========================================
// 3. STAFF MANAGEMENT
// ==========================================

document.getElementById('staffForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        role: document.getElementById('stRole').value,
        name: document.getElementById('stName').value,
        email: document.getElementById('stEmail').value,
        mobile: document.getElementById('stMobile').value,
        password: document.getElementById('stPass').value
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/create-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            alert("✅ Staff Registered Successfully!");
            document.getElementById('staffForm').reset();
            loadStaffMembers();
        } else {
            alert("❌ Error: " + data.message);
        }
    } catch (err) { alert("Server Error!"); }
});

async function loadStaffMembers() {
    const res = await fetch(`${API_BASE_URL}/api/admin/staff`);
    const data = await res.json();
    const tbody = document.getElementById('staffListTable');
    tbody.innerHTML = '';
    
    const render = (list, role) => {
        list.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td><b>${p.name}</b><br><small style="color:#636e72;">ID: ${p.email}</small></td>
                    <td><span class="fees-paid" style="background:#f1f2f6; color:#2d3436">${role.toUpperCase()}</span></td>
                    <td>${p.mobile || '-'}</td>
                    <td>
                        <button class="btn-danger" style="padding:5px 10px; font-size:11px;" 
                            onclick="deleteStaffMember('${role}','${p._id}')">Remove</button>
                    </td>
                </tr>`;
        });
    };
    render(data.wardens, 'warden');
    render(data.guards, 'guard');
}

async function deleteStaffMember(role, id) {
    if(confirm(`Are you sure you want to remove this ${role}?`)) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/delete-staff/${role}/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Staff Removed!");
                loadStaffMembers();
            } else {
                alert("❌ Error: " + data.message);
            }
        } catch (err) {
            alert("Delete Failed! Backend check karein.");
        }
    }
}

window.onload = loadActiveStudents;
