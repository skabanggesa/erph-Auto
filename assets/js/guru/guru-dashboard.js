// assets/js/admin/dashboard.js 

import { auth, db } from '../config.js'; 
import { 
    collection, query, where, getDocs, 
    doc, getDoc as getFirestoreDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/**
 * Fungsi utama untuk memuatkan Dashboard Pentadbir dengan UI yang diperkemas.
 */
export async function loadAdminDashboard() {
    const content = document.getElementById('content');
    
    const user = auth.currentUser;
    if (!user) {
        content.innerHTML = '<p class="error">Sesi tamat. Sila log masuk semula.</p>';
        return;
    }

    const adminName = localStorage.getItem('userName') || 'Pentadbir';

    // UI Dashboard yang diperkemas menggunakan Grid dan Kad
    content.innerHTML = `
        <div class="admin-dashboard-container" style="max-width: 1200px; margin: 0 auto; padding: 20px;">
            <header style="margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                <h2 style="color: #2c3e50; margin-bottom: 5px;">Panel Kawalan Utama</h2>
                <p style="color: #7f8c8d;">Selamat datang kembali, <strong>${adminName}</strong>. Apa tugasan anda hari ini?</p>
            </header>

            <div class="admin-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                
                <div class="admin-card" id="viewRphBtn" style="${cardStyle('#3498db')}">
                    <div style="font-size: 2em; margin-bottom: 10px;">📄</div>
                    <h3 style="margin: 0;">Semak RPH Guru</h3>
                    <p style="font-size: 0.9em; opacity: 0.9;">Lihat, sahkan dan beri ulasan pada RPH guru.</p>
                </div>

                <div class="admin-card" id="manageUsersBtn" style="${cardStyle('#9b59b6')}">
                    <div style="font-size: 2em; margin-bottom: 10px;">👥</div>
                    <h3 style="margin: 0;">Urus Pengguna</h3>
                    <p style="font-size: 0.9em; opacity: 0.9;">Tambah, edit atau nyahaktif akaun guru.</p>
                </div>

                <div class="admin-card" id="viewAnalyticsBtn" style="${cardStyle('#2ecc71')}">
                    <div style="font-size: 2em; margin-bottom: 10px;">📊</div>
                    <h3 style="margin: 0;">Analisis & Laporan</h3>
                    <p style="font-size: 0.9em; opacity: 0.9;">Statistik penghantaran RPH mingguan/bulanan.</p>
                </div>

                <div class="admin-card" id="viewMaintenanceBtn" style="${cardStyle('#f39c12')}">
                    <div style="font-size: 2em; margin-bottom: 10px;">🛠️</div>
                    <h3 style="margin: 0;">Penyelenggaraan</h3>
                    <p style="font-size: 0.9em; opacity: 0.9;">Kemaskini data sistem dan statistik teknikal.</p>
                </div>

                <div class="admin-card" id="viewAuditLogsBtn" style="${cardStyle('#17a2b8')}">
                    <div style="font-size: 2em; margin-bottom: 10px;">🔍</div>
                    <h3 style="margin: 0;">Audit Log</h3>
                    <p style="font-size: 0.9em; opacity: 0.9;">Pantau aktiviti pengguna dan log masuk sistem.</p>
                </div>

            </div>

            <div id="adminContent" style="margin-top: 40px; padding: 20px; background: #fff; border-radius: 8px; border: 1px solid #ddd; min-height: 200px;">
                <p style="text-align: center; color: #95a5a6;">Pilih satu kategori di atas untuk memaparkan butiran.</p>
            </div>
        </div>
    `;

    // ------------------------------------------------------------
    // 🔑 EVENT LISTENERS (Menggunakan window.router.navigate)
    // ------------------------------------------------------------
    
    // 1. Semak RPH Guru
    document.getElementById('viewRphBtn').addEventListener('click', () => {
        document.getElementById('adminContent').innerHTML = '<p>Memuatkan senarai RPH...</p>';
        import('./rph-list.js').then(m => m.loadRphListPage()); 
    });

    // 2. Urus Pengguna
    document.getElementById('manageUsersBtn').addEventListener('click', () => {
        document.getElementById('adminContent').innerHTML = '<p>Memuatkan modul Urus Pengguna...</p>';
        import('./teachers.js').then(m => m.loadTeachersPage());
    });
    
    // 3. Analisis & Laporan
    document.getElementById('viewAnalyticsBtn').addEventListener('click', () => {
        window.router.navigate('admin-analytics'); 
    });
    
    // 4. Penyelenggaraan
    document.getElementById('viewMaintenanceBtn').addEventListener('click', () => {
        window.router.navigate('admin-maintenance'); 
    });

    // 5. Audit Log (Aktiviti)
    document.getElementById('viewAuditLogsBtn').addEventListener('click', () => {
        window.router.navigate('admin-audit-logs'); 
    });
}

/**
 * Fungsi bantuan untuk gaya kad supaya kod lebih bersih
 */
function cardStyle(color) {
    return `
        background: ${color};
        color: white;
        padding: 20px;
        border-radius: 12px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `;
}
