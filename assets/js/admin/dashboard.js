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
    // Note: 'content' adalah DIV luaran yang dimuatkan oleh router.js
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
        // Gantikan ini dengan modul RPH sebenar anda, jika ia berbeza (Contoh: rph-review.js)
        import('./rph-list.js').then(m => m.loadRphListPage()); 
    });

    // 3. Analisis & Laporan
    // MENGGUNAKAN ROUTER: Ini menyelesaikan masalah placeholder lama anda.
    const analyticsBtn = document.getElementById('viewAnalyticsBtn');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', () => {
            // Memanggil fungsi router global yang tahu cara memuatkan analytics.js
            window.router.navigate('admin-analytics'); 
        });
    }

// ------------------------------------------------------------
// FUNGSI: Logik Semakan RPH (Placeholder)
// ------------------------------------------------------------
// Anda boleh meletakkan fungsi pembantu di bawah jika perlu, tetapi ia biasanya lebih baik
// dimasukkan ke dalam modul yang berkaitan (seperti rph-list.js)

}
