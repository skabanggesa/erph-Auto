// assets/js/admin/dashboard.js (KOD LENGKAP & DIKEMASKINI)

import { auth, db } from '../config.js'; 
import { 
    collection, query, where, getDocs, 
    doc, getDoc as getFirestoreDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/**
 * Fungsi utama yang dipanggil oleh router.js apabila admin log masuk.
 */
export async function loadAdminDashboard() {
    const content = document.getElementById('content');
    
    const user = auth.currentUser;
    if (!user) {
        content.innerHTML = '<p class="error">Sesi tamat. Sila log masuk semula.</p>';
        return;
    }

    content.innerHTML = `
        <div class="admin-section">
            <h2>Dashboard Pentadbir</h2>
            <p>Selamat datang, Pentadbir! Sila pilih tindakan di bawah.</p>
            
            <div id="admin-actions" style="margin-top: 20px;">
                <button id="viewRphBtn" class="btn btn-primary">1. Semak RPH Guru</button>
                <button id="manageUsersBtn" class="btn btn-secondary" style="margin-left: 10px;">2. Urus Pengguna (Akaun)</button>
                <button id="viewAnalyticsBtn" class="btn btn-secondary" style="margin-left: 10px;">3. Analisis & Laporan</button>
            </div>
            
            <div id="adminContent" style="margin-top: 30px;">
                <p>Sila klik butang di atas untuk memulakan tugas pentadbiran.</p>
            </div>
        </div>
    `;

    // ------------------------------------------------------------
    // 🔑 KRITIKAL: EVENT LISTENERS
    // ------------------------------------------------------------
    
    // 1. Urus Pengguna (Memanggil fungsi baharu dari teachers.js)
    document.getElementById('manageUsersBtn').addEventListener('click', () => {
        document.getElementById('adminContent').innerHTML = '<p>Memuatkan modul Urus Pengguna...</p>';
        // IMPORT DYNAMIC: Panggil loadTeachersPage dari teachers.js
        import('./teachers.js').then(m => m.loadTeachersPage());
    });
    
    // 2. Semak RPH Guru (Anggap anda ada rph-list.js)
    document.getElementById('viewRphBtn').addEventListener('click', () => {
        document.getElementById('adminContent').innerHTML = '<p>Memuatkan senarai RPH...</p>';
        // Gantikan ini dengan modul RPH sebenar anda, jika ia berbeza
        import('./rph-list.js').then(m => m.loadRphListPage()); 
    });

    // 3. Analisis & Laporan (Placeholder)
    document.getElementById('viewAnalyticsBtn').addEventListener('click', () => {
        const contentArea = document.getElementById('adminContent');
        contentArea.innerHTML = '<p>Ciri Analisis & Laporan akan datang...</p>';
        // import('./analytics.js').then(m => m.loadAnalytics());
    });

    // Pilihan: Boleh tambahkan logik untuk memuatkan senarai RPH secara lalai
    // document.getElementById('viewRphBtn').click();
}

// ------------------------------------------------------------
// FUNGSI: Logik Semakan RPH (Placeholder)
// ------------------------------------------------------------
// Nota: Anda mungkin mahu memindahkan fungsi ini ke rph-list.js
// function adminReviewRph(rphId) { ... }
