// Load admin dashboard
function loadAdminDashboard() {
    loadAdminContent('dashboard');
}

// Load admin content based on target
function loadAdminContent(target) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    switch(target) {
        case 'dashboard':
            contentArea.innerHTML = getAdminDashboardHTML();
            setupAdminDashboard();
            break;
        case 'attendance':
            contentArea.innerHTML = getAttendanceManagementHTML();
            loadAttendanceData();
            break;
        case 'employees':
            contentArea.innerHTML = getEmployeeManagementHTML();
            loadEmployeeData();
            break;
        case 'reports':
            contentArea.innerHTML = getReportsHTML();
            setupReports();
            break;
        case 'settings':
            contentArea.innerHTML = getSettingsHTML();
            break;
        default:
            contentArea.innerHTML = getAdminDashboardHTML();
            setupAdminDashboard();
    }
}

// Admin Dashboard HTML
function getAdminDashboardHTML() {
    return `
        <div class="dashboard-overview">
            <div class="card">
                <div class="card-header">
                    <h3>Statistik Hari Ini</h3>
                    <span class="current-date-display"></span>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(76, 201, 240, 0.2); color: #4cc9f0;">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div class="stat-info">
                            <h4 id="todayPresent">0</h4>
                            <p>Hadir Hari Ini</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(248, 150, 30, 0.2); color: #f8961e;">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h4 id="todayLate">0</h4>
                            <p>Terlambat</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(247, 37, 133, 0.2); color: #f72585;">
                            <i class="fas fa-user-times"></i>
                        </div>
                        <div class="stat-info">
                            <h4 id="todayAbsent">0</h4>
                            <p>Tidak Hadir</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(104, 237, 160, 0.2); color: #68eda0;">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <h4 id="totalEmployees">0</h4>
                            <p>Total Karyawan</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h3>Grafik Kehadiran Bulanan</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="attendanceChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h3>5 Karyawan Teladan</h3>
                        </div>
                        <div class="top-employees" id="topEmployees">
                            <!-- Top employees will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3>Absensi Terkini</h3>
                    <button class="btn btn-sm btn-primary" onclick="loadAttendanceData()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
                <div class="table-container">
                    <table class="table" id="recentAttendance">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Tanggal</th>
                                <th>Masuk</th>
                                <th>Keluar</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Setup admin dashboard
function setupAdminDashboard() {
    updateDashboardStats();
    loadTopEmployees();
    loadRecentAttendance();
    initializeAttendanceChart();
    
    // Auto refresh every 30 seconds
    setInterval(updateDashboardStats, 30000);
}

// Update dashboard statistics
function updateDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const allEmployees = auth.getAllEmployees();
    const attendanceData = auth.attendanceData;
    
    // Calculate today's stats
    const todayAttendance = attendanceData.filter(a => a.date === today && a.type === 'in');
    const todayPresent = todayAttendance.length;
    const todayLate = todayAttendance.filter(a => a.late).length;
    const todayAbsent = allEmployees.length - todayPresent;
    
    // Update DOM
    document.getElementById('todayPresent').textContent = todayPresent;
    document.getElementById('todayLate').textContent = todayLate;
    document.getElementById('todayAbsent').textContent = todayAbsent;
    document.getElementById('totalEmployees').textContent = allEmployees.length;
    
    // Update current date display
    const currentDateDisplay = document.querySelector('.current-date-display');
    if (currentDateDisplay) {
        const now = new Date();
        currentDateDisplay.textContent = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }
}

// Load top employees
function loadTopEmployees() {
    const topEmployeesDiv = document.getElementById('topEmployees');
    if (!topEmployeesDiv) return;
    
    const employees = auth.getAllEmployees();
    const attendanceData = auth.attendanceData;
    
    // Calculate scores for each employee
    const employeeScores = employees.map(emp => {
        const empAttendance = attendanceData.filter(a => a.userId === emp.id);
        const presentDays = empAttendance.filter(a => a.type === 'in').length;
        const lateDays = empAttendance.filter(a => a.late).length;
        const absenceDays = 30 - presentDays; // Simple calculation
        
        // Calculate score (higher is better)
        const score = (presentDays * 100) - (lateDays * 50) - (absenceDays * 200);
        
        return {
            ...emp,
            score: score,
            presentDays: presentDays,
            lateDays: lateDays
        };
    });
    
    // Sort by score (descending)
    employeeScores.sort((a, b) => b.score - a.score);
    
    // Get top 5
    const top5 = employeeScores.slice(0, 5);
    
    // Display top employees
    topEmployeesDiv.innerHTML = top5.map((emp, index) => `
        <div class="top-employee-card">
            <div class="rank-badge">${index + 1}</div>
            <div class="employee-avatar-small">${emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</div>
            <div class="employee-details">
                <h4>${emp.name.split(',')[0]}</h4>
                <p>${emp.presentDays} hari hadir, ${emp.lateDays} terlambat</p>
            </div>
            <div class="employee-score">
                <span class="score">${emp.score}</span>
            </div>
        </div>
    `).join('');
}

// Load recent attendance
function loadRecentAttendance() {
    const tableBody = document.querySelector('#recentAttendance tbody');
    if (!tableBody) return;
    
    const attendanceData = auth.attendanceData;
    const employees = auth.getAllEmployees();
    
    // Get last 10 attendance records
    const recentRecords = [...attendanceData]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
    
    // Group by user and date
    const groupedRecords = {};
    recentRecords.forEach(record => {
        const key = `${record.userId}-${record.date}`;
        if (!groupedRecords[key]) {
            groupedRecords[key] = {
                userId: record.userId,
                date: record.date,
                inTime: '',
                outTime: '',
                status: '',
                id: record.id
            };
        }
        
        if (record.type === 'in') {
            groupedRecords[key].inTime = record.time;
            groupedRecords[key].status = record.late ? 'Terlambat' : 'Hadir';
        } else if (record.type === 'out') {
            groupedRecords[key].outTime = record.time;
        }
    });
    
    // Convert to array and display
    const recordsArray = Object.values(groupedRecords);
    
    tableBody.innerHTML = recordsArray.map(record => {
        const employee = employees.find(e => e.id === record.userId);
        const employeeName = employee ? employee.name : 'Unknown';
        
        return `
            <tr>
                <td>${employeeName}</td>
                <td>${utils.formatDate(record.date)}</td>
                <td>${record.inTime || '-'}</td>
                <td>${record.outTime || '-'}</td>
                <td><span class="status-badge ${record.status === 'Terlambat' ? 'status-late' : 'status-present'}">${record.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editAttendance(${record.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Initialize attendance chart
function initializeAttendanceChart() {
    const canvas = document.getElementById('attendanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Prepare data
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const presentData = new Array(daysInMonth).fill(0);
    const lateData = new Array(daysInMonth).fill(0);
    
    // Count attendance per day
    auth.attendanceData.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate.getMonth() === currentMonth && 
            recordDate.getFullYear() === currentYear &&
            record.type === 'in') {
            
            const day = recordDate.getDate() - 1;
            presentData[day]++;
            if (record.late) {
                lateData[day]++;
            }
        }
    });
    
    // Create chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Hadir',
                    data: presentData,
                    backgroundColor: 'rgba(76, 201, 240, 0.7)',
                    borderColor: 'rgba(76, 201, 240, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Terlambat',
                    data: lateData,
                    backgroundColor: 'rgba(248, 150, 30, 0.7)',
                    borderColor: 'rgba(248, 150, 30, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Edit attendance
function editAttendance(attendanceId) {
    const modal = document.getElementById('editAttendanceModal');
    const form = document.getElementById('editAttendanceForm');
    
    // Find attendance record
    const attendanceData = auth.attendanceData;
    const record = attendanceData.find(a => a.id === attendanceId);
    
    if (!record) {
        utils.showMessage(null, 'Data absensi tidak ditemukan', 'error');
        return;
    }
    
    // Populate form
    form.innerHTML = `
        <div class="form-group">
            <label>Tanggal</label>
            <input type="date" id="editDate" value="${record.date}" class="form-control">
        </div>
        <div class="form-group">
            <label>Waktu</label>
            <input type="time" id="editTime" value="${record.time}" class="form-control">
        </div>
        <div class="form-group">
            <label>Tipe</label>
            <select id="editType" class="form-control">
                <option value="in" ${record.type === 'in' ? 'selected' : ''}>Masuk</option>
                <option value="out" ${record.type === 'out' ? 'selected' : ''}>Keluar</option>
            </select>
        </div>
        <div class="form-group">
            <label>Catatan</label>
            <textarea id="editNote" class="form-control">${record.note || ''}</textarea>
        </div>
        <div class="form-group">
            <label>Terlambat?</label>
            <input type="checkbox" id="editLate" ${record.late ? 'checked' : ''}>
        </div>
        <div class="form-group">
            <button type="submit" class="btn btn-primary btn-block">
                <i class="fas fa-save"></i> Simpan Perubahan
            </button>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    
    // Handle form submission
    form.onsubmit = function(e) {
        e.preventDefault();
        
        // Update record
        record.date = document.getElementById('editDate').value;
        record.time = document.getElementById('editTime').value;
        record.type = document.getElementById('editType').value;
        record.note = document.getElementById('editNote').value;
        record.late = document.getElementById('editLate').checked;
        
        // Update localStorage
        localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
        
        // Close modal
        modal.classList.remove('active');
        
        // Refresh data
        updateDashboardStats();
        loadRecentAttendance();
        
        utils.showMessage(null, 'Absensi berhasil diperbarui', 'success');
    };
    
    // Close modal button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.classList.remove('active');
}

// Export functions
window.adminFunctions = {
    loadAdminDashboard,
    loadAdminContent,
    setupAdminDashboard,
    updateDashboardStats,
    loadTopEmployees,
    loadRecentAttendance,
    editAttendance

};
// Setup navigation menu for admin
function setupAdminNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const currentUser = auth.checkAuth();
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get target from data-target attribute
            const target = this.getAttribute('data-target');
            
            // Load content based on target
            loadAdminContent(target);
        });
    });
}

// Update loadAdminDashboard function
function loadAdminDashboard() {
    const currentUser = auth.checkAuth();
    if (!currentUser) return;
    
    // Update user info
    updateUserInfo(currentUser);
    updateCurrentDate();
    
    // Setup navigation
    setupAdminNavigation();
    
    // Load default content
    loadAdminContent('dashboard');
}

// Update getAttendanceManagementHTML function
function getAttendanceManagementHTML() {
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-clipboard-check"></i> Data Absensi Semua Karyawan</h3>
                <div class="filter-controls">
                    <input type="date" id="attendanceDateFilter" class="form-control">
                    <button class="btn btn-sm btn-primary" onclick="filterAttendanceByDate()">
                        <i class="fas fa-filter"></i> Filter
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="table" id="allAttendanceTable">
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Tanggal</th>
                            <th>Masuk</th>
                            <th>Keluar</th>
                            <th>Status</th>
                            <th>Catatan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Data akan dimuat di sini -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Update getEmployeeManagementHTML function
function getEmployeeManagementHTML() {
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-users"></i> Data Karyawan</h3>
                <button class="btn btn-primary" onclick="showAddEmployeeModal()">
                    <i class="fas fa-plus"></i> Tambah Karyawan
                </button>
            </div>
            <div class="employee-grid" id="employeeList">
                <!-- Data karyawan akan dimuat di sini -->
            </div>
        </div>
    `;
}

// Update getReportsHTML function
function getReportsHTML() {
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-chart-bar"></i> Laporan Absensi</h3>
            </div>
            <div class="report-controls">
                <div class="form-row">
                    <div class="form-group">
                        <label>Dari Tanggal</label>
                        <input type="date" id="reportStartDate" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Sampai Tanggal</label>
                        <input type="date" id="reportEndDate" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <button class="btn btn-success" onclick="generateReport()">
                        <i class="fas fa-file-excel"></i> Export ke Excel
                    </button>
                    <button class="btn btn-danger" onclick="generatePDFReport()">
                        <i class="fas fa-file-pdf"></i> Export ke PDF
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="table" id="reportTable">
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Total Hadir</th>
                            <th>Terlambat</th>
                            <th>Izin</th>
                            <th>Sakit</th>
                            <th>Cuti</th>
                            <th>Alfa</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Data laporan akan dimuat di sini -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Update getSettingsHTML function
function getSettingsHTML() {
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-cog"></i> Pengaturan Sistem</h3>
            </div>
            <div class="settings-form">
                <div class="form-group">
                    <label>Jam Masuk Kerja</label>
                    <input type="time" id="workStartTime" value="07:30" class="form-control">
                </div>
                <div class="form-group">
                    <label>Jam Keluar Kerja</label>
                    <input type="time" id="workEndTime" value="15:30" class="form-control">
                </div>
                <div class="form-group">
                    <label>Toleransi Keterlambatan (menit)</label>
                    <input type="number" id="lateTolerance" value="0" class="form-control">
                </div>
                <div class="form-group">
                    <button class="btn btn-primary" onclick="saveSettings()">
                        <i class="fas fa-save"></i> Simpan Pengaturan
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Function to load attendance data
function loadAttendanceData() {
    const tableBody = document.querySelector('#allAttendanceTable tbody');
    if (!tableBody) return;
    
    const attendanceData = auth.attendanceData;
    const employees = auth.getAllEmployees();
    
    // Sort by date (newest first)
    const sortedData = [...attendanceData].sort((a, b) => b.timestamp - a.timestamp);
    
    tableBody.innerHTML = sortedData.map(record => {
        const employee = employees.find(e => e.id === record.userId);
        const employeeName = employee ? employee.name : 'Unknown';
        
        let status = 'Hadir';
        let statusClass = 'status-present';
        
        if (record.late) {
            status = 'Terlambat';
            statusClass = 'status-late';
        } else if (record.type === 'leave') {
            status = record.leaveType === 'permission' ? 'Izin' : 
                    record.leaveType === 'sick' ? 'Sakit' : 'Cuti';
            statusClass = 'status-info';
        } else if (record.type === 'absence') {
            status = 'Alfa';
            statusClass = 'status-absence';
        }
        
        return `
            <tr>
                <td>${employeeName}</td>
                <td>${utils.formatDate(record.date)}</td>
                <td>${record.type === 'in' ? record.time : '-'}</td>
                <td>${record.type === 'out' ? record.time : '-'}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${record.note || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editAttendance(${record.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAttendance(${record.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Function to load employee data
function loadEmployeeData() {
    const employeeList = document.getElementById('employeeList');
    if (!employeeList) return;
    
    const employees = auth.getAllEmployees();
    
    employeeList.innerHTML = employees.map(emp => `
        <div class="employee-card">
            <div class="employee-avatar">
                ${emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div class="employee-info">
                <h4>${emp.name}</h4>
                <p><i class="fas fa-user-circle"></i> ${emp.username}</p>
                <p><i class="fas fa-id-card"></i> ID: ${emp.id}</p>
                <div class="employee-actions">
                    <button class="btn btn-sm btn-warning" onclick="editEmployee(${emp.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${emp.id})">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Function to show add employee modal
function showAddEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    const form = document.getElementById('addEmployeeForm');
    
    // Show modal
    modal.classList.add('active');
    
    // Handle form submission
    form.onsubmit = function(e) {
        e.preventDefault();
        
        const name = document.getElementById('empName').value;
        const username = document.getElementById('empUsername').value;
        const password = document.getElementById('empPassword').value;
        
        if (!name || !username || !password) {
            utils.showMessage(null, 'Semua field harus diisi', 'error');
            return;
        }
        
        // Check if username already exists
        const employees = auth.getAllEmployees();
        if (employees.some(emp => emp.username === username)) {
            utils.showMessage(null, 'Username sudah digunakan', 'error');
            return;
        }
        
        // Add employee
        const newEmployee = auth.addEmployee(name, username, password);
        
        // Close modal
        modal.classList.remove('active');
        
        // Refresh employee list
        loadEmployeeData();
        
        // Show success message
        utils.showMessage(null, `Karyawan ${name} berhasil ditambahkan`, 'success');
        
        // Clear form
        form.reset();
    };
    
    // Close modal button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.classList.remove('active');
}

// Function to filter attendance by date
function filterAttendanceByDate() {
    const dateFilter = document.getElementById('attendanceDateFilter').value;
    if (!dateFilter) {
        loadAttendanceData();
        return;
    }
    
    const tableBody = document.querySelector('#allAttendanceTable tbody');
    if (!tableBody) return;
    
    const attendanceData = auth.attendanceData;
    const employees = auth.getAllEmployees();
    
    const filteredData = attendanceData.filter(record => record.date === dateFilter);
    
    tableBody.innerHTML = filteredData.map(record => {
        const employee = employees.find(e => e.id === record.userId);
        const employeeName = employee ? employee.name : 'Unknown';
        
        let status = 'Hadir';
        let statusClass = 'status-present';
        
        if (record.late) {
            status = 'Terlambat';
            statusClass = 'status-late';
        }
        
        return `
            <tr>
                <td>${employeeName}</td>
                <td>${utils.formatDate(record.date)}</td>
                <td>${record.type === 'in' ? record.time : '-'}</td>
                <td>${record.type === 'out' ? record.time : '-'}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${record.note || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editAttendance(${record.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Export functions
window.adminFunctions = {
    loadAdminDashboard,
    loadAdminContent,
    setupAdminNavigation,
    updateDashboardStats,
    loadTopEmployees,
    loadRecentAttendance,
    loadAttendanceData,
    loadEmployeeData,
    showAddEmployeeModal,
    editAttendance,
    filterAttendanceByDate
};

// Call loadAdminDashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        loadAdminDashboard();
    }
});

// ====== SISTEM PENGATURAN JAM KERJA ======

// Inisialisasi pengaturan
function initializeSettings() {
    if (!localStorage.getItem('workSettings')) {
        const defaultSettings = {
            workStartTime: '07:30',
            workEndTime: '15:30',
            lateTolerance: 0, // menit
            workDays: [1, 2, 3, 4, 5, 6], // Senin-Sabtu
            autoHoliday: true // Minggu libur otomatis
        };
        localStorage.setItem('workSettings', JSON.stringify(defaultSettings));
    }
}

// Fungsi untuk mengambil pengaturan
function getWorkSettings() {
    return JSON.parse(localStorage.getItem('workSettings')) || {
        workStartTime: '07:30',
        workEndTime: '15:30',
        lateTolerance: 0
    };
}

// Fungsi untuk menyimpan pengaturan
function saveWorkSettings(settings) {
    localStorage.setItem('workSettings', JSON.stringify(settings));
    return true;
}

// Update pengaturan
function updateWorkSettings(newSettings) {
    const currentSettings = getWorkSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    return saveWorkSettings(updatedSettings);
}

// ====== FUNGSI UNTUK DASHBOARD ======

// Update getSettingsHTML function untuk menampilkan form edit
function getSettingsHTML() {
    const settings = getWorkSettings();
    
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-clock"></i> Pengaturan Jam Kerja</h3>
                <p class="card-subtitle">Atur jam kerja dan toleransi keterlambatan</p>
            </div>
            <div class="settings-form">
                <form id="workSettingsForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="workStartTime">
                                <i class="fas fa-sign-in-alt"></i> Jam Masuk Kerja
                            </label>
                            <input type="time" id="workStartTime" value="${settings.workStartTime}" 
                                   class="form-control" required>
                            <small class="form-text">Default: 07:30</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="workEndTime">
                                <i class="fas fa-sign-out-alt"></i> Jam Keluar Kerja
                            </label>
                            <input type="time" id="workEndTime" value="${settings.workEndTime}" 
                                   class="form-control" required>
                            <small class="form-text">Default: 15:30</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="lateTolerance">
                                <i class="fas fa-hourglass-half"></i> Toleransi Keterlambatan (menit)
                            </label>
                            <input type="number" id="lateTolerance" value="${settings.lateTolerance}" 
                                   min="0" max="60" class="form-control">
                            <small class="form-text">0 = tidak ada toleransi</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="autoHoliday">
                                <i class="fas fa-calendar-times"></i> Hari Libur Otomatis
                            </label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="autoHoliday" ${settings.autoHoliday ? 'checked' : ''}>
                                    <span class="checkbox-custom"></span>
                                    <span>Minggu sebagai hari libur</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><i class="fas fa-calendar-alt"></i> Hari Kerja</label>
                        <div class="workdays-selection">
                            ${['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
                                .map((day, index) => `
                                    <label class="workday-checkbox">
                                        <input type="checkbox" value="${index}" 
                                               ${settings.workDays.includes(index) ? 'checked' : ''}
                                               ${index === 6 && settings.autoHoliday ? 'disabled' : ''}>
                                        <span class="workday-label">${day}</span>
                                    </label>
                                `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary btn-block">
                            <i class="fas fa-save"></i> Simpan Pengaturan
                        </button>
                    </div>
                </form>
                
                <div id="settingsMessage" class="message"></div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-info-circle"></i> Informasi Pengaturan</h3>
            </div>
            <div class="settings-info">
                <div class="info-item">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <h4>Penting!</h4>
                        <p>Perubahan pengaturan akan berlaku untuk semua karyawan dan mempengaruhi:</p>
                        <ul>
                            <li>Validasi absensi masuk</li>
                            <li>Penghitungan keterlambatan</li>
                            <li>Waktu absensi keluar</li>
                            <li>Penentuan hari libur</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Fungsi untuk menyimpan pengaturan
function saveSettings() {
    const form = document.getElementById('workSettingsForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const workStartTime = document.getElementById('workStartTime').value;
        const workEndTime = document.getElementById('workEndTime').value;
        const lateTolerance = parseInt(document.getElementById('lateTolerance').value) || 0;
        const autoHoliday = document.getElementById('autoHoliday').checked;
        
        // Get selected work days
        const workDays = [];
        document.querySelectorAll('.workday-checkbox input:checked').forEach(checkbox => {
            workDays.push(parseInt(checkbox.value));
        });
        
        // Validasi
        if (!workStartTime || !workEndTime) {
            utils.showMessage('settingsMessage', 'Jam kerja harus diisi', 'error');
            return;
        }
        
        // Validasi jam masuk < jam keluar
        const start = new Date(`1970-01-01T${workStartTime}:00`);
        const end = new Date(`1970-01-01T${workEndTime}:00`);
        
        if (start >= end) {
            utils.showMessage('settingsMessage', 'Jam masuk harus sebelum jam keluar', 'error');
            return;
        }
        
        // Save settings
        const newSettings = {
            workStartTime,
            workEndTime,
            lateTolerance,
            autoHoliday,
            workDays
        };
        
        const success = updateWorkSettings(newSettings);
        
        if (success) {
            utils.showMessage('settingsMessage', 'Pengaturan berhasil disimpan!', 'success');
            
            // Auto refresh setelah 2 detik
            setTimeout(() => {
                loadAdminContent('settings');
            }, 2000);
        } else {
            utils.showMessage('settingsMessage', 'Gagal menyimpan pengaturan', 'error');
        }
    });
}

// ====== UPDATE FUNGSI ABSENSI ======

// Update fungsi recordAttendance untuk menggunakan pengaturan
function recordAttendanceWithSettings(userId, type, note = '') {
    const now = new Date();
    const settings = getWorkSettings();
    
    // Cek apakah hari ini hari kerja
    const today = now.getDay(); // 0 = Minggu, 1 = Senin, dst
    const isWorkDay = settings.workDays.includes(today);
    const isAutoHoliday = settings.autoHoliday && today === 0; // Minggu
    
    if (!isWorkDay || isAutoHoliday) {
        return { 
            success: false, 
            message: 'Hari ini adalah hari libur' 
        };
    }
    
    const attendanceRecord = {
        id: Date.now(),
        userId: userId,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: type,
        note: note,
        timestamp: now.getTime()
    };
    
    // Validasi untuk absen masuk
    if (type === 'in') {
        const workStart = new Date();
        workStart.setHours(
            parseInt(settings.workStartTime.split(':')[0]),
            parseInt(settings.workStartTime.split(':')[1]),
            0, 0
        );
        
        // Apply late tolerance
        const toleranceMs = settings.lateTolerance * 60 * 1000;
        const adjustedStart = new Date(workStart.getTime() + toleranceMs);
        
        if (now > adjustedStart) {
            attendanceRecord.late = true;
            attendanceRecord.lateMinutes = Math.floor((now - workStart) / (1000 * 60));
        }
    }
    
    // Validasi untuk absen keluar (hanya bisa setelah jam kerja)
    if (type === 'out') {
        const workEnd = new Date();
        workEnd.setHours(
            parseInt(settings.workEndTime.split(':')[0]),
            parseInt(settings.workEndTime.split(':')[1]),
            0, 0
        );
        
        if (now < workEnd) {
            return { 
                success: false, 
                message: `Belum waktunya absen keluar. Jam keluar: ${settings.workEndTime}` 
            };
        }
    }
    
    // Save to attendance data
    const attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
    attendanceData.push(attendanceRecord);
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    
    return { success: true, data: attendanceRecord };
}

// ====== UPDATE LOAD SETTINGS CONTENT ======

function loadAdminContent(target) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    switch(target) {
        case 'dashboard':
            contentArea.innerHTML = getAdminDashboardHTML();
            setupAdminDashboard();
            break;
        case 'attendance':
            contentArea.innerHTML = getAttendanceManagementHTML();
            loadAttendanceData();
            break;
        case 'employees':
            contentArea.innerHTML = getEmployeeManagementHTML();
            loadEmployeeData();
            break;
        case 'reports':
            contentArea.innerHTML = getReportsHTML();
            setupReports();
            break;
        case 'settings':
            contentArea.innerHTML = getSettingsHTML();
            setupSettingsPage();
            break;
        default:
            contentArea.innerHTML = getAdminDashboardHTML();
            setupAdminDashboard();
    }
}

// Setup settings page
function setupSettingsPage() {
    // Inisialisasi pengaturan
    initializeSettings();
    
    // Setup form submission
    saveSettings();
    
    // Setup auto holiday toggle
    const autoHolidayCheckbox = document.getElementById('autoHoliday');
    if (autoHolidayCheckbox) {
        autoHolidayCheckbox.addEventListener('change', function() {
            const sundayCheckbox = document.querySelector('.workday-checkbox input[value="6"]');
            if (sundayCheckbox) {
                sundayCheckbox.disabled = this.checked;
                if (this.checked) {
                    sundayCheckbox.checked = false;
                }
            }
        });
    }
}

// Update fungsi di auth.js untuk menggunakan pengaturan
// Tambahkan ini di auth.js atau update fungsi yang ada
function checkIfHoliday(date) {
    const settings = getWorkSettings();
    const day = new Date(date).getDay();
    
    // Cek apakah hari Minggu dan auto holiday aktif
    if (settings.autoHoliday && day === 0) {
        return true;
    }
    
    // Cek apakah hari termasuk dalam hari kerja
    return !settings.workDays.includes(day);
}

// ====== TAMBAHKAN KE WINDOW OBJECT ======
window.workSettings = {
    initializeSettings,
    getWorkSettings,
    saveWorkSettings,
    updateWorkSettings,
    recordAttendanceWithSettings,
    checkIfHoliday
};

// ====== FUNGSI UNTUK SETUP HALAMAN PENGATURAN ======

function setupSettingsPage() {
    // Inisialisasi pengaturan
    initializeSettings();
    
    // Setup form submission untuk tombol Simpan
    setupSaveSettingsForm();
    
    // Setup auto holiday toggle
    setupAutoHolidayToggle();
}

// Fungsi khusus untuk setup form Simpan
function setupSaveSettingsForm() {
    const form = document.getElementById('workSettingsForm');
    const messageDiv = document.getElementById('settingsMessage');
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Ambil nilai dari form
        const workStartTime = document.getElementById('workStartTime').value;
        const workEndTime = document.getElementById('workEndTime').value;
        const lateTolerance = parseInt(document.getElementById('lateTolerance').value) || 0;
        const autoHoliday = document.getElementById('autoHoliday').checked;
        
        // Get selected work days
        const workDays = [];
        document.querySelectorAll('.workday-checkbox input[type="checkbox"]:checked').forEach(checkbox => {
            workDays.push(parseInt(checkbox.value));
        });
        
        // Validasi
        if (!workStartTime || !workEndTime) {
            showSettingsMessage('Jam kerja harus diisi', 'error');
            return;
        }
        
        // Validasi jam masuk < jam keluar
        const start = new Date(`1970-01-01T${workStartTime}:00`);
        const end = new Date(`1970-01-01T${workEndTime}:00`);
        
        if (start >= end) {
            showSettingsMessage('Jam masuk harus sebelum jam keluar', 'error');
            return;
        }
        
        // Validasi hari kerja minimal 1 hari
        if (workDays.length === 0) {
            showSettingsMessage('Pilih minimal 1 hari kerja', 'error');
            return;
        }
        
        // Save settings
        const newSettings = {
            workStartTime,
            workEndTime,
            lateTolerance,
            autoHoliday,
            workDays
        };
        
        const success = updateWorkSettings(newSettings);
        
        if (success) {
            showSettingsMessage('Pengaturan berhasil disimpan!', 'success');
            
            // Update info di dashboard
            updateDashboardInfo();
            
            // Auto refresh form setelah 2 detik
            setTimeout(() => {
                // Reload form dengan nilai baru
                loadSettingsFormData();
            }, 2000);
        } else {
            showSettingsMessage('Gagal menyimpan pengaturan', 'error');
        }
    });
}

// Fungsi untuk setup toggle hari Minggu
function setupAutoHolidayToggle() {
    const autoHolidayCheckbox = document.getElementById('autoHoliday');
    if (!autoHolidayCheckbox) return;
    
    autoHolidayCheckbox.addEventListener('change', function() {
        const sundayCheckbox = document.querySelector('.workday-checkbox input[value="6"]');
        if (sundayCheckbox) {
            sundayCheckbox.disabled = this.checked;
            if (this.checked) {
                sundayCheckbox.checked = false;
            }
        }
    });
}

// Fungsi untuk menampilkan pesan
function showSettingsMessage(message, type = 'info') {
    const messageDiv = document.getElementById('settingsMessage');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto hide setelah 5 detik
    if (type !== 'error') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Fungsi untuk memuat data pengaturan ke form
function loadSettingsFormData() {
    const settings = getWorkSettings();
    
    // Set values ke form
    const workStartTime = document.getElementById('workStartTime');
    const workEndTime = document.getElementById('workEndTime');
    const lateTolerance = document.getElementById('lateTolerance');
    const autoHoliday = document.getElementById('autoHoliday');
    
    if (workStartTime) workStartTime.value = settings.workStartTime;
    if (workEndTime) workEndTime.value = settings.workEndTime;
    if (lateTolerance) lateTolerance.value = settings.lateTolerance;
    if (autoHoliday) autoHoliday.checked = settings.autoHoliday;
    
    // Set hari kerja
    document.querySelectorAll('.workday-checkbox input[type="checkbox"]').forEach(checkbox => {
        const value = parseInt(checkbox.value);
        checkbox.checked = settings.workDays.includes(value);
        
        // Disable Minggu jika auto holiday aktif
        if (value === 6 && settings.autoHoliday) {
            checkbox.disabled = true;
        }
    });
}

// Fungsi untuk update info di dashboard
function updateDashboardInfo() {
    const settings = getWorkSettings();
    
    // Update info jam kerja di elemen yang sesuai
    const workTimeInfo = document.getElementById('workTimeInfo');
    if (workTimeInfo) {
        workTimeInfo.textContent = `Jam Kerja: ${settings.workStartTime} - ${settings.workEndTime}`;
    }
}

// ====== UPDATE FUNGSI LOAD SETTINGS HTML ======

function getSettingsHTML() {
    const settings = getWorkSettings();
    
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-clock"></i> Pengaturan Jam Kerja</h3>
                <p class="card-subtitle">Atur jam kerja dan toleransi keterlambatan</p>
            </div>
            <div class="settings-form">
                <form id="workSettingsForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="workStartTime">
                                <i class="fas fa-sign-in-alt"></i> Jam Masuk Kerja
                            </label>
                            <input type="time" id="workStartTime" value="${settings.workStartTime}" 
                                   class="form-control" required>
                            <small class="form-text">Default: 07:30</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="workEndTime">
                                <i class="fas fa-sign-out-alt"></i> Jam Keluar Kerja
                            </label>
                            <input type="time" id="workEndTime" value="${settings.workEndTime}" 
                                   class="form-control" required>
                            <small class="form-text">Default: 15:30</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="lateTolerance">
                                <i class="fas fa-hourglass-half"></i> Toleransi Keterlambatan (menit)
                            </label>
                            <input type="number" id="lateTolerance" value="${settings.lateTolerance}" 
                                   min="0" max="120" class="form-control">
                            <small class="form-text">0 = tidak ada toleransi (maksimal 120 menit)</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="autoHoliday">
                                <i class="fas fa-calendar-times"></i> Hari Libur Otomatis
                            </label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="autoHoliday" ${settings.autoHoliday ? 'checked' : ''}>
                                    <span class="checkbox-custom"></span>
                                    <span>Minggu sebagai hari libur</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><i class="fas fa-calendar-alt"></i> Hari Kerja</label>
                        <div class="workdays-selection">
                            ${['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
                                .map((day, index) => `
                                    <label class="workday-checkbox">
                                        <input type="checkbox" value="${index}" 
                                               ${settings.workDays.includes(index) ? 'checked' : ''}
                                               ${index === 6 && settings.autoHoliday ? 'disabled' : ''}>
                                        <span class="workday-label">${day}</span>
                                    </label>
                                `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary btn-block">
                            <i class="fas fa-save"></i> Simpan Pengaturan
                        </button>
                    </div>
                </form>
                
                <div id="settingsMessage" class="message" style="display: none;"></div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-info-circle"></i> Informasi Pengaturan Saat Ini</h3>
            </div>
            <div class="settings-info">
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <div>
                        <h4>Jam Kerja</h4>
                        <p>${settings.workStartTime} - ${settings.workEndTime}</p>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-hourglass-half"></i>
                    <div>
                        <h4>Toleransi Keterlambatan</h4>
                        <p>${settings.lateTolerance} menit</p>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <div>
                        <h4>Hari Kerja</h4>
                        <p>${getWorkDaysText(settings.workDays, settings.autoHoliday)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper function untuk menampilkan hari kerja sebagai text
function getWorkDaysText(workDays, autoHoliday) {
    const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    if (autoHoliday && workDays.includes(0)) {
        // Hapus Minggu jika auto holiday aktif
        workDays = workDays.filter(day => day !== 0);
    }
    
    const dayNames = workDays.map(day => daysMap[day]);
    
    if (dayNames.length === 0) {
        return 'Tidak ada hari kerja';
    } else if (dayNames.length === 1) {
        return dayNames[0];
    } else if (dayNames.length === 7) {
        return 'Setiap hari';
    } else {
        return dayNames.join(', ');
    }
}

// ====== UPDATE FUNGSI LOAD ADMIN CONTENT ======

function loadAdminContent(target) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    switch(target) {
        case 'dashboard':
            contentArea.innerHTML = getAdminDashboardHTML();
            setupAdminDashboard();
            break;
        case 'attendance':
            contentArea.innerHTML = getAttendanceManagementHTML();
            loadAttendanceData();
            break;
        case 'employees':
            contentArea.innerHTML = getEmployeeManagementHTML();
            loadEmployeeData();
            break;
        case 'reports':
            contentArea.innerHTML = getReportsHTML();
            setupReports();
            break;
        case 'settings':
            contentArea.innerHTML = getSettingsHTML();
            setupSettingsPage(); // PASTIKAN fungsi ini dipanggil!
            break;
        default:
            contentArea.innerHTML = getAdminDashboardHTML();
            setupAdminDashboard();
    }
}


// ====== SISTEM LAPORAN YANG DIPERBAIKI ======

function getReportsHTML() {
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-chart-bar"></i> Laporan Absensi Detail</h3>
                <p class="card-subtitle">Filter laporan berdasarkan tanggal dan karyawan</p>
            </div>
            
            <div class="report-controls">
                <div class="form-row">
                    <div class="form-group">
                        <label for="reportStartDate"><i class="fas fa-calendar-day"></i> Dari Tanggal</label>
                        <input type="date" id="reportStartDate" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="reportEndDate"><i class="fas fa-calendar-day"></i> Sampai Tanggal</label>
                        <input type="date" id="reportEndDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="employeeFilter"><i class="fas fa-user"></i> Filter Karyawan</label>
                    <select id="employeeFilter" class="form-control">
                        <option value="all">Semua Karyawan</option>
                        <!-- Options akan diisi oleh JavaScript -->
                    </select>
                </div>
                
                <div class="form-group">
                    <button class="btn btn-primary" onclick="generateReport()">
                        <i class="fas fa-filter"></i> Tampilkan Laporan
                    </button>
                    <button class="btn btn-success" onclick="exportToExcel()">
                        <i class="fas fa-file-excel"></i> Export ke Excel
                    </button>
                    <button class="btn btn-danger" onclick="exportToPDF()">
                        <i class="fas fa-file-pdf"></i> Export ke PDF
                    </button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-table"></i> Data Laporan</h3>
                <div class="report-summary" id="reportSummary">
                    <!-- Summary akan ditampilkan di sini -->
                </div>
            </div>
            <div class="table-container">
                <table class="table" id="reportTable">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama Karyawan</th>
                            <th>Tanggal</th>
                            <th>Hari</th>
                            <th>Jam Masuk</th>
                            <th>Jam Keluar</th>
                            <th>Durasi</th>
                            <th>Status</th>
                            <th>Keterlambatan</th>
                            <th>Catatan</th>
                        </tr>
                    </thead>
                    <tbody id="reportTableBody">
                        <!-- Data akan dimuat di sini -->
                    </tbody>
                </table>
            </div>
            
            <div class="report-footer">
                <p id="totalRecords">Total: 0 data</p>
            </div>
        </div>
    `;
}

// Setup reports page
function setupReports() {
    // Set default dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('reportStartDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];
    
    // Load employee options
    loadEmployeeOptions();
    
    // Generate initial report
    generateReport();
}

// Load employee options for filter
function loadEmployeeOptions() {
    const employeeFilter = document.getElementById('employeeFilter');
    if (!employeeFilter) return;
    
    const employees = auth.getAllEmployees();
    
    // Sort employees by name
    employees.sort((a, b) => a.name.localeCompare(b.name));
    
    // Clear existing options except first
    employeeFilter.innerHTML = '<option value="all">Semua Karyawan</option>';
    
    // Add employee options
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeFilter.appendChild(option);
    });
}

// Generate report based on filters
function generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const employeeId = document.getElementById('employeeFilter').value;
    
    if (!startDate || !endDate) {
        utils.showMessage(null, 'Pilih tanggal terlebih dahulu', 'error');
        return;
    }
    
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
        utils.showMessage(null, 'Tanggal awal tidak boleh lebih besar dari tanggal akhir', 'error');
        return;
    }
    
    // Get filtered data
    const reportData = getFilteredReportData(startDate, endDate, employeeId);
    
    // Display report
    displayReport(reportData, startDate, endDate);
}

// Get filtered report data
function getFilteredReportData(startDate, endDate, employeeId) {
    const allEmployees = auth.getAllEmployees();
    const attendanceData = auth.attendanceData;
    
    // Convert dates to comparable format
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    
    // Filter attendance data by date range
    let filteredData = attendanceData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
    });
    
    // Filter by employee if selected
    if (employeeId !== 'all') {
        filteredData = filteredData.filter(record => record.userId === parseInt(employeeId));
    }
    
    // Group data by employee and date
    const groupedData = {};
    
    filteredData.forEach(record => {
        const employee = allEmployees.find(e => e.id === record.userId);
        if (!employee) return;
        
        const key = `${employee.id}-${record.date}`;
        if (!groupedData[key]) {
            groupedData[key] = {
                employeeId: employee.id,
                employeeName: employee.name,
                date: record.date,
                day: utils.getDayName(record.date),
                inTime: '',
                outTime: '',
                status: 'Alfa',
                lateMinutes: 0,
                notes: [],
                duration: '0 jam'
            };
        }
        
        if (record.type === 'in') {
            groupedData[key].inTime = record.time;
            groupedData[key].status = record.late ? 'Terlambat' : 'Hadir';
            if (record.late) {
                groupedData[key].lateMinutes = record.lateMinutes || 0;
            }
            if (record.note) {
                groupedData[key].notes.push(`Masuk: ${record.note}`);
            }
        } else if (record.type === 'out') {
            groupedData[key].outTime = record.time;
            if (record.note) {
                groupedData[key].notes.push(`Keluar: ${record.note}`);
            }
            
            // Calculate duration if both in and out times exist
            if (groupedData[key].inTime) {
                groupedData[key].duration = calculateWorkingDuration(
                    groupedData[key].inTime, 
                    groupedData[key].outTime
                );
            }
        } else if (record.type === 'leave') {
            groupedData[key].status = record.leaveType === 'permission' ? 'Izin' : 
                                     record.leaveType === 'sick' ? 'Sakit' : 'Cuti';
            if (record.note) {
                groupedData[key].notes.push(`${groupedData[key].status}: ${record.note}`);
            }
        }
    });
    
    // Convert to array and sort by employee name and date
    const result = Object.values(groupedData);
    result.sort((a, b) => {
        if (a.employeeName === b.employeeName) {
            return new Date(a.date) - new Date(b.date);
        }
        return a.employeeName.localeCompare(b.employeeName);
    });
    
    return result;
}

// Calculate working duration
function calculateWorkingDuration(inTime, outTime) {
    if (!inTime || !outTime) return '0 jam';
    
    const [inHour, inMinute] = inTime.split(':').map(Number);
    const [outHour, outMinute] = outTime.split(':').map(Number);
    
    let totalMinutes = (outHour * 60 + outMinute) - (inHour * 60 + inMinute);
    
    // Handle negative duration (overnight work)
    if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
        return `${minutes} menit`;
    } else if (minutes === 0) {
        return `${hours} jam`;
    } else {
        return `${hours} jam ${minutes} menit`;
    }
}

// Display report in table
function displayReport(data, startDate, endDate) {
    const tableBody = document.getElementById('reportTableBody');
    const totalRecords = document.getElementById('totalRecords');
    const reportSummary = document.getElementById('reportSummary');
    
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list fa-3x"></i>
                        <p>Tidak ada data absensi untuk periode yang dipilih</p>
                    </div>
                </td>
            </tr>
        `;
        totalRecords.textContent = 'Total: 0 data';
        reportSummary.innerHTML = '<p>Tidak ada data untuk ditampilkan</p>';
        return;
    }
    
    // Calculate summary
    const summary = calculateReportSummary(data);
    
    // Display summary
    reportSummary.innerHTML = `
        <div class="summary-stats">
            <div class="summary-stat">
                <span class="stat-label">Periode:</span>
                <span class="stat-value">${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}</span>
            </div>
            <div class="summary-stat">
                <span class="stat-label">Total Hari Kerja:</span>
                <span class="stat-value">${summary.totalDays} hari</span>
            </div>
            <div class="summary-stat">
                <span class="stat-label">Rata-rata Kehadiran:</span>
                <span class="stat-value">${summary.averageAttendance}%</span>
            </div>
            <div class="summary-stat">
                <span class="stat-label">Total Keterlambatan:</span>
                <span class="stat-value">${summary.totalLateMinutes} menit</span>
            </div>
        </div>
    `;
    
    // Display data
    let currentEmployee = '';
    let employeeRowspan = 0;
    let employeeStartIndex = 0;
    
    data.forEach((item, index) => {
        // Check if new employee
        if (item.employeeName !== currentEmployee) {
            currentEmployee = item.employeeName;
            employeeRowspan = data.filter(d => d.employeeName === currentEmployee).length;
            employeeStartIndex = index;
        }
        
        const row = document.createElement('tr');
        
        // Only show employee name in first row
        const employeeNameCell = index === employeeStartIndex ? 
            `<td rowspan="${employeeRowspan}" class="employee-name-cell">${item.employeeName}</td>` : 
            '';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            ${employeeNameCell}
            <td>${utils.formatDate(item.date)}</td>
            <td>${item.day}</td>
            <td>${item.inTime || '-'}</td>
            <td>${item.outTime || '-'}</td>
            <td>${item.duration}</td>
            <td><span class="status-badge ${getStatusClass(item.status)}">${item.status}</span></td>
            <td>${item.lateMinutes > 0 ? `${item.lateMinutes} menit` : '-'}</td>
            <td>${item.notes.join('; ') || '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    totalRecords.textContent = `Total: ${data.length} data`;
}

// Calculate report summary
function calculateReportSummary(data) {
    const totalDays = new Set(data.map(item => item.date)).size;
    const totalPresent = data.filter(item => item.status === 'Hadir' || item.status === 'Terlambat').length;
    const totalLateMinutes = data.reduce((sum, item) => sum + (item.lateMinutes || 0), 0);
    const averageAttendance = totalDays > 0 ? Math.round((totalPresent / (data.length || 1)) * 100) : 0;
    
    return {
        totalDays,
        totalPresent,
        totalLateMinutes,
        averageAttendance
    };
}

// Get status class for badge
function getStatusClass(status) {
    switch(status) {
        case 'Hadir': return 'status-present';
        case 'Terlambat': return 'status-late';
        case 'Izin': return 'status-warning';
        case 'Sakit': return 'status-info';
        case 'Cuti': return 'status-info';
        case 'Alfa': return 'status-absence';
        default: return '';
    }
}

// ====== FITUR EKSPOR EXCEL ======

function exportToExcel() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const employeeId = document.getElementById('employeeFilter').value;
    
    if (!startDate || !endDate) {
        utils.showMessage(null, 'Pilih tanggal terlebih dahulu', 'error');
        return;
    }
    
    // Get filtered data
    const reportData = getFilteredReportData(startDate, endDate, employeeId);
    
    if (reportData.length === 0) {
        utils.showMessage(null, 'Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    // Prepare data for Excel
    const excelData = prepareExcelData(reportData, startDate, endDate);
    
    // Create and download Excel file
    createExcelFile(excelData, `Laporan_Absensi_${startDate}_${endDate}.xlsx`);
}

function prepareExcelData(data, startDate, endDate) {
    const employees = auth.getAllEmployees();
    const selectedEmployee = document.getElementById('employeeFilter').value;
    
    // Prepare header
    const headers = [
        'NO',
        'NAMA KARYAWAN',
        'TANGGAL',
        'HARI',
        'JAM MASUK',
        'JAM KELUAR',
        'DURASI KERJA',
        'STATUS',
        'KETERLAMBATAN (MENIT)',
        'CATATAN'
    ];
    
    // Prepare rows
    const rows = data.map((item, index) => [
        index + 1,
        item.employeeName,
        utils.formatDate(item.date),
        item.day,
        item.inTime || '-',
        item.outTime || '-',
        item.duration,
        item.status,
        item.lateMinutes || 0,
        item.notes.join('; ') || '-'
    ]);
    
    // Add summary section
    const summary = calculateReportSummary(data);
    const summaryRows = [
        [],
        ['LAPORAN ABSENSI'],
        [`Periode: ${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}`],
        selectedEmployee === 'all' ? 
            [`Jumlah Karyawan: ${new Set(data.map(d => d.employeeId)).size}`] : 
            [`Nama Karyawan: ${employees.find(e => e.id == selectedEmployee)?.name || '-'}`],
        [`Total Hari Kerja: ${summary.totalDays}`],
        [`Rata-rata Kehadiran: ${summary.averageAttendance}%`],
        [`Total Keterlambatan: ${summary.totalLateMinutes} menit`],
        [],
        ['DETAIL ABSENSI:']
    ];
    
    return {
        headers,
        rows,
        summaryRows
    };
}

function createExcelFile(data, filename) {
    // Create CSV content
    let csvContent = '';
    
    // Add summary
    data.summaryRows.forEach(row => {
        csvContent += row.join(',') + '\n';
    });
    
    // Add headers
    csvContent += data.headers.join(',') + '\n';
    
    // Add rows
    data.rows.forEach(row => {
        csvContent += row.map(cell => {
            // Escape quotes and wrap in quotes if contains comma
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    utils.showMessage(null, `File Excel berhasil didownload: ${filename}`, 'success');
}

// ====== FITUR EKSPOR PDF ======

function exportToPDF() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const employeeId = document.getElementById('employeeFilter').value;
    
    if (!startDate || !endDate) {
        utils.showMessage(null, 'Pilih tanggal terlebih dahulu', 'error');
        return;
    }
    
    // Get filtered data
    const reportData = getFilteredReportData(startDate, endDate, employeeId);
    
    if (reportData.length === 0) {
        utils.showMessage(null, 'Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    // Create PDF using jsPDF (if available) or fallback to simple method
    if (typeof window.jspdf !== 'undefined') {
        createPDFWithJSPDF(reportData, startDate, endDate);
    } else {
        createSimplePDF(reportData, startDate, endDate);
    }
}

function createSimplePDF(data, startDate, endDate) {
    const employees = auth.getAllEmployees();
    const selectedEmployee = document.getElementById('employeeFilter').value;
    const summary = calculateReportSummary(data);
    
    // Create PDF content
    let pdfContent = `
        LAPORAN ABSENSI KARYAWAN
        =========================
        
        Periode: ${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}
        ${selectedEmployee === 'all' ? 
            `Jumlah Karyawan: ${new Set(data.map(d => d.employeeId)).size}` : 
            `Nama Karyawan: ${employees.find(e => e.id == selectedEmployee)?.name || '-'}`}
        Total Hari Kerja: ${summary.totalDays}
        Rata-rata Kehadiran: ${summary.averageAttendance}%
        Total Keterlambatan: ${summary.totalLateMinutes} menit
        
        =========================
        DETAIL ABSENSI:
        =========================
        
    `;
    
    let currentEmployee = '';
    data.forEach((item, index) => {
        if (item.employeeName !== currentEmployee) {
            currentEmployee = item.employeeName;
            pdfContent += `\n\n${currentEmployee.toUpperCase()}:\n`;
            pdfContent += ''.padEnd(50, '-') + '\n';
        }
        
        pdfContent += `
        ${index + 1}. ${utils.formatDate(item.date)} (${item.day})
           Masuk: ${item.inTime || '-'}
           Keluar: ${item.outTime || '-'}
           Durasi: ${item.duration}
           Status: ${item.status}
           Keterlambatan: ${item.lateMinutes > 0 ? `${item.lateMinutes} menit` : '-'}
           Catatan: ${item.notes.join('; ') || '-'}
        `.trim() + '\n';
    });
    
    pdfContent += `
        =========================
        Dicetak pada: ${new Date().toLocaleString('id-ID')}
        Sistem Absensi AUAS
    `;
    
    // Create download link
    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', `Laporan_Absensi_${startDate}_${endDate}.txt`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    utils.showMessage(null, 'File PDF/TXT berhasil didownload', 'success');
}

// For better PDF export, add jsPDF library
function loadJSPDFLibrary() {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = function() {
        console.log('jsPDF loaded successfully');
    };
    document.head.appendChild(script);
}

// Call this on page load
document.addEventListener('DOMContentLoaded', function() {
    loadJSPDFLibrary();
});


// ====== FUNGSI EKSPOR EXCEL YANG BENAR (Menggunakan SheetJS) ======

function exportToExcel() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const employeeId = document.getElementById('employeeFilter').value;
    
    if (!startDate || !endDate) {
        utils.showMessage(null, 'Pilih tanggal terlebih dahulu', 'error');
        return;
    }
    
    // Get filtered data
    const reportData = getFilteredReportData(startDate, endDate, employeeId);
    
    if (reportData.length === 0) {
        utils.showMessage(null, 'Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    try {
        // Create Excel workbook
        createExcelWorkbook(reportData, startDate, endDate, employeeId);
    } catch (error) {
        console.error('Error creating Excel:', error);
        utils.showMessage(null, 'Gagal membuat file Excel. Pastikan library SheetJS terload.', 'error');
        // Fallback to CSV
        exportToCSV(reportData, startDate, endDate);
    }
}

function createExcelWorkbook(data, startDate, endDate, employeeId) {
    // Check if XLSX library is available
    if (typeof XLSX === 'undefined') {
        throw new Error('XLSX library not loaded');
    }
    
    const employees = auth.getAllEmployees();
    const selectedEmployee = employeeId === 'all' ? null : 
        employees.find(e => e.id == employeeId);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // ====== SHEET 1: SUMMARY ======
    const summaryData = [
        ['LAPORAN ABSENSI KARYAWAN'],
        ['Sistem Absensi AUAS'],
        [],
        ['PERIODE LAPORAN'],
        [`Dari: ${utils.formatDate(startDate)}`],
        [`Sampai: ${utils.formatDate(endDate)}`],
        [`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`],
        [],
        ['FILTER'],
        [`Karyawan: ${selectedEmployee ? selectedEmployee.name : 'Semua Karyawan'}`],
        [],
        ['STATISTIK'],
    ];
    
    const summary = calculateReportSummary(data);
    summaryData.push([`Total Hari Kerja: ${summary.totalDays}`]);
    summaryData.push([`Total Data Absensi: ${data.length}`]);
    summaryData.push([`Rata-rata Kehadiran: ${summary.averageAttendance}%`]);
    summaryData.push([`Total Keterlambatan: ${summary.totalLateMinutes} menit`]);
    summaryData.push([]);
    summaryData.push(['KETERANGAN STATUS:']);
    summaryData.push(['Hadir: Kehadiran normal']);
    summaryData.push(['Terlambat: Masuk setelah jam kerja + toleransi']);
    summaryData.push(['Izin: Ijin tidak masuk kerja']);
    summaryData.push(['Sakit: Tidak masuk karena sakit']);
    summaryData.push(['Cuti: Cuti tahunan/izin khusus']);
    summaryData.push(['Alfa: Tidak masuk tanpa keterangan']);
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style summary sheet
    wsSummary['!cols'] = [{wch: 50}]; // Column width
    
    // ====== SHEET 2: DETAIL ABSENSI ======
    const detailHeaders = [
        'NO',
        'NAMA KARYAWAN',
        'TANGGAL',
        'HARI',
        'JAM MASUK',
        'JAM KELUAR',
        'DURASI KERJA',
        'STATUS',
        'KETERLAMBATAN (MENIT)',
        'CATATAN'
    ];
    
    const detailRows = data.map((item, index) => [
        index + 1,
        item.employeeName,
        utils.formatDate(item.date),
        item.day,
        item.inTime || '-',
        item.outTime || '-',
        item.duration,
        item.status,
        item.lateMinutes || 0,
        item.notes.join('; ') || '-'
    ]);
    
    const detailData = [detailHeaders, ...detailRows];
    const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
    
    // Style detail sheet
    wsDetail['!cols'] = [
        {wch: 5},   // NO
        {wch: 25},  // NAMA
        {wch: 12},  // TANGGAL
        {wch: 10},  // HARI
        {wch: 10},  // JAM MASUK
        {wch: 10},  // JAM KELUAR
        {wch: 12},  // DURASI
        {wch: 12},  // STATUS
        {wch: 15},  // KETERLAMBATAN
        {wch: 30}   // CATATAN
    ];
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detail Absensi");
    
    // ====== SHEET 3: REKAP PER KARYAWAN ======
    if (employeeId === 'all') {
        const rekapData = createEmployeeSummarySheet(data);
        const wsRekap = XLSX.utils.aoa_to_sheet(rekapData);
        wsRekap['!cols'] = [
            {wch: 25},  // NAMA
            {wch: 8},   // HADIR
            {wch: 8},   // TERLAMBAT
            {wch: 8},   // IZIN
            {wch: 8},   // SAKIT
            {wch: 8},   // CUTI
            {wch: 8},   // ALFA
            {wch: 12},  // % KEHADIRAN
            {wch: 15}   // TOTAL TERLAMBAT
        ];
        XLSX.utils.book_append_sheet(wb, wsRekap, "Rekap Karyawan");
    }
    
    // Generate filename
    const employeeName = selectedEmployee ? 
        selectedEmployee.name.replace(/\s+/g, '_') : 'Semua';
    const filename = `Laporan_Absensi_${employeeName}_${startDate}_${endDate}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
    
    utils.showMessage(null, `File Excel berhasil didownload: ${filename}`, 'success');
}

function createEmployeeSummarySheet(data) {
    // Group data by employee
    const employeeMap = {};
    
    data.forEach(item => {
        if (!employeeMap[item.employeeName]) {
            employeeMap[item.employeeName] = {
                name: item.employeeName,
                hadir: 0,
                terlambat: 0,
                izin: 0,
                sakit: 0,
                cuti: 0,
                alfa: 0,
                totalLate: 0,
                totalDays: new Set()
            };
        }
        
        const emp = employeeMap[item.employeeName];
        emp.totalDays.add(item.date);
        
        switch(item.status) {
            case 'Hadir':
                emp.hadir++;
                break;
            case 'Terlambat':
                emp.terlambat++;
                emp.totalLate += item.lateMinutes || 0;
                break;
            case 'Izin':
                emp.izin++;
                break;
            case 'Sakit':
                emp.sakit++;
                break;
            case 'Cuti':
                emp.cuti++;
                break;
            case 'Alfa':
                emp.alfa++;
                break;
        }
    });
    
    // Convert to array and calculate percentages
    const headers = [
        'NAMA KARYAWAN',
        'HADIR',
        'TERLAMBAT',
        'IZIN',
        'SAKIT',
        'CUTI',
        'ALFA',
        '% KEHADIRAN',
        'TOTAL TERLAMBAT (MENIT)'
    ];
    
    const rows = Object.values(employeeMap).map(emp => {
        const totalRecords = emp.hadir + emp.terlambat + emp.izin + emp.sakit + emp.cuti + emp.alfa;
        const attendanceRate = totalRecords > 0 ? 
            Math.round(((emp.hadir + emp.terlambat) / totalRecords) * 100) : 0;
        
        return [
            emp.name,
            emp.hadir,
            emp.terlambat,
            emp.izin,
            emp.sakit,
            emp.cuti,
            emp.alfa,
            `${attendanceRate}%`,
            emp.totalLate
        ];
    });
    
    // Sort by name
    rows.sort((a, b) => a[0].localeCompare(b[0]));
    
    return [headers, ...rows];
}

// ====== FALLBACK: EKSPOR CSV ======

function exportToCSV(data, startDate, endDate) {
    const headers = [
        'NO',
        'NAMA KARYAWAN',
        'TANGGAL',
        'HARI',
        'JAM MASUK',
        'JAM KELUAR',
        'DURASI KERJA',
        'STATUS',
        'KETERLAMBATAN (MENIT)',
        'CATATAN'
    ];
    
    const rows = data.map((item, index) => [
        index + 1,
        item.employeeName,
        utils.formatDate(item.date),
        item.day,
        item.inTime || '-',
        item.outTime || '-',
        item.duration,
        item.status,
        item.lateMinutes || 0,
        item.notes.join('; ') || '-'
    ]);
    
    // Create CSV content with BOM for Excel
    const csvContent = [
        '\ufeff' + headers.join(';'), // Use semicolon for better Excel compatibility
        ...rows.map(row => row.join(';'))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', `Laporan_Absensi_${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    utils.showMessage(null, `File CSV berhasil didownload`, 'success');
}

// ====== FUNGSI EKSPOR PDF YANG LEBIH BAIK ======

function exportToPDF() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const employeeId = document.getElementById('employeeFilter').value;
    
    if (!startDate || !endDate) {
        utils.showMessage(null, 'Pilih tanggal terlebih dahulu', 'error');
        return;
    }
    
    // Get filtered data
    const reportData = getFilteredReportData(startDate, endDate, employeeId);
    
    if (reportData.length === 0) {
        utils.showMessage(null, 'Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    try {
        // Try to use jsPDF if available
        if (typeof window.jspdf !== 'undefined') {
            createPDFWithJSPDF(reportData, startDate, endDate, employeeId);
        } else {
            // Fallback to CSV
            exportToCSV(reportData, startDate, endDate);
        }
    } catch (error) {
        console.error('Error creating PDF:', error);
        utils.showMessage(null, 'Gagal membuat PDF. Menggunakan CSV sebagai alternatif.', 'warning');
        exportToCSV(reportData, startDate, endDate);
    }
}

// Load libraries on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load SheetJS for Excel export
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = function() {
            console.log('SheetJS loaded successfully');
        };
        document.head.appendChild(script);
    }
});


// ====== DASHBOARD ADMIN YANG DIPERBAIKI ======

function getAdminDashboardHTML() {
    return `
        <div class="dashboard-header">
            <h2><i class="fas fa-tachometer-alt"></i> Dashboard Administrator</h2>
            <p class="dashboard-subtitle">Monitoring Real-time Kehadiran Karyawan</p>
        </div>
        
        <!-- ROW 1: REAL-TIME STATS -->
        <div class="row">
            <div class="col-md-3">
                <div class="stat-card today-stat">
                    <div class="stat-icon">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="todayPresent">0</h3>
                        <p>Hadir Hari Ini</p>
                        <div class="stat-trend" id="presentTrend">
                            <i class="fas fa-arrow-up"></i>
                            <span>0% dari kemarin</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stat-card today-stat">
                    <div class="stat-icon" style="background: rgba(248, 150, 30, 0.2); color: #f8961e;">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="todayLate">0</h3>
                        <p>Terlambat</p>
                        <div class="stat-trend" id="lateTrend">
                            <i class="fas fa-minus"></i>
                            <span>0 menit rata-rata</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stat-card today-stat">
                    <div class="stat-icon" style="background: rgba(247, 37, 133, 0.2); color: #f72585;">
                        <i class="fas fa-user-times"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="todayAbsent">0</h3>
                        <p>Tidak Hadir</p>
                        <div class="stat-trend" id="absentTrend">
                            <i class="fas fa-arrow-down"></i>
                            <span>0% dari total</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stat-card today-stat">
                    <div class="stat-icon" style="background: rgba(104, 237, 160, 0.2); color: #68eda0;">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="totalEmployees">0</h3>
                        <p>Total Karyawan</p>
                        <div class="stat-trend">
                            <i class="fas fa-chart-line"></i>
                            <span>Aktif: <span id="activeEmployees">0</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ROW 2: CHARTS & ATTENDANCE OVERVIEW -->
        <div class="row">
            <div class="col-md-8">
                <div class="card chart-card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-line"></i> Tren Kehadiran 30 Hari Terakhir</h3>
                        <div class="chart-filter">
                            <select id="chartPeriod" class="form-control-sm">
                                <option value="7">7 Hari</option>
                                <option value="14">14 Hari</option>
                                <option value="30" selected>30 Hari</option>
                            </select>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="attendanceTrendChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card status-card">
                    <div class="card-header">
                        <h3><i class="fas fa-pie-chart"></i> Status Kehadiran Hari Ini</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="attendancePieChart"></canvas>
                    </div>
                    <div class="chart-legend" id="pieChartLegend"></div>
                </div>
            </div>
        </div>
        
        <!-- ROW 3: RECENT ACTIVITY & TOP EMPLOYEES -->
        <div class="row">
            <div class="col-md-6">
                <div class="card activity-card">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Aktivitas Terkini</h3>
                        <button class="btn btn-sm btn-refresh" onclick="loadRecentActivity()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div class="activity-list" id="recentActivity">
                        <!-- Aktivitas akan dimuat di sini -->
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card ranking-card">
                    <div class="card-header">
                        <h3><i class="fas fa-trophy"></i> 5 Karyawan Terbaik Bulan Ini</h3>
                    </div>
                    <div class="ranking-list" id="topEmployees">
                        <!-- Top employees akan dimuat di sini -->
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ROW 4: EMPLOYEE ATTENDANCE TABLE -->
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-table"></i> Status Kehadiran Karyawan Hari Ini</h3>
                <div class="header-actions">
                    <button class="btn btn-sm btn-primary" onclick="refreshDashboard()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    <button class="btn btn-sm btn-success" onclick="exportTodayReport()">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="table dashboard-table" id="employeeAttendanceTable">
                    <thead>
                        <tr>
                            <th>Nama Karyawan</th>
                            <th>Jam Masuk</th>
                            <th>Jam Keluar</th>
                            <th>Status</th>
                            <th>Keterlambatan</th>
                            <th>Catatan</th>
                            <th>Terakhir Update</th>
                        </tr>
                    </thead>
                    <tbody id="employeeAttendanceBody">
                        <!-- Data akan dimuat di sini -->
                    </tbody>
                </table>
            </div>
            <div class="table-footer">
                <div class="footer-info">
                    <span class="last-update" id="lastUpdateTime">Terakhir update: -</span>
                    <span class="auto-refresh">Auto-refresh setiap 30 detik</span>
                </div>
            </div>
        </div>
        
        <!-- ROW 5: QUICK ACTIONS -->
        <div class="card quick-actions-card">
            <div class="card-header">
                <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
            </div>
            <div class="quick-actions">
                <button class="quick-action-btn" onclick="loadAdminContent('attendance')">
                    <i class="fas fa-clipboard-check"></i>
                    <span>Lihat Semua Absensi</span>
                </button>
                <button class="quick-action-btn" onclick="loadAdminContent('employees')">
                    <i class="fas fa-user-plus"></i>
                    <span>Tambah Karyawan</span>
                </button>
                <button class="quick-action-btn" onclick="exportDailyReport()">
                    <i class="fas fa-file-excel"></i>
                    <span>Export Harian</span>
                </button>
                <button class="quick-action-btn" onclick="sendReminder()">
                    <i class="fas fa-bell"></i>
                    <span>Kirim Pengingat</span>
                </button>
                <button class="quick-action-btn" onclick="loadAdminContent('settings')">
                    <i class="fas fa-cog"></i>
                    <span>Pengaturan</span>
                </button>
            </div>
        </div>
    `;
}

// ====== FUNGSI DASHBOARD YANG DIPERBAIKI ======

function setupAdminDashboard() {
    // Update real-time stats
    updateDashboardStats();
    
    // Load charts
    initializeAttendanceTrendChart();
    initializePieChart();
    
    // Load recent activity
    loadRecentActivity();
    
    // Load top employees
    loadTopEmployees();
    
    // Load employee attendance table
    loadEmployeeAttendanceTable();
    
    // Setup auto refresh
    setupAutoRefresh();
    
    // Update last update time
    updateLastUpdateTime();
}

function updateDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const allEmployees = auth.getAllEmployees();
    const attendanceData = auth.attendanceData;
    const settings = getWorkSettings();
    
    // Calculate today's stats
    const todayAttendance = attendanceData.filter(a => a.date === today && a.type === 'in');
    const todayPresent = todayAttendance.length;
    const todayLate = todayAttendance.filter(a => a.late).length;
    const todayAbsent = allEmployees.length - todayPresent;
    
    // Calculate yesterday's stats for comparison
    const yesterdayAttendance = attendanceData.filter(a => a.date === yesterdayStr && a.type === 'in');
    const yesterdayPresent = yesterdayAttendance.length;
    
    // Calculate trends
    const presentTrend = yesterdayPresent > 0 ? 
        Math.round(((todayPresent - yesterdayPresent) / yesterdayPresent) * 100) : 0;
    
    const averageLateMinutes = todayLate > 0 ? 
        Math.round(todayAttendance.filter(a => a.late)
            .reduce((sum, a) => sum + (a.lateMinutes || 0), 0) / todayLate) : 0;
    
    const absentPercentage = allEmployees.length > 0 ? 
        Math.round((todayAbsent / allEmployees.length) * 100) : 0;
    
    // Count active employees (those who have attended at least once this month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const activeEmployees = new Set(
        attendanceData
            .filter(a => {
                const recordDate = new Date(a.date);
                return recordDate.getMonth() === currentMonth && 
                       recordDate.getFullYear() === currentYear &&
                       a.type === 'in';
            })
            .map(a => a.userId)
    ).size;
    
    // Update DOM
    document.getElementById('todayPresent').textContent = todayPresent;
    document.getElementById('todayLate').textContent = todayLate;
    document.getElementById('todayAbsent').textContent = todayAbsent;
    document.getElementById('totalEmployees').textContent = allEmployees.length;
    document.getElementById('activeEmployees').textContent = activeEmployees;
    
    // Update trends
    const presentTrendElem = document.getElementById('presentTrend');
    const lateTrendElem = document.getElementById('lateTrend');
    const absentTrendElem = document.getElementById('absentTrend');
    
    if (presentTrendElem) {
        presentTrendElem.innerHTML = `
            <i class="fas fa-arrow-${presentTrend >= 0 ? 'up' : 'down'}"></i>
            <span>${Math.abs(presentTrend)}% dari kemarin</span>
        `;
        presentTrendElem.className = `stat-trend ${presentTrend >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (lateTrendElem) {
        lateTrendElem.innerHTML = `
            <i class="fas fa-clock"></i>
            <span>${averageLateMinutes} menit rata-rata</span>
        `;
    }
    
    if (absentTrendElem) {
        absentTrendElem.innerHTML = `
            <i class="fas fa-chart-pie"></i>
            <span>${absentPercentage}% dari total</span>
        `;
    }
}

function initializeAttendanceTrendChart() {
    const canvas = document.getElementById('attendanceTrendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const period = parseInt(document.getElementById('chartPeriod')?.value || 30);
    
    // Get data for selected period
    const trendData = getAttendanceTrendData(period);
    
    // Destroy existing chart if any
    if (window.attendanceTrendChartInstance) {
        window.attendanceTrendChartInstance.destroy();
    }
    
    // Create new chart
    window.attendanceTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.labels,
            datasets: [
                {
                    label: 'Hadir',
                    data: trendData.presentData,
                    borderColor: '#4cc9f0',
                    backgroundColor: 'rgba(76, 201, 240, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Terlambat',
                    data: trendData.lateData,
                    borderColor: '#f8961e',
                    backgroundColor: 'rgba(248, 150, 30, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Jumlah Karyawan'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Tanggal'
                    }
                }
            }
        }
    });
    
    // Add event listener for period change
    const periodSelect = document.getElementById('chartPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', initializeAttendanceTrendChart);
    }
}

function getAttendanceTrendData(days = 30) {
    const attendanceData = auth.attendanceData;
    const labels = [];
    const presentData = new Array(days).fill(0);
    const lateData = new Array(days).fill(0);
    
    const today = new Date();
    
    // Generate labels for the last X days
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('id-ID', { 
            day: '2-digit',
            month: 'short'
        }));
    }
    
    // Count attendance per day
    attendanceData.forEach(record => {
        const recordDate = new Date(record.date);
        const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < days && record.type === 'in') {
            const index = days - 1 - diffDays;
            presentData[index]++;
            if (record.late) {
                lateData[index]++;
            }
        }
    });
    
    return {
        labels,
        presentData,
        lateData
    };
}

function initializePieChart() {
    const canvas = document.getElementById('attendancePieChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const today = new Date().toISOString().split('T')[0];
    const allEmployees = auth.getAllEmployees();
    const attendanceData = auth.attendanceData;
    
    // Get today's attendance
    const todayAttendance = attendanceData.filter(a => a.date === today && a.type === 'in');
    const presentCount = todayAttendance.length;
    const lateCount = todayAttendance.filter(a => a.late).length;
    const absentCount = allEmployees.length - presentCount;
    const onTimeCount = presentCount - lateCount;
    
    // Destroy existing chart if any
    if (window.attendancePieChartInstance) {
        window.attendancePieChartInstance.destroy();
    }
    
    // Create pie chart
    window.attendancePieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tepat Waktu', 'Terlambat', 'Tidak Hadir'],
            datasets: [{
                data: [onTimeCount, lateCount, absentCount],
                backgroundColor: [
                    '#4cc9f0',  // On time - blue
                    '#f8961e',  // Late - orange
                    '#f72585'   // Absent - pink
                ],
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
    
    // Update legend
    updatePieChartLegend([onTimeCount, lateCount, absentCount]);
}

function updatePieChartLegend(data) {
    const legendDiv = document.getElementById('pieChartLegend');
    if (!legendDiv) return;
    
    const labels = ['Tepat Waktu', 'Terlambat', 'Tidak Hadir'];
    const colors = ['#4cc9f0', '#f8961e', '#f72585'];
    const total = data.reduce((a, b) => a + b, 0);
    
    legendDiv.innerHTML = labels.map((label, index) => {
        const value = data[index];
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        
        return `
            <div class="legend-item">
                <span class="legend-color" style="background: ${colors[index]}"></span>
                <span class="legend-label">${label}</span>
                <span class="legend-value">${value} (${percentage}%)</span>
            </div>
        `;
    }).join('');
}

function loadRecentActivity() {
    const activityDiv = document.getElementById('recentActivity');
    if (!activityDiv) return;
    
    const attendanceData = auth.attendanceData;
    const employees = auth.getAllEmployees();
    
    // Get last 10 activities
    const recentActivities = [...attendanceData]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
    
    activityDiv.innerHTML = recentActivities.map(record => {
        const employee = employees.find(e => e.id === record.userId);
        const employeeName = employee ? employee.name.split(',')[0] : 'Unknown';
        const timeAgo = getTimeAgo(record.timestamp);
        
        let activityText = '';
        let icon = '';
        let iconColor = '';
        
        if (record.type === 'in') {
            activityText = record.late ? 'terlambat masuk' : 'masuk kerja';
            icon = record.late ? 'fa-clock' : 'fa-sign-in-alt';
            iconColor = record.late ? '#f8961e' : '#4cc9f0';
        } else if (record.type === 'out') {
            activityText = 'keluar kerja';
            icon = 'fa-sign-out-alt';
            iconColor = '#7209b7';
        } else if (record.type === 'leave') {
            activityText = `mengajukan ${record.leaveType === 'permission' ? 'izin' : 
                          record.leaveType === 'sick' ? 'sakit' : 'cuti'}`;
            icon = 'fa-file-medical';
            iconColor = '#17a2b8';
        }
        
        return `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${iconColor}20; color: ${iconColor}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">
                        <strong>${employeeName}</strong> ${activityText}
                    </div>
                    <div class="activity-details">
                        <span class="activity-time">${record.time}</span>
                        <span class="activity-date">${utils.formatDate(record.date)}</span>
                    </div>
                </div>
                <div class="activity-timeago">${timeAgo}</div>
            </div>
        `;
    }).join('');
    
    // If no activities
    if (recentActivities.length === 0) {
        activityDiv.innerHTML = `
            <div class="empty-activity">
                <i class="fas fa-history fa-2x"></i>
                <p>Belum ada aktivitas hari ini</p>
            </div>
        `;
    }
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
}

function loadTopEmployees() {
    const topEmployeesDiv = document.getElementById('topEmployees');
    if (!topEmployeesDiv) return;
    
    const employees = auth.getAllEmployees();
    const attendanceData = auth.attendanceData;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculate scores for each employee
    const employeeScores = employees.map(emp => {
        const empAttendance = attendanceData.filter(a => 
            a.userId === emp.id && 
            new Date(a.date).getMonth() === currentMonth &&
            new Date(a.date).getFullYear() === currentYear
        );
        
        const presentDays = empAttendance.filter(a => a.type === 'in').length;
        const lateDays = empAttendance.filter(a => a.late).length;
        const totalLateMinutes = empAttendance
            .filter(a => a.late)
            .reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
        
        // Calculate score (higher is better)
        const baseScore = presentDays * 10;
        const latePenalty = lateDays * 5 + totalLateMinutes * 0.1;
        const score = Math.max(0, baseScore - latePenalty);
        
        // Calculate attendance percentage
        const workDays = 22; // Assuming 22 work days per month
        const attendancePercentage = Math.round((presentDays / workDays) * 100);
        
        return {
            ...emp,
            score: Math.round(score),
            presentDays,
            lateDays,
            totalLateMinutes,
            attendancePercentage
        };
    });
    
    // Sort by score (descending)
    employeeScores.sort((a, b) => b.score - a.score);
    
    // Get top 5
    const top5 = employeeScores.slice(0, 5);
    
    // Display top employees
    topEmployeesDiv.innerHTML = top5.map((emp, index) => {
        const rank = index + 1;
        let rankClass = '';
        
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';
        
        return `
            <div class="ranking-item ${rankClass}">
                <div class="rank-badge">${rank}</div>
                <div class="employee-avatar">
                    ${emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div class="employee-details">
                    <h4>${emp.name.split(',')[0]}</h4>
                    <p class="employee-stats">
                        <span><i class="fas fa-calendar-check"></i> ${emp.presentDays} hari</span>
                        <span><i class="fas fa-percentage"></i> ${emp.attendancePercentage}%</span>
                    </p>
                </div>
                <div class="employee-score">
                    <span class="score">${emp.score}</span>
                    <span class="score-label">poin</span>
                </div>
            </div>
        `;
    }).join('');
}

function loadEmployeeAttendanceTable() {
    const tableBody = document.getElementById('employeeAttendanceBody');
    if (!tableBody) return;
    
    const today = new Date().toISOString().split('T')[0];
    const employees = auth.getAllEmployees();
    const attendanceData = auth.attendanceData;
    
    // Sort employees by name
    employees.sort((a, b) => a.name.localeCompare(b.name));
    
    tableBody.innerHTML = employees.map(emp => {
        // Get today's attendance for this employee
        const empTodayAttendance = attendanceData.filter(a => 
            a.userId === emp.id && a.date === today
        );
        
        const checkIn = empTodayAttendance.find(a => a.type === 'in');
        const checkOut = empTodayAttendance.find(a => a.type === 'out');
        
        let status = 'Belum Absen';
        let statusClass = 'status-absence';
        let lateMinutes = '-';
        let notes = '-';
        let lastUpdate = '-';
        
        if (checkIn) {
            if (checkIn.late) {
                status = 'Terlambat';
                statusClass = 'status-late';
                lateMinutes = `${checkIn.lateMinutes || 0} menit`;
            } else {
                status = 'Hadir';
                statusClass = 'status-present';
            }
            
            if (checkOut) {
                status = 'Selesai';
                statusClass = 'status-success';
            }
            
            notes = checkIn.note || '-';
            lastUpdate = checkIn.time;
        }
        
        // If employee has leave record
        const leaveRecord = empTodayAttendance.find(a => a.type === 'leave');
        if (leaveRecord) {
            status = leaveRecord.leaveType === 'permission' ? 'Izin' : 
                    leaveRecord.leaveType === 'sick' ? 'Sakit' : 'Cuti';
            statusClass = 'status-info';
            notes = leaveRecord.note || '-';
            lastUpdate = leaveRecord.time;
        }
        
        return `
            <tr>
                <td class="employee-name">
                    <div class="name-with-avatar">
                        <div class="table-avatar">
                            ${emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        ${emp.name}
                    </div>
                </td>
                <td>${checkIn ? checkIn.time : '-'}</td>
                <td>${checkOut ? checkOut.time : '-'}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${lateMinutes}</td>
                <td class="notes-cell">${notes}</td>
                <td>${lastUpdate}</td>
            </tr>
        `;
    }).join('');
}

function setupAutoRefresh() {
    // Auto refresh every 30 seconds
    if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
    }
    
    window.dashboardRefreshInterval = setInterval(() => {
        if (document.getElementById('employeeAttendanceBody')) {
            refreshDashboard();
        }
    }, 30000); // 30 seconds
}

function refreshDashboard() {
    updateDashboardStats();
    initializePieChart();
    loadRecentActivity();
    loadEmployeeAttendanceTable();
    updateLastUpdateTime();
}

function updateLastUpdateTime() {
    const lastUpdateElem = document.getElementById('lastUpdateTime');
    if (lastUpdateElem) {
        const now = new Date();
        lastUpdateElem.textContent = `Terakhir update: ${now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })}`;
    }
}

function exportDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const reportData = getFilteredReportData(today, today, 'all');
    
    if (reportData.length === 0) {
        utils.showMessage(null, 'Tidak ada data untuk hari ini', 'warning');
        return;
    }
    
    try {
        createExcelWorkbook(reportData, today, today, 'all');
        utils.showMessage(null, 'Laporan harian berhasil diexport', 'success');
    } catch (error) {
        console.error('Export error:', error);
        utils.showMessage(null, 'Gagal export laporan harian', 'error');
    }
}

function sendReminder() {
    const today = new Date().toISOString().split('T')[0];
    const employees = auth.getAllEmployees();
    const attendanceData = auth.attendanceData;
    
    // Find employees who haven't checked in today
    const absentEmployees = employees.filter(emp => {
        const hasCheckedIn = attendanceData.some(a => 
            a.userId === emp.id && a.date === today && a.type === 'in'
        );
        return !hasCheckedIn;
    });
    
    if (absentEmployees.length === 0) {
        utils.showMessage(null, 'Semua karyawan sudah absen hari ini', 'info');
        return;
    }
    
    // Show confirmation
    if (confirm(`Kirim pengingat ke ${absentEmployees.length} karyawan yang belum absen?`)) {
        // In a real system, this would send email/SMS
        utils.showMessage(null, 
            `Pengingat dikirim ke ${absentEmployees.length} karyawan`, 
            'success'
        );
        
        // Log the action
        console.log('Reminder sent to:', absentEmployees.map(e => e.name));
    }
}
