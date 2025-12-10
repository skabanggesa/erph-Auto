// assets/js/admin/dashboard.js

import { auth, db } from '../../config.js'; 
import { 
    collection, query, where, getDocs, 
    doc, getDoc as getFirestoreDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { navigate } from '../../router.js'; // Import fungsi navigasi

/**
 * Fungsi utama yang dipanggil oleh router.js apabila admin log masuk.
 * Ini akan memaparkan kandungan dashboard admin.
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
            <p>Selamat datang, Pentadbir! Sila semak RPH yang telah dihantar oleh guru.</p>
            
            <div id="admin-actions" style="margin-top: 20px;">
                <button id="viewRphBtn" class="btn btn-primary">1. Semak RPH Guru</button>
                <button id="manageUsersBtn" class="btn btn-secondary" style="margin-left: 10px;">2. Urus Pengguna (Akaun)</button>
            </div>
            
            <div id="admin-content-area" style="margin-top: 30px;">
                </div>
        </div>
    `;

    // Pasang Event Listeners
    document.getElementById('viewRphBtn').addEventListener('click', loadRphReviewList);
    document.getElementById('manageUsersBtn').addEventListener('click', () => {
        document.getElementById('admin-content-area').innerHTML = '<p>Fungsi Urus Pengguna akan datang.</p>';
    });

    // Muatkan fungsi utama (Semak RPH) secara automatik
    await loadRphReviewList(); 

    // Jadikan fungsi global untuk digunakan oleh butang di dalam grid
    window.adminReviewRph = adminReviewRph;
}

// -------------------------------------------------------------
// FUNGSI: Muatkan Senarai RPH yang Perlu Disemak
// -------------------------------------------------------------

async function loadRphReviewList() {
    const contentArea = document.getElementById('admin-content-area');
    contentArea.innerHTML = '<p>Mencari RPH yang telah dihantar oleh guru...</p>';

    try {
        // Query: Cari RPH yang statusnya 'submitted'
        // Anda boleh tukar 'submitted' kepada 'hantar' jika itu yang digunakan dalam guru-side
        const q = query(collection(db, 'rph'), where('status', '==', 'submitted'));
        const querySnapshot = await getDocs(q);

        let html = '<h3>RPH Menunggu Semakan</h3>';

        if (querySnapshot.empty) {
            html += '<p>Tiada RPH yang dihantar untuk semakan buat masa ini.</p>';
            contentArea.innerHTML = html;
            return;
        }

        html += `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Tarikh</th>
                        <th>Guru</th>
                        <th>Kelas</th>
                        <th>Mata Pelajaran</th>
                        <th>Status</th>
                        <th>Tindakan</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const guruPromises = [];
        querySnapshot.forEach(docSnapshot => {
            const rph = docSnapshot.data();
            rph.id = docSnapshot.id;
            
            // Dapatkan nama guru dari Firestore 'users' collection
            const userRef = doc(db, 'users', rph.uid);
            guruPromises.push(getFirestoreDoc(userRef).then(userSnap => {
                const namaGuru = userSnap.exists() ? userSnap.data().name || 'Tidak Diketahui' : 'Tidak Diketahui';
                
                // Format tarikh
                const tarikhFormat = rph.tarikh.toDate ? rph.tarikh.toDate().toLocaleDateString('ms-MY') : rph.tarikh;
                
                return `
                    <tr>
                        <td>${tarikhFormat}</td>
                        <td>${namaGuru}</td>
                        <td>${rph.kelas}</td>
                        <td>${rph.matapelajaran}</td>
                        <td class="status-submitted">${rph.status.toUpperCase()}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="adminReviewRph('${rph.id}')">Semak</button>
                        </td>
                    </tr>
                `;
            }));
        });

        const rows = await Promise.all(guruPromises);
        html += rows.join('');
        html += '</tbody></table>';
        
        contentArea.innerHTML = html;
        

    } catch (e) {
        console.error("Ralat memuatkan senarai RPH:", e);
        contentArea.innerHTML = '<p class="error">Gagal memuatkan senarai RPH. Sila semak konsol.</p>';
    }
}

// -------------------------------------------------------------
// FUNGSI: Logik Semakan RPH (Placeholder)
// -------------------------------------------------------------
function adminReviewRph(rphId) {
    // Apabila guru klik "Semak", kita akan navigasi ke halaman review RPH
    // Fail admin-rph-review.js akan dibangunkan kemudian.
    alert(`Membuka RPH ID: ${rphId} untuk semakan. Fungsi ini akan datang!`);
    
    // Gunakan router untuk navigasi ke halaman review, membawa ID RPH
    // navigate('admin-review-rph', rphId); // Ini akan berfungsi apabila anda sediakan laluan admin-review-rph dalam router.js
}
