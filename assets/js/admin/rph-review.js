// assets/js/admin/rph-review.js

import { db } from '../../config.js';
import { 
  collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Memuatkan halaman semakan RPH untuk Admin.
 * @param {Object} params - Objek yang mengandungi parameter laluan, cth., { uid: 'F3mT5NKN42Y74l0vijMiYPhZeuF3' }
 */
export async function loadRphReviewPage(params) {
    const content = document.getElementById('adminContent');
    const teacherUid = params?.uid;
    
    if (!teacherUid) {
        content.innerHTML = '<div class="admin-section"><p class="warning">⚠️ Sila pilih guru dari Analisis Laporan untuk memulakan semakan.</p></div>';
        return;
    }

    content.innerHTML = `
        <div class="admin-section">
            <h2>Semakan RPH Guru (UID: ${teacherUid})</h2>
            <p>Memuatkan RPH yang dihantar oleh guru ini...</p>
            <div id="rphReviewList"></div>
        </div>
    `;

    try {
        // Kueri RPH untuk guru ini
        const rphQuery = query(
            collection(db, 'rph'),
            where('uid', '==', teacherUid)
            // Anda mungkin mahu menapis hanya status 'submitted' di sini
        );
        
        const rphSnap = await getDocs(rphQuery);
        
        let html = '<h3>Senarai RPH</h3>';
        
        if (rphSnap.empty) {
            html += `<p>Tiada RPH ditemui untuk UID ini.</p>`;
        } else {
            html += `<p>Jumlah RPH ditemui: <strong>${rphSnap.size}</strong></p>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>Tarikh</th><th>Minggu</th><th>Status</th><th>Tindakan</th></tr>
                        </thead>
                        <tbody>`;
            
            rphSnap.forEach(doc => {
                const r = doc.data();
                html += `<tr>
                    <td>${r.date || 'N/A'}</td>
                    <td>${r.minggu || 'N/A'}</td>
                    <td><span class="status-${r.status}">${r.status}</span></td>
                    <td><button onclick="window.router.navigate('guru-rph-edit', { id: '${doc.id}' })">Lihat/Semak</button></td>
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
