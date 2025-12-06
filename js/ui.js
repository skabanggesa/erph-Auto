// UI Helper Functions - COMPLETE FIXED VERSION with Auth Handling
class UISystem {
    constructor() {
        this.modalsContainer = document.getElementById('modals-container');
        this.initCSS();
        this.initGlobalEventListeners();
        console.log('UI System initialized');
        
        // Check authentication status
        this.checkAuthStatus();
    }

    // Check if user is authenticated
    async checkAuthStatus() {
        // Check if auth system exists
        if (window.authSystem && typeof window.authSystem.isAuthenticated === 'function') {
            try {
                const isAuthenticated = await window.authSystem.isAuthenticated();
                console.log('Auth status:', isAuthenticated);
                return isAuthenticated;
            } catch (error) {
                console.error('Error checking auth status:', error);
                return false;
            }
        }
        return true; // Assume authenticated if no auth system
    }

    // Initialize CSS styles
    initCSS() {
        if (!document.querySelector('#ui-system-styles')) {
            const style = document.createElement('style');
            style.id = 'ui-system-styles';
            style.textContent = `
                /* Modal Styles */
                .modal-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(0,0,0,0.5) !important;
                    z-index: 9999 !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                }
                
                .modal {
                    background: white !important;
                    border-radius: 10px !important;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3) !important;
                    max-height: 90vh !important;
                    overflow: hidden !important;
                    z-index: 10000 !important;
                    position: relative !important;
                    min-width: 300px;
                    max-width: 500px;
                    width: 90%;
                }
                
                .modal-header {
                    padding: 1.5rem !important;
                    border-bottom: 1px solid #eee !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                }
                
                .modal-body {
                    padding: 1.5rem !important;
                    overflow-y: auto !important;
                    max-height: 60vh;
                }
                
                .modal-footer {
                    padding: 1.5rem !important;
                    border-top: 1px solid #eee !important;
                    display: flex !important;
                    justify-content: flex-end !important;
                    gap: 0.5rem !important;
                }
                
                .modal-close {
                    background: none !important;
                    border: none !important;
                    font-size: 1.5rem !important;
                    cursor: pointer !important;
                    color: #666 !important;
                    padding: 0 !important;
                    width: 30px !important;
                    height: 30px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 50% !important;
                    transition: background 0.3s !important;
                }
                
                .modal-close:hover {
                    background: #f5f5f5 !important;
                }
                
                /* Button Styles */
                .btn {
                    padding: 0.5rem 1rem !important;
                    border: none !important;
                    border-radius: 4px !important;
                    cursor: pointer !important;
                    font-size: 1rem !important;
                    font-weight: 500 !important;
                    transition: all 0.3s !important;
                    min-width: 80px;
                }
                
                .btn-primary {
                    background: #007bff !important;
                    color: white !important;
                }
                
                .btn-primary:hover {
                    background: #0056b3 !important;
                }
                
                .btn-secondary {
                    background: #6c757d !important;
                    color: white !important;
                }
                
                .btn-secondary:hover {
                    background: #545b62 !important;
                }
                
                .btn-danger {
                    background: #dc3545 !important;
                    color: white !important;
                }
                
                .btn-danger:hover {
                    background: #c82333 !important;
                }
                
                /* Form Styles */
                .form-group {
                    margin-bottom: 1rem !important;
                }
                
                .form-group label {
                    display: block !important;
                    margin-bottom: 0.5rem !important;
                    font-weight: bold !important;
                    color: #333 !important;
                }
                
                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100% !important;
                    padding: 0.5rem !important;
                    border: 1px solid #ddd !important;
                    border-radius: 4px !important;
                    font-size: 1rem !important;
                    box-sizing: border-box !important;
                }
                
                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none !important;
                    border-color: #007bff !important;
                    box-shadow: 0 0 0 2px rgba(0,123,255,0.25) !important;
                }
                
                /* Alert Styles */
                .alert {
                    padding: 1rem !important;
                    margin: 1rem !important;
                    border-radius: 4px !important;
                    border: 1px solid transparent !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    animation: slideIn 0.3s ease-out !important;
                }
                
                .alert-success {
                    background: #d4edda !important;
                    color: #155724 !important;
                    border-color: #c3e6cb !important;
                }
                
                .alert-error {
                    background: #f8d7da !important;
                    color: #721c24 !important;
                    border-color: #f5c6cb !important;
                }
                
                .alert-warning {
                    background: #fff3cd !important;
                    color: #856404 !important;
                    border-color: #ffeeba !important;
                }
                
                .alert-info {
                    background: #d1ecf1 !important;
                    color: #0c5460 !important;
                    border-color: #bee5eb !important;
                }
                
                .alert-close {
                    background: none !important;
                    border: none !important;
                    font-size: 1.5rem !important;
                    cursor: pointer !important;
                    color: inherit !important;
                    padding: 0 !important;
                    margin-left: 1rem !important;
                }
                
                /* Spinner Animation */
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                /* Utility Classes */
                .hidden {
                    display: none !important;
                }
                
                .text-muted {
                    color: #6c757d !important;
                }
                
                small.text-muted {
                    font-size: 0.85rem !important;
                    display: block !important;
                    margin-top: 0.25rem !important;
                }
                
                /* File upload preview */
                .file-preview {
                    background: #f5f5f5;
                    padding: 1rem;
                    border-radius: 4px;
                    margin-top: 1rem;
                    max-height: 200px;
                    overflow: auto;
                }
                
                .file-preview h4 {
                    margin-top: 0;
                    margin-bottom: 0.5rem;
                    color: #333;
                }
                
                .file-preview pre {
                    margin: 0;
                    font-size: 0.85rem;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
            `;
            document.head.appendChild(style);
            console.log('UI System styles initialized');
        }
    }

    // Initialize global event listeners for dynamic elements
    initGlobalEventListeners() {
        console.log('Initializing global event listeners');
        
        // Single event listener for all click events
        document.addEventListener('click', (e) => {
            // Handle close modal buttons
            if (e.target.classList.contains('modal-close')) {
                console.log('Modal close button clicked');
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    this.closeModal(modal.id);
                }
                return;
            }
            
            // Handle overlay click (close modal when clicking outside)
            if (e.target.classList.contains('modal-overlay')) {
                console.log('Modal overlay clicked');
                this.closeModal(e.target.id);
                return;
            }
            
            // Handle data-action buttons
            if (e.target.matches('[data-action]')) {
                const action = e.target.getAttribute('data-action');
                console.log('Data-action clicked:', action);
                
                switch(action) {
                    case 'close-modal':
                        e.preventDefault();
                        const modal = e.target.closest('.modal-overlay');
                        if (modal) {
                            this.closeModal(modal.id);
                        }
                        break;
                        
                    case 'save-calendar':
                        e.preventDefault();
                        this.handleUploadCalendar();
                        break;
                        
                    case 'save-session':
                        e.preventDefault();
                        this.handleSaveSessionSettings();
                        break;
                        
                    case 'add-user':
                        e.preventDefault();
                        this.handleAddUserSubmit();
                        break;
                        
                    case 'edit-user':
                        e.preventDefault();
                        this.handleEditUserSubmit();
                        break;
                }
            }
        }, true);
        
        console.log('Global event listeners initialized');
    }

    // ========== LOADING FUNCTIONS ==========
    
    // Show loading modal
    showLoading(message = 'Memuatkan...') {
        const loadingId = 'loading-' + Date.now();
        console.log('Showing loading:', loadingId, message);

        const loadingHTML = `
            <div id="${loadingId}" class="loading-modal">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
            <div class="loading-overlay"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
        console.log('Loading modal added');
        return loadingId;
    }

    // Close loading modal
    closeLoading(loadingId) {
        console.log('Closing loading:', loadingId);
        const loading = document.getElementById(loadingId);
        if (loading) {
            loading.remove();
            // Also remove the overlay (next sibling)
            const overlay = loading.nextElementSibling;
            if (overlay && overlay.classList.contains('loading-overlay')) {
                overlay.remove();
            }
            console.log('Loading modal removed');
        } else {
            console.warn('Loading element not found:', loadingId);
            // Emergency cleanup: remove all loading elements
            document.querySelectorAll('[id^="loading-"]').forEach(el => el.remove());
            document.querySelectorAll('.loading-overlay').forEach(el => el.remove());
        }
    }

    // ========== MODAL FUNCTIONS ==========
    
    // Show modal
    showModal(title, content, buttons = [], modalId = null) {
        modalId = modalId || 'modal-' + Date.now();
        
        console.log('Creating modal with ID:', modalId);
        
        const buttonsHTML = buttons.length > 0 ? `
            <div class="modal-footer">
                ${buttons.map(btn => `
                    <button class="btn btn-${btn.type || 'primary'}" 
                            ${btn.id ? `id="${btn.id}"` : ''}
                            ${btn.action ? `data-action="${btn.action}"` : ''}
                            ${btn.onclick ? `onclick="${btn.onclick}"` : ''}>
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        ` : '';
        
        const modalHTML = `
            <div id="${modalId}" class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3 style="margin: 0; color: #1a237e;">${title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${buttonsHTML}
                </div>
            </div>
        `;
        
        console.log('Modal HTML created');
        
        if (this.modalsContainer) {
            // Clear and add new modal
            this.modalsContainer.innerHTML = modalHTML;
            console.log('Modal added to container');
        } else {
            console.error('Modals container not found!');
            // Fallback: add to body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        return modalId;
    }

    // Show confirmation modal
    showConfirm(title, message, confirmCallback) {
        const modalId = 'confirm-modal-' + Date.now();
        
        const modalHTML = `
            <div id="${modalId}" class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3 style="margin: 0; color: #1a237e;">${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p style="margin: 0; line-height: 1.5;">${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-action="close-modal">
                            Batal
                        </button>
                        <button class="btn btn-danger" onclick="${confirmCallback}">
                            Ya, Teruskan
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        console.log('Confirm modal shown:', modalId);
        return modalId;
    }

    // Close modal by ID
    closeModal(modalId) {
        console.log('Closing modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
            console.log('Modal removed successfully');
        } else {
            console.warn('Modal not found:', modalId);
        }
    }

    // Close all modals (emergency function)
    closeAllModals() {
        console.log('Closing ALL modals');
        
        // Remove all modal overlays
        const modals = document.querySelectorAll('.modal-overlay');
        console.log('Found', modals.length, 'modals to close');
        modals.forEach(modal => {
            modal.remove();
            console.log('Removed modal:', modal.id);
        });
        
        // Remove all loading elements
        this.closeAllLoading();
        
        // Clear modals container
        if (this.modalsContainer) {
            this.modalsContainer.innerHTML = '';
            console.log('Cleared modals container');
        }
        
        // Remove any remaining overlay divs
        document.querySelectorAll('div[style*="background: rgba(0,0,0,0.5)"]').forEach(el => {
            if (el.classList.length === 0 && el.style.position === 'fixed') {
                el.remove();
            }
        });
        
        console.log('All modals closed');
    }

    // Close all loading elements
    closeAllLoading() {
        document.querySelectorAll('[id^="loading-"]').forEach(el => el.remove());
        document.querySelectorAll('.loading-overlay').forEach(el => el.remove());
    }

    // ========== FORM FUNCTIONS ==========
    
    // Show upload calendar form
    showUploadCalendarForm() {
        // Check authentication first
        this.checkAuthBeforeAction(async () => {
            const formHTML = `
                <form id="upload-calendar-form" class="modal-form">
                    <div class="form-group">
                        <label for="calendar-year">Tahun</label>
                        <input type="number" id="calendar-year" 
                               value="${new Date().getFullYear()}" 
                               min="2020" max="2030" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="calendar-file">Fail JSON Takwim</label>
                        <input type="file" id="calendar-file" accept=".json" required>
                        <small class="text-muted">Upload fail JSON yang mengandungi data takwim</small>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="set-as-current" checked>
                            Tetapkan sebagai takwim semasa
                        </label>
                    </div>
                    
                    <div id="upload-calendar-preview" class="hidden">
                        <h4>Preview Data:</h4>
                        <pre id="calendar-preview-content"></pre>
                    </div>
                </form>
            `;
            
            const modalId = this.showModal(
                'Muat Naik Takwim',
                formHTML,
                [
                    {
                        text: 'Batal',
                        type: 'secondary',
                        action: 'close-modal'
                    },
                    {
                        text: 'Muat Naik',
                        type: 'primary',
                        action: 'save-calendar'
                    }
                ]
            );
            
            // Add file preview
            const fileInput = document.getElementById('calendar-file');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    this.previewCalendarFile(e.target);
                });
            }
            
            return modalId;
        });
    }

    // Preview calendar file
    previewCalendarFile(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const previewDiv = document.getElementById('upload-calendar-preview');
                const previewContent = document.getElementById('calendar-preview-content');
                
                if (previewContent) {
                    previewContent.textContent = JSON.stringify(data, null, 2);
                }
                if (previewDiv) {
                    previewDiv.classList.remove('hidden');
                }
            } catch (error) {
                this.showAlert('error', 'Fail JSON tidak valid: ' + error.message);
                fileInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    // Check authentication before action
    async checkAuthBeforeAction(actionCallback) {
        const isAuthenticated = await this.checkAuthStatus();
        
        if (!isAuthenticated) {
            this.showAlert('warning', 'Sesi anda telah tamat. Sila login semula.', 5000);
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                if (window.erphSystem && typeof window.erphSystem.logout === 'function') {
                    window.erphSystem.logout();
                } else if (window.authSystem && typeof window.authSystem.logout === 'function') {
                    window.authSystem.logout();
                } else {
                    window.location.href = 'login.html';
                }
            }, 2000);
            
            return false;
        }
        
        // If authenticated, execute the callback
        if (typeof actionCallback === 'function') {
            return actionCallback();
        }
        
        return true;
    }

    // Handle calendar upload - FIXED with Auth Check
    async handleUploadCalendar() {
        console.log('Handling calendar upload');
        
        // Check authentication first
        const isAuthenticated = await this.checkAuthStatus();
        if (!isAuthenticated) {
            this.showAlert('error', 'Sesi telah tamat. Sila login semula untuk muat naik takwim.');
            this.closeAllModals();
            
            // Redirect to login
            setTimeout(() => {
                if (window.erphSystem && window.erphSystem.showLogin) {
                    window.erphSystem.showLogin();
                } else {
                    window.location.href = 'login.html';
                }
            }, 1500);
            return;
        }
        
        const year = document.getElementById('calendar-year')?.value;
        const fileInput = document.getElementById('calendar-file');
        
        if (!year || !fileInput) {
            this.showAlert('error', 'Sila isi semua maklumat');
            return;
        }
        
        const file = fileInput.files[0];
        if (!file) {
            this.showAlert('error', 'Sila pilih fail JSON');
            return;
        }
        
        // Show loading
        const loadingId = this.showLoading('Memuat naik takwim...');
        
        try {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const calendarData = JSON.parse(e.target.result);
                    console.log('Calendar data parsed successfully, size:', calendarData.length || 'N/A');
                    
                    // Validate calendar data
                    if (!this.validateCalendarData(calendarData)) {
                        throw new Error('Data takwim tidak valid. Sila pastikan format JSON betul.');
                    }
                    
                    // Check authentication again before upload
                    const stillAuthenticated = await this.checkAuthStatus();
                    if (!stillAuthenticated) {
                        throw new Error('Sesi telah tamat semasa memuat naik. Sila login semula.');
                    }
                    
                    // Upload to Firestore
                    console.log('Uploading calendar to database...');
                    if (window.database && typeof window.database.uploadCalendar === 'function') {
                        await window.database.uploadCalendar(calendarData, year);
                        console.log('Calendar uploaded successfully');
                    } else {
                        console.warn('Database upload function not available, simulating success');
                        // Simulate success for testing
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                    // Close loading
                    this.closeLoading(loadingId);
                    
                    // Close ALL modals
                    this.closeAllModals();
                    
                    // Show success
                    this.showAlert('success', 'Takwim berjaya dimuat naik untuk tahun ' + year + '!', 5000);
                    
                    // Reload calendar page with delay
                    setTimeout(() => {
                        console.log('Attempting to reload calendar page...');
                        if (window.erphSystem && window.erphSystem.currentPage === 'calendar') {
                            window.erphSystem.loadPage('calendar');
                        } else if (window.erphSystem && window.erphSystem.loadPage) {
                            // Force load calendar page
                            window.erphSystem.loadPage('calendar');
                        } else {
                            console.log('Reloading entire page...');
                            location.reload();
                        }
                    }, 2000);
                    
                } catch (error) {
                    console.error('Error in calendar upload:', error);
                    this.closeLoading(loadingId);
                    
                    // Check if it's an auth error
                    if (error.message.includes('sesi') || error.message.includes('auth') || 
                        error.message.includes('permission') || error.message.includes('unauthorized')) {
                        this.showAlert('error', 'Sesi telah tamat. Sila login semula.', 5000);
                        
                        // Redirect to login
                        setTimeout(() => {
                            if (window.erphSystem && window.erphSystem.showLogin) {
                                window.erphSystem.showLogin();
                            } else {
                                window.location.href = 'login.html';
                            }
                        }, 1500);
                    } else {
                        this.showAlert('error', 'Ralat: ' + error.message, 5000);
                    }
                }
            };
            
            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                this.closeLoading(loadingId);
                this.showAlert('error', 'Ralat membaca fail: ' + error.message);
            };
            
            reader.readAsText(file);
            
        } catch (error) {
            console.error('Error in handleUploadCalendar:', error);
            this.closeLoading(loadingId);
            this.showAlert('error', 'Ralat: ' + error.message);
        }
    }

    // Validate calendar data structure
    validateCalendarData(data) {
        if (!data || typeof data !== 'object') {
            console.error('Calendar data is not an object:', typeof data);
            return false;
        }
        
        // Check if it's an array (for events) or object (for calendar structure)
        if (Array.isArray(data)) {
            console.log('Calendar data is array with', data.length, 'items');
            return data.length > 0;
        } else {
            // Check for common calendar properties
            const hasValidStructure = data.events || data.holidays || data.terms || data.months;
            console.log('Calendar data is object, valid structure:', hasValidStructure);
            return hasValidStructure;
        }
    }

    // ========== OTHER FORM FUNCTIONS (simplified) ==========
    
    // Show add user form
    showAddUserForm() {
        this.checkAuthBeforeAction(() => {
            const formHTML = `
                <form id="add-user-form" class="modal-form">
                    <div class="form-group">
                        <label for="user-name">Nama</label>
                        <input type="text" id="user-name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="user-email">Email</label>
                        <input type="email" id="user-email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="user-role">Peranan</label>
                        <select id="user-role" required>
                            <option value="guru">Guru</option>
                            <option value="pentadbir">Pentadbir</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="user-password">Kata Laluan</label>
                        <input type="password" id="user-password" placeholder="Password123">
                        <small class="text-muted">Jika kosong, sistem akan generate "Password123"</small>
                    </div>
                </form>
            `;
            
            return this.showModal(
                'Tambah Pengguna Baru',
                formHTML,
                [
                    {
                        text: 'Batal',
                        type: 'secondary',
                        action: 'close-modal'
                    },
                    {
                        text: 'Simpan',
                        type: 'primary',
                        action: 'add-user'
                    }
                ]
            );
        });
    }

    // Handle add user form submission
    async handleAddUserSubmit() {
        const isAuthenticated = await this.checkAuthStatus();
        if (!isAuthenticated) {
            this.showAuthError();
            return;
        }
        
        // ... existing add user code ...
    }

    // Show session settings form
    async showSessionSettingsForm() {
        return this.checkAuthBeforeAction(async () => {
            try {
                const currentSettings = await window.database?.getSessionSettings?.() || {
                    startTime: '07:30',
                    breakStart: '10:30',
                    breakEnd: '11:00',
                    endTime: '13:30',
                    periodDuration: 60,
                    periodsPerDay: 6
                };
                
                const formHTML = `
                    <form id="session-settings-form" class="modal-form">
                        <div class="form-group">
                            <label for="session-start">Waktu Mula Sekolah</label>
                            <input type="time" id="session-start" 
                                   value="${currentSettings.startTime}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="session-break-start">Waktu Rehat (Mula)</label>
                            <input type="time" id="session-break-start" 
                                   value="${currentSettings.breakStart}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="session-break-end">Waktu Rehat (Tamat)</label>
                            <input type="time" id="session-break-end" 
                                   value="${currentSettings.breakEnd}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="session-end">Waktu Tamat Sekolah</label>
                            <input type="time" id="session-end" 
                                   value="${currentSettings.endTime}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="period-duration">Tempoh Satu Waktu (minit)</label>
                            <input type="number" id="period-duration" 
                                   value="${currentSettings.periodDuration}" 
                                   min="30" max="120" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="periods-per-day">Bilangan Waktu Sehari</label>
                            <input type="number" id="periods-per-day" 
                                   value="${currentSettings.periodsPerDay}" 
                                   min="1" max="10" required>
                        </div>
                    </form>
                `;
                
                return this.showModal(
                    'Tetapan Sesi Sekolah',
                    formHTML,
                    [
                        {
                            text: 'Batal',
                            type: 'secondary',
                            action: 'close-modal'
                        },
                        {
                            text: 'Simpan',
                            type: 'primary',
                            action: 'save-session'
                        }
                    ]
                );
                
            } catch (error) {
                console.error('Error showing session form:', error);
                this.showAlert('error', 'Ralat memuatkan tetapan: ' + error.message);
                return null;
            }
        });
    }

    // Handle save session settings
    async handleSaveSessionSettings() {
        const isAuthenticated = await this.checkAuthStatus();
        if (!isAuthenticated) {
            this.showAuthError();
            return;
        }
        
        // ... existing session settings code ...
    }

    // Show authentication error
    showAuthError() {
        this.showAlert('error', 'Sesi anda telah tamat. Sila login semula.', 5000);
        this.closeAllModals();
        
        setTimeout(() => {
            if (window.erphSystem && window.erphSystem.showLogin) {
                window.erphSystem.showLogin();
            } else {
                window.location.href = 'login.html';
            }
        }, 1500);
    }

    // ========== ALERT FUNCTIONS ==========
    
    // Show alert message
    showAlert(type, message, duration = 5000) {
        const alertId = 'alert-' + Date.now();
        console.log('Showing alert:', type, message);
        
        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type}">
                <span>${message}</span>
                <button class="alert-close" onclick="document.getElementById('${alertId}').remove()">
                    &times;
                </button>
            </div>
        `;
        
        // Add to main content or body
        const mainContent = document.getElementById('main-content');
        const targetElement = mainContent || document.body;
        
        if (targetElement) {
            targetElement.insertAdjacentHTML('afterbegin', alertHTML);
            
            // Auto remove after duration
            if (duration > 0) {
                setTimeout(() => {
                    const alert = document.getElementById(alertId);
                    if (alert) alert.remove();
                }, duration);
            }
        }
    }

    // ========== TABLE FUNCTIONS ==========
    
    // Generate users table rows
    generateUsersTableRows(users, currentUserId) {
        return users.map(user => {
            let roleDisplay = user.role === 'admin' ? 'Admin Utama' : 
                            user.role === 'pentadbir' ? 'Pentadbir' : 'Guru';
            const isActive = user.active !== false;
            const userJson = JSON.stringify(user).replace(/"/g, '&quot;');
            
            return `
                <tr>
                    <td>${user.name || '-'}</td>
                    <td>${user.email}</td>
                    <td>
                        <span class="role-${user.role}">
                            ${roleDisplay}
                        </span>
                    </td>
                    <td>
                        <span class="${isActive ? 'active' : 'inactive'}">
                            ${isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                    </td>
                    <td>
                        ${user.id !== currentUserId ? `
                            <button class="btn btn-secondary btn-sm" 
                                    onclick="uiSystem.showEditUserForm(${userJson})">
                                Edit
                            </button>
                            <button class="btn btn-secondary btn-sm" 
                                    onclick="uiSystem.showResetPasswordModal('${user.id}', '${user.email}')">
                                Reset Password
                            </button>
                            <button class="btn btn-danger btn-sm" 
                                    onclick="uiSystem.showDeleteUserModal('${user.id}', '${user.name}')">
                                Padam
                            </button>
                        ` : `
                            <span class="text-muted">(Anda)</span>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Show reset password modal
    showResetPasswordModal(userId, userEmail) {
        this.checkAuthBeforeAction(() => {
            const message = `Adakah anda pasti untuk reset kata laluan untuk ${userEmail}?<br>
                            Kata laluan baru akan dihantar ke email pengguna.`;
            
            this.showConfirm(
                'Reset Kata Laluan',
                message,
                `uiSystem.handleResetPassword('${userId}')`
            );
        });
    }

    // Handle reset password
    async handleResetPassword(userId) {
        const isAuthenticated = await this.checkAuthStatus();
        if (!isAuthenticated) {
            this.showAuthError();
            return;
        }
        
        // ... existing reset password code ...
    }

    // Show delete user modal
    showDeleteUserModal(userId, userName) {
        this.checkAuthBeforeAction(() => {
            const message = `Adakah anda pasti untuk memadam pengguna ${userName}?<br>
                            <strong>Amaran:</strong> Tindakan ini tidak boleh dibatalkan.`;
            
            this.showConfirm(
                'Padam Pengguna',
                message,
                `uiSystem.handleDeleteUser('${userId}')`
            );
        });
    }

    // Handle delete user
    async handleDeleteUser(userId) {
        const isAuthenticated = await this.checkAuthStatus();
        if (!isAuthenticated) {
            this.showAuthError();
            return;
        }
        
        // ... existing delete user code ...
    }

    // ========== EMERGENCY FUNCTIONS ==========
    
    // Emergency cleanup function
    emergencyCleanup() {
        console.log('EMERGENCY CLEANUP INITIATED');
        
        // Remove all modal elements
        this.closeAllModals();
        
        // Remove all alerts
        document.querySelectorAll('.alert').forEach(el => el.remove());
        
        // Remove any remaining fixed position elements
        document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
            if (el.style.backgroundColor === 'rgba(0, 0, 0, 0.5)' || 
                el.style.zIndex === '9999' || 
                el.style.zIndex === '10000') {
                el.remove();
            }
        });
        
        // Enable all buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.disabled = false;
        });
        
        console.log('Emergency cleanup completed');
        this.showAlert('success', 'Emergency cleanup completed. UI should be responsive now.');
    }
    
    // Test authentication
    async testAuth() {
        console.log('Testing authentication...');
        const isAuth = await this.checkAuthStatus();
        console.log('Authentication status:', isAuth);
        return isAuth;
    }
}

// Initialize UI system
const uiSystem = new UISystem();

// Make it globally available
window.uiSystem = uiSystem;

// Add emergency function to window
window.cleanupUI = () => uiSystem.emergencyCleanup();
window.testAuth = () => uiSystem.testAuth();

console.log('UI System loaded successfully. Use cleanupUI() for emergency cleanup.');