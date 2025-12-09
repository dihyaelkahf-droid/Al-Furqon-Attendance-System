// Load employee dashboard
function loadEmployeeDashboard() {
    loadEmployeeContent('attendance');
}

// Load employee content based on target
function loadEmployeeContent(target) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    const currentUser = auth.checkAuth();
    if (!currentUser) return;
    
    switch(target) {
        case 'attendance':
            contentArea.innerHTML = getAttendanceFormHTML();
            setupAttendanceForm(currentUser);
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
            setupAttendanceForm(currentUser);
    }
}

// Attendance Form HTML
function getAttendanceFormHTML() {
    const now = new Date();
    const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
    const isSunday = dayName.toLowerCase() === 'minggu';
    
    if (isSunday) {
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
                    <p>Silakan nikmati waktu libur Anda.</p>
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
                            <p>07:30 - 15:30 (Senin - Sabtu)</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-times"></i>
                        <div>
                            <h4>Hari Libur</h4>
                            <p>Minggu dan hari libur nasional</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-calendar-check"></i> Absensi Hari Ini</h3>
                <span class="current-date-display">${dayName}, ${utils.formatDate(new Date().toISOString())}</span>
            </div>
            
            <div class="attendance-status" id="attendanceStatus">
                <!-- Status akan dimuat di sini -->
            </div>
            
            <div class="attendance-form">
                <div class="time-display" id="liveTime">00:00:00</div>
                
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="text" id="attendanceDate" value="${utils.formatDate(new Date().toISOString())}" readonly>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Status Kehadiran</label>
                        <select id="attendanceStatusSelect" disabled>
                            <option value="present">Masuk</option>
                            <option value="permission">Izin</option>
                            <option value="sick">Sakit</option>
                            <option value="leave">Cuti</option>
                            <option value="absence">Alfa</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Waktu Kerja</label>
                        <input type="text" value="07:30 - 15:30" readonly>
                    </div>
                </div>
                
                <div class="attendance-buttons" id="attendanceButtons">
                    <!-- Tombol akan dimuat di sini -->
                </div>
                
                <div class="attendance-note" id="attendanceNote" style="display: none;">
                    <div class="form-group">
                        <label>Catatan</label>
                        <textarea id="noteTextArea" rows="3" placeholder="Masukkan catatan..."></textarea>
                    </div>
                    <button class="btn btn-success btn-block" id="submitNoteBtn">
                        <i class="fas fa-paper-plane"></i> Kirim Catatan
                    </button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-chart-line"></i> Statistik Bulan Ini</h3>
            </div>
            <div class="stats-grid" id="monthlyStats">
                <!-- Statistik akan dimuat di sini -->
            </div>
        </div>
    `;
}

// Setup attendance form
function setupAttendanceForm(currentUser) {
    updateAttendanceStatus(currentUser);
    setupLiveClock();
    setupAttendanceButtons(currentUser);
    loadMonthlyStats(currentUser.id);
    
    // Cek apakah hari ini Minggu
    const now = new Date();
    const isSunday = now.getDay() === 0;
    if (isSunday) return;
    
    // Auto-refresh setiap 30 detik
    setInterval(() => {
        updateAttendanceStatus(currentUser);
        setupLiveClock();
    }, 30000);
}

// Update attendance status
function updateAttendanceStatus(user) {
    const statusDiv = document.getElementById('attendanceStatus');
    if (!statusDiv) return;
    
    const today = new Date().toISOString().split('T')[0];
    const userAttendance = auth.getAttendanceHistory(user.id, 'today');
    const hasCheckedIn = userAttendance.some(a => a.type === 'in');
    const hasCheckedOut = userAttendance.some(a => a.type === 'out');
    const checkInRecord = userAttendance.find(a => a.type === 'in');
    
    let statusHTML = '';
    
    if (hasCheckedIn && hasCheckedOut) {
        statusHTML = `
            <div class="status-card success">
                <i class="fas fa-check-circle"></i>
                <div>
                    <h4>Absensi Selesai</h4>
                    <p>Anda telah melakukan absensi masuk dan keluar hari ini</p>
                    <p class="time-info">Masuk: ${checkInRecord.time} | Keluar: ${userAttendance.find(a => a.type === 'out').time}</p>
                </div>
            </div>
        `;
    } else if (hasCheckedIn && !hasCheckedOut) {
        statusHTML = `
            <div class="status-card warning">
                <i class="fas fa-clock"></i>
                <div>
                    <h4>Sudah Absen Masuk</h4>
                    <p>Anda telah melakukan absensi masuk pada pukul ${checkInRecord.time}</p>
                    <p class="time-info">Silakan lakukan absensi keluar setelah jam kerja selesai</p>
                </div>
            </div>
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
    }
    
    statusDiv.innerHTML = statusHTML;
    
    // Update buttons
    updateAttendanceButtons(hasCheckedIn, hasCheckedOut, checkInRecord);
}

// Setup live clock
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

// Update attendance buttons
function updateAttendanceButtons(hasCheckedIn, hasCheckedOut, checkInRecord) {
    const buttonsDiv = document.getElementById('attendanceButtons');
    if (!buttonsDiv) return;
    
    let buttonsHTML = '';
    
    if (!hasCheckedIn) {
        buttonsHTML = `
            <button class="btn btn-success" id="checkInBtn">
                <i class="fas fa-sign-in-alt"></i> Absen Masuk
            </button>
            <button class="btn btn-secondary" id="requestLeaveBtn">
                <i class="fas fa-file-medical"></i> Ajukan Izin/Sakit
            </button>
        `;
    } else if (hasCheckedIn && !hasCheckedOut) {
        // Cek apakah sudah bisa absen keluar (setelah jam 15:30)
        const now = new Date();
        const canCheckOut = now.getHours() >= 15 && now.getMinutes() >= 30;
        
        buttonsHTML = `
            <button class="btn btn-primary ${canCheckOut ? '' : 'disabled'}" id="checkOutBtn" ${!canCheckOut ? 'disabled' : ''}>
                <i class="fas fa-sign-out-alt"></i> Absen Keluar
            </button>
            ${!canCheckOut ? '<p class="info-text">Absen keluar tersedia setelah pukul 15:30</p>' : ''}
        `;
    } else {
        buttonsHTML = `
            <button class="btn btn-secondary disabled" disabled>
                <i class="fas fa-check"></i> Absensi Selesai
            </button>
        `;
    }
    
    buttonsDiv.innerHTML = buttonsHTML;
    
    // Add event listeners
    if (document.getElementById('checkInBtn')) {
        document.getElementById('checkInBtn').addEventListener('click', () => {
            showNoteModal('checkin');
        });
    }
    
    if (document.getElementById('checkOutBtn')) {
        document.getElementById('checkOutBtn').addEventListener('click', () => {
            showNoteModal('checkout');
        });
    }
    
    if (document.getElementById('requestLeaveBtn')) {
        document.getElementById('requestLeaveBtn').addEventListener('click', () => {
            showLeaveRequestModal();
        });
    }
}

// Show note modal
function showNoteModal(type) {
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('noteModalTitle');
    const noteForm = document.getElementById('noteForm');
    const submitBtn = document.getElementById('noteSubmitBtn');
    const currentUser = auth.checkAuth();
    
    if (type === 'checkin') {
        modalTitle.textContent = 'Absen Masuk';
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Absen Masuk';
    } else {
        modalTitle.textContent = 'Absen Keluar';
        submitBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Absen Keluar';
    }
    
    // Show modal
    modal.classList.add('active');
    
    // Handle form submission
    noteForm.onsubmit = function(e) {
        e.preventDefault();
        const note = document.getElementById('noteText').value;
        
        const result = auth.recordAttendance(
            currentUser.id,
            type === 'checkin' ? 'in' : 'out',
            note
        );
        
        if (result.success) {
            modal.classList.remove('active');
            updateAttendanceStatus(currentUser);
            loadMonthlyStats(currentUser.id);
            
            // Show success message
            utils.showMessage(null, 
                type === 'checkin' ? 'Absen masuk berhasil!' : 'Absen keluar berhasil!', 
                'success'
            );
        } else {
            utils.showMessage(null, result.message, 'error');
        }
    };
    
    // Close modal button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.classList.remove('active');
    
    // Clear note field
    document.getElementById('noteText').value = '';
}

// Show leave request modal
function showLeaveRequestModal() {
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('noteModalTitle');
    const noteForm = document.getElementById('noteForm');
    const submitBtn = document.getElementById('noteSubmitBtn');
    
    modalTitle.textContent = 'Ajukan Izin/Sakit';
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Ajukan Permohonan';
    
    // Replace textarea with leave type selection
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
            <textarea id="leaveNote" rows="4" placeholder="Masukkan alasan/keterangan..."></textarea>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    
    // Handle form submission
    noteForm.onsubmit = function(e) {
        e.preventDefault();
        const leaveType = document.getElementById('leaveType').value;
        const leaveNote = document.getElementById('leaveNote').value;
        
        // Untuk sekarang, simpan sebagai catatan khusus
        // Di sistem lengkap, ini akan masuk ke database permohonan
        const currentUser = auth.checkAuth();
        const attendanceData = auth.attendanceData;
        
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
        updateAttendanceStatus(currentUser);
        
        utils.showMessage(null, 'Permohonan berhasil dikirim', 'success');
    };
    
    // Close modal button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        modal.classList.remove('active');
        // Restore original textarea
        location.reload();
    };
}

// Load monthly stats
function loadMonthlyStats(userId) {
    const statsDiv = document.getElementById('monthlyStats');
    if (!statsDiv) return;
    
    const stats = auth.getAttendanceStats(userId);
    const userAttendance = auth.getAttendanceHistory(userId, 'month');
    
    const presentDays = userAttendance.filter(a => a.type === 'in').length;
    const lateDays = userAttendance.filter(a => a.late).length;
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

// Attendance History HTML
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

// Load attendance history
function loadAttendanceHistory(userId) {
    const tableBody = document.querySelector('#attendanceHistoryTable tbody');
    const filterSelect = document.getElementById('historyFilter');
    if (!tableBody) return;
    
    function renderHistory(filter) {
        let attendanceData = auth.attendanceData.filter(a => a.userId === userId);
        
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
            const dayName = utils.getDayName(record.date);
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
                    <td>${utils.formatDate(record.date)}</td>
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

// Profile HTML
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

// Setup profile form
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

// Load profile stats
function loadProfileStats(userId) {
    const statsDiv = document.getElementById('profileStats');
    if (!statsDiv) return;
    
    const attendanceData = auth.attendanceData.filter(a => a.userId === userId);
    const presentDays = attendanceData.filter(a => a.type === 'in').length;
    const lateDays = attendanceData.filter(a => a.late).length;
    const leaveDays = attendanceData.filter(a => a.type === 'leave').length;
    
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
                <!-- Simple bar chart bisa ditambahkan di sini -->
                <div class="summary-text">
                    <p>Kehadiran: ${presentDays} hari</p>
                    <p>Persentase: ${Math.round((presentDays / 30) * 100)}%</p>
                    <p>Rata-rata keterlambatan: ${lateDays > 0 ? Math.round(lateDays / presentDays * 100) : 0}% dari kehadiran</p>
                </div>
            </div>
        </div>
    `;
}

// Show change password modal
function showChangePasswordModal(user) {
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('noteModalTitle');
    const noteForm = document.getElementById('noteForm');
    const submitBtn = document.getElementById('noteSubmitBtn');
    
    modalTitle.textContent = 'Ubah Password';
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Password';
    
    // Replace form content
    const noteText = document.getElementById('noteText');
    noteText.parentElement.innerHTML = `
        <div class="form-group">
            <label>Password Saat Ini</label>
            <input type="password" id="currentPassword" class="form-control" placeholder="Masukkan password saat ini" required>
        </div>
        <div class="form-group">
            <label>Password Baru</label>
            <input type="password" id="newPassword" class="form-control" placeholder="Masukkan password baru" required>
        </div>
        <div class="form-group">
            <label>Konfirmasi Password Baru</label>
            <input type="password" id="confirmPassword" class="form-control" placeholder="Konfirmasi password baru" required>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    
    // Handle form submission
    noteForm.onsubmit = function(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validasi
        if (currentPassword !== user.password) {
            utils.showMessage(null, 'Password saat ini salah', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            utils.showMessage(null, 'Password baru minimal 6 karakter', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            utils.showMessage(null, 'Konfirmasi password tidak cocok', 'error');
            return;
        }
        
        // Update password
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const employeeIndex = employees.findIndex(e => e.id === user.id);
        
        if (employeeIndex !== -1) {
            employees[employeeIndex].password = newPassword;
            localStorage.setItem('employees', JSON.stringify(employees));
            
            // Update current user
            user.password = newPassword;
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
        
        modal.classList.remove('active');
        utils.showMessage(null, 'Password berhasil diubah', 'success');
        
        // Restore original form
        location.reload();
    };
    
    // Close modal button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        modal.classList.remove('active');
        location.reload();
    };
}

// Ranking HTML
function getRankingHTML() {
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-trophy"></i> Ranking Karyawan Teladan</h3>
                <select id="rankingPeriod" class="form-control">
                    <option value="month">Bulan Ini</option>
                    <option value="quarter">Triwulan</option>
                    <option value="year">Tahun Ini</option>
                </select>
            </div>
            <div class="ranking-container" id="rankingContainer">
                <!-- Ranking akan dimuat di sini -->
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-award"></i> Kriteria Penilaian</h3>
            </div>
            <div class="criteria-list">
                <div class="criterion">
                    <div class="criterion-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="criterion-details">
                        <h4>1. Kehadiran Terbanyak</h4>
                        <p>Jumlah hari hadir (tanpa alfa)</p>
                    </div>
                </div>
                <div class="criterion">
                    <div class="criterion-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="criterion-details">
                        <h4>2. Keterlambatan Terkecil</h4>
                        <p>Jumlah keterlambatan (menit/hari)</p>
                    </div>
                </div>
                <div class="criterion">
                    <div class="criterion-icon">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <div class="criterion-details">
                        <h4>3. Izin/Sakit Terkecil</h4>
                        <p>Jumlah hari izin/sakit/cuti</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load employee ranking
function loadEmployeeRanking() {
    const container = document.getElementById('rankingContainer');
    const periodSelect = document.getElementById('rankingPeriod');
    if (!container) return;
    
    function renderRanking(period) {
        const employees = auth.getAllEmployees();
        const attendanceData = auth.attendanceData;
        const now = new Date();
        
        // Filter data berdasarkan periode
        let filteredData = [...attendanceData];
        if (period === 'month') {
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            filteredData = filteredData.filter(a => {
                const recordDate = new Date(a.date);
                return recordDate.getMonth() === currentMonth && 
                       recordDate.getFullYear() === currentYear;
            });
        } else if (period === 'quarter') {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const currentYear = now.getFullYear();
            filteredData = filteredData.filter(a => {
                const recordDate = new Date(a.date);
                const recordQuarter = Math.floor(recordDate.getMonth() / 3);
                return recordQuarter === currentQuarter && 
                       recordDate.getFullYear() === currentYear;
            });
        }
        // 'year' menggunakan semua data
        
        // Calculate scores
        const employeeScores = employees.map(emp => {
            const empData = filteredData.filter(a => a.userId === emp.id);
            const presentDays = empData.filter(a => a.type === 'in').length;
            const lateMinutes = empData.filter(a => a.late)
                .reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
            const leaveDays = empData.filter(a => a.type === 'leave').length;
            
            // Scoring system
            const presentScore = presentDays * 10;
            const latePenalty = lateMinutes * 0.1;
            const leavePenalty = leaveDays * 5;
            
            const totalScore = presentScore - latePenalty - leavePenalty;
            
            return {
                ...emp,
                presentDays,
                lateMinutes,
                leaveDays,
                score: Math.max(0, totalScore) // Tidak boleh negatif
            };
        });
        
        // Sort by score (descending)
        employeeScores.sort((a, b) => b.score - a.score);
        
        // Render ranking
        container.innerHTML = employeeScores.map((emp, index) => {
            const rank = index + 1;
            let rankClass = '';
            
            if (rank === 1) rankClass = 'gold';
            else if (rank === 2) rankClass = 'silver';
            else if (rank === 3) rankClass = 'bronze';
            
            return `
                <div class="ranking-item ${rankClass}">
                    <div class="rank-number">${rank}</div>
                    <div class="employee-avatar-small">
                        ${emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div class="employee-details">
                        <h4>${emp.name.split(',')[0]}</h4>
                        <p class="employee-stats">
                            <span><i class="fas fa-calendar-check"></i> ${emp.presentDays} hari</span>
                            <span><i class="fas fa-clock"></i> ${emp.lateMinutes} menit terlambat</span>
                        </p>
                    </div>
                    <div class="employee-score">
                        <span class="score">${Math.round(emp.score)}</span>
                        <span class="score-label">poin</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Initial render
    renderRanking(periodSelect.value);
    
    // Add period change listener
    periodSelect.addEventListener('change', (e) => {
        renderRanking(e.target.value);
    });
}

// Export functions
window.employeeFunctions = {
    loadEmployeeDashboard,
    loadEmployeeContent,
    setupAttendanceForm,
    updateAttendanceStatus,
    loadAttendanceHistory,
    loadEmployeeRanking

};
// Update fungsi absensi di employee.js
function showNoteModal(type) {
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('noteModalTitle');
    const noteForm = document.getElementById('noteForm');
    const submitBtn = document.getElementById('noteSubmitBtn');
    const currentUser = auth.checkAuth();
    const settings = window.workSettings.getWorkSettings();
    
    // Cek apakah hari libur
    const today = new Date();
    if (window.workSettings.checkIfHoliday(today)) {
        utils.showMessage(null, 'Hari ini adalah hari libur', 'warning');
        return;
    }
    
    if (type === 'checkin') {
        modalTitle.textContent = 'Absen Masuk';
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Absen Masuk';
        
        // Tampilkan jam masuk yang diatur
        const infoText = document.createElement('p');
        infoText.className = 'info-text';
        infoText.textContent = `Jam masuk kerja: ${settings.workStartTime}`;
        noteForm.appendChild(infoText);
    } else {
        modalTitle.textContent = 'Absen Keluar';
        submitBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Absen Keluar';
        
        // Tampilkan jam keluar yang diatur
        const infoText = document.createElement('p');
        infoText.className = 'info-text';
        infoText.textContent = `Jam keluar kerja: ${settings.workEndTime}`;
        noteForm.appendChild(infoText);
    }
    
    // Show modal
    modal.classList.add('active');
    
    // Handle form submission
    noteForm.onsubmit = function(e) {
        e.preventDefault();
        const note = document.getElementById('noteText').value;
        
        // Gunakan fungsi baru dengan pengaturan
        const result = window.workSettings.recordAttendanceWithSettings(
            currentUser.id,
            type === 'checkin' ? 'in' : 'out',
            note
        );
        
        if (result.success) {
            modal.classList.remove('active');
            updateAttendanceStatus(currentUser);
            loadMonthlyStats(currentUser.id);
            
            // Show success message
            utils.showMessage(null, 
                type === 'checkin' ? 'Absen masuk berhasil!' : 'Absen keluar berhasil!', 
                'success'
            );
        } else {
            utils.showMessage(null, result.message, 'error');
        }
    };
    
    // Close modal button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        modal.classList.remove('active');
        // Remove info text
        const infoText = noteForm.querySelector('.info-text');
        if (infoText) infoText.remove();
    };
}


// ====== FUNGSI UNTUK MENGAMBIL PENGATURAN ======

// Fungsi untuk mendapatkan pengaturan jam kerja
function getWorkSettings() {
    const settings = JSON.parse(localStorage.getItem('workSettings')) || {
        workStartTime: '07:30',
        workEndTime: '15:30',
        lateTolerance: 0,
        workDays: [1, 2, 3, 4, 5, 6], // Senin-Sabtu
        autoHoliday: true
    };
    return settings;
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

// ====== UPDATE ATTENDANCE FORM HTML ======

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
    
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-calendar-check"></i> Absensi Hari Ini</h3>
                <span class="current-date-display">${utils.getDayName(new Date().toISOString())}, ${utils.formatDate(new Date().toISOString())}</span>
            </div>
            
            <div class="attendance-status" id="attendanceStatus">
                <!-- Status akan dimuat di sini -->
            </div>
            
            <div class="attendance-form">
                <div class="time-display" id="liveTime">00:00:00</div>
                
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="text" id="attendanceDate" value="${utils.formatDate(new Date().toISOString())}" readonly>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Status Kehadiran</label>
                        <select id="attendanceStatusSelect" disabled>
                            <option value="present">Masuk</option>
                            <option value="permission">Izin</option>
                            <option value="sick">Sakit</option>
                            <option value="leave">Cuti</option>
                            <option value="absence">Alfa</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Waktu Kerja</label>
                        <input type="text" id="workTimeDisplay" value="${settings.workStartTime} - ${settings.workEndTime}" readonly>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Toleransi Keterlambatan</label>
                    <input type="text" id="lateToleranceDisplay" value="${settings.lateTolerance} menit" readonly>
                </div>
                
                <div class="attendance-buttons" id="attendanceButtons">
                    <!-- Tombol akan dimuat di sini -->
                </div>
                
                <div class="attendance-note" id="attendanceNote" style="display: none;">
                    <div class="form-group">
                        <label>Catatan</label>
                        <textarea id="noteTextArea" rows="3" placeholder="Masukkan catatan..."></textarea>
                    </div>
                    <button class="btn btn-success btn-block" id="submitNoteBtn">
                        <i class="fas fa-paper-plane"></i> Kirim Catatan
                    </button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-chart-line"></i> Statistik Bulan Ini</h3>
            </div>
            <div class="stats-grid" id="monthlyStats">
                <!-- Statistik akan dimuat di sini -->
            </div>
        </div>
    `;
}

// ====== UPDATE FUNGSI ABSENSI DENGAN PENGATURAN ======

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
    
    // Validasi untuk absen keluar (hanya bisa setelah jam kerja)
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
    const attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
    attendanceData.push(attendanceRecord);
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    
    return { success: true, data: attendanceRecord };
}

// ====== UPDATE FUNGSI UPDATE ATTENDANCE BUTTONS ======

function updateAttendanceButtons(hasCheckedIn, hasCheckedOut, checkInRecord) {
    const buttonsDiv = document.getElementById('attendanceButtons');
    if (!buttonsDiv) return;
    
    const settings = getWorkSettings();
    
    let buttonsHTML = '';
    
    if (!hasCheckedIn) {
        buttonsHTML = `
            <button class="btn btn-success" id="checkInBtn">
                <i class="fas fa-sign-in-alt"></i> Absen Masuk
            </button>
            <button class="btn btn-secondary" id="requestLeaveBtn">
                <i class="fas fa-file-medical"></i> Ajukan Izin/Sakit
            </button>
            <p class="info-text">Jam masuk: ${settings.workStartTime} (toleransi: ${settings.lateTolerance} menit)</p>
        `;
    } else if (hasCheckedIn && !hasCheckedOut) {
        // Cek apakah sudah bisa absen keluar
        const now = new Date();
        const [hours, minutes] = settings.workEndTime.split(':');
        const workEnd = new Date();
        workEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const canCheckOut = now >= workEnd;
        
        buttonsHTML = `
            <button class="btn btn-primary ${canCheckOut ? '' : 'disabled'}" id="checkOutBtn" ${!canCheckOut ? 'disabled' : ''}>
                <i class="fas fa-sign-out-alt"></i> Absen Keluar
            </button>
            ${!canCheckOut ? `<p class="info-text">Absen keluar tersedia setelah pukul ${settings.workEndTime}</p>` : ''}
        `;
    } else {
        buttonsHTML = `
            <button class="btn btn-secondary disabled" disabled>
                <i class="fas fa-check"></i> Absensi Selesai
            </button>
        `;
    }
    
    buttonsDiv.innerHTML = buttonsHTML;
    
    // Add event listeners
    if (document.getElementById('checkInBtn')) {
        document.getElementById('checkInBtn').addEventListener('click', () => {
            showNoteModal('checkin');
        });
    }
    
    if (document.getElementById('checkOutBtn')) {
        document.getElementById('checkOutBtn').addEventListener('click', () => {
            showNoteModal('checkout');
        });
    }
    
    if (document.getElementById('requestLeaveBtn')) {
        document.getElementById('requestLeaveBtn').addEventListener('click', () => {
            showLeaveRequestModal();
        });
    }
}

// ====== UPDATE FUNGSI SHOW NOTE MODAL ======

function showNoteModal(type) {
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('noteModalTitle');
    const noteForm = document.getElementById('noteForm');
    const submitBtn = document.getElementById('noteSubmitBtn');
    const currentUser = auth.checkAuth();
    const settings = getWorkSettings();
    
    // Cek apakah hari libur
    if (isTodayHoliday()) {
        utils.showMessage(null, 'Hari ini adalah hari libur', 'warning');
        return;
    }
    
    if (type === 'checkin') {
        modalTitle.textContent = 'Absen Masuk';
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Absen Masuk';
        
        // Tampilkan informasi jam kerja
        const infoDiv = document.createElement('div');
        infoDiv.className = 'modal-info';
        infoDiv.innerHTML = `
            <p><i class="fas fa-clock"></i> Jam masuk kerja: <strong>${settings.workStartTime}</strong></p>
            <p><i class="fas fa-hourglass-half"></i> Toleransi: <strong>${settings.lateTolerance} menit</strong></p>
            <p class="small-text">Anda terlambat jika masuk setelah ${calculateLateTime(settings)}</p>
        `;
        noteForm.insertBefore(infoDiv, noteForm.firstChild);
    } else {
        modalTitle.textContent = 'Absen Keluar';
        submitBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Absen Keluar';
        
        // Tampilkan informasi jam kerja
        const infoDiv = document.createElement('div');
        infoDiv.className = 'modal-info';
        infoDiv.innerHTML = `
            <p><i class="fas fa-clock"></i> Jam keluar kerja: <strong>${settings.workEndTime}</strong></p>
            <p class="small-text">Absen keluar tersedia mulai pukul ${settings.workEndTime}</p>
        `;
        noteForm.insertBefore(infoDiv, noteForm.firstChild);
    }
    
    // Show modal
    modal.classList.add('active');
    
    // Handle form submission
    noteForm.onsubmit = function(e) {
        e.preventDefault();
        const note = document.getElementById('noteText').value;
        
        // Gunakan fungsi baru dengan pengaturan
        const result = recordAttendanceWithSettings(
            currentUser.id,
            type === 'checkin' ? 'in' : 'out',
            note
        );
        
        if (result.success) {
            modal.classList.remove('active');
            updateAttendanceStatus(currentUser);
            loadMonthlyStats(currentUser.id);
            
            // Show success message
            utils.showMessage(null, 
                type === 'checkin' ? 'Absen masuk berhasil!' : 'Absen keluar berhasil!', 
                'success'
            );
        } else {
            utils.showMessage(null, result.message, 'error');
        }
    };
    
    // Close modal button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        modal.classList.remove('active');
        // Remove info div
        const infoDiv = noteForm.querySelector('.modal-info');
        if (infoDiv) infoDiv.remove();
    };
}

// Helper function untuk menghitung waktu terlambat
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

// ====== UPDATE LOAD EMPLOYEE DASHBOARD ======

function loadEmployeeDashboard() {
    // Load pengaturan terbaru
    const settings = getWorkSettings();
    
    // Load content default
    loadEmployeeContent('attendance');
    
    // Auto refresh pengaturan setiap 30 detik
    setInterval(() => {
        // Cek jika ada perubahan pengaturan
        const newSettings = getWorkSettings();
        if (JSON.stringify(settings) !== JSON.stringify(newSettings)) {
            // Refresh page jika pengaturan berubah
            location.reload();
        }
    }, 30000);
}
