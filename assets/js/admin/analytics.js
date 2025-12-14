// assets/js/admin/analytics.js (VERSI MUKTAMAD: MENGGUNAKAN ID DOKUMEN SEBAGAI UID)

import { db } from '../config.js';
import { 
  collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const navigate = window.router?.navigate; 

export async function loadAnalytics() {
  const content = document.getElementById('adminContent');
  
  content.innerHTML = `
    <div class="admin-section">
      <h2>Analisis Penghantaran RPH</h2>
      <p>Data dikira berdasarkan status RPH yang terakhir ('draft', 'submitted', 'approved', 'rejected').</p>
      
      <div id="analyticsDetails" style="margin-top:30px;">
          <p>Memuatkan data...</p>
      </div>
    </div>
  `;

  try {
    // 1. Dapatkan SEMUA pengguna (BYPASS INDEX FIRESTORE)
    const userSnap = await getDocs(collection(db, 'users')); 
    
    const teachers = {};
    let guruCount = 0;

    userSnap.forEach(doc => {
      const d = doc.data();
      
      if (d.role === 'guru') { 
          // >>> KRITIKAL: GUNA doc.id (ID DOKUMEN) BUKAN d.uid
          teachers[doc.id] = d.name; // doc.id adalah UID Firebase Auth
          guruCount++;
      }
    });

    if (guruCount === 0) {
        document.getElementById('analyticsDetails').innerHTML = `<p class="warning">⚠️ Gagal memuatkan Analisis: Tiada pengguna dengan peranan 'guru' ditemui dalam koleksi /users.</p>`;
        return;
    }


    // 2. Dapatkan semua RPH & Proses Data
    const rphSnap = await getDocs(collection(db, 'rph'));
    
    let totalStats = { total: 0, submitted: 0, approved: 0, rejected: 0 }; 
    const stats = {};
    let matchedRphCount = 0;

    if (rphSnap.empty) {
        document.getElementById('analyticsDetails').innerHTML = `<p class="warning">⚠️ Tiada RPH yang ditemui dalam koleksi /rph. Analisis tidak dapat dijalankan.</p>`;
        return;
    }
    
    rphSnap.forEach(doc => {
      const r = doc.data();
      const teacherUid = r.uid; 
      
      // Padankan RPH.uid dengan ID Dokumen Guru (doc.id)
      if (teachers[teacherUid]) { 
          matchedRphCount++;
          totalStats.total++;
          
          if (!stats[teacherUid]) {
            stats[teacherUid] = { 
                uid: teacherUid, 
                name: teachers[teacherUid], 
                total: 0, submitted: 0, approved: 0, rejected: 0  
            };
          }
          
          stats[teacherUid].total++;
          if (r.status === 'submitted') stats[teacherUid].submitted++;
          if (r.status === 'approved') {
             stats[teacherUid].approved++;
             totalStats.approved++;
          }
          if (r.status === 'rejected') {
             stats[teacherUid].rejected++;
             totalStats.rejected++;
          }
      } else {
          console.warn(`RPH ID ${doc.id} dilangkau: UID guru '${teacherUid}' tidak wujud dalam senarai pengguna /users.`);
      }
    });

    totalStats.submitted = totalStats.total - totalStats.approved - totalStats.rejected; 

    if (matchedRphCount === 0) {
        document.getElementById('analyticsDetails').innerHTML = `<p class="warning">⚠️ RPH ditemui (${rphSnap.size} dokumen), tetapi tiada satu pun yang sepadan dengan guru yang disenaraikan. Sila sahkan UID dalam dokumen RPH anda sepadan dengan ID Dokumen Pengguna dalam koleksi /users.</p>`;
        return;
    }

    // 3. Paparkan Data
    let html = `<h3>Ringkasan Keseluruhan</h3>
        <style>
          .summary-card-container { display: flex; gap: 20px; flex-wrap: wrap; }
          .summary-card { padding: 15px; border-radius: 8px; flex-grow: 1; min-width: 150px; text-align: center; border: 1px solid #ccc; }
          .approved-color { background-color: #e6ffe6; border-color: #66cc66; }
          .submitted-color { background-color: #fffbe6; border-color: #ffcc00; }
          .rejected-color { background-color: #ffe6e6; border-color: #ff6666; }
        </style>
        <div class="summary-card-container">
            <div class="summary-card">Jumlah RPH: <strong>${totalStats.total}</strong></div>
            <div class="summary-card approved-color">Diluluskan: <strong>${totalStats.approved}</strong></div>
            <div class="summary-card submitted-color">Menunggu Semakan: <strong>${totalStats.submitted}</strong></div>
            <div class="summary-card rejected-color">Ditolak: <strong>${totalStats.rejected}</strong></div>
        </div>`;

    html += '<h3 style="margin-top: 30px;">Prestasi Mengikut Guru</h3><div class="table-container"><table><thead><tr><th>Guru</th><th>Jumlah RPH</th><th>Menunggu Semakan</th><th>Diluluskan</th><th>Ditolak</th><th>% Diluluskan</th></tr></thead><tbody>';
    
    const sortedStats = Object.values(stats).sort((a, b) => b.total - a.total);

    sortedStats.forEach(s => {
      const approvedRate = s.total > 0 ? ((s.approved / s.total) * 100).toFixed(0) : 0;
      const rateColor = approvedRate >= 75 ? 'color: green;' : approvedRate >= 50 ? 'color: orange;' : 'color: red;';
      
      html += `<tr>
        <td><a href="#" onclick="${navigate ? `window.router.navigate('admin-rph-review', { uid: '${s.uid}' });` : `console.error('Router tidak tersedia');`} return false;">${s.name}</a></td>
        <td>${s.total}</td>
        <td>${s.submitted}</td>
        <td>${s.approved}</td>
        <td>${s.rejected}</td>
        <td style="${rateColor} font-weight: bold;">${approvedRate}%</td>
      </tr>`;
    });
    
    html += '</tbody></table></div>';
    document.getElementById('analyticsDetails').innerHTML = html;

  } catch (err) {
    document.getElementById('analyticsDetails').innerHTML = `<p class="error">Gagal memuatkan Analisis (Ralat Kritikal): ${err.message}. Sila semak Peraturan Keselamatan Firestore.</p>`;
    console.error("Ralat Memuatkan Analisis:", err);
  }
}
