// assets/js/admin/analytics.js (VERSI DIAGNOSIS RPH SAHAJA)

import { db } from '../config.js';
import { 
  collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadAnalytics() {
  const content = document.getElementById('adminContent');
  
  content.innerHTML = `
    <div class="admin-section">
      <h2>Diagnosis RPH Sahaja</h2>
      <p>Ini menguji sama ada Admin boleh membaca koleksi RPH tanpa memproses data guru.</p>
      
      <div id="analyticsDetails" style="margin-top:30px;">
          <p>Memuatkan data...</p>
      </div>
    </div>
  `;

  try {
    // 1. HANYA Dapatkan semua RPH
    const rphSnap = await getDocs(collection(db, 'rph')); 
    const totalRph = rphSnap.size;

    let html = `<h3>Keputusan Diagnosis</h3>
        <p>Status: <span style="font-weight: bold; color: ${totalRph > 0 ? 'green' : 'red'};">Berjaya mencapai koleksi /rph.</span></p>
        <p>Jumlah Dokumen RPH Ditemui: <strong style="font-size: 1.5em;">${totalRph}</strong></p>
    `;

    if (totalRph > 0) {
        html += `<div class="table-container"><table><thead>
            <tr><th>Doc ID</th><th>UID Guru (RPH.uid)</th><th>Status</th></tr>
        </thead><tbody>`;
        
        rphSnap.forEach(doc => {
            const r = doc.data();
            html += `<tr>
                <td>${doc.id}</td>
                <td>${r.uid || 'UID HILANG'}</td>
                <td>${r.status || 'STATUS HILANG'}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        
        // Mesej pengesahan
        html += `<p style="margin-top: 20px;">
            <span style="font-weight: bold; color: green;">BERITA BAIK!</span><br>
            Jika anda melihat senarai di atas, ia mengesahkan bahawa <span style="font-weight: bold;">Masalah Analisis adalah 100% pada bahagian kod yang memuatkan senarai Guru (/users).</span>
        </p>`;
        
    } else {
        html += `<p class="error">Gagal membaca data RPH. Sila semak semula Peraturan Keselamatan Firestore untuk koleksi /rph (izin 'list' untuk Admin).</p>`;
    }

    document.getElementById('analyticsDetails').innerHTML = html;

  } catch (err) {
    document.getElementById('analyticsDetails').innerHTML = `<p class="error">Ralat Kritikal (Kod atau Kebenaran): ${err.message}. Sila semak konsol F12.</p>`;
    console.error("Ralat Diagnosis RPH:", err);
  }
}
