// assets/js/admin/teachers.js (KOD LENGKAP & DIKEMASKINI: Tukar Padam ke Nyahaktif)

import { auth, db } from '../config.js';
import { 
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  collection, addDoc, getDocs, doc, updateDoc, query, where, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function loadTeachersPage() {
  const content = document.getElementById('adminContent');
  content.innerHTML = `
    <div class="admin-section">
      <h2>Daftar Guru Baru</h2>
      <div class="form-group">
        <label>Nama</label>
        <input type="text" id="teacherName" placeholder="Nama penuh" />
      </div>
      <div class="form-group">
        <label>Emel</label>
        <input type="email" id="teacherEmail" placeholder="emel@guru.edu.my" />
      </div>
      <div class="form-group">
        <label>Kata Laluan</label>
        <input type="password" id="teacherPassword" placeholder="Minimum 6 aksara" />
      </div>
      <button id="btnRegisterTeacher" class="btn btn-primary">Daftar Guru</button>
      <div id="teacherError" style="color:red; margin-top:10px;"></div>

      <h3 style="margin-top: 30px;">Senarai Guru Berdaftar</h3>
      <div class="table-container">
        <table id="teachersTable">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Emel</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  // Daftar guru
  document.getElementById('btnRegisterTeacher').addEventListener('click', registerTeacher);
  await loadTeachersList();
}

/**
 * Mendaftar akaun guru baharu ke Firebase Auth dan Firestore.
 */
async function registerTeacher() {
  const name = document.getElementById('teacherName').value.trim();
  const email = document.getElementById('teacherEmail').value.trim();
  const password = document.getElementById('teacherPassword').value;
  const errorDiv = document.getElementById('teacherError');

  if (!name || !email || !password) {
    errorDiv.textContent = 'Sila isi semua medan.';
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = 'Kata laluan mesti sekurang-kurangnya 6 aksara.';
    return;
  }

  try {
    errorDiv.textContent = 'Mendaftar...';
    
    // Cipta pengguna Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Simpan ke Firestore (KRITIKAL: Tambah status: 'active')
    await addDoc(collection(db, 'users'), {
      uid: user.uid,
      name: name,
      email: email,
      role: 'guru',
      status: 'active', // <<< DEFAULT STATUS BARU
      createdAt: new Date()
    });

    errorDiv.textContent = 'Guru berjaya didaftar!';
    document.getElementById('teacherName').value = '';
    document.getElementById('teacherEmail').value = '';
    document.getElementById('teacherPassword').value = '';
    await loadTeachersList();
  } catch (err) {
    console.error(err);
    if (err.code === 'auth/email-already-in-use') {
      errorDiv.textContent = 'Emel sudah digunakan.';
    } else {
      errorDiv.textContent = 'Ralat: ' + err.message;
    }
  }
}

/**
 * Memuatkan dan memaparkan senarai pengguna (guru).
 */
async function loadTeachersList() {
  // Hanya ambil pengguna dengan role 'guru'. Kita akan tapis 'status' di klien.
  const q = query(collection(db, 'users'), where('role', '==', 'guru'));
  const querySnapshot = await getDocs(q);
  const tbody = document.querySelector('#teachersTable tbody');
  tbody.innerHTML = '';

  querySnapshot.forEach(doc => {
    const data = doc.data();
    const docId = doc.id;
    const status = data.status || 'active'; // Default kepada active jika tiada field
    const isDiasabled = status === 'disabled';
    
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${data.name}</td>
      <td>${data.email}</td>
      <td>
        <span style="font-weight: bold; color: ${isDiasabled ? '#d32f2f' : '#1976d2'}">
          ${isDiasabled ? 'Nyahaktif' : 'Aktif'}
        </span>
      </td>
      <td>
        <button 
          class="btn ${isDiasabled ? 'btn-primary' : 'btn-delete'}" 
          data-docid="${docId}" 
          data-current-status="${status}">
          ${isDiasabled ? 'Aktifkan Semula' : 'Nyahaktifkan'}
        </button>
      </td>
    `;
  });

  // Tambah event listener untuk Nyahaktif/Aktif Semula
  document.querySelectorAll('.btn-delete, .btn-primary').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const docId = e.target.dataset.docid;
      const currentStatus = e.target.dataset.currentStatus;
      toggleTeacherStatus(docId, currentStatus);
    });
  });
}

/**
 * Menukar status pengguna antara 'active' dan 'disabled'.
 * Ini hanya mengubah dokumen Firestore, tetapi Peraturan Keselamatan anda
 * perlu menyekat pengguna 'disabled' daripada mengakses data (cth. RPH, Jadual).
 * @param {string} docId - ID dokumen Firestore (Bukan UID Auth)
 * @param {string} currentStatus - Status semasa ('active' atau 'disabled')
 */
async function toggleTeacherStatus(docId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
  const actionText = newStatus === 'disabled' ? 'nyahaktifkan' : 'aktifkan semula';

  if (!confirm(`Adakah anda pasti mahu ${actionText} akaun ini?`)) return;

  const docRef = doc(db, 'users', docId);
  try {
    // UPDATE Firestore document
    await updateDoc(docRef, {
      status: newStatus,
      // Pilihan: anda juga boleh membuang role/menetapkan role khas jika status tidak cukup
      // role: newStatus === 'disabled' ? 'disabled' : 'guru' 
    });
    
    alert(`Guru berjaya di${actionText} (status Firestore dikemas kini).`);
    await loadTeachersList();
  } catch (err) {
    alert('Gagal mengemas kini status: ' + err.message);
  }
}
