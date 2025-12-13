// assets/js/admin/teachers.js (KOD LENGKAP & DISAHKAN)

import { auth, db } from '../config.js';
import { 
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  collection, setDoc, getDocs, doc, updateDoc, query, where
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

  document.getElementById('btnRegisterTeacher').addEventListener('click', registerTeacher);
  await loadTeachersList();
}


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

    // 2. Simpan ke Firestore (KRITIKAL: menetapkan role dan status)
    // Nota: Menggunakan setDoc di sini, ID dokumen akan menjadi ID Rawak. 
    // Jika anda mahu ID dokumen sama dengan UID, guna setDoc(doc(db, 'users', user.uid), {...})
    // Namun, kita kekalkan setDoc kerana ia sudah ada dalam kod asal anda.
    await setDoc(collection(db, 'users'), {
      uid: user.uid,
      name: name,
      email: email,
      role: 'guru', // Peranan ditetapkan
      status: 'active', // Status ditetapkan
      createdAt: new Date()
    });

    errorDiv.textContent = 'Guru berjaya didaftar!';
    
    document.getElementById('teacherName').value = '';
    document.getElementById('teacherEmail').value = '';
    document.getElementById('teacherPassword').value = '';
    
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


async function loadTeachersList() {
    const tbody = document.querySelector('#teachersTable tbody');
    tbody.innerHTML = '<tr><td colspan="4">Memuatkan data guru...</td></tr>';
    
    try {
        // Hanya query pengguna dengan role 'guru'. Memerlukan kebenaran 'list' Admin.
        const q = query(collection(db, 'users'), where('role', '==', 'guru'));
        const querySnapshot = await getDocs(q);
        
        let htmlRows = '';
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Nota: doc.id mungkin berbeza daripada data.uid jika menggunakan setDoc
            const docId = doc.id; 
            const status = data.status || 'active'; 
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
        // Ralat FirebaseError: Missing or insufficient permissions akan dipaparkan di sini
        tbody.innerHTML = `<tr><td colspan="4" class="error">Gagal memuatkan senarai: ${err.message}.</td></tr>`;
    }
}


async function toggleTeacherStatus(docId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
  const actionText = newStatus === 'disabled' ? 'nyahaktifkan' : 'aktifkan semula';

  if (!confirm(`Adakah anda pasti mahu ${actionText} akaun ini?`)) return;

  const docRef = doc(db, 'users', docId);
  try {
    await updateDoc(docRef, { status: newStatus });
    
    const statusDiv = document.getElementById('statusUpdate');
    statusDiv.innerHTML = `<p class="success">Guru berjaya di${actionText}.</p>`;
    
    await loadTeachersList();
    
  } catch (err) {
    const statusDiv = document.getElementById('statusUpdate');
    statusDiv.innerHTML = `<p class="error">Gagal mengemas kini status: ${err.message}</p>`;
    console.error("Ralat Toggle Status:", err);
  }
}

