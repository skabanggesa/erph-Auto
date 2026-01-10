// assets/js/admin/dashboard.js (KOD LENGKAP DIKEMASKINI DENGAN MODUL AGIHAN)

import { auth, db } from '../config.js'; 
import { 
    collection, query, where, getDocs, 
    doc, getDoc as getFirestoreDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/**
 * Fungsi utama yang dipanggil oleh router.js apabila admin log masuk.
 * FUNGSI INI MESTI DIEKSPORT (export) untuk dapat diakses oleh router.js.
 */
export async function loadAdminDashboard() {
    // 'content' adalah DIV luaran (dari dashboard.html)
    const content = document.getElementById('content');
    
    const user = auth.currentUser;
    if (!user) {
        content.innerHTML = '<p class="error">Sesi tamat. Sila log masuk semula.</p>';
        return;
    }

    // Gantikan kandungan utama dengan template dashboard
    // Menambah butang ke-6: Agihan Guru (Distributor)
    content.innerHTML = `
        <div class="admin-section">
            <h2>Dashboard Pentadbir</h2>
            <p>Selamat datang, Pentadbir! Sila pilih tindakan di bawah.</p>
            
            <div id="admin-actions" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;">
                <button id="viewRphBtn" class="btn btn-primary">1. Semak RPH Guru</button>
                <button id="manageUsersBtn" class="btn btn-secondary">2. Urus Pengguna (Akaun)</button>
                <button id="viewAnalyticsBtn" class="btn btn-secondary">3. Analisis & Laporan</button>
                <button id="viewMaintenanceBtn" class="btn btn-warning">4. Penyelenggaraan & Statistik</button>
                <button id="viewAuditLogsBtn" class="btn btn-info" style="background-color: #17a2b8; color: white; border: none;">5. Audit Log (Aktiviti)</button>
                <button id="viewAgihanBtn" class="btn btn-dark" style="background-color: #6c757d; color: white; border: none;">6. Agihan Guru (Distributor)</button>
            </div>
            
            <div id="adminContent" style="margin-top: 30px;">
                <p>Sila klik butang di atas untuk memulakan tugas pentadbiran.</p>
            </div>
        </div>
    `;

    // ------------------------------------------------------------
    // 🔑 EVENT LISTENERS
    // ------------------------------------------------------------
    
    // 1. Semak RPH Guru (rph-list.js)
    document.getElementById('viewRphBtn').addEventListener('click', () => {
        document.getElementById('adminContent').innerHTML = '<p>Memuatkan senarai RPH...</p>';
        import('./rph-list.js').then(m => m.loadRphListPage()); 
    });

    // 2. Urus Pengguna (teachers.js)
    document.getElementById('manageUsersBtn').addEventListener('click', () => {
        document.getElementById('adminContent').innerHTML = '<p>Memuatkan modul Urus Pengguna...</p>';
        import('./teachers.js').then(m => m.loadTeachersPage());
    });
    
    // 3. Analisis & Laporan
    document.getElementById('viewAnalyticsBtn').addEventListener('click', () => {
        window.router.navigate('admin-analytics'); 
    });
    
    // 4. Penyelenggaraan & Statistik
    document.getElementById('viewMaintenanceBtn').addEventListener('click', () => {
        window.router.navigate('admin-maintenance'); 
    });

    // 5. Audit Log (Aktiviti Sistem)
    document.getElementById('viewAuditLogsBtn').addEventListener('click', () => {
        document.getElementById('adminContent').innerHTML = '<p>Memuatkan Audit Log...</p>';
        
        import('./audit-logs.js').then(m => {
            m.loadAuditLogs();
        }).catch(err => {
            console.error("Gagal memuatkan modul Audit Log:", err);
            document.getElementById('adminContent').innerHTML = 
                `<p class="error">Ralat: Gagal memuatkan fail audit-logs.js. Sila pastikan fail wujud.</p>`;
        });
    });

    // 6. Agihan Guru (agihan.js) - PENAMBAHBAIKAN BARU
    document.getElementById('viewAgihanBtn').addEventListener('click', () => {
        document.getElementById('adminContent').innerHTML = '<p>Memuatkan modul Agihan Guru...</p>';
        
        // Import fail agihan.js secara dinamik
        import('./agihan.js').then(m => {
            m.loadAgihanPage();
        }).catch(err => {
            console.error("Gagal memuatkan modul Agihan:", err);
            document.getElementById('adminContent').innerHTML = 
                `<p class="error">Ralat: Gagal memuatkan fail agihan.js. Sila pastikan fail wujud di folder assets/js/admin/.</p>`;
        });
    });

}
