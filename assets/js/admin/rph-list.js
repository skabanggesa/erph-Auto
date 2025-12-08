import { db } from '../config.js';
import { 
  collection, getDocs, query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadRphListPage() {
  const content = document.getElementById('adminContent');
  content.innerHTML = `
    <div class="admin-section">
      <h2>Senarai RPH Dihantar</h2>
      <div class="table-container">
        <table id="rphTable">
          <thead>
            <tr>
              <th>Guru</th>
              <th>Kelas</th>
              <th>Mata Pelajaran</th>
              <th>Tarikh</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  const q = query(
    collection(db, 'rph'),
    where('status', '==', 'submitted'),
    orderBy('tarikh', 'desc')
  );
  const querySnapshot = await getDocs(q);
  const tbody = document.querySelector('#rphTable tbody');
  tbody.innerHTML = '';

  // Muatkan senarai guru untuk rujukan nama
  const teachers = {};
  const teacherSnap = await getDocs(collection(db, 'users'));
  teacherSnap.forEach(doc => {
    const d = doc.data();
    if (d.role === 'guru') teachers[d.uid] = d.name;
  });

  querySnapshot.forEach(doc => {
    const data = doc.data();
    const tarikh = data.tarikh.toDate ? data.tarikh.toDate().toLocaleDateString('ms-MY') : '–';
    const status = data.status === 'submitted' ? 'Menunggu Semakan' : 'Disemak';
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${teachers[data.userId] || '–'}</td>
      <td>${data.kelas || '–'}</td>
      <td>${data.matapelajaran || '–'}</td>
      <td>${tarikh}</td>
      <td>${status}</td>
      <td>
        <button class="btn btn-review" data-id="${doc.id}">Semak</button>
      </td>
    `;
  });

  // Event: semak RPH
  document.querySelectorAll('.btn-review').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rphId = e.target.dataset.id;
      import('./review.js').then(m => m.loadReviewPage(rphId));
    });
  });
}