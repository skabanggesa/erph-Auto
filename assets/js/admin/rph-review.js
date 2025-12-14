// assets/js/admin/rph-review.js (FAIL INI ADALAH LIST VIEW)

import { db } from '../../config.js';
import { 
  collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Pastikan window.router.navigate didedahkan oleh router.js
const navigate = window.router?.navigate; 

/**
 * Memuatkan halaman senarai semakan RPH untuk Admin, ditapis mengikut UID guru.
 * Fungsi ini dipanggil oleh router.js untuk laluan 'admin-rph-review'.
 * * @param {Object} params - Objek yang mengandungi parameter laluan, cth., { uid: 'UID_GURU' }
 */
export async function loadRphReviewPage(params) {
    const content = document.getElementById('adminContent');
    const teacherUid = params?.uid;
    
    // Semakan asas
    if (!teacherUid) {
        content.innerHTML = '<div class="admin-section"><p class="warning">⚠️ Sila pilih guru dari Analisis Laporan untuk memulakan semakan.</p></div>';
        return;
    }

    content.innerHTML = `
        <div class="admin-section">
            <h2>Semakan RPH Guru</h2>
            <p>Memuatkan RPH yang dihantar oleh guru ini...</p>
            <div id="rphReviewList" style="margin-top: 20px;"></div>
        </div>
    `;

    try {
        // Kueri RPH untuk guru ini
        // Kita gunakan where('uid', '==', teacherUid)
        const rphQuery = query(
            collection(db, 'rph'),
            where('uid', '==', teacherUid)
        );
        
        const rphSnap = await getDocs(rphQuery);
        
        let html = '';
        
        if (rphSnap.empty) {
            html += `<p class="warning">Tiada RPH ditemui untuk guru ini.</p>`;
        } else {
            
            // Cuba dapatkan nama guru (Menggunakan kueri where untuk /users)
            let teacherName = teacherUid;
            const teacherQuery = query(collection(db, 'users'), where('uid', '==', teacherUid));
            const teacherDoc = await getDocs(teacherQuery);
            if (!teacherDoc.empty) {
                teacherName = teacherDoc.docs[0].data().name;
            }

            html += `<h3>Senarai RPH untuk ${teacherName}</h3>
                <p>Jumlah RPH ditemui: <strong>${rphSnap.size}</strong></p>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>Doc ID</th><th>Status</th><th>Tindakan</th></tr>
                        </thead>
                        <tbody>`;
            
            rphSnap.forEach(doc => {
                const r = doc.data();
                // Butang ini memanggil laluan detail view ('admin-rph-detail') menggunakan ID dokumen RPH
                html += `<tr>
                    <td>${doc.id}</td>
                    <td><span class="status-${r.status}">${r.status ? r.status.toUpperCase() : 'N/A'}</span></td>
                    <td><button onclick="${navigate ? `window.router.navigate('admin-rph-detail', { id: '${doc.id}' });` : `console.error('Router tidak tersedia');`}">Lihat/Semak</button></td>
                </tr>`;
            });

            html += `</tbody></table></div>`;
        }

        document.getElementById('rphReviewList').innerHTML = html;

    } catch (error) {
        document.getElementById('rphReviewList').innerHTML = `<p class="error">Gagal memuatkan senarai RPH: ${error.message}</p>`;
        console.error("Ralat memuatkan semakan RPH:", error);
    }
}
