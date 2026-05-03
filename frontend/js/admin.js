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

    // Tab Load hone par data fetch karna
    if (id === 'add-user') loadActiveStudents();
    if (id === 'ex-students') loadExStudents();
    if (id === 'staff') loadStaffMembers();
    if (id === 'admissions') loadPendingAdmissions(); // 🚀 FIX: Admission load karne ka logic add kiya
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
        password: document.getElementById('sPass').value,
        status: 'Active' // Manually add karne par seedha active hoga
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
                   
                    <td style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                    <button class="btn btn-warning" style="padding: 8px 12px; font-size: 12px; background: #f59e0b; color: white; border: none;" 
    onclick="openEditModal('${s._id}', '${s.name}', '${s.mobile}', '${s.roomNo}')">
    <i class="fas fa-edit"></i> Edit
</button>
                        <button class="btn btn-primary" style="padding: 8px 12px; font-size: 12px;" onclick="updateFeesStatus('${s._id}', '${nextStatus}')">
                            <i class="fas fa-check-circle"></i> Mark ${nextStatus}
                        </button>
                        <button class="btn btn-danger" style="padding: 8px 12px; font-size: 12px;" onclick="openExitModal('${s._id}', '${s.name}')">
    <i class="fas fa-sign-out-alt"></i> Mark Ex-Student
</button>
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

function openExitModal(id, name) {
    selectedStudentId = id;
    
    document.getElementById('exitStudentName').innerText = name; 
    
    document.getElementById('exitModal').style.display = 'block';
}

function closeModal() { 
    document.getElementById('exitModal').style.display = 'none'; 
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

// ==========================================
// 4. NEW ADMISSION MANAGEMENT
// ==========================================

async function loadPendingAdmissions() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/pending-students`);
        const students = await res.json();
        
        const tbody = document.getElementById('admissionTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: gray; padding: 20px;">No pending admissions right now.</td></tr>`;
            return;
        }

        students.forEach(student => {
            // FIX: Yahan undefined se bachne ke liye collegeName aur fallbacks add kiye gaye hain
            tbody.innerHTML += `
                <tr>
                    <td>
                        <b>${student.name || 'No Name'}</b><br>
                        <small style="color: #64748b;">${student.email || 'No Email'}</small><br>
                        <small style="color: #6c63ff; font-weight: bold;">${student.collegeName || 'N/A'}</small>
                    </td>
                    <td>
                        <small><b>FATHER:</b> ${student.fatherName || '---'}</small><br>
                        <small><b>MOTHER:</b> ${student.motherName || '---'}</small>
                    </td>
                    <td><small style="color: #64748b;">${student.address || '---'}</small></td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                            <button class="btn btn-primary" style="padding: 8px 12px; font-size: 12px; background: #10b981;" onclick="approveStudent('${student._id}')">
                                <i class="fas fa-check-circle"></i> Approve
                            </button>
                            <button class="btn btn-danger" style="padding: 8px 12px; font-size: 12px;" onclick="rejectStudent('${student._id}')">
                                <i class="fas fa-times-circle"></i> Reject
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error loading admissions:", err);
    }
}

async function approveStudent(studentId) {
    const roomNo = prompt("✅ Please allot a Room Number for this student:");
    
    if (!roomNo || roomNo.trim() === "") {
        alert("⚠️ Room number is required to approve a student!");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/approve-student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: studentId, roomNo: roomNo, status: 'Active' })
        });

        const data = await res.json();
        if (data.success) {
            alert("🎉 Student Approved Successfully!");
            loadPendingAdmissions(); 
            loadActiveStudents(); 
        } else {
            alert("❌ Failed to approve: " + data.message);
        }
    } catch (err) {
        console.error("Approval Error:", err);
        alert("Server Error!");
    }
}

async function rejectStudent(studentId) {
    if(confirm("❌ Are you sure you want to reject and delete this registration request?")) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/reject-student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: studentId })
            });
            
            if (res.ok) {
                alert("Registration Rejected!");
                loadPendingAdmissions();
            }
        } catch (err) {
            console.error(err);
        }
    }
}
// ==========================================
// 🚀 EDIT STUDENT LOGIC
// ==========================================

// Popup Kholna aur purana data bharna
function openEditModal(id, name, mobile, roomNo) {
    document.getElementById('editStdId').value = id;
    document.getElementById('editStdName').value = name;
    
    // Agar mobile 'undefined' ya '-' hai, toh blank dikhaye
    document.getElementById('editStdMobile').value = (mobile && mobile !== '-' && mobile !== 'undefined') ? mobile : '';
    document.getElementById('editStdRoom').value = roomNo;
    
    document.getElementById('editModal').style.display = 'flex';
}

// Popup Band karna
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Naya data backend par bhejna
async function submitEditStudent() {
    const id = document.getElementById('editStdId').value;
    const updateData = {
        name: document.getElementById('editStdName').value,
        mobile: document.getElementById('editStdMobile').value,
        roomNo: document.getElementById('editStdRoom').value
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/update-student`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: id, updateData: updateData })
        });
        
        const data = await res.json();
        if (data.success) {
            alert("✅ Student details updated successfully!");
            closeEditModal();
            loadActiveStudents(); // Table ko refresh karein
        } else {
            alert("❌ Failed to update: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Server Error while updating!");
    }
}
window.onload = loadActiveStudents;
