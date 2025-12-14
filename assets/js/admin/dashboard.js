// assets/js/admin/dashboard.js (KOD LENGKAP & BERSIH)

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
    
    // 1. Urus Pengguna (Teachers.js)
    document.getElementById('manageUsersBtn').addEventListener('click', () => {
        document.getElementById('adminContent').innerHTML = '<p>Memuatkan modul Urus Pengguna...</p>';
        import('./teachers.js').then(m => m.loadTeachersPage());
    });
    
    // 2. Semak RPH Guru (rph-list.js/rph-review.js)
    document.getElementById('viewRphBtn').addEventListener('click', () => {
        document.getElementById('adminContent').innerHTML = '<p>Memuatkan senarai RPH...</p>';
        // Anda mungkin mahu menukar ini kepada 'rph-review.js'
        import('./rph-list.js').then(m => m.loadRphListPage()); 
    });

    // 3. Analisis & Laporan
    document.getElementById('viewAnalyticsBtn').addEventListener('click', () => {
        // Menggunakan window.router.navigate yang ditakrifkan dalam router.js
        window.router.navigate('admin-analytics'); 
    });

} // <--- KRITIKAL: KURUNGAN TUTUP UNTUK loadAdminDashboard
