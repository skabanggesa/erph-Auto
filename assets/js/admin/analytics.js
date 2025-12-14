// assets/js/admin/analytics.js (VERSI TERAKHIR & DIPERBETULKAN)

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
      
      <div id="analyticsDetails" style="margin-top:20px;">
          <p>Memuatkan data...</p>
      </div>
      
    </div>
  `;

  try {
    // 1. Dapatkan semua guru (menggunakan uid sebagai kunci)
    const teacherSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'guru')));
    const teachers = {};
    teacherSnap.forEach(doc => {
      const d = doc.data();
      teachers[d.uid] = d.name; // Kunci: UID, Nilai: Nama
    });

    // 2. Dapatkan semua RPH
    const rphSnap = await getDocs(collection(db, 'rph')); // RPH disimpan di sini
    const stats = {};

    rphSnap.forEach(doc => {
      const r = doc.data();
      
      // <<< KRITIKAL 1: Guna r.uid (ID pengguna) BUKAN r.userId
      const teacherUid = r.uid; 

      if (!teachers[teacherUid]) return; // Langkau jika data guru tidak dijumpai

      if (!stats[teacherUid]) {
        stats[teacherUid] = { 
            name: teachers[teacherUid], 
            total: 0, 
            submitted: 0, 
            approved: 0, // GUNA 'approved' (daripada 'reviewed' lama)
            rejected: 0  // DITAMBAH
        };
      }
      
      stats[teacherUid].total++;
      
      // <<< KRITIKAL 2: Guna 'approved' dan 'rejected' sebagai status RPH
      if (r.status === 'submitted') stats[teacherUid].submitted++;
      if (r.status === 'approved') stats[teacherUid].approved++; 
      if (r.status === 'rejected') stats[teacherUid].rejected++; 
    });

    // 3. Paparkan data dalam jadual
    let html = '<h3>Prestasi Mengikut Guru</h3><div class="table-container"><table><thead><tr><th>Guru</th><th>Jumlah RPH Dicipta</th><th>Menunggu Semakan</th><th>Diluluskan</th><th>Ditolak</th></tr></thead><tbody>';
    
    // Susun mengikut Jumlah RPH
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
    document.getElementById('analyticsDetails').innerHTML = `<p class="error">Gagal memuatkan Analisis: ${err.message}. Sila semak semula Peraturan Keselamatan Firestore.</p>`;
    console.error("Ralat Memuatkan Analisis:", err);
  }
}
