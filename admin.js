// ====== INISIALISASI ======

// Inisialisasi pengaturan
function initializeSettings() {
    if (!localStorage.getItem('workSettings')) {
        const defaultSettings = {
            workStartTime: '07:30',
            workEndTime: '15:30',
            lateTolerance: 0,
            workDays: [1, 2, 3, 4, 5, 6],
            autoHoliday: true
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

// ====== NAVIGASI ======

// Setup navigation menu for admin
function setupAdminNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    
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

// ====== LOAD DASHBOARD ======

// Load admin dashboard
function loadAdminDashboard() {
    const currentUser = auth.checkAuth();
    if (!currentUser) return;
    
    // Update user info
    updateUserInfo(currentUser);
    utils.updateCurrentDate();
    
    // Setup navigation
    setupAdminNavigation();
    
    // Load default content
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
            setupSettingsPage();
            break;
        default:
            contentArea.innerHTML = getAdminDashboardHTML();
            setupAdminDashboard();
    }
}

// ====== DASHBOARD UTAMA (DIPERBAIKI) ======

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

// Setup admin dashboard
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

// Update dashboard statistics
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
    const todayPresentElem = document.getElementById('todayPresent');
    const todayLateElem = document.getElementById('todayLate');
    const todayAbsentElem = document.getElementById('todayAbsent');
    const totalEmployeesElem = document.getElementById('totalEmployees');
    const activeEmployeesElem = document.getElementById('activeEmployees');
    
    if (todayPresentElem) todayPresentElem.textContent = todayPresent;
    if (todayLateElem) todayLateElem.textContent = todayLate;
    if (todayAbsentElem) todayAbsentElem.textContent = todayAbsent;
    if (totalEmployeesElem) totalEmployeesElem.textContent = allEmployees.length;
    if (activeEmployeesElem) activeEmployeesElem.textContent = activeEmployees;
    
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

// ====== CHARTS ======

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

// ====== ACTIVITY & EMPLOYEE DATA ======

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

// ====== AUTO REFRESH ======

function setupAutoRefresh() {
    // Auto refresh every 30 seconds
    if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
    }
    
    window.dashboardRefreshInterval = setInterval(() => {
        if (document.getElementById('employeeAttendanceBody')) {
            refreshDashboard();
        }
    }, 30000);
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

// ====== QUICK ACTIONS ======

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

// ====== PENGATURAN ======

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
                                    <input type="checkbox" id="autoHoliday" ${settings.
