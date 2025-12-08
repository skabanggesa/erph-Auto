import { db } from '../config.js';
import { 
  collection, getDocs, query, where 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadAnalytics() {
  const content = document.getElementById('adminContent');
  content.innerHTML = `
    <div class="admin-section">
      <h2>Analisis Penghantaran RPH</h2>
      <div class="chart-container">
        <p>Analisis ringkas akan dipaparkan di sini.</p>
      </div>
      <div id="analyticsDetails" style="margin-top:20px;"></div>
    </div>
  `;

  try {
    // Dapatkan semua guru
    const teacherSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'guru')));
    const teachers = {};
    teacherSnap.forEach(doc => {
      const d = doc.data();
      teachers[d.uid] = d.name;
    });

    // Dapatkan semua RPH
    const rphSnap = await getDocs(collection(db, 'rph'));
    const stats = {};

    rphSnap.forEach(doc => {
      const r = doc.data();
      if (!teachers[r.userId]) return;
      if (!stats[r.userId]) {
        stats[r.userId] = { name: teachers[r.userId], total: 0, submitted: 0, reviewed: 0 };
      }
      stats[r.userId].total++;
      if (r.status === 'submitted') stats[r.userId].submitted++;
      if (r.status === 'reviewed') stats[r.userId].reviewed++;
    });

    let html = '<h3>Prestasi Mengikut Guru</h3><div class="table-container"><table><thead><tr><th>Guru</th><th>Jumlah RPH</th><th>Dihantar</th><th>Disemak</th></tr></thead><tbody>';
    Object.values(stats).forEach(s => {
      html += `<tr>
        <td>${s.name}</td>
        <td>${s.total}</td>
        <td>${s.submitted}</td>
        <td>${s.reviewed}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    document.getElementById('analyticsDetails').innerHTML = html;
  } catch (err) {
    document.getElementById('analyticsDetails').innerHTML = `<p>Ralat: ${err.message}</p>`;
  }
}