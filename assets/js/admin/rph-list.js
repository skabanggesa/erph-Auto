// assets/js/admin/rph-list.js (VERSI TINDAKAN PUKAL + PENAPISAN AGIHAN)

import { auth, db } from '../config.js';
import { 
  collection, getDocs, query, where, orderBy, 
  doc, getDoc, writeBatch, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadRphListPage() {
  const content = document.getElementById('adminContent');
  const user = auth.currentUser;

  if (!user) {
    content.innerHTML = '<p class="error">Sesi tamat. Sila log masuk semula.</p>';
    return;
  }

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
            <tr><td colspan="7">Memuatkan data seliaan...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = document.querySelector('#rphTable tbody');

  try {
    // 2. Logik Penapisan Distributor (Agihan Guru)
    const distRef = doc(db, 'distributor', user.uid);
    const distSnap = await getDoc(distRef);
    
    let teacherUids = [];
    let isSuperAdmin = false;

    // Semak peranan user (Admin atau PK)
    const userProfile = await getDoc(doc(db, 'users', user.uid));
    const userData = userProfile.data();

    if (userData.role === 'admin' && !distSnap.exists()) {
        // Jika Super Admin (Tiada agihan spesifik), nampak SEMUA
        isSuperAdmin = true;
    } else if (distSnap.exists()) {
        // Jika ada agihan (PK/Penyemak), ambil senarai guru seliaan
        teacherUids = distSnap.data().teacherUids || [];
    }

    // 3. Bina Query Firestore berdasarkan Agihan
    let q;
    if (isSuperAdmin) {
        q = query(
            collection(db, 'rph'), 
            where('status', '==', 'submitted'), 
            orderBy('tarikh', 'desc')
        );
    } else if (teacherUids.length > 0) {
        // Hanya ambil RPH dari guru-guru dalam list seliaan PK ini
        q = query(
            collection(db, 'rph'), 
            where('status', '==', 'submitted'), 
            where('uid', 'in', teacherUids)
        );
    } else {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Tiada guru diagahkan di bawah seliaan anda.</td></tr>';
        return;
    }

    const querySnapshot = await getDocs(q);
    
    // 4. Muatkan senarai guru untuk rujukan nama (Mapping UID -> Name)
    const teachers = {};
    const teacherSnap = await getDocs(collection(db, 'users'));
    teacherSnap.forEach(dDoc => {
      teachers[dDoc.id] = dDoc.data().name; 
    });

    tbody.innerHTML = '';

    if (querySnapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Tiada RPH menunggu semakan.</td></tr>';
        return;
    }

    // 5. Paparkan data ke dalam jadual
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const tarikh = data.tarikh && data.tarikh.toDate ? data.tarikh.toDate().toLocaleDateString('ms-MY') : (data.tarikh || '–');
      
      const row = tbody.insertRow();
      row.innerHTML = `
        <td style="text-align:center;"><input type="checkbox" class="rph-checkbox" value="${docSnap.id}"></td>
        <td>${teachers[data.uid] || 'Guru Tidak Dikenali'}</td> 
        <td>${data.kelas || '–'}</td>
        <td>${data.matapelajaran || '–'}</td>
        <td>${tarikh}</td>
        <td><span class="status-submitted">Menunggu Semakan</span></td> 
        <td>
          <button class="btn btn-review" data-id="${docSnap.id}">Semak</button>
        </td>
      `;
    });

    // 6. Aktifkan Listeners
    setupEventListeners();

  } catch (error) {
    console.error("Ralat memuatkan senarai:", error);
    tbody.innerHTML = `<tr><td colspan="7" class="error">Ralat: ${error.message}</td></tr>`;
  }
}

/**
 * Fungsi untuk menguruskan interaksi UI (Checkbox & Buttons)
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

  // Butang "Semak" Individu
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
    statusMsg.innerHTML = "✅ Berjaya Meluluskan!";
    
    // Muat semula senarai selepas 1 saat
    setTimeout(loadRphListPage, 1000);
    
  } catch (error) {
    console.error("Ralat batch:", error);
    statusMsg.style.color = "red";
    statusMsg.innerHTML = "❌ Ralat: " + error.message;
  }
}
