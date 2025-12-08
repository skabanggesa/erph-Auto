import { auth, db } from '../config.js';
import { 
  createUserWithEmailAndPassword,
  deleteUser 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  collection, addDoc, getDocs, doc, deleteDoc 
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
      <button id="btnRegisterTeacher" class="btn">Daftar Guru</button>
      <div id="teacherError" style="color:red; margin-top:10px;"></div>

      <h3>Senarai Guru</h3>
      <div class="table-container">
        <table id="teachersTable">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Emel</th>
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
  loadTeachersList();
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
    // Cipta pengguna Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Simpan ke Firestore
    await addDoc(collection(db, 'users'), {
      uid: user.uid,
      name: name,
      email: email,
      role: 'guru',
      createdAt: new Date()
    });

    errorDiv.textContent = 'Guru berjaya didaftar!';
    document.getElementById('teacherName').value = '';
    document.getElementById('teacherEmail').value = '';
    document.getElementById('teacherPassword').value = '';
    loadTeachersList();
  } catch (err) {
    console.error(err);
    if (err.code === 'auth/email-already-in-use') {
      errorDiv.textContent = 'Emel sudah digunakan.';
    } else {
      errorDiv.textContent = 'Ralat: ' + err.message;
    }
  }
}

async function loadTeachersList() {
  const q = query(collection(db, 'users'), where('role', '==', 'guru'));
  const querySnapshot = await getDocs(q);
  const tbody = document.querySelector('#teachersTable tbody');
  tbody.innerHTML = '';

  querySnapshot.forEach(doc => {
    const data = doc.data();
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${data.name}</td>
      <td>${data.email}</td>
      <td>
        <button class="btn btn-delete" data-uid="${doc.id}" data-userid="${data.uid}">Padam</button>
      </td>
    `;
  });

  // Tambah event listener untuk padam
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const docId = e.target.dataset.uid;
      const userId = e.target.dataset.userid;
      deleteTeacher(docId, userId);
    });
  });
}

async function deleteTeacher(docId, userId) {
  if (!confirm('Padam guru ini? Tindakan tidak boleh asingkan.')) return;

  try {
    // Padam dari Firestore
    await deleteDoc(doc(db, 'users', docId));
    // Padam akaun Firebase (perlu akses admin — tapi kita tak boleh dari client!)
    // Oleh itu, kita biarkan akaun wujud tetapi tiada akses (role dihapus)
    // Atau: tandakan sebagai "disabled"
    
    alert('Guru dipadam (dari senarai).');
    loadTeachersList();
  } catch (err) {
    alert('Gagal memadam: ' + err.message);
  }
}