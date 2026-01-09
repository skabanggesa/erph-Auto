// assets/js/admin/rph-review.js (VERSI DIKEMASKINI: PEMBETULAN TOPIK & TARIKH)

import { db } from '../config.js'; 
import { 
    collection, query, where, getDocs, 
    doc, getDoc, 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const navigate = window.router?.navigate; 

/**
 * Memuatkan halaman senarai semakan RPH untuk Admin, ditapis mengikut UID guru.
 */
export async function loadRphReviewPage(params) {
    const content = document.getElementById('adminContent');
    const teacherUid = params?.uid;
    
    if (!teacherUid) {
        content.innerHTML = `
            <div class="admin-section">
                <p class="warning">⚠️ Sila pilih guru dari Analisis Laporan untuk memulakan semakan.</p>
                <button onclick="window.router.navigate('admin-analytics')" class="btn-primary">Kembali ke Analisis</button>
            </div>`;
        return;
    }

    content.innerHTML = `
        <div class="admin-section">
            <h2>Semakan RPH Guru</h2>
            <div id="rphReviewList" style="margin-top: 20px;">
                <p>Memuatkan maklumat guru dan senarai RPH...</p>
            </div>
        </div>
    `;

    try {
        // 1. Dapatkan maklumat Profil Guru
        let teacherName = "Guru";
        const teacherDoc = await getDoc(doc(db, 'users', teacherUid)); 
        if (teacherDoc.exists()) {
            teacherName = teacherDoc.data().name;
        }

        // 2. Dapatkan Senarai RPH untuk guru ini
        const rphQuery = query(
            collection(db, 'rph'),
            where('uid', '==', teacherUid)
        );
        const rphSnap = await getDocs(rphQuery);
        
        let html = `<h3>Senarai RPH untuk ${teacherName}</h3>`;
        
        if (rphSnap.empty) {
            html += `<p class="warning">Tiada RPH ditemui untuk guru ini.</p>`;
        } else {
            html += `
                <p>Jumlah RPH ditemui: <strong>${rphSnap.size}</strong></p>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Tarikh</th>
                                <th>Mata Pelajaran & Tajuk</th>
                                <th>Status</th>
                                <th>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            rphSnap.forEach(docSnap => {
                const r = docSnap.data();
                
                // --- PEMBETULAN PEMETAAN DATA (Mapping) ---
                // Guna 'tarikh' (huruf kecil) mengikut Screenshot Firestore
                const displayDate = r.tarikh || 'N/A';
                
                // Guna 'matapelajaran' & 'tajuk' mengikut Screenshot Firestore
                const displaySubject = r.matapelajaran || r.mataPelajaran || 'N/A';
                const displayTopic = r.tajuk || r.topik || '-';
                
                const statusValue = String(r.status || 'N/A');
                const statusText = statusValue.toUpperCase();
                
                html += `
                    <tr>
                        <td><strong>${displayDate}</strong></td>
                        <td>
                            <div style="font-weight:bold; color:#2c3e50;">${displaySubject}</div>
                            <div style="font-size:0.85rem; color:#666;">${displayTopic}</div>
                        </td>
                        <td><span class="status-${statusValue.toLowerCase()}">${statusText}</span></td>
                        <td>
                            <button class="btn-review" onclick="${navigate ? `window.router.navigate('admin-rph-detail', { id: '${docSnap.id}' });` : `console.error('Router tidak tersedia');`}">
                                Semak RPH
                            </button>
                        </td>
                    </tr>`;
            });

            html += `</tbody></table></div>`;
        }

        document.getElementById('rphReviewList').innerHTML = html;

    } catch (error) {
        document.getElementById('rphReviewList').innerHTML = `
            <p class="error">Gagal memuatkan senarai RPH: ${error.message}</p>
            <p>Pastikan koleksi 'rph' wujud dan Rules Firestore membenarkan akses.</p>`;
        console.error("Ralat memuatkan semakan RPH:", error);
    }
}
