// assets/js/admin/rph-review.js (FAIL INI MESTI DICIPTA DAN DIEKSPORT DENGAN BETUL)

// *** KRITIKAL: Pastikan laluan relatif ke config.js adalah betul ***
// Jika config.js berada di assets/js/config.js, maka laluan ini adalah yang betul
import { db } from '../../config.js'; 
import { 
  collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const navigate = window.router?.navigate; 

/**
 * Memuatkan halaman senarai semakan RPH untuk Admin, ditapis mengikut UID guru.
 * * @param {Object} params - Objek yang mengandungi parameter laluan, cth., { uid: 'UID_GURU' }
 */
export async function loadRphReviewPage(params) {
    // FUNGSI INI MESTI MEMPUNYAI KATA KUNCI 'export'
    const content = document.getElementById('adminContent');
    const teacherUid = params?.uid;
    
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
        // 1. Dapatkan RPH untuk guru ini
        const rphQuery = query(
            collection(db, 'rph'),
            where('uid', '==', teacherUid)
        );
        const rphSnap = await getDocs(rphQuery);
        
        let html = '';
        
        if (rphSnap.empty) {
            html += `<p class="warning">Tiada RPH ditemui untuk guru ini.</p>`;
        } else {
            
            // 2. Cuba dapatkan nama guru
            let teacherName = teacherUid;
            // *Nota: Kueri ini juga memerlukan Indeks Firestore. Alternatif: Guna doc.id jika uid == doc id*
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
                // Butang ini memanggil laluan detail view ('admin-rph-detail')
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
