// assets/js/admin/analytics.js (VERSI MUKTAMAD: BYPASS INDEX FIRESTORE)

import { db } from '../config.js';
import { 
  collection, getDocs
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
    // 1. GANTIKAN Kueri 'where' yang gagal. 
    // Ambil SEMUA pengguna, dan tapis 'guru' di sini. Admin mempunyai izin 'list' penuh.
    const userSnap = await getDocs(collection(db, 'users')); 
    
    const teachers = {};
    let guruCount = 0;

    userSnap.forEach(doc => {
      const d = doc.data();
      
      // Tapis role 'guru' pada sisi klien (JavaScript)
      if (d.role === 'guru') { 
          teachers[d.uid] = d.name; 
          guruCount++;
      }
    });

    // Semak jika tiada guru yang sah
    if (guruCount === 0) {
        document.getElementById('analyticsDetails').innerHTML = `<p class="warning">⚠️ Gagal memuatkan Analisis: Tiada pengguna dengan peranan 'guru' ditemui dalam koleksi /users. Sila pastikan medan 'role' adalah <span style="font-weight: bold;">"guru"</span>.</p>`;
        return;
    }


    // 2. Dapatkan semua RPH
    const rphSnap = await getDocs(collection(db, 'rph'));
    
    const stats = {};
    let matchedRphCount = 0;

    if (rphSnap.empty) {
        document.getElementById('analyticsDetails').innerHTML = `<p class="warning">⚠️ Tiada RPH yang ditemui dalam koleksi /rph. Analisis tidak dapat dijalankan.</p>`;
        return;
    }
    
    rphSnap.forEach(doc => {
      const r = doc.data();
      const teacherUid = r.uid; 
      
      // Padankan dengan senarai guru yang telah ditapis di atas
      if (teachers[teacherUid]) { 
          matchedRphCount++;
          if (!stats[teacherUid]) {
            stats[teacherUid] = { name: teachers[teacherUid], total: 0, submitted: 0, approved: 0, rejected: 0 };
          }
          
          stats[teacherUid].total++;
          if (r.status === 'submitted') stats[teacherUid].submitted++;
          if (r.status === 'approved') stats[teacherUid].approved++; 
          if (r.status === 'rejected') stats[teacherUid].rejected++; 
      } else {
          // Hanya akan dipaparkan jika guru wujud tetapi RPH menggunakan UID yang salah
          console.warn(`RPH ID ${doc.id} dilangkau: UID guru '${teacherUid}' tidak wujud dalam senarai pengguna /users.`);
      }
    });

    if (matchedRphCount === 0) {
        document.getElementById('analyticsDetails').innerHTML = `<p class="warning">⚠️ RPH ditemui (${rphSnap.size} dokumen), tetapi tiada satu pun yang sepadan dengan guru yang disenaraikan. Semak medan <span style="font-weight: bold;">\`uid\`</span> dalam dokumen RPH anda.</p>`;
        return;
    }

    // 3. Paparkan Data
    let html = '<h3>Prestasi Mengikut Guru</h3><div class="table-container"><table><thead><tr><th>Guru</th><th>Jumlah RPH Dicipta</th><th>Menunggu Semakan</th><th>Diluluskan</th><th>Ditolak</th></tr></thead><tbody>';
    const sortedStats = Object.values(stats).sort((a, b) => b.total - a.total);

    sortedStats.forEach(s => {
      html += `<tr><td>${s.name}</td><td>${s.total}</td><td>${s.submitted}</td><td>${s.approved}</td><td>${s.rejected}</td></tr>`;
    });
    html += '</tbody></table></div>';

    document.getElementById('analyticsDetails').innerHTML = html;

  } catch (err) {
    document.getElementById('analyticsDetails').innerHTML = `<p class="error">Gagal memuatkan Analisis (Ralat Kritikal): ${err.message}. Sila semak Peraturan Keselamatan Firestore.</p>`;
    console.error("Ralat Memuatkan Analisis:", err);
  }
}
