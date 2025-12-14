// assets/js/admin/analytics.js (DIPERBETULKAN UNTUK MENGGUNAKAN 'uid' BUKAN 'userId')

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
    const rphSnap = await getDocs(collection(db, 'rph'));
    const stats = {};

    rphSnap.forEach(doc => {
      const r = doc.data();
      const teacherUid = r.uid; // <<< KRITIKAL: Guna r.uid (Bukan r.userId)

      if (!teachers[teacherUid]) return; // Langkau jika data guru tidak dijumpai

      if (!stats[teacherUid]) {
        stats[teacherUid] = { 
            name: teachers[teacherUid], 
            total: 0, 
            submitted: 0, 
            approved: 0, // Tambah medan ini untuk selaras dengan tajuk jadual baru anda
            rejected: 0  // Tambah medan ini
        };
      }
      
      stats[teacherUid].total++;
      
      // Kirakan statistik mengikut status (menggunakan status yang betul)
      if (r.status === 'submitted') stats[teacherUid].submitted++;
      if (r.status === 'approved') stats[teacherUid].approved++;
      if (r.status === 'rejected') stats[teacherUid].rejected++;
    });

    // 3. Paparkan data dalam jadual (Pastikan tajuk selaras dengan data yang dikira)
    let html = '<h3>Prestasi Mengikut Guru</h3><div class="table-container"><table><thead><tr><th>Guru</th><th>Jumlah RPH Dicipta</th><th>Menunggu Semakan</th><th>Diluluskan</th><th>Ditolak</th></tr></thead><tbody>';
    
    // Sort by Total RPH descending
    const sortedStats = Object.values(stats).sort((a, b) => b.total - a.total);

    sortedStats.forEach(s => {
      // Pastikan s.approved dan s.rejected digunakan di sini
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
