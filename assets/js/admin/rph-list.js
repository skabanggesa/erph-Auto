// assets/js/admin/rph-list.js (KOD LENGKAP & DIKEMASKINI)

import { db } from '../config.js';
import { 
  collection, getDocs, query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Ambil fungsi router.navigate secara global (jika anda menukarnya)
// const router = window.router; 

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
    if (d.role === 'guru') teachers[d.uid] = d.name; // <--- ISU MUNGKIN DI SINI
  });

  querySnapshot.forEach(doc => {
    const data = doc.data();
    const tarikh = data.tarikh.toDate ? data.tarikh.toDate().toLocaleDateString('ms-MY') : '–';
    
    // Logik status yang dipertingkatkan
    let statusText = 'Tidak Diketahui';
    switch (data.status) {
        case 'submitted':
            statusText = 'Menunggu Semakan';
            break;
        case 'draft':
            statusText = 'Draf';
            break;
        case 'approved':
            statusText = 'LULUS';
            break;
        case 'rejected':
            statusText = 'TOLAK';
            break;
    }
    
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${teachers[data.uid] || '–'}</td> <td>${data.kelas || '–'}</td>
      <td>${data.matapelajaran || '–'}</td>
      <td>${tarikh}</td>
      <td>${statusText}</td> <td>
        <button class="btn btn-review" data-id="${doc.id}">Semak</button>
      </td>
    `;
  });

  // Event: semak RPH
  document.querySelectorAll('.btn-review').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rphId = e.target.dataset.id;
      
      // Menggunakan import dinamik seperti yang ada dalam kod asal anda
      import('./review.js').then(m => m.loadReviewPage(rphId)); 
      
      // Jika anda menggunakan router.navigate (perlu tambah laluan 'admin-review-rph' dalam router.js):
      // window.router.navigate('admin-review-rph', rphId);
    });
  });
}


