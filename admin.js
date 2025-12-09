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
