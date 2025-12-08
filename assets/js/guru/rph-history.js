import { auth, db } from '../config.js';
import { 
  collection, query, where, getDocs, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadRphHistory() {
  const content = document.getElementById('content');
  content.innerHTML = '<p>Memuatkan senarai RPH...</p>';

  const q = query(
    collection(db, 'rph'),
    where('userId', '==', auth.currentUser.uid),
    orderBy('tarikh', 'desc')
  );
  const querySnapshot = await getDocs(q);

  let html = `
    <div class="guru-section">
      <h2>Senarai RPH Saya</h2>
      <div id="rphList">
  `;

  if (querySnapshot.empty) {
    html += '<p>Anda belum menjana sebarang RPH.</p>';
  } else {
    querySnapshot.forEach(doc => {
      const r = doc.data();
      const tarikh = r.tarikh.toDate ? r.tarikh.toDate().toLocaleDateString('ms-MY') : '–';
      const status = r.status === 'draft' ? 'Draf' : 
                    r.status === 'submitted' ? 'Dihantar' : 'Disemak';
      const statusColor = r.status === 'draft' ? '#888' : 
                         r.status === 'submitted' ? '#1976d2' : '#388e3c';

      html += `
        <div class="rph-card">
          <h4>${r.matapelajaran} - ${r.kelas}</h4>
          <div class="rph-meta">
            Tarikh: ${tarikh} | Status: <span style="color:${statusColor}">${status}</span>
          </div>
          <div class="rph-actions">
            <button class="btn" onclick="window.viewRph('${doc.id}')">Lihat/Edit</button>
          </div>
        </div>
      `;
    });
  }

  html += `
      </div>
      <button id="btnBackDashboard" class="btn">Kembali ke Dashboard</button>
    </div>
  `;

  content.innerHTML = html;

  document.getElementById('btnBackDashboard').addEventListener('click', () => {
    // Muat semula timetable module (ia akan redirect ke dashboard jika jadual wujud)
    import('./timetable.js').then(m => m.loadTimetableModule());
  });
}

// Fungsi global untuk edit
window.viewRph = (rphId) => {
  import('./rph-edit.js').then(m => m.loadRphEdit(rphId));
};