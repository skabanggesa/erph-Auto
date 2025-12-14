// assets/js/admin/analytics.js (VERSI TERAKHIR & LEBIH TEGUH)

import { db } from '../config.js';
import { 
  collection, getDocs, query, where 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
    // 1. Dapatkan semua guru
    const teacherSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'guru')));
    
    // PEMERIKSAAN KRITIKAL 1: Jika tiada guru
    if (teacherSnap.empty) {
        document.getElementById('analyticsDetails').innerHTML = `<p class="warning">⚠️ Gagal memuatkan Analisis: Tiada pengguna dengan peranan 'guru' ditemui. Sila semak koleksi /users dan pastikan medan 'role' adalah <span style="font-weight: bold;">"guru"</span>.</p>`;
        return;
    }

    const teachers = {};
    teacherSnap.forEach(doc => {
      const d = doc.data();
      teachers[d.uid] = d.name; // Kunci: UID, Nilai: Nama
    });


    // 2. Dapatkan semua RPH
    const rphSnap = await getDocs(collection(db, 'rph'));
    
    // PEMERIKSAAN KRITIKAL 2: Jika tiada RPH
    if (rphSnap.empty) {
        document.getElementById('analyticsDetails').innerHTML = `<p class="warning">⚠️ Tiada RPH yang ditemui dalam koleksi /rph. Analisis tidak dapat dijalankan.</p>`;
        return;
    }

    // 3. Proses Data
    const stats = {};
    let matchedRphCount = 0;

    rphSnap.forEach(doc => {
      const r = doc.data();
      const teacherUid = r.uid; 
      
      // PEMERIKSAAN KRITIKAL 3: Jika RPH tidak sepadan dengan guru yang wujud
      if (!teachers[teacherUid]) {
          // Log ralat ini di konsol untuk Admin
          console.warn(`RPH ID ${doc.id} dilangkau: UID guru '${teacherUid}' tidak wujud dalam senarai pengguna /users.`);
          return; 
      }
      
      matchedRphCount++;

      if (!stats[teacherUid]) {
        stats[teacherUid] = { 
            name: teachers[teacherUid], 
            total: 0, 
            submitted: 0, 
            approved: 0, 
            rejected: 0  
        };
      }
      
      stats[teacherUid].total++;
      
      // Kirakan statistik mengikut status
      if (r.status === 'submitted') stats[teacherUid].submitted++;
      if (r.status === 'approved') stats[teacherUid].approved++; 
      if (r.status === 'rejected') stats[teacherUid].rejected++; 
    });
    
    // 4. Paparkan Data
    
    if (matchedRphCount === 0) {
        document.getElementById('analyticsDetails').innerHTML = `<p class="warning">⚠️ RPH ditemui (${rphSnap.size} dokumen), tetapi tiada satu pun yang sepadan dengan guru yang disenaraikan. Semak medan <span style="font-weight: bold;">\`uid\`</span> dalam dokumen RPH anda berbanding UID dalam dokumen pengguna.</p>`;
        return;
    }

    let html = '<h3>Prestasi Mengikut Guru</h3><div class="table-container"><table><thead><tr><th>Guru</th><th>Jumlah RPH Dicipta</th><th>Menunggu Semakan</th><th>Diluluskan</th><th>Ditolak</th></tr></thead><tbody>';
    
    const sortedStats = Object.values(stats).sort((a, b) => b.total - a.total);

    sortedStats.forEach(s => {
      html += `<tr>
        <td>${s.name}</td>
        <td>${s.total}</td>
        <td>${s.submitted}</td>
        <td>${s.approved}</td>
        <td>${s.rejected}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    document.getElementById('analyticsDetails').innerHTML = html;

  } catch (err) {
    // Ini menangkap ralat Kebenaran (Missing or insufficient permissions) jika ia berlaku
    document.getElementById('analyticsDetails').innerHTML = `<p class="error">Gagal memuatkan Analisis (Ralat Kritikal): ${err.message}. Sila semak Peraturan Keselamatan Firestore.</p>`;
    console.error("Ralat Memuatkan Analisis:", err);
  }
}
