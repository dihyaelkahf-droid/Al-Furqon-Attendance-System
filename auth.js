// Inisialisasi pengaturan saat pertama kali load
function initializeAllData() {
    initializeData(); // Data karyawan dan absensi
    
    // Inisialisasi pengaturan jika belum ada
    if (!localStorage.getItem('workSettings')) {
        const defaultSettings = {
            workStartTime: '07:30',
            workEndTime: '15:30',
            lateTolerance: 0,
            workDays: [1, 2, 3, 4, 5, 6], // Senin-Sabtu
            autoHoliday: true
        };
        localStorage.setItem('workSettings', JSON.stringify(defaultSettings));
    }
}

// Panggil di DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAllData();
});
// Data karyawan awal
const employees = [
    { id: 1, name: "Sutrisno", username: "sutris", password: "sutris123", role: "employee" },
    { id: 2, name: "Nita Sri Wahyuningrum, S.Pd", username: "nita", password: "nita123", role: "employee" },
    { id: 3, name: "Heri Kurniawan", username: "heri", password: "heri123", role: "employee" },
    { id: 4, name: "Yian Hidayatul Ulfa, S. Pd.", username: "yian", password: "yian123", role: "employee" },
    { id: 5, name: "Diah Aprilia Devi, S.Pd", username: "diah", password: "diah123", role: "employee" },
    { id: 6, name: "Teguh Setia Isma Ramadan", username: "teguh", password: "teguh123", role: "employee" },
    { id: 7, name: "Iskandar Kholif, S.Pd", username: "iskandar", password: "iskandar123", role: "employee" },
    { id: 8, name: "Dinul Qoyyimah, S. Pd", username: "dinul", password: "dinul123", role: "employee" },
    { id: 9, name: "Endah Windarti, S.Pd", username: "endah", password: "endah123", role: "employee" },
    { id: 10, name: "Citra Wulan Sari, S. Pd", username: "citra", password: "citra123", role: "employee" },
    { id: 11, name: "Fajriansyah Abdillah", username: "fajri", password: "fajri123", role: "employee" },
    { id: 12, name: "Muh. Abdul Hamid, S.H.I", username: "hamid", password: "hamid123", role: "employee" },
    { id: 13, name: "Nurjayati, S.Pd", username: "nurjayati", password: "jayati123", role: "employee" },
    { id: 14, name: "Riswan Siregar, M.Pd", username: "riswan", password: "riswan123", role: "employee" },
    { id: 15, name: "Rizka Ulfiana, S. Tp", username: "rizka", password: "rizka123", role: "employee" },
    { id: 16, name: "Susi Dwi Ratna Sari, S.Pd", username: "susi", password: "susi123", role: "employee" },
    { id: 17, name: "Usamah Hanif", username: "usamah", password: "usamah123", role: "employee" },
    { id: 18, name: "Zainap Assaihatus Syahidah S. Si", username: "zainap", password: "zainap123", role: "employee" }
];

// Data admin
const admin = [
    { id: 100, name: "Administrator", username: "admin", password: "admin123", role: "admin" }
];

// Data absensi (akan disimpan di localStorage)
let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];

// Inisialisasi data karyawan di localStorage
function initializeData() {
    if (!localStorage.getItem('employees')) {
        localStorage.setItem('employees', JSON.stringify(employees));
    }
    
    if (!localStorage.getItem('admin')) {
        localStorage.setItem('admin', JSON.stringify(admin));
    }
    
    if (!localStorage.getItem('attendanceData')) {
        localStorage.setItem('attendanceData', JSON.stringify([]));
    }
}

// Fungsi login
function login(username, password, isAdmin) {
    const userData = isAdmin ? 
        JSON.parse(localStorage.getItem('admin')) || admin :
        JSON.parse(localStorage.getItem('employees')) || employees;
    
    const user = userData.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Simpan data user yang login
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    }
    
    return null;
}

// Fungsi logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Fungsi untuk mengecek apakah user sudah login
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    
    return currentUser;
}

// Fungsi untuk redirect berdasarkan role
function redirectBasedOnRole(user) {
    if (user.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'employee.html';
    }
}

// Fungsi untuk menambah karyawan baru (admin only)
function addEmployee(name, username, password) {
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const newEmployee = {
        id: Date.now(),
        name: name,
        username: username,
        password: password,
        role: 'employee'
    };
    
    employees.push(newEmployee);
    localStorage.setItem('employees', JSON.stringify(employees));
    
    return newEmployee;
}

// Fungsi untuk mengambil semua karyawan
function getAllEmployees() {
    return JSON.parse(localStorage.getItem('employees')) || employees;
}

// Fungsi untuk mencatat absensi
function recordAttendance(userId, type, note = '') {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    // Cek apakah sudah ada absensi masuk hari ini
    const existingIndex = attendanceData.findIndex(a => 
        a.userId === userId && a.date === today && a.type === 'in'
    );
    
    const attendanceRecord = {
        id: Date.now(),
        userId: userId,
        date: today,
        time: time,
        type: type, // 'in' atau 'out'
        note: note,
        timestamp: now.getTime()
    };
    
    // Validasi: tidak bisa absen keluar sebelum absen masuk
    if (type === 'out' && existingIndex === -1) {
        return { success: false, message: 'Anda belum melakukan absensi masuk hari ini' };
    }
    
    // Validasi: tidak bisa absen masuk dua kali
    if (type === 'in' && existingIndex !== -1) {
        return { success: false, message: 'Anda sudah melakukan absensi masuk hari ini' };
    }
    
    // Cek keterlambatan untuk absen masuk
    if (type === 'in') {
        const workStart = new Date();
        workStart.setHours(7, 30, 0, 0);
        if (now > workStart) {
            attendanceRecord.late = true;
            attendanceRecord.lateMinutes = Math.floor((now - workStart) / (1000 * 60));
        }
    }
    
    attendanceData.push(attendanceRecord);
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    
    return { success: true, data: attendanceRecord };
}

// Fungsi untuk mengambil riwayat absensi
function getAttendanceHistory(userId, period = 'today') {
    const now = new Date();
    let filteredData = attendanceData.filter(a => a.userId === userId);
    
    if (period === 'today') {
        const today = now.toISOString().split('T')[0];
        filteredData = filteredData.filter(a => a.date === today);
    } else if (period === 'month') {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        filteredData = filteredData.filter(a => {
            const recordDate = new Date(a.date);
            return recordDate.getMonth() === currentMonth && 
                   recordDate.getFullYear() === currentYear;
        });
    }
    
    return filteredData.sort((a, b) => b.timestamp - a.timestamp);
}

// Fungsi untuk statistik absensi
function getAttendanceStats(userId) {
    const today = new Date().toISOString().split('T')[0];
    const userAttendance = attendanceData.filter(a => a.userId === userId);
    
    const todayAttendance = userAttendance.filter(a => a.date === today);
    const monthlyAttendance = userAttendance.filter(a => {
        const recordDate = new Date(a.date);
        const now = new Date();
        return recordDate.getMonth() === now.getMonth() && 
               recordDate.getFullYear() === now.getFullYear();
    });
    
    const stats = {
        today: {
            present: todayAttendance.some(a => a.type === 'in'),
            out: todayAttendance.some(a => a.type === 'out'),
            late: todayAttendance.some(a => a.late)
        },
        month: {
            present: monthlyAttendance.filter(a => a.type === 'in').length,
            late: monthlyAttendance.filter(a => a.late).length
        }
    };
    
    return stats;
}

// Export fungsi
window.auth = {
    initializeData,
    login,
    logout,
    checkAuth,
    redirectBasedOnRole,
    addEmployee,
    getAllEmployees,
    recordAttendance,
    getAttendanceHistory,
    getAttendanceStats,
    attendanceData

};


// Update fungsi recordAttendance untuk menggunakan pengaturan
function recordAttendance(userId, type, note = '') {
    const now = new Date();
    
    // Ambil pengaturan dari localStorage
    const settings = JSON.parse(localStorage.getItem('workSettings')) || {
        workStartTime: '07:30',
        workEndTime: '15:30',
        lateTolerance: 0,
        workDays: [1, 2, 3, 4, 5, 6],
        autoHoliday: true
    };
    
    // Cek apakah hari ini hari kerja
    const today = now.getDay();
    const isWorkDay = settings.workDays.includes(today);
    const isAutoHoliday = settings.autoHoliday && today === 0;
    
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
        const [hours, minutes] = settings.workStartTime.split(':');
        const workStart = new Date();
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
        const [hours, minutes] = settings.workEndTime.split(':');
        const workEnd = new Date();
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
