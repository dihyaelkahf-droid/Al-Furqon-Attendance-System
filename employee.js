// employee.js - Sistem Absensi Karyawan

// ====== VARIABEL GLOBAL ======
let currentUser = null;

// ====== FUNGSI UTILITAS ======

// Fungsi untuk mendapatkan pengaturan jam kerja
function getWorkSettings() {
    return JSON.parse(localStorage.getItem('workSettings')) || {
        workStartTime: '07:30',
        workEndTime: '15:30',
        lateTolerance: 0,
        workDays: [1, 2, 3, 4, 5, 6], // Senin-Sabtu
        autoHoliday: true
    };
}

// Fungsi untuk cek apakah hari ini hari libur
function isTodayHoliday() {
    const settings = getWorkSettings();
    const today = new Date().getDay(); // 0 = Minggu, 1 = Senin, dst
    
    // Cek jika Minggu dan auto holiday aktif
    if (settings.autoHoliday && today === 0) {
        return true;
    }
    
    // Cek apakah hari termasuk dalam hari kerja
    return !settings.workDays.includes(today);
}

// Fungsi helper untuk menghitung waktu terlambat
function calculateLateTime(settings) {
    if (settings.lateTolerance === 0) {
        return settings.workStartTime;
    }
    
    const [hours, minutes] = settings.workStartTime.split(':');
    const startTime = new Date();
    startTime.setHours(parseInt(hours), parseInt(minutes) + settings.lateTolerance, 0, 0);
    
    return startTime.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Fungsi untuk mencatat absensi dengan pengaturan
function recordAttendanceWithSettings(userId, type, note = '') {
    const now = new Date();
    const settings = getWorkSettings();
    
    // Cek apakah hari ini hari kerja
    if (isTodayHoliday()) {
        return { 
            success: false, 
            message: 'Hari ini adalah hari libur' 
        };
    }
    
    // Cek apakah sudah ada absensi
    const today = now.toISOString().split('T')[0];
    const attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
    
    if (type === 'in') {
        const hasCheckedIn = attendanceData.some(a => 
            a.userId === userId && a.date === today && a.type === 'in'
        );
        
        if (hasCheckedIn) {
            return { 
                success: false, 
                message: 'Anda sudah melakukan absensi masuk hari ini' 
            };
        }
    } else if (type === 'out') {
        const hasCheckedIn = attendanceData.some(a => 
            a.userId === userId && a.date === today && a.type === 'in'
        );
        
        if (!hasCheckedIn) {
            return { 
                success: false, 
                message: 'Anda belum melakukan absensi masuk hari ini' 
            };
        }
        
        const hasCheckedOut = attendanceData.some(a => 
            a.userId === userId && a.date === today && a.type === 'out'
        );
        
        if (hasCheckedOut) {
            return { 
                success: false, 
                message: 'Anda sudah melakukan absensi keluar hari ini' 
            };
        }
    }
    
    const attendanceRecord = {
        id: Date.now(),
        userId: userId,
        date: today,
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: type,
        note: note,
        timestamp: now.getTime()
    };
    
    // Validasi untuk absen masuk
    if (type === 'in') {
        const workStart = new Date();
        const [hours, minutes] = settings.workStartTime.split(':');
        workStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Apply late tolerance
        const toleranceMs = settings.lateTolerance * 60 * 1000;
        const adjustedStart = new Date(workStart.getTime() + toleranceMs);
        
        if (now > adjustedStart) {
            attendanceRecord.late = true;
            attendanceRecord.lateMinutes = Math.floor((now - workStart) / (1000 * 60));
            attendanceRecord.lateMinutes = Math.max(0, attendanceRecord.lateMinutes - settings.lateTolerance);
        }
    }
    
    // Validasi untuk absen keluar
    if (type === 'out') {
        const workEnd = new Date();
        const [hours, minutes] = settings.workEndTime.split(':');
        workEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (now < workEnd) {
            return { 
                success: false, 
                message: `Belum waktunya absen keluar. Jam keluar: ${settings.workEndTime}` 
            };
        }
    }
    
    // Save to attendance data
    attendanceData.push(attendanceRecord);
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    
    return { success: true, data: attendanceRecord };
}

// ====== SETUP DASHBOARD ======

function setupDashboard() {
    currentUser = auth.checkAuth();
    if (!currentUser) return;
    
    // Update informasi user
    updateUserInfo();
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
}

function updateUserInfo() {
    if (!currentUser) return;
    
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    const userRoleElement = document.getElementById('userRole');
    
    if (userNameElement) userNameElement.textContent = currentUser.name;
    if (userAvatarElement) userAvatarElement.textContent = currentUser.name.charAt(0).toUpperCase();
    if (userRoleElement) userRoleElement.textContent = currentUser.role === 'admin' ? 'Administrator' : 'Karyawan';
    
    updateCurrentDate();
}

function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('id-ID', options);
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Load content
            loadEmployeeContent(target);
        });
    });
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            auth.logout();
        });
    }
    
    // Close modal buttons
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            const modal = document.getElementById('noteModal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('noteModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// ====== LOAD CONTENT FUNCTIONS ======

function loadEmployeeDashboard() {
    loadEmployeeContent('attendance');
}

function loadEmployeeContent(target) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    currentUser = auth.checkAuth();
    if (!currentUser) return;
    
    switch(target) {
        case 'attendance':
            contentArea.innerHTML = getAttendanceFormHTML();
            setupAttendanceForm();
            break;
        case 'history':
            contentArea.innerHTML = getAttendanceHistoryHTML();
            loadAttendanceHistory(currentUser.id);
            break;
        case 'profile':
            contentArea.innerHTML = getProfileHTML(currentUser);
            setupProfileForm(currentUser);
            break;
        case 'ranking':
            contentArea.innerHTML = getRankingHTML();
            loadEmployeeRanking();
            break;
        default:
            contentArea.innerHTML = getAttendanceFormHTML();
            setupAttendanceForm();
    }
}

// ====== ATTENDANCE FORM ======

function getAttendanceFormHTML() {
    const now = new Date();
    const settings = getWorkSettings();
    const isHoliday = isTodayHoliday();
    
    if (isHoliday) {
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = dayNames[now.getDay()];
        
        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-calendar-check"></i> Absensi Hari Ini</h3>
                </div>
                <div class="holiday-message">
                    <div class="holiday-icon">
                        <i class="fas fa-umbrella-beach"></i>
                    </div>
                    <h2>Hari Libur!</h2>
                    <p>Hari ini adalah hari ${dayName}, tidak ada jadwal kerja.</p>
                    <p>Jam kerja yang berlaku: ${settings.workStartTime} - ${settings.workEndTime}</p>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-info-circle"></i> Informasi Kehadiran</h3>
                </div>
                <div class="attendance-info">
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <h4>Jam Kerja</h4>
                            <p>${settings.workStartTime} - ${settings.workEndTime}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-times"></i>
                        <div>
                            <h4>Hari Libur</h4>
                            <p>${settings.autoHoliday ? 'Minggu dan hari libur nasional' : 'Hanya hari libur nasional'}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-hourglass-half"></i>
                        <div>
                            <h4>Toleransi Keterlambatan</h4>
                            <p>${settings.lateTolerance} menit</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[now.getDay()];
    
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-calendar-check"></i> Absensi Hari Ini</h3>
                <span class="current-date-display">${dayName}, ${formatDate(new Date().toISOString())}</span>
            </div>
            
            <div class="attendance-status" id="attendanceStatus">
                <!-- Status will be loaded here -->
            </div>
            
            <div class="attendance-form">
                <div class="time-display" id="liveTime">00:00:00</div>
                
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="text" id="attendanceDate" value="${formatDate(new Date().toISOString())}" readonly>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Waktu Kerja</label>
                        <input type="text" id="workTimeDisplay" value="${settings.workStartTime} - ${settings.workEndTime}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Toleransi Keterlambatan</label>
                        <input type="text" id="lateToleranceDisplay" value="${settings.lateTolerance} menit" readonly>
                    </div>
                </div>
                
                <div class="attendance-buttons" id="attendanceButtons">
                    <!-- Buttons will be loaded here -->
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-chart-line"></i> Statistik Bulan Ini</h3>
            </div>
            <div class="stats-grid" id="monthlyStats">
                <!-- Statistics will be loaded here -->
            </div>
        </div>
    `;
}

function setupAttendanceForm() {
    if (!currentUser) return;
    
    updateAttendanceStatus();
    setupLiveClock();
    loadMonthlyStats(currentUser.id);
    
    // Auto-refresh setiap 30 detik
    setInterval(() => {
        updateAttendanceStatus();
    }, 30000);
}

function updateAttendanceStatus() {
    if (!currentUser) return;
    
    const statusDiv = document.getElementById('attendanceStatus');
    const buttonsDiv = document.getElementById('attendanceButtons');
    if (!statusDiv || !buttonsDiv) return;
    
    const today = new Date().toISOString().split('T')[0];
    const userAttendance = auth.getAttendanceHistory(currentUser.id, 'today');
    const hasCheckedIn = userAttendance.some(a => a.type === 'in');
    const hasCheckedOut = userAttendance.some(a => a.type === 'out');
    const checkInRecord = userAttendance.find(a => a.type === 'in');
    const checkOutRecord = userAttendance.find(a => a.type === 'out');
    const settings = getWorkSettings();
    
    // Update status display
    let statusHTML = '';
    let buttonsHTML = '';
    
    if (hasCheckedIn && hasCheckedOut) {
        statusHTML = `
            <div class="status-card success">
                <i class="fas fa-check-circle"></i>
                <div>
                    <h4>Absensi Selesai</h4>
                    <p>Anda telah melakukan absensi masuk dan keluar hari ini</p>
                    <p class="time-info">
                        Masuk: ${checkInRecord.time}${checkInRecord.late ? ' (Terlambat)' : ''} | 
                        Keluar: ${checkOutRecord.time}
                    </p>
                </div>
            </div>
        `;
        
        buttonsHTML = `
            <button class="btn btn-secondary disabled" disabled>
                <i class="fas fa-check"></i> Absensi Selesai
            </button>
        `;
    } else if (hasCheckedIn && !hasCheckedOut) {
        // Cek apakah sudah bisa absen keluar
        const now = new Date();
        const [hours, minutes] = settings.workEndTime.split(':');
        const workEnd = new Date();
        workEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const canCheckOut = now >= workEnd;
        
        statusHTML = `
            <div class="status-card warning">
                <i class="fas fa-clock"></i>
                <div>
                    <h4>Sudah Absen Masuk</h4>
                    <p>Anda telah melakukan absensi masuk pada pukul ${checkInRecord.time}${checkInRecord.late ? ' (Terlambat)' : ''}</p>
                    <p class="time-info">Silakan lakukan absensi keluar setelah jam kerja selesai</p>
                </div>
            </div>
        `;
        
        buttonsHTML = `
            <button class="btn btn-primary" id="checkOutBtn" ${!canCheckOut ? 'disabled' : ''}>
                <i class="fas fa-sign-out-alt"></i> Absen Keluar
            </button>
            ${!canCheckOut ? `<p class="info-text">Absen keluar tersedia setelah pukul ${settings.workEndTime}</p>` : ''}
        `;
    } else {
        statusHTML = `
            <div class="status-card info">
                <i class="fas fa-calendar-day"></i>
                <div>
                    <h4>Belum Absen</h4>
                    <p>Anda belum melakukan absensi masuk hari ini</p>
                    <p class="time-info">Silakan lakukan absensi masuk sebelum memulai kerja</p>
                </div>
            </div>
        `;
        
        buttonsHTML = `
            <button class="btn btn-success" id="checkInBtn">
                <i class="fas fa-sign-in-alt"></i> Absen Masuk
            </button>
            <button class="btn btn-secondary" id="requestLeaveBtn">
                <i class="fas fa-file-medical"></i> Ajukan Izin/Sakit
            </button>
            <p class="info-text">Jam masuk: ${settings.workStartTime} (toleransi: ${settings.lateTolerance} menit)</p>
        `;
    }
    
    statusDiv.innerHTML = statusHTML;
    buttonsDiv.innerHTML = buttonsHTML;
    
    // Add event listeners
    if (document.getElementById('checkInBtn')) {
        document.getElementById('checkInBtn').addEventListener('click', () => showNoteModal('in'));
    }
    
    if (document.getElementById('checkOutBtn')) {
        document.getElementById('checkOutBtn').addEventListener('click', () => showNoteModal('out'));
    }
    
    if (document.getElementById('requestLeaveBtn')) {
        document.getElementById('requestLeaveBtn').addEventListener('click', showLeaveRequestModal);
    }
}

function setupLiveClock() {
    const liveTime = document.getElementById('liveTime');
    if (!liveTime) return;
    
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        liveTime.textContent = timeString;
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

// ====== MODAL FUNCTIONS ======

function showNoteModal(type) {
    if (!currentUser) return;
    
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('noteModalTitle');
    const noteForm = document.getElementById('noteForm');
    const submitBtn = document.getElementById('noteSubmitBtn');
    const settings = getWorkSettings();
    
    // Cek apakah hari libur
    if (isTodayHoliday()) {
        showMessage('Hari ini adalah hari libur', 'warning');
        return;
    }
    
    if (type === 'in') {
        modalTitle.textContent = 'Absen Masuk';
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Absen Masuk';
    } else {
        modalTitle.textContent = 'Absen Keluar';
        submitBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Absen Keluar';
    }
    
    // Clear previous info
    const existingInfo = noteForm.querySelector('.modal-info');
    if (existingInfo) existingInfo.remove();
    
    // Add info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'modal-info';
    infoDiv.innerHTML = type === 'in' ? 
        `<p><i class="fas fa-clock"></i> Jam masuk kerja: <strong>${settings.workStartTime}</strong></p>
         <p><i class="fas fa-hourglass-half"></i> Toleransi: <strong>${settings.lateTolerance} menit</strong></p>` :
        `<p><i class="fas fa-clock"></i> Jam keluar kerja: <strong>${settings.workEndTime}</strong></p>`;
    
    noteForm.insertBefore(infoDiv, noteForm.firstChild);
    
    // Show modal
    modal.classList.add('active');
    
    // Handle form submission
    noteForm.onsubmit = function(e) {
        e.preventDefault();
        const note = document.getElementById('noteText').value;
        
        const result = recordAttendanceWithSettings(
            currentUser.id,
            type,
            note
        );
        
        if (result.success) {
            modal.classList.remove('active');
            updateAttendanceStatus();
            loadMonthlyStats(currentUser.id);
            showMessage(
                type === 'in' ? 'Absen masuk berhasil!' : 'Absen keluar berhasil!', 
                'success'
            );
        } else {
            showMessage(result.message, 'error');
        }
        
        // Clear note field
        document.getElementById('noteText').value = '';
        
        // Remove info div
        infoDiv.remove();
    };
}

function showLeaveRequestModal() {
    if (!currentUser) return;
    
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('noteModalTitle');
    const noteForm = document.getElementById('noteForm');
    const submitBtn = document.getElementById('noteSubmitBtn');
    
    modalTitle.textContent = 'Ajukan Izin/Sakit';
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Ajukan Permohonan';
    
    // Replace form content
    const noteText = document.getElementById('noteText');
    noteText.parentElement.innerHTML = `
        <div class="form-group">
            <label>Jenis</label>
            <select id="leaveType" class="form-control">
                <option value="permission">Izin</option>
                <option value="sick">Sakit</option>
                <option value="leave">Cuti</option>
            </select>
        </div>
        <div class="form-group">
            <label>Keterangan</label>
            <textarea id="leaveNote" rows="4" placeholder="Masukkan alasan/keterangan..." required></textarea>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    
    // Handle form submission
    noteForm.onsubmit = function(e) {
        e.preventDefault();
        const leaveType = document.getElementById('leaveType').value;
        const leaveNote = document.getElementById('leaveNote').value;
        
        const attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
        
        const leaveRecord = {
            id: Date.now(),
            userId: currentUser.id,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            type: 'leave',
            leaveType: leaveType,
            note: leaveNote,
            timestamp: Date.now()
        };
        
        attendanceData.push(leaveRecord);
        localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
        
        modal.classList.remove('active');
        updateAttendanceStatus();
        showMessage('Permohonan berhasil dikirim', 'success');
        
        // Restore original form
        loadEmployeeContent('attendance');
    };
}

// ====== STATISTICS FUNCTIONS ======

function loadMonthlyStats(userId) {
    const statsDiv = document.getElementById('monthlyStats');
    if (!statsDiv) return;
    
    const stats = auth.getAttendanceStats(userId);
    const userAttendance = auth.getAttendanceHistory(userId, 'month');
    const presentDays = userAttendance.filter(a => a.type === 'in').length;
    const lateDays = userAttendance.filter(a => a.late).length;
    const leaveDays = userAttendance.filter(a => a.type === 'leave').length;
    const workDays = 22; // Asumsi 22 hari kerja per bulan
    
    statsDiv.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(76, 201, 240, 0.2); color: #4cc9f0;">
                <i class="fas fa-calendar-check"></i>
            </div>
            <div class="stat-info">
                <h4>${presentDays}/${workDays}</h4>
                <p>Hari Hadir</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(248, 150, 30, 0.2); color: #f8961e;">
                <i class="fas fa-clock"></i>
            </div>
            <div class="stat-info">
                <h4>${lateDays}</h4>
                <p>Keterlambatan</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(104, 237, 160, 0.2); color: #68eda0;">
                <i class="fas fa-percentage"></i>
            </div>
            <div class="stat-info">
                <h4>${Math.round((presentDays / workDays) * 100)}%</h4>
                <p>Kehadiran</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(157, 78, 221, 0.2); color: #9d4edd;">
                <i class="fas fa-trophy"></i>
            </div>
            <div class="stat-info">
                <h4>-</h4>
                <p>Ranking</p>
            </div>
        </div>
    `;
}

// ====== ATTENDANCE HISTORY ======

function getAttendanceHistoryHTML() {
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-history"></i> Riwayat Absensi Saya</h3>
                <div class="filter-controls">
                    <select id="historyFilter" class="form-control">
                        <option value="today">Hari Ini</option>
                        <option value="week">Minggu Ini</option>
                        <option value="month">Bulan Ini</option>
                        <option value="all">Semua</option>
                    </select>
                </div>
            </div>
            <div class="table-container">
                <table class="table" id="attendanceHistoryTable">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Hari</th>
                            <th>Masuk</th>
                            <th>Keluar</th>
                            <th>Status</th>
                            <th>Catatan</th>
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

function loadAttendanceHistory(userId) {
    const tableBody = document.querySelector('#attendanceHistoryTable tbody');
    const filterSelect = document.getElementById('historyFilter');
    if (!tableBody || !filterSelect) return;
    
    function renderHistory(filter) {
        let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
        attendanceData = attendanceData.filter(a => a.userId === userId);
        
        // Apply filter
        const now = new Date();
        switch(filter) {
            case 'today':
                const today = now.toISOString().split('T')[0];
                attendanceData = attendanceData.filter(a => a.date === today);
                break;
            case 'week':
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                attendanceData = attendanceData.filter(a => new Date(a.date) >= oneWeekAgo);
                break;
            case 'month':
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                attendanceData = attendanceData.filter(a => {
                    const recordDate = new Date(a.date);
                    return recordDate.getMonth() === currentMonth && 
                           recordDate.getFullYear() === currentYear;
                });
                break;
            // 'all' shows all data
        }
        
        // Group by date
        const groupedByDate = {};
        attendanceData.forEach(record => {
            if (!groupedByDate[record.date]) {
                groupedByDate[record.date] = {
                    date: record.date,
                    inTime: '',
                    outTime: '',
                    status: 'Tidak Hadir',
                    note: '',
                    type: 'absence'
                };
            }
            
            if (record.type === 'in') {
                groupedByDate[record.date].inTime = record.time;
                groupedByDate[record.date].status = record.late ? 'Terlambat' : 'Hadir';
                groupedByDate[record.date].type = 'present';
                if (record.note) groupedByDate[record.date].note += `Masuk: ${record.note} `;
            } else if (record.type === 'out') {
                groupedByDate[record.date].outTime = record.time;
                if (record.note) groupedByDate[record.date].note += `Keluar: ${record.note}`;
            } else if (record.type === 'leave') {
                groupedByDate[record.date].status = record.leaveType === 'permission' ? 'Izin' : 
                                                   record.leaveType === 'sick' ? 'Sakit' : 'Cuti';
                groupedByDate[record.date].type = record.leaveType;
                groupedByDate[record.date].note = record.note;
            }
        });
        
        // Convert to array and sort by date (descending)
        const recordsArray = Object.values(groupedByDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Render table
        tableBody.innerHTML = recordsArray.map(record => {
            const dayName = getDayName(record.date);
            const isSunday = dayName.toLowerCase() === 'minggu';
            
            let statusClass = '';
            let statusText = record.status;
            
            if (isSunday) {
                statusClass = 'status-secondary';
                statusText = 'Libur';
            } else if (record.type === 'present') {
                statusClass = record.status === 'Terlambat' ? 'status-late' : 'status-present';
            } else if (record.type === 'permission') {
                statusClass = 'status-warning';
                statusText = 'Izin';
            } else if (record.type === 'sick') {
                statusClass = 'status-info';
                statusText = 'Sakit';
            } else if (record.type === 'leave') {
                statusClass = 'status-info';
                statusText = 'Cuti';
            } else {
                statusClass = 'status-absence';
                statusText = 'Alfa';
            }
            
            return `
                <tr>
                    <td>${formatDate(record.date)}</td>
                    <td>${dayName}</td>
                    <td>${record.inTime || '-'}</td>
                    <td>${record.outTime || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${record.note || '-'}</td>
                </tr>
            `;
        }).join('');
    }
    
    // Initial render
    renderHistory(filterSelect.value);
    
    // Add filter change listener
    filterSelect.addEventListener('change', (e) => {
        renderHistory(e.target.value);
    });
}

// ====== PROFILE FUNCTIONS ======

function getProfileHTML(user) {
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-user"></i> Profil Saya</h3>
            </div>
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-avatar-large">
                        ${user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div class="profile-info">
                        <h2>${user.name}</h2>
                        <p class="profile-role">${user.role === 'admin' ? 'Administrator' : 'Karyawan'}</p>
                        <p class="profile-username"><i class="fas fa-user-circle"></i> ${user.username}</p>
                    </div>
                </div>
                
                <div class="profile-details">
                    <h4><i class="fas fa-info-circle"></i> Informasi Akun</h4>
                    <div class="detail-item">
                        <span class="detail-label">ID Karyawan:</span>
                        <span class="detail-value">${user.id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Username:</span>
                        <span class="detail-value">${user.username}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Role:</span>
                        <span class="detail-value">${user.role === 'admin' ? 'Administrator' : 'Karyawan'}</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="btn btn-warning" id="changePasswordBtn">
                        <i class="fas fa-key"></i> Ubah Password
                    </button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-chart-pie"></i> Statistik Kehadiran</h3>
            </div>
            <div class="profile-stats" id="profileStats">
                <!-- Stats akan dimuat di sini -->
            </div>
        </div>
    `;
}

function setupProfileForm(user) {
    loadProfileStats(user.id);
    
    // Change password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            showChangePasswordModal(user);
        });
    }
}

function loadProfileStats(userId) {
    const statsDiv = document.getElementById('profileStats');
    if (!statsDiv) return;
    
    const attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
    const userAttendance = attendanceData.filter(a => a.userId === userId);
    const presentDays = userAttendance.filter(a => a.type === 'in').length;
    const lateDays = userAttendance.filter(a => a.late).length;
    const leaveDays = userAttendance.filter(a => a.type === 'leave').length;
    
    statsDiv.innerHTML = `
        <div class="stats-row">
            <div class="stat-item">
                <div class="stat-number">${presentDays}</div>
                <div class="stat-label">Total Hadir</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${lateDays}</div>
                <div class="stat-label">Keterlambatan</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${leaveDays}</div>
                <div class="stat-label">Izin/Sakit/Cuti</div>
            </div>
        </div>
        
        <div class="attendance-summary">
            <h4>Ringkasan 30 Hari Terakhir</h4>
            <div class="summary-chart">
                <div class="summary-text">
                    <p>Kehadiran: ${presentDays} hari</p>
                    <p>Persentase: ${Math.round((presentDays / 30) * 100)}%</p>
                    <p>Rata-rata keterlambatan: ${lateDays > 0 ? Math.round(lateDays / presentDays * 100) : 0}% dari kehadiran</p>
                </div>
            </div>
        </div>
    `;
}

function showChangePasswordModal(user) {
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('noteModalTitle');
    const noteForm = document.getElementById('noteForm');
    const submitBtn = document.getElementById('noteSubmitBtn');
