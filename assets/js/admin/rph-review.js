// assets/js/admin/rph-review.js (LIST VIEW - MUKTAMAD)

// KRITIKAL: Laluan ini mesti betul
import { db } from '../config.js'; 
import { 
  collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const navigate = window.router?.navigate; 

/**
 * Memuatkan halaman senarai semakan RPH untuk Admin, ditapis mengikut UID guru.
 * KRITIKAL: MESTI ADA KATA KUNCI 'export'
 */
export async function loadRphReviewPage(params) {
    const content = document.getElementById('adminContent');
    const teacherUid = params?.uid;
    
    // ... (kod HTML awal) ...

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
            
            // 2. Cuba dapatkan nama guru (Kaitkan UID RPH dengan UID Pengguna)
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
