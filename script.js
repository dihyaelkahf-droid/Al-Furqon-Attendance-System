// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi data
    auth.initializeData();
    
    // Setup untuk halaman login
    if (document.getElementById('loginForm')) {
        setupLoginPage();
    }
    
    // Setup untuk halaman admin/employee
    if (document.getElementById('logoutBtn')) {
        setupDashboard();
    }
});

// Setup halaman login
function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const employeeBtn = document.getElementById('employeeBtn');
    const adminBtn = document.getElementById('adminBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    let isAdmin = false;
    
    // Toggle user type
    if (employeeBtn && adminBtn) {
        employeeBtn.addEventListener('click', () => {
            employeeBtn.classList.add('active');
            adminBtn.classList.remove('active');
            isAdmin = false;
        });
        
        adminBtn.addEventListener('click', () => {
            adminBtn.classList.add('active');
            employeeBtn.classList.remove('active');
            isAdmin = true;
        });
    }
    
    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.innerHTML = type === 'password' ? 
                '<i class="fas fa-eye"></i>' : 
                '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Handle login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('loginMessage');
            
            if (!username || !password) {
                showMessage(messageDiv, 'Username dan password harus diisi', 'error');
                return;
            }
            
            const user = auth.login(username, password, isAdmin);
            
            if (user) {
                showMessage(messageDiv, 'Login berhasil! Mengalihkan...', 'success');
                setTimeout(() => {
                    auth.redirectBasedOnRole(user);
                }, 1000);
            } else {
                showMessage(messageDiv, 'Username atau password salah', 'error');
            }
        });
    }
}

// Setup dashboard
function setupDashboard() {
    const currentUser = auth.checkAuth();
    if (!currentUser) return;
    
    // Update user info
    updateUserInfo(currentUser);
    
    // Update current date
    updateCurrentDate();
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                auth.logout();
            }
        });
    }
    
    // Setup navigation
    setupNavigation();
    
    // Load initial content based on page
    if (window.location.pathname.includes('admin.html')) {
        loadAdminDashboard();
    } else if (window.location.pathname.includes('employee.html')) {
        loadEmployeeDashboard();
    }
}

// Update user info
function updateUserInfo(user) {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    if (userAvatar) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        userAvatar.textContent = initials;
    }
    
    if (userName) {
        userName.textContent = user.name;
    }
    
    if (userRole) {
        userRole.textContent = user.role === 'admin' ? 'Administrator' : 'Karyawan';
    }
}

// Update current date
function updateCurrentDate() {
    const currentDate = document.getElementById('currentDate');
    if (currentDate) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        currentDate.textContent = now.toLocaleDateString('id-ID', options);
    }
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                const target = this.getAttribute('data-target');
                
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Load content based on target
                if (window.location.pathname.includes('admin.html')) {
                    loadAdminContent(target);
                } else {
                    loadEmployeeContent(target);
                }
            }
        });
    });
}

// Show message
function showMessage(element, message, type = 'info') {
    if (!element) return;
    
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    // Auto hide after 5 seconds
    if (type !== 'error') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Format time
function formatTime(timeString) {
    return timeString;
}

// Get day name
function getDayName(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
}

// Check if it's Sunday
function isSunday(dateString) {
    const date = new Date(dateString);
    return date.getDay() === 0; // 0 = Sunday
}

// Export fungsi
window.utils = {
    showMessage,
    formatDate,
    formatTime,
    getDayName,
    isSunday,
    updateCurrentDate
};