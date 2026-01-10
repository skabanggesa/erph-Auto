// assets/js/admin/rph-list.js (VERSI TINDAKAN PUKAL LENGKAP)

import { auth, db } from '../config.js';
import { 
  collection, getDocs, query, where, orderBy, 
  doc, writeBatch, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadRphListPage() {
  const content = document.getElementById('adminContent');
  
  // 1. Bina struktur HTML termasuk Panel Tindakan Pukal
  content.innerHTML = `
    <div class="admin-section">
      <h2>Senarai RPH Dihantar</h2>
      
      <div id="bulkActionContainer" style="display:none; background: #f0f7ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #007bff;">
          <h4 style="margin-top:0; color: #007bff;">Tindakan Pukal (<span id="selectedCount">0</span> RPH dipilih)</h4>
          <textarea id="bulkComment" placeholder="Masukkan komen untuk semua RPH yang dipilih..." style="width:100%; padding:10px; margin-bottom:12px; border-radius:4px; border:1px solid #ccc; font-family: inherit;"></textarea>
          <div style="display: flex; gap: 10px; align-items: center;">
              <button id="btnBulkApprove" class="btn btn-success" style="background:#28a745; color:white; border:none; padding:10px 20px; cursor:pointer; border-radius:4px; font-weight:bold;">Luluskan Pilihan</button>
              <span id="bulkStatus" style="font-weight:bold;"></span>
          </div>
      </div>

      <div class="table-container">
        <table id="rphTable">
          <thead>
            <tr>
              <th style="width: 40px;"><input type="checkbox" id="selectAll"></th>
              <th>Guru</th>
              <th>Kelas</th>
              <th>Mata Pelajaran</th>
              <th>Tarikh</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="7">Memuatkan RPH...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  try {
    // 2. Ambil data RPH (Submitted sahaja)
    const q = query(
      collection(db, 'rph'),
      where('status', '==', 'submitted'),
      orderBy('tarikh', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    // 3. Muatkan senarai guru untuk rujukan nama
    const teachers = {};
    const teacherSnap = await getDocs(collection(db, 'users'));
    teacherSnap.forEach(doc => {
      const d = doc.data();
      if (d.role === 'guru') teachers[doc.id] = d.name; 
    });

    const tbody = document.querySelector('#rphTable tbody');
    tbody.innerHTML = '';

    if (querySnapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Tiada RPH menunggu semakan.</td></tr>';
        return;
    }

    // 4. Paparkan data ke dalam jadual
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const tarikh = data.tarikh && data.tarikh.toDate ? data.tarikh.toDate().toLocaleDateString('ms-MY') : (data.tarikh || '–');
      
      const row = tbody.insertRow();
      row.innerHTML = `
        <td style="text-align:center;"><input type="checkbox" class="rph-checkbox" value="${docSnap.id}"></td>
        <td>${teachers[data.uid] || '–'}</td> 
        <td>${data.kelas || '–'}</td>
        <td>${data.matapelajaran || '–'}</td>
        <td>${tarikh}</td>
        <td><span class="status-submitted">Menunggu Semakan</span></td> 
        <td>
          <button class="btn btn-review" data-id="${docSnap.id}">Semak</button>
        </td>
      `;
    });

    // 5. Aktifkan Listeners (Checkbox & Butang)
    setupEventListeners();

  } catch (error) {
    console.error("Ralat memuatkan senarai:", error);
    document.querySelector('#rphTable tbody').innerHTML = `<tr><td colspan="7" class="error">Gagal: ${error.message}</td></tr>`;
  }
}

/**
 * Fungsi untuk menguruskan interaksi UI
 */
function setupEventListeners() {
  const selectAll = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('.rph-checkbox');
  const bulkContainer = document.getElementById('bulkActionContainer');
  const selectedCountDisplay = document.getElementById('selectedCount');
  const btnBulkApprove = document.getElementById('btnBulkApprove');

  // Logik Pilih Semua
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      checkboxes.forEach(cb => cb.checked = e.target.checked);
      updateBulkUI();
    });
  }

  // Logik Pilih Individu
  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateBulkUI);
  });

  function updateBulkUI() {
    const checked = document.querySelectorAll('.rph-checkbox:checked');
    selectedCountDisplay.textContent = checked.length;
    bulkContainer.style.display = checked.length > 0 ? 'block' : 'none';
  }

  // Butang "Semak" Individu (Fungsi Asal)
  document.querySelectorAll('.btn-review').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rphId = e.target.dataset.id;
      import('./review.js').then(m => m.loadReviewPage(rphId)); 
    });
  });

  // Butang Luluskan Pukal
  if (btnBulkApprove) {
    btnBulkApprove.addEventListener('click', handleBulkApprove);
  }
}

/**
 * Fungsi untuk memproses kelulusan banyak RPH sekaligus
 */
async function handleBulkApprove() {
  const checkedBoxes = document.querySelectorAll('.rph-checkbox:checked');
  const comment = document.getElementById('bulkComment').value;
  const statusMsg = document.getElementById('bulkStatus');
  const admin = auth.currentUser;

  if (!admin) return alert("Sesi tamat. Sila log masuk semula.");
  if (checkedBoxes.length === 0) return;

  if (!confirm(`Adakah anda pasti untuk meluluskan ${checkedBoxes.length} RPH ini secara serentak?`)) return;

  statusMsg.innerHTML = "Sedang memproses...";
  statusMsg.style.color = "orange";
  
  const batch = writeBatch(db);

  checkedBoxes.forEach(cb => {
    const rphId = cb.value;
    const rphRef = doc(db, 'rph', rphId);
    
    // Kemaskini data mengikut struktur review.js
    batch.update(rphRef, {
      status: 'approved',
      reviewerComment: comment,
      reviewerUid: admin.uid,
      reviewDate: serverTimestamp()
    });
  });

  try {
    await batch.commit();
    statusMsg.style.color = "green";
    statusMsg.innerHTML = "✅ Berjaya!";
    
    // Muat semula senarai selepas 1 saat
    setTimeout(loadRphListPage, 1000);
    
  } catch (error) {
    console.error("Ralat batch:", error);
    statusMsg.style.color = "red";
    statusMsg.innerHTML = "❌ Ralat: " + error.message;
  }
}
