// assets/js/admin/rph-review.js (LIST VIEW - MUKTAMAD)

// KRITIKAL: Laluan yang betul telah disahkan berfungsi di sini
import { db } from '../config.js'; 
import { 
  collection, query, where, getDocs, // Fungsi yang anda sudah ada
  doc, getDoc, // <<< FUNGSI BARU YANG DITAMBAH UNTUK MEMBETULKAN RALAT
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const navigate = window.router?.navigate; 

/**
 * Memuatkan halaman senarai semakan RPH untuk Admin, ditapis mengikut UID guru.
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
            // Baris ini (dan penggunaan 'doc') kini berfungsi kerana getDoc dan doc telah diimport
            const teacherDoc = await getDoc(doc(db, 'users', teacherUid)); 
            if (teacherDoc.exists()) {
                teacherName = teacherDoc.data().name;
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
        // Paparkan ralat yang lebih bermakna
        document.getElementById('rphReviewList').innerHTML = `<p class="error">Gagal memuatkan senarai RPH: ${error.message}. (Semak peraturan Firestore untuk /users dan /rph)</p>`;
        console.error("Ralat memuatkan semakan RPH:", error);
    }
}
