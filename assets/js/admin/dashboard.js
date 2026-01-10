// assets/js/admin/dashboard.js (KOD LENGKAP DIKEMASKINI DENGAN LOGIK PERANAN PK)

import { auth, db } from '../config.js'; 
import { 
    doc, getDoc as getFirestoreDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/**
 * Fungsi utama yang dipanggil oleh router.js apabila admin/PK log masuk.
 */
export async function loadAdminDashboard() {
    const content = document.getElementById('content');
    
    const user = auth.currentUser;
    if (!user) {
        content.innerHTML = '<p class="error">Sesi tamat. Sila log masuk semula.</p>';
        return;
    }

    try {
        // 1. Ambil data profil pengguna untuk menyemak peranan (role)
        const userDoc = await getFirestoreDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (!userData) {
            content.innerHTML = '<p class="error">Data pengguna tidak ditemui.</p>';
            return;
        }

        const role = userData.role; // admin, PK1, PKHEM, atau PKKK
        const name = userData.name || "Pentadbir";

        // 2. Tentukan tajuk dashboard mengikut peranan
        let dashboardTitle = "Dashboard Pentadbir";
        if (role === 'PK1') dashboardTitle = "Dashboard PK Pentadbiran";
        if (role === 'PKHEM') dashboardTitle = "Dashboard PK HEM";
        if (role === 'PKKK') dashboardTitle = "Dashboard PK Kokurikulum";

        // 3. Bina Template Dashboard secara Dinamik
        content.innerHTML = `
            <div class="admin-section">
                <h2>${dashboardTitle}</h2>
                <p>Selamat datang, <strong>${name}</strong>! Sila pilih tindakan di bawah.</p>
                
                <div id="admin-actions" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;">
                    <button id="viewRphBtn" class="btn btn-primary">1. Semak RPH Guru</button>
                    
                    ${role === 'admin' ? `
                        <button id="manageUsersBtn" class="btn btn-secondary">2. Urus Pengguna (Akaun)</button>
                        <button id="viewAnalyticsBtn" class="btn btn-secondary">3. Analisis & Laporan</button>
                        <button id="viewMaintenanceBtn" class="btn btn-warning">4. Penyelenggaraan & Statistik</button>
                        <button id="viewAuditLogsBtn" class="btn btn-info" style="background-color: #17a2b8; color: white; border: none;">5. Audit Log (Aktiviti)</button>
                        <button id="viewAgihanBtn" class="btn btn-dark" style="background-color: #6c757d; color: white; border: none;">6. Agihan Guru (Distributor)</button>
                    ` : `
                        <button id="viewAnalyticsBtn" class="btn btn-secondary">2. Analisis & Laporan</button>
                    `}
                </div>
                
                <div id="adminContent" style="margin-top: 30px;">
                    <p>Sila klik butang di atas untuk memulakan tugas semakan atau pentadbiran.</p>
                </div>
            </div>
        `;

        // 4. Hubungkan Event Listeners (Hanya jika butang wujud)
        setupListeners(role);

    } catch (error) {
        console.error("Ralat Dashboard:", error);
        content.innerHTML = `<p class="error">Ralat memuatkan dashboard: ${error.message}</p>`;
    }
}

/**
 * Fungsi untuk menetapkan event listener berdasarkan kewujudan butang
 */
function setupListeners(role) {
    // 1. Semak RPH (Semua PK/Admin ada)
    const viewRphBtn = document.getElementById('viewRphBtn');
    if (viewRphBtn) {
        viewRphBtn.addEventListener('click', () => {
            document.getElementById('adminContent').innerHTML = '<p>Memuatkan senarai RPH...</p>';
            import('./rph-list.js').then(m => m.loadRphListPage()); 
        });
    }

    // 2. Analisis & Laporan (Semua ada)
    const viewAnalyticsBtn = document.getElementById('viewAnalyticsBtn');
    if (viewAnalyticsBtn) {
        viewAnalyticsBtn.addEventListener('click', () => {
            window.router.navigate('admin-analytics'); 
        });
    }

    // Butang-butang khusus untuk Super Admin sahaja
    if (role === 'admin') {
        document.getElementById('manageUsersBtn').addEventListener('click', () => {
            document.getElementById('adminContent').innerHTML = '<p>Memuatkan modul Urus Pengguna...</p>';
            import('./teachers.js').then(m => m.loadTeachersPage());
        });

        document.getElementById('viewMaintenanceBtn').addEventListener('click', () => {
            window.router.navigate('admin-maintenance'); 
        });

        document.getElementById('viewAuditLogsBtn').addEventListener('click', () => {
            document.getElementById('adminContent').innerHTML = '<p>Memuatkan Audit Log...</p>';
            import('./audit-logs.js').then(m => m.loadAuditLogs());
        });

        document.getElementById('viewAgihanBtn').addEventListener('click', () => {
            document.getElementById('adminContent').innerHTML = '<p>Memuatkan modul Agihan Guru...</p>';
            import('./agihan.js').then(m => m.loadAgihanPage());
        });
    }
}
