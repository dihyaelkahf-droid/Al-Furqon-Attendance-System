// script.js - Utilitas umum untuk semua halaman

// ====== INISIALISASI ======

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    
    // Inisialisasi data sistem
    if (typeof auth !== 'undefined' && typeof auth.initializeData === 'function') {
        auth.initializeData();
        console.log('Auth data initialized');
    } else {
        console.error('Auth module not found or initializeData function not available');
    }
    
    // Inisialisasi pengaturan
    if (typeof window.workSettings !== 'undefined') {
        window.workSettings.initializeSettings();
    }
    
    // Deteksi halaman dan setup sesuai kebutuhan
    detectPageAndSetup();
    
    // Tambahkan event listener untuk resize
    window.addEventListener('resize', debounce(handleResize, 250));
});

// Deteksi halaman dan setup
function detectPageAndSetup() {
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path.endsWith('/')) {
        console.log('Login page detected');
        if (document.getElementById('loginForm')) {
            setupLoginPage();
        }
    } 
    else if (path.includes('admin.html')) {
        console.log('Admin page detected');
        setupDashboard();
        if (typeof adminFunctions !== 'undefined' && 
            typeof adminFunctions.loadAdminDashboard === 'function') {
            adminFunctions.loadAdminDashboard();
        } else {
            console.error('Admin functions not available');
        }
    } 
    else if (path.includes('employee.html')) {
        console.log('Employee page detected');
        setupDashboard();
        if (typeof employeePage !== 'undefined' && 
            typeof employeePage.initializeEmployeePage === 'function') {
            employeePage.initializeEmployeePage();
        } else {
            console.error('Employee functions not available');
            // Fallback untuk employee
            loadEmployeeDashboard();
        }
    }
}

// ====== FUNGSI LOGIN PAGE ======

// Setup halaman login
function setupLoginPage() {
    console.log('Setting up login page...');
    
    const loginForm = document.getElementById('loginForm');
    const employeeBtn = document.getElementById('employeeBtn');
    const adminBtn = document.getElementById('adminBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const loginMessage = document.getElementById('loginMessage');
    
    let isAdmin = false;
    
    // Cek apakah ada saved username
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername && usernameInput) {
        usernameInput.value = savedUsername;
    }
    
    // Toggle user type
    if (employeeBtn && adminBtn) {
        employeeBtn.addEventListener('click', () => {
            employeeBtn.classList.add('active');
            adminBtn.classList.remove('active');
            isAdmin = false;
            updateLoginButtonText();
        });
        
        adminBtn.addEventListener('click', () => {
            adminBtn.classList.add('active');
            employeeBtn.classList.remove('active');
            isAdmin = true;
            updateLoginButtonText();
        });
        
        // Update teks tombol login
        function updateLoginButtonText() {
            const loginBtn = document.querySelector('#loginForm .btn-primary');
            if (loginBtn) {
                const icon = '<i class="fas fa-sign-in-alt"></i> ';
                const text = isAdmin ? 'Masuk sebagai Admin' : 'Masuk sebagai Karyawan';
                loginBtn.innerHTML = icon + text;
            }
        }
        
        // Initial update
        updateLoginButtonText();
    }
    
    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.innerHTML = type === 'password' ? 
                '<i class="fas fa-eye"></i>' : 
                '<i class="fas fa-eye-slash"></i>';
            togglePassword.setAttribute('title', type === 'password' ? 'Tampilkan password' : 'Sembunyikan password');
        });
    }
    
    // Handle login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!username || !password) {
                showMessage(loginMessage, 'Username dan password harus diisi', 'error');
                usernameInput.focus();
                return;
            }
            
            // Tampilkan loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            submitBtn.disabled = true;
            
            // Simulasi delay network
            setTimeout(() => {
                try {
                    const user = auth.login(username, password, isAdmin);
                    
                    if (user) {
                        // Save username jika diinginkan
                        const rememberMe = document.getElementById('rememberMe');
                        if (rememberMe && rememberMe.checked) {
                            localStorage.setItem('rememberedUsername', username);
                        }
                        
                        showMessage(loginMessage, `Login berhasil! Selamat datang, ${user.name}`, 'success');
                        
                        // Redirect setelah 1 detik
                        setTimeout(() => {
                            auth.redirectBasedOnRole(user);
                        }, 1000);
                    } else {
                        showMessage(loginMessage, 'Username atau password salah. Silakan coba lagi.', 'error');
                        passwordInput.value = '';
                        passwordInput.focus();
                        resetLoginButton();
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    showMessage(loginMessage, 'Terjadi kesalahan saat login. Silakan coba lagi.', 'error');
                    resetLoginButton();
                }
            }, 1000);
            
            function resetLoginButton() {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Auto-focus username field
    if (usernameInput) {
        setTimeout(() => usernameInput.focus(), 100);
    }
}

// ====== FUNGSI DASHBOARD ======

// Setup dashboard (umum untuk admin dan employee)
function setupDashboard() {
    console.log('Setting up dashboard...');
    
    const currentUser = auth.checkAuth();
    if (!currentUser) {
        console.warn('No authenticated user found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('User authenticated:', currentUser.name);
    
    // Update user info
    updateUserInfo(currentUser);
    
    // Update current date
    updateCurrentDate();
    
    // Setup logout button
    setupLogoutButton();
    
    // Setup navigation
    setupNavigation();
    
    // Auto-update waktu
    startClockUpdate();
}

// Update user info
function updateUserInfo(user) {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    if (userAvatar && user.name) {
        const initials = user.name.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        userAvatar.textContent = initials;
        
        // Tambahkan warna random untuk avatar
        const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#009688'];
        const colorIndex = user.id % colors.length;
        userAvatar.style.backgroundColor = colors[colorIndex];
    }
    
    if (userName) {
        userName.textContent = user.name || 'User';
    }
    
    if (userRole) {
        userRole.textContent = user.role === 'admin' ? 'Administrator' : 'Karyawan';
    }
}

// Update current date
function updateCurrentDate() {
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        currentDateElement.textContent = now.toLocaleDateString('id-ID', options);
    }
}

// Start clock update
function startClockUpdate() {
    const liveTimeElement = document.getElementById('liveTime');
    if (liveTimeElement) {
        function updateClock() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            liveTimeElement.textContent = timeString;
        }
        
        updateClock();
        setInterval(updateClock, 1000);
    }
}

// Setup logout button
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                // Tampilkan loading
                logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Keluar...';
                logoutBtn.disabled = true;
                
                setTimeout(() => {
                    auth.logout();
                }, 500);
            }
        });
    }
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#' || this.getAttribute('href') === '') {
                e.preventDefault();
                const target = this.getAttribute('data-target');
                
                if (!target) {
                    console.warn('Navigation item has no data-target attribute');
                    return;
                }
                
                console.log('Navigation clicked:', target);
                
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Load content based on current page
                if (window.location.pathname.includes('admin.html')) {
                    if (typeof adminFunctions !== 'undefined' && 
                        typeof adminFunctions.loadAdminContent === 'function') {
                        adminFunctions.loadAdminContent(target);
                    } else {
                        console.error('Admin functions not available');
                        loadDefaultContent(target);
                    }
                } else {
                    if (typeof employeePage !== 'undefined' && 
                        typeof employeePage.loadEmployeeContent === 'function') {
                        employeePage.loadEmployeeContent(target);
                    } else if (typeof employeeFunctions !== 'undefined' && 
                               typeof employeeFunctions.loadEmployeeContent === 'function') {
                        employeeFunctions.loadEmployeeContent(target);
                    } else {
                        console.error('Employee functions not available');
                        loadDefaultContent(target);
                    }
                }
            }
        });
    });
}

// Default content jika fungsi tidak tersedia
function loadDefaultContent(target) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    const currentUser = auth.checkAuth();
    if (!currentUser) return;
    
    const content = {
        attendance: 'Halaman Absensi',
        history: 'Halaman Riwayat',
        profile: 'Halaman Profil',
        ranking: 'Halaman Ranking',
        employees: 'Daftar Karyawan',
        reports: 'Laporan',
        settings: 'Pengaturan'
    };
    
    contentArea.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-info-circle"></i> ${content[target] || 'Dashboard'}</h3>
            </div>
            <div class="card-body">
                <p>Halaman ${target} untuk ${currentUser.name}</p>
                <p>Fitur ini sedang dalam pengembangan.</p>
            </div>
        </div>
    `;
}

// ====== FUNGSI UTILITAS ======

// Show message utility
function showMessage(element, message, type = 'info') {
    if (!element || !message) return;
    
    // Clear existing messages
    const existingMessages = element.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 
                           type === 'success' ? 'check-circle' : 
                           type === 'warning' ? 'exclamation-circle' : 
                           'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    element.appendChild(messageElement);
    
    // Auto hide after 5 seconds for success/error messages
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            if (messageElement.parentNode === element) {
                messageElement.remove();
            }
        }, 5000);
    }
}

// Format date
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString || '-';
        }
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return dateString || '-';
    }
}

// Format time
function formatTime(timeString) {
    try {
        if (!timeString) return '-';
        
        // Jika sudah dalam format HH:MM
        if (typeof timeString === 'string' && timeString.includes(':')) {
            return timeString;
        }
        
        // Jika berupa timestamp
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return timeString;
    } catch (error) {
        return timeString || '-';
    }
}

// Get day name
function getDayName(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[date.getDay()];
    } catch (error) {
        return 'Unknown';
    }
}

// Check if it's Sunday
function isSunday(dateString) {
    try {
        const date = new Date(dateString);
        return date.getDay() === 0; // 0 = Sunday
    } catch (error) {
        return false;
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle window resize
function handleResize() {
    // Anda bisa menambahkan logika responsive di sini
    console.log('Window resized:', window.innerWidth, 'x', window.innerHeight);
}

// Load employee dashboard (fallback)
function loadEmployeeDashboard() {
    console.log('Loading employee dashboard (fallback)...');
    loadDefaultContent('attendance');
}

// Load admin dashboard (fallback)
function loadAdminDashboard() {
    console.log('Loading admin dashboard (fallback)...');
    loadDefaultContent('employees');
}

// ====== EKSPOR FUNGSI ======

window.utils = {
    showMessage,
    formatDate,
    formatTime,
    getDayName,
    isSunday,
    updateCurrentDate,
    debounce
};

// Export untuk compatibilitas
window.setupLoginPage = setupLoginPage;
window.setupDashboard = setupDashboard;
window.updateUserInfo = updateUserInfo;
window.updateCurrentDate = updateCurrentDate;
