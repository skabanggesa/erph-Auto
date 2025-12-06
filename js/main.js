// Main Application Controller
class ERPHSystem {
    constructor() {
        this.currentPage = 'login';
        this.currentView = null;
        this.language = 'ms'; // Default: Bahasa Malaysia
        
        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    // Initialize application
    init() {
        this.initLanguage();
        this.initEventListeners();
        this.checkAuthState();
    }

    // Initialize language system
    initLanguage() {
        // Load saved language preference
        const savedLang = localStorage.getItem('erph_language');
        if (savedLang) {
            this.language = savedLang;
        }
        this.updateLanguage();
    }

    // Toggle language
    toggleLanguage() {
        this.language = this.language === 'ms' ? 'en' : 'ms';
        localStorage.setItem('erph_language', this.language);
        this.updateLanguage();
        this.loadPage(this.currentPage); // Reload current page with new language
    }

    // Update UI language
    updateLanguage() {
        document.documentElement.lang = this.language;
        // Update language toggle button text
        const langBtn = document.getElementById('lang-toggle');
        if (langBtn) {
            langBtn.textContent = this.language === 'ms' ? 'English' : 'Bahasa Melayu';
        }
    }

    // Initialize event listeners
    initEventListeners() {
        // Listen for auth state changes
        window.addEventListener('authStateChanged', (event) => {
            this.handleAuthChange(event.detail);
        });
    }

    // Handle authentication state change
    handleAuthChange(authState) {
        if (authState.loggedIn) {
            this.showNavigation(authState.role);
            this.routeToDashboard(authState.role);
        } else {
            this.hideNavigation();
            this.loadPage('login');
        }
    }

    // Check initial auth state
    checkAuthState() {
        if (authSystem.isLoggedIn()) {
            const user = authSystem.getCurrentUser();
            this.showNavigation(user.role);
            this.routeToDashboard(user.role);
        } else {
            this.loadPage('login');
        }
    }

    // Show navigation based on role
    showNavigation(role) {
        const navbar = document.getElementById('navbar');
        const navHTML = this.generateNavigation(role);
        navbar.innerHTML = navHTML;
        
        // Add event listeners to nav items
        this.addNavigationListeners(role);
    }

    // Hide navigation
    hideNavigation() {
        const navbar = document.getElementById('navbar');
        navbar.innerHTML = '';
    }

    // Generate navigation HTML based on role
    generateNavigation(role) {
        const user = authSystem.getCurrentUser();
        const navItems = {
            'admin': [
                { id: 'dashboard', text: { ms: 'Utama', en: 'Dashboard' } },
                { id: 'users', text: { ms: 'Pengguna', en: 'Users' } },
                { id: 'calendar', text: { ms: 'Takwim', en: 'Calendar' } },
                { id: 'sessions', text: { ms: 'Sesi Sekolah', en: 'School Sessions' } }
            ],
            'pentadbir': [
                { id: 'dashboard', text: { ms: 'Utama', en: 'Dashboard' } },
                { id: 'rph-review', text: { ms: 'Semak RPH', en: 'Review RPH' } },
                { id: 'analytics', text: { ms: 'Analisis', en: 'Analytics' } }
            ],
            'guru': [
                { id: 'dashboard', text: { ms: 'Utama', en: 'Dashboard' } },
                { id: 'schedule', text: { ms: 'Jadual Waktu', en: 'Schedule' } },
                { id: 'rph-create', text: { ms: 'Buat RPH', en: 'Create RPH' } },
                { id: 'rph-drafts', text: { ms: 'Draf RPH', en: 'RPH Drafts' } },
                { id: 'rph-submitted', text: { ms: 'RPH Dihantar', en: 'Submitted RPH' } }
            ]
        };

        const items = navItems[role] || [];
        
        return `
            <div class="nav-brand">
                📚 e-RPH System
            </div>
            <ul class="nav-menu">
                ${items.map(item => `
                    <li data-page="${item.id}">
                        ${item.text[this.language]}
                    </li>
                `).join('')}
            </ul>
            <div class="nav-user">
                <span>${user.user.email}</span>
                <button id="lang-toggle" class="btn btn-secondary">
                    ${this.language === 'ms' ? 'English' : 'Bahasa Melayu'}
                </button>
                <button id="logout-btn" class="btn btn-secondary">
                    ${this.language === 'ms' ? 'Log Keluar' : 'Logout'}
                </button>
            </div>
        `;
    }

    // Add navigation event listeners
    addNavigationListeners(role) {
        // Page navigation
        document.querySelectorAll('.nav-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.loadPage(page);
            });
        });

        // Language toggle
        const langBtn = document.getElementById('lang-toggle');
        if (langBtn) {
            langBtn.addEventListener('click', () => this.toggleLanguage());
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // Route to appropriate dashboard
    routeToDashboard(role) {
        switch(role) {
            case 'admin':
                this.loadPage('dashboard');
                break;
            case 'pentadbir':
                this.loadPage('dashboard');
                break;
            case 'guru':
                this.loadPage('dashboard');
                break;
            default:
                this.loadPage('login');
        }
    }

    // Load page content
    async loadPage(pageName) {
        this.currentPage = pageName;
        const mainContent = document.getElementById('main-content');
        
        // Show loading
        mainContent.innerHTML = '<div class="spinner"></div>';
        
        // Load page based on name
        try {
            let pageHTML = '';
            
            switch(pageName) {
                case 'login':
                    pageHTML = this.getLoginPage();
                    break;
                case 'dashboard':
                    pageHTML = await this.getDashboardPage();
                    break;
                case 'users':
                    pageHTML = await this.getUsersPage();
                    break;
                default:
                    pageHTML = `<h2>Halaman ${pageName}</h2><p>Halaman sedang dibangunkan.</p>`;
            }
            
            mainContent.innerHTML = pageHTML;
            this.attachPageEvents(pageName);
            
        } catch (error) {
            console.error('Error loading page:', error);
            mainContent.innerHTML = `
                <div class="alert alert-error">
                    <h3>${this.language === 'ms' ? 'Ralat Memuatkan Halaman' : 'Error Loading Page'}</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    // Get login page HTML
    getLoginPage() {
        return `
            <div class="login-container">
                <div class="login-header">
                    <h1>${this.language === 'ms' ? 'Sistem e-RPH Automatik' : 'Automatic e-RPH System'}</h1>
                    <p>${this.language === 'ms' ? 'Sila log masuk ke akaun anda' : 'Please login to your account'}</p>
                </div>
                
                <form id="login-form" class="login-form">
                    <div class="form-group">
                        <label for="email">${this.language === 'ms' ? 'Email' : 'Email'}</label>
                        <input type="email" id="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">${this.language === 'ms' ? 'Kata Laluan' : 'Password'}</label>
                        <input type="password" id="password" required>
                    </div>
                    
                    <button type="submit" class="login-btn">
                        ${this.language === 'ms' ? 'Log Masuk' : 'Login'}
                    </button>
                    
                    <div id="login-error" class="alert alert-error mt-4 hidden"></div>
                </form>
                
                <div class="login-footer">
                    <p>${this.language === 'ms' ? 'Sistem e-RPH © 2024' : 'e-RPH System © 2024'}</p>
                </div>
            </div>
        `;
    }

    // Get dashboard page HTML
    async getDashboardPage() {
        const user = authSystem.getCurrentUser();
        const role = user.role;
        
        let dashboardContent = '';
        
        switch(role) {
            case 'admin':
                dashboardContent = await this.getAdminDashboard();
                break;
            case 'pentadbir':
                dashboardContent = await this.getPentadbirDashboard();
                break;
            case 'guru':
                dashboardContent = await this.getGuruDashboard();
                break;
        }
        
        return `
            <div class="dashboard-header">
                <h1>${this.language === 'ms' ? 'Dashboard Utama' : 'Main Dashboard'}</h1>
                <p>${this.language === 'ms' ? 'Selamat datang, ' : 'Welcome, '}${user.user.email}</p>
            </div>
            ${dashboardContent}
        `;
    }

    // Get admin dashboard
    async getAdminDashboard() {
        // We'll implement this later with actual data
        return `
            <div class="dashboard-cards">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${this.language === 'ms' ? 'Pengguna Sistem' : 'System Users'}</h3>
                        <div class="card-icon">👥</div>
                    </div>
                    <p>${this.language === 'ms' ? 'Urus pengguna dan peranan' : 'Manage users and roles'}</p>
                    <button onclick="erphSystem.loadPage('users')" class="btn btn-primary mt-4">
                        ${this.language === 'ms' ? 'Urus Pengguna' : 'Manage Users'}
                    </button>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${this.language === 'ms' ? 'Takwim Sekolah' : 'School Calendar'}</h3>
                        <div class="card-icon">📅</div>
                    </div>
                    <p>${this.language === 'ms' ? 'Muat naik takwim persekolahan' : 'Upload school calendar'}</p>
                    <button onclick="erphSystem.loadPage('calendar')" class="btn btn-primary mt-4">
                        ${this.language === 'ms' ? 'Urus Takwim' : 'Manage Calendar'}
                    </button>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${this.language === 'ms' ? 'Sesi Sekolah' : 'School Session'}</h3>
                        <div class="card-icon">⏰</div>
                    </div>
                    <p>${this.language === 'ms' ? 'Tetapkan waktu sesi sekolah' : 'Set school session times'}</p>
                    <button onclick="erphSystem.loadPage('sessions')" class="btn btn-primary mt-4">
                        ${this.language === 'ms' ? 'Tetapan Sesi' : 'Session Settings'}
                    </button>
                </div>
            </div>
        `;
    }

    // Get pentadbir dashboard
    async getPentadbirDashboard() {
        return `
            <div class="dashboard-cards">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${this.language === 'ms' ? 'Semakan RPH' : 'RPH Review'}</h3>
                        <div class="card-icon">📋</div>
                    </div>
                    <p>${this.language === 'ms' ? 'Semak RPH yang dihantar' : 'Review submitted RPH'}</p>
                    <button onclick="erphSystem.loadPage('rph-review')" class="btn btn-primary mt-4">
                        ${this.language === 'ms' ? 'Mula Semakan' : 'Start Review'}
                    </button>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${this.language === 'ms' ? 'Analisis' : 'Analytics'}</h3>
                        <div class="card-icon">📊</div>
                    </div>
                    <p>${this.language === 'ms' ? 'Analisis penghantaran RPH' : 'RPH submission analytics'}</p>
                    <button onclick="erphSystem.loadPage('analytics')" class="btn btn-primary mt-4">
                        ${this.language === 'ms' ? 'Lihat Analisis' : 'View Analytics'}
                    </button>
                </div>
            </div>
        `;
    }

    // Get guru dashboard
    async getGuruDashboard() {
        return `
            <div class="dashboard-cards">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${this.language === 'ms' ? 'Jadual Waktu' : 'Timetable'}</h3>
                        <div class="card-icon">📅</div>
                    </div>
                    <p>${this.language === 'ms' ? 'Urus jadual waktu pengajaran' : 'Manage teaching timetable'}</p>
                    <button onclick="erphSystem.loadPage('schedule')" class="btn btn-primary mt-4">
                        ${this.language === 'ms' ? 'Urus Jadual' : 'Manage Schedule'}
                    </button>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${this.language === 'ms' ? 'Buat RPH' : 'Create RPH'}</h3>
                        <div class="card-icon">✏️</div>
                    </div>
                    <p>${this.language === 'ms' ? 'Jana RPH automatik' : 'Generate automatic RPH'}</p>
                    <button onclick="erphSystem.loadPage('rph-create')" class="btn btn-primary mt-4">
                        ${this.language === 'ms' ? 'Jana RPH' : 'Generate RPH'}
                    </button>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${this.language === 'ms' ? 'Draf RPH' : 'RPH Drafts'}</h3>
                        <div class="card-icon">📝</div>
                    </div>
                    <p>${this.language === 'ms' ? 'Lihat dan edit draf RPH' : 'View and edit RPH drafts'}</p>
                    <button onclick="erphSystem.loadPage('rph-drafts')" class="btn btn-primary mt-4">
                        ${this.language === 'ms' ? 'Lihat Draf' : 'View Drafts'}
                    </button>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${this.language === 'ms' ? 'RPH Dihantar' : 'Submitted RPH'}</h3>
                        <div class="card-icon">📨</div>
                    </div>
                    <p>${this.language === 'ms' ? 'Sejarah penghantaran RPH' : 'RPH submission history'}</p>
                    <button onclick="erphSystem.loadPage('rph-submitted')" class="btn btn-primary mt-4">
                        ${this.language === 'ms' ? 'Lihat Sejarah' : 'View History'}
                    </button>
                </div>
            </div>
        `;
    }

    // Get users management page (admin only)
async getUsersPage() {
    try {
        // Get current user
        const currentUser = authSystem.getCurrentUser();
        
        // Get all users
        const users = await database.getAllUsers();
        
        // Sort users: admin first, then active users
        users.sort((a, b) => {
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (a.role !== 'admin' && b.role === 'admin') return 1;
            return (a.active === false) - (b.active === false);
        });
        
        const usersTable = users.length > 0 ? 
            uiSystem.generateUsersTableRows(users, currentUser.user.uid) :
            `<tr><td colspan="5" class="text-center">
                ${this.language === 'ms' ? 'Tiada pengguna ditemui' : 'No users found'}
            </td></tr>`;
        
        return `
            <div class="page-header">
                <h1>${this.language === 'ms' ? 'Pengurusan Pengguna' : 'User Management'}</h1>
                <button id="add-user-btn" class="btn btn-primary">
                    ${this.language === 'ms' ? '+ Tambah Pengguna' : '+ Add User'}
                </button>
            </div>
            
            <div class="table-container">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>${this.language === 'ms' ? 'Nama' : 'Name'}</th>
                            <th>Email</th>
                            <th>${this.language === 'ms' ? 'Peranan' : 'Role'}</th>
                            <th>${this.language === 'ms' ? 'Status' : 'Status'}</th>
                            <th>${this.language === 'ms' ? 'Tindakan' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody id="users-list">
                        ${usersTable}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading users page:', error);
        return `
            <div class="alert alert-error">
                <h3>${this.language === 'ms' ? 'Ralat Memuatkan Pengguna' : 'Error Loading Users'}</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

    // Attach page-specific events
    attachPageEvents(pageName) {
        switch(pageName) {
            case 'login':
                this.attachLoginEvents();
                break;
            case 'users':
                this.attachUsersEvents();
                break;
        }
    }

    // Attach login form events
    attachLoginEvents() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('login-error');
                
                // Clear previous error
                errorDiv.classList.add('hidden');
                errorDiv.textContent = '';
                
                // Show loading
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = this.language === 'ms' ? 'Memuatkan...' : 'Loading...';
                submitBtn.disabled = true;
                
                // Attempt login
                const result = await authSystem.login(email, password);
                
                if (result.success) {
                    // Login successful - auth listener will handle redirection
                    console.log('Login successful');
                } else {
                    // Show error
                    errorDiv.textContent = result.error;
                    errorDiv.classList.remove('hidden');
                    
                    // Reset button
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }

    // Attach users page events
attachUsersEvents() {
    // Add user button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            uiSystem.showAddUserForm();
        });
    }
}

// Dalam class ERPHSystem, tambah functions:

// Get calendar page
async getCalendarPage() {
    try {
        const currentCalendar = await database.getCurrentCalendar();
        
        return `
            <div class="page-header">
                <h1>${this.language === 'ms' ? 'Takwim Sekolah' : 'School Calendar'}</h1>
                <button id="upload-calendar-btn" class="btn btn-primary">
                    ${this.language === 'ms' ? '+ Muat Naik Takwim' : '+ Upload Calendar'}
                </button>
            </div>
            
            ${currentCalendar ? `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            ${this.language === 'ms' ? 'Takwim Semasa' : 'Current Calendar'} - ${currentCalendar.year}
                        </h3>
                        <div class="card-icon">📅</div>
                    </div>
                    <div class="card-body">
                        <p><strong>${this.language === 'ms' ? 'Dimuat naik pada:' : 'Uploaded on:'}</strong> 
                           ${new Date(currentCalendar.uploadedAt?.toDate()).toLocaleDateString('ms-MY')}</p>
                        <p><strong>${this.language === 'ms' ? 'Status:' : 'Status:'}</strong> 
                           <span class="status-badge active">${this.language === 'ms' ? 'Aktif' : 'Active'}</span></p>
                        
                        <div class="mt-4">
                            <h4>${this.language === 'ms' ? 'Data Takwim:' : 'Calendar Data:'}</h4>
                            <pre style="background: #f8f9fa; padding: 1rem; border-radius: 5px; max-height: 300px; overflow: auto;">
${JSON.stringify(currentCalendar.data, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="alert alert-info">
                    <h3>${this.language === 'ms' ? 'Tiada Takwim Ditemui' : 'No Calendar Found'}</h3>
                    <p>${this.language === 'ms' ? 
                        'Sila muat naik takwim sekolah untuk tahun semasa.' : 
                        'Please upload the school calendar for the current year.'}
                    </p>
                </div>
            `}
        `;
    } catch (error) {
        console.error('Error loading calendar page:', error);
        return `
            <div class="alert alert-error">
                <h3>${this.language === 'ms' ? 'Ralat Memuatkan Takwim' : 'Error Loading Calendar'}</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Get sessions page
async getSessionsPage() {
    try {
        const sessionSettings = await database.getSessionSettings();
        
        return `
            <div class="page-header">
                <h1>${this.language === 'ms' ? 'Tetapan Sesi Sekolah' : 'School Session Settings'}</h1>
                <button id="edit-session-btn" class="btn btn-primary">
                    ${this.language === 'ms' ? 'Edit Tetapan' : 'Edit Settings'}
                </button>
            </div>
            
            ${sessionSettings ? `
                <div class="dashboard-cards">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">${this.language === 'ms' ? 'Waktu Sekolah' : 'School Hours'}</h3>
                            <div class="card-icon">⏰</div>
                        </div>
                        <div class="card-body">
                            <p><strong>${this.language === 'ms' ? 'Mula:' : 'Start:'}</strong> ${sessionSettings.startTime}</p>
                            <p><strong>${this.language === 'ms' ? 'Tamat:' : 'End:'}</strong> ${sessionSettings.endTime}</p>
                            <p><strong>${this.language === 'ms' ? 'Tempoh:' : 'Duration:'}</strong> ${this.calculateDuration(sessionSettings.startTime, sessionSettings.endTime)}</p>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">${this.language === 'ms' ? 'Waktu Rehat' : 'Break Time'}</h3>
                            <div class="card-icon">🍽️</div>
                        </div>
                        <div class="card-body">
                            <p><strong>${this.language === 'ms' ? 'Mula:' : 'Start:'}</strong> ${sessionSettings.breakStart}</p>
                            <p><strong>${this.language === 'ms' ? 'Tamat:' : 'End:'}</strong> ${sessionSettings.breakEnd}</p>
                            <p><strong>${this.language === 'ms' ? 'Tempoh:' : 'Duration:'}</strong> ${this.calculateDuration(sessionSettings.breakStart, sessionSettings.breakEnd)}</p>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">${this.language === 'ms' ? 'Waktu Pengajaran' : 'Teaching Periods'}</h3>
                            <div class="card-icon">📚</div>
                        </div>
                        <div class="card-body">
                            <p><strong>${this.language === 'ms' ? 'Bilangan Waktu:' : 'Number of Periods:'}</strong> ${sessionSettings.periodsPerDay}</p>
                            <p><strong>${this.language === 'ms' ? 'Tempoh Satu Waktu:' : 'Period Duration:'}</strong> ${sessionSettings.periodDuration} ${this.language === 'ms' ? 'minit' : 'minutes'}</p>
                            <p><strong>${this.language === 'ms' ? 'Jumlah Masa:' : 'Total Time:'}</strong> ${sessionSettings.periodsPerDay * sessionSettings.periodDuration} ${this.language === 'ms' ? 'minit' : 'minutes'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-4">
                    <div class="card-header">
                        <h3 class="card-title">${this.language === 'ms' ? 'Jadual Waktu Contoh' : 'Sample Timetable'}</h3>
                    </div>
                    <div class="card-body">
                        ${this.generateSampleTimetable(sessionSettings)}
                    </div>
                </div>
            ` : `
                <div class="alert alert-info">
                    <h3>${this.language === 'ms' ? 'Tetapan Sesi Belum Ditetapkan' : 'Session Settings Not Set'}</h3>
                    <p>${this.language === 'ms' ? 
                        'Sila tetapkan waktu sesi sekolah terlebih dahulu.' : 
                        'Please set the school session times first.'}
                    </p>
                </div>
            `}
        `;
    } catch (error) {
        console.error('Error loading sessions page:', error);
        return `
            <div class="alert alert-error">
                <h3>${this.language === 'ms' ? 'Ralat Memuatkan Tetapan' : 'Error Loading Settings'}</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Helper function to calculate duration
calculateDuration(startTime, endTime) {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diffMinutes = (end - start) / (1000 * 60);
    return `${diffMinutes} minit`;
}

// Generate sample timetable
generateSampleTimetable(settings) {
    if (!settings) return '';
    
    let html = '<table class="users-table" style="width: 100%;">';
    html += '<thead><tr><th>Waktu</th><th>Tempoh</th><th>Aktiviti</th></tr></thead>';
    html += '<tbody>';
    
    // Add periods
    const periods = settings.periodsPerDay;
    const periodDuration = settings.periodDuration;
    
    let currentTime = new Date(`2000-01-01T${settings.startTime}:00`);
    
    for (let i = 1; i <= periods; i++) {
        const startStr = currentTime.toTimeString().substring(0, 5);
        
        // Check if it's break time
        const breakStart = new Date(`2000-01-01T${settings.breakStart}:00`);
        const breakEnd = new Date(`2000-01-01T${settings.breakEnd}:00`);
        
        if (currentTime >= breakStart && currentTime < breakEnd) {
            // This is break time
            const breakDuration = (breakEnd - breakStart) / (1000 * 60);
            html += `<tr style="background: #fff3cd;">
                <td>${settings.breakStart} - ${settings.breakEnd}</td>
                <td>${breakDuration} minit</td>
                <td><strong>Waktu Rehat</strong></td>
            </tr>`;
            
            currentTime = breakEnd;
            i--; // Don't count break as a period
            continue;
        }
        
        // Calculate end time
        const endTime = new Date(currentTime.getTime() + periodDuration * 60000);
        const endStr = endTime.toTimeString().substring(0, 5);
        
        html += `<tr>
            <td>${startStr} - ${endStr}</td>
            <td>${periodDuration} minit</td>
            <td>Waktu ${i}</td>
        </tr>`;
        
        currentTime = endTime;
    }
    
    html += '</tbody></table>';
    return html;
}

// Jangan lupa update loadPage function untuk include pages baru:

async loadPage(pageName) {
    this.currentPage = pageName;
    const mainContent = document.getElementById('main-content');
    
    // Show loading
    mainContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        let pageHTML = '';
        
        switch(pageName) {
            case 'login':
                pageHTML = this.getLoginPage();
                break;
            case 'dashboard':
                pageHTML = await this.getDashboardPage();
                break;
            case 'users':
                pageHTML = await this.getUsersPage();
                break;
            case 'calendar':
                pageHTML = await this.getCalendarPage();
                break;
            case 'sessions':
                pageHTML = await this.getSessionsPage();
                break;
            default:
                pageHTML = `<h2>Halaman ${pageName}</h2><p>Halaman sedang dibangunkan.</p>`;
        }
        
        mainContent.innerHTML = pageHTML;
        this.attachPageEvents(pageName);
        
    } catch (error) {
        console.error('Error loading page:', error);
        mainContent.innerHTML = `
            <div class="alert alert-error">
                <h3>${this.language === 'ms' ? 'Ralat Memuatkan Halaman' : 'Error Loading Page'}</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Dan update attachPageEvents:

attachPageEvents(pageName) {
    switch(pageName) {
        case 'login':
            this.attachLoginEvents();
            break;
        case 'users':
            this.attachUsersEvents();
            break;
        case 'calendar':
            this.attachCalendarEvents();
            break;
        case 'sessions':
            this.attachSessionsEvents();
            break;
    }
}

// Tambah attachCalendarEvents function:

// Dalam class ERPHSystem:

attachCalendarEvents() {
    // Use event delegation for dynamic buttons
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'upload-calendar-btn') {
            console.log('Upload calendar button clicked');
            e.preventDefault();
            uiSystem.showUploadCalendarForm();
        }
    });
}

attachSessionsEvents() {
    // Use event delegation for dynamic buttons
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'edit-session-btn') {
            console.log('Edit session button clicked');
            e.preventDefault();
            uiSystem.showSessionSettingsForm();
        }
    });
}

attachUsersEvents() {
    // Add user button
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'add-user-btn') {
            console.log('Add user button clicked');
            e.preventDefault();
            uiSystem.showAddUserForm();
        }
    });
}

    // Logout function
    async logout() {
        const result = await authSystem.logout();
        if (result.success) {
            this.loadPage('login');
        } else {
            alert(result.error);
        }
    }
}

// Initialize the application
const erphSystem = new ERPHSystem();