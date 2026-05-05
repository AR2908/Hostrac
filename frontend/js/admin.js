const user = JSON.parse(localStorage.getItem('user'));
let selectedStudentId = null;

const API_BASE_URL = 'https://hostrac.onrender.com';

if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
} else {
    document.getElementById('adminDisplayName').innerText = user.name;
}

function formatDate(dateString) {
    if (!dateString) return "-";
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
}

function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + id).classList.add('active');
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    el.classList.add('active');

    if (id === 'add-user') loadActiveStudents();
    if (id === 'ex-students') loadExStudents();
    if (id === 'staff') loadStaffMembers();
    if (id === 'admissions') loadPendingAdmissions();
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
        status: 'Active' 
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/create-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showSmartAlert('success', 'Success!', 'Student Registered Successfully!');
            document.getElementById('studentForm').reset();
            loadActiveStudents();
        } else {
            showSmartAlert('error', 'Error!', data.message);
        }
    } catch (err) { 
        showSmartAlert('error', 'Network Error', 'Server is down or unreachable!'); 
    }
});

async function loadActiveStudents() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/students`);
        const students = await res.json();
        const tbody = document.getElementById('activeStudentTable');
        tbody.innerHTML = '';

        students.forEach(s => {
            const isPaid = s.feesStatus === 'Paid';
            const isOut = s.currentStatus === 'Out';
            const statusLabel = isOut ? 'OUT 🚩' : 'IN ✅';
            const statusStyle = isOut 
                ? "background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2;" 
                : "background: #f0fff4; color: #38a169; border: 1px solid #9ae6b4;";
            
            const feesBadgeStyle = isPaid 
                ? "background: #f0fff4; color: #27ae60; padding: 4px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #27ae60;" 
                : "background: #fff5f5; color: #e74c3c; padding: 4px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #e74c3c;";

            const safeName = (s.name || '').replace(/'/g, "\\'");
            const safeEmail = (s.email || '').replace(/'/g, "\\'");
            const safeMobile = (s.mobile || '').replace(/'/g, "\\'");
            const safeRoom = (s.roomNo || '').replace(/'/g, "\\'");
            const safeCollege = (s.collegeName || '').replace(/'/g, "\\'");
            const safeFather = (s.fatherName || '').replace(/'/g, "\\'");
            const safeMother = (s.motherName || '').replace(/'/g, "\\'");
            const safeAddress = (s.address || '').replace(/'/g, "\\'").replace(/(\r\n|\n|\r)/gm, " ");

            // 🚀 Table ab ekdum clean hai! Sirf 1 "Manage" button!
            tbody.innerHTML += `
                <tr>
                    <td><b>${s.name}</b><br><small style="color:#636e72;">ID: ${s.email}</small></td>
                    <td>${s.roomNo}</td>
                    <td><span style="padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; ${statusStyle}">${statusLabel}</span></td>
                    <td><span style="${feesBadgeStyle}">${s.feesStatus || 'Unpaid'}</span></td>
                    <td style="text-align: center;">
                        <button class="btn btn-primary" style="padding: 8px 20px; font-size: 13px; border-radius: 6px; cursor: pointer; background: #6c63ff; color: white; border: none;" 
                            onclick="openEditModal('${s._id}', '${safeName}', '${safeEmail}', '${safeMobile}', '${safeRoom}', '${safeCollege}', '${safeFather}', '${safeMother}', '${safeAddress}', '${s.feesStatus}')">
                            <i class="fas fa-user-cog"></i> Manage
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) { console.error("Load Students Failed", err); }
}

// ==========================================
// 2. PERMANENT EXIT & EX-STUDENTS
// ==========================================
function openExitModal(id, name) {
    selectedStudentId = id;
    document.getElementById('exitStudentName').innerText = name; 
    document.getElementById('exitModal').style.display = 'block';
}

function closeModal() { document.getElementById('exitModal').style.display = 'none'; }

async function confirmPermanentExit() {
    const date = document.getElementById('exitDate').value;
    const time = document.getElementById('exitTime').value;
    
    if(!date || !time) return showSmartAlert('warning', 'Missing Details', 'Please select Date & Time!');

    const res = await fetch(`${API_BASE_URL}/api/admin/mark-ex-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId, exitDate: date, exitTime: time })
    });
    if ((await res.json()).success) {
        showSmartAlert('success', 'Ex-Student Marked', 'Student successfully moved to EX-Student list.');
        closeModal();
        loadActiveStudents();
    }
}

// 24-hour time ko AM/PM mein badalne ka function
function formatTimeAMPM(time24) {
    if (!time24) return "---";
    const [hourString, minute] = time24.split(':');
    let hour = parseInt(hourString, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    
    hour = hour % 12;
    hour = hour ? hour : 12; 
    const formattedHour = hour.toString().padStart(2, '0');
    
    return `${formattedHour}:${minute} ${ampm}`;
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
                    <td>${formatTimeAMPM(s.exitTime)}</td> 
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
            showSmartAlert('success', 'Success!', 'Staff Registered Successfully!');
            document.getElementById('staffForm').reset();
            loadStaffMembers();
        } else {
            showSmartAlert('error', 'Error!', data.message);
        }
    } catch (err) { showSmartAlert('error', 'Network Error', 'Server is unreachable!'); }
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
                showSmartAlert('success', 'Removed!', 'Staff member removed successfully.');
                loadStaffMembers();
            } else {
                showSmartAlert('error', 'Error', data.message);
            }
        } catch (err) {
            showSmartAlert('error', 'Delete Failed', 'Check backend connection.');
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

// 1. Popup Kholna
function approveStudent(studentId) {
    document.getElementById('allotStudentId').value = studentId;
    document.getElementById('allotRoomNo').value = ""; 
    document.getElementById('roomAllotModal').style.display = 'flex';
}

// 2. Popup Band karna
function closeRoomModal() {
    document.getElementById('roomAllotModal').style.display = 'none';
}

// 3. API Call aur Data Save Karna
async function confirmRoomAllotment() {
    const studentId = document.getElementById('allotStudentId').value;
    const roomNo = document.getElementById('allotRoomNo').value;
    
    if (!roomNo || roomNo.trim() === "") {
        showSmartAlert('warning', 'Missing Room', 'Please enter a room number to approve.');
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
            closeRoomModal(); 
            showSmartAlert('success', 'Approved!', `Student has been approved & allotted Room: ${roomNo}`);
            loadPendingAdmissions(); 
            loadActiveStudents(); 
        } else {
            showSmartAlert('error', 'Error', data.message);
        }
    } catch (err) {
        showSmartAlert('error', 'Network Error', 'Server is down or unreachable!');
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
                showSmartAlert('success', 'Rejected', 'Registration request rejected and deleted.');
                loadPendingAdmissions();
            }
        } catch (err) {
            console.error(err);
        }
    }
}

// ==========================================
// 🚀 EDIT STUDENT LOGIC (FULL DETAILS WITH FEES & EX-STUDENT)
// ==========================================
function openEditModal(id, name, email, mobile, roomNo, college, father, mother, address, feesStatus) {
    document.getElementById('editStdId').value = id;
    document.getElementById('editStdName').value = name;
    document.getElementById('editStdEmail').value = email;
    document.getElementById('editStdMobile').value = (mobile && mobile !== '-' && mobile !== 'undefined') ? mobile : '';
    document.getElementById('editStdRoom').value = roomNo;
    document.getElementById('editStdCollege').value = (college && college !== '-' && college !== 'undefined') ? college : '';
    document.getElementById('editStdFather').value = (father && father !== '-' && father !== 'undefined') ? father : '';
    document.getElementById('editStdMother').value = (mother && mother !== '-' && mother !== 'undefined') ? mother : '';
    document.getElementById('editStdAddress').value = (address && address !== '-' && address !== 'undefined') ? address : '';
    
    // Set current Fees Status in Dropdown
    document.getElementById('editStdFees').value = (feesStatus === 'Paid') ? 'Paid' : 'Unpaid';
    
    // Setup Ex-Student Button Click
    document.getElementById('btnEditExStudent').onclick = function() {
        closeEditModal();
        openExitModal(id, name);
    };
    
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function submitEditStudent() {
    const id = document.getElementById('editStdId').value;
    
    const updateData = {
        name: document.getElementById('editStdName').value,
        email: document.getElementById('editStdEmail').value,
        mobile: document.getElementById('editStdMobile').value,
        roomNo: document.getElementById('editStdRoom').value,
        collegeName: document.getElementById('editStdCollege').value,
        feesStatus: document.getElementById('editStdFees').value, // Bheja Fees Status
        fatherName: document.getElementById('editStdFather').value,
        motherName: document.getElementById('editStdMother').value,
        address: document.getElementById('editStdAddress').value
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/update-student`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: id, updateData: updateData })
        });
        
        const data = await res.json();
        if (data.success) {
            showSmartAlert('success', 'Updated!', 'Student details & fees have been successfully updated.');
            closeEditModal();
            loadActiveStudents(); 
        } else {
            showSmartAlert('error', 'Update Failed', data.message);
        }
    } catch (err) {
        showSmartAlert('error', 'Server Error', 'Failed to update student details.');
    }
}

// ==========================================
// LOGOUT LOGIC (With Smart Confirm)
// ==========================================
function logout() {
    showSmartConfirm("Logout?", "Are you sure you want to log out of your account?", function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

window.onload = loadActiveStudents;
