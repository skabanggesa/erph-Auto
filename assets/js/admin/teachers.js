// assets/js/admin/teachers.js (KOD LENGKAP & DIKEMASKINI: UI Kemas & Fungsi Nyahaktif/Aktif Semula)

import { auth, db } from '../config.js';
import { 
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  collection, addDoc, getDocs, doc, updateDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function loadTeachersPage() {
  const adminContent = document.getElementById('adminContent');
  adminContent.innerHTML = `
    <div class="admin-section">
      <h2>Daftar Guru Baru</h2>
      
      <div class="form-group">
        <label for="teacherName">Nama</label>
        <input type="text" id="teacherName" placeholder="Nama penuh" class="form-control" />
      </div>
      <div class="form-group">
        <label for="teacherEmail">Emel</label>
        <input type="email" id="teacherEmail" placeholder="emel@guru.edu.my" class="form-control" />
      </div>
      <div class="form-group">
        <label for="teacherPassword">Kata Laluan</label>
        <input type="password" id="teacherPassword" placeholder="Minimum 6 aksara" class="form-control" />
      </div>
      
      <div class="admin-buttons">
          <button id="btnRegisterTeacher" class="btn btn-primary">Daftar Guru</button>
      </div>
      
      <div id="teacherError" class="status-message error" style="margin-top:10px;"></div>

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
          <tbody>
              <tr><td colspan="4">Memuatkan data guru...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="statusUpdate" class="status-message" style="margin-top: 15px;"></div>
    </div>
  `;

  // Lampirkan Event Listener
  document.getElementById('btnRegisterTeacher').addEventListener('click', registerTeacher);
  
  // Muatkan senarai guru (Fungsi ini akan menentukan sama ada senarai dipaparkan)
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
    
    // 1. Cipta pengguna Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Simpan ke Firestore (KRITIKAL: Dokumen ini yang diperlukan oleh loadTeachersList)
    const userDocRef = await addDoc(collection(db, 'users'), {
      uid: user.uid,
      name: name,
      email: email,
      role: 'guru',
      status: 'active', // <<< DEFAULT STATUS BARU
      createdAt: new Date()
    });

    errorDiv.textContent = 'Guru berjaya didaftar!';
    
    // Kosongkan borang
    document.getElementById('teacherName').value = '';
    document.getElementById('teacherEmail').value = '';
    document.getElementById('teacherPassword').value = '';
    
    // Muat semula senarai
    await loadTeachersList();
    
  } catch (err) {
    console.error("Ralat Pendaftaran:", err);
    if (err.code === 'auth/email-already-in-use') {
      errorDiv.textContent = 'Emel sudah digunakan.';
    } else {
      errorDiv.textContent = 'Ralat: Gagal mendaftar guru. ' + err.message;
    }
  }
}

/**
 * Memuatkan dan memaparkan senarai pengguna (guru) dari Firestore.
 */
async function loadTeachersList() {
    const tbody = document.querySelector('#teachersTable tbody');
    tbody.innerHTML = '<tr><td colspan="4">Memuatkan data guru...</td></tr>';
    
    try {
        // Query hanya dokumen pengguna dengan role 'guru' dalam koleksi 'users'
        const q = query(collection(db, 'users'), where('role', '==', 'guru'));
        const querySnapshot = await getDocs(q);
        
        let htmlRows = '';
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const docId = doc.id; // ID Dokumen Firestore
            const status = data.status || 'active'; // Default kepada active jika field tiada
            const isDiasabled = status === 'disabled';
            
            htmlRows += `
                <tr>
                    <td>${data.name || 'Tiada Nama'}</td>
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
                </tr>
            `;
        });
        
        tbody.innerHTML = htmlRows || '<tr><td colspan="4">Tiada akaun guru berdaftar ditemui dalam Firestore.</td></tr>';

        // Tambah event listener untuk Nyahaktif/Aktif Semula
        document.querySelectorAll('#teachersTable button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.target.dataset.docid;
                const currentStatus = e.target.dataset.currentStatus;
                toggleTeacherStatus(docId, currentStatus);
            });
        });

    } catch (err) {
        console.error("Ralat memuatkan senarai pengguna:", err);
        tbody.innerHTML = `<tr><td colspan="4" class="error">Gagal memuatkan senarai: ${err.message}. Pastikan Peraturan Keselamatan anda betul.</td></tr>`;
    }
}

/**
 * Menukar status pengguna antara 'active' dan 'disabled' dalam Firestore.
 * @param {string} docId - ID dokumen Firestore (Bukan UID Auth)
 * @param {string} currentStatus - Status semasa ('active' atau 'disabled')
 */
async function toggleTeacherStatus(docId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
  const actionText = newStatus === 'disabled' ? 'nyahaktifkan' : 'aktifkan semula';

  if (!confirm(`Adakah anda pasti mahu ${actionText} akaun ini? Ini akan menyekat akses mereka kepada sistem RPH/Jadual jika Peraturan Keselamatan anda telah dikemas kini.`)) return;

  const docRef = doc(db, 'users', docId);
  try {
    // UPDATE Firestore document
    await updateDoc(docRef, {
      status: newStatus,
    });
    
    // Berikan maklum balas
    const statusDiv = document.getElementById('statusUpdate');
    statusDiv.innerHTML = `<p class="success">Guru berjaya di${actionText}.</p>`;
    
    // Muat semula senarai
    await loadTeachersList();
    
  } catch (err) {
    const statusDiv = document.getElementById('statusUpdate');
    statusDiv.innerHTML = `<p class="error">Gagal mengemas kini status: ${err.message}</p>`;
    console.error("Ralat Toggle Status:", err);
  }
}
