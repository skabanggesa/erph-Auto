// assets/js/admin/teachers.js

import { auth, db, firebaseConfig } from '../config.js'; 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    doc, setDoc, collection, getDocs, query, where, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Memaparkan halaman pengurusan guru
 */
export async function loadTeachersPage() {
    const adminContent = document.getElementById('adminContent');
    adminContent.innerHTML = `
        <div class="admin-section">
            <h2>Daftar Guru Baru</h2>
            <div class="form-group">
                <label>Nama Penuh</label>
                <input type="text" id="teacherName" class="form-control" placeholder="Nama Guru" />
            </div>
            <div class="form-group">
                <label>Emel</label>
                <input type="email" id="teacherEmail" class="form-control" placeholder="emel@guru.com" />
            </div>
            <div class="form-group">
                <label>Kata Laluan</label>
                <input type="password" id="teacherPassword" class="form-control" placeholder="Min 6 aksara" />
            </div>
            <div class="admin-buttons">
                <button id="btnRegisterTeacher" class="btn btn-primary">Daftar Guru</button>
            </div>
            <div id="teacherError" class="status-message" style="margin-top:10px;"></div>

            <h3 style="margin-top: 30px;">Senarai Guru Berdaftar</h3>
            <div class="table-container">
                <table id="teachersTable">
                    <thead>
                        <tr><th>Nama</th><th>Emel</th><th>Status</th><th>Tindakan</th></tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="4">Memuatkan data...</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="statusUpdate" class="status-message"></div>
        </div>
    `;

    document.getElementById('btnRegisterTeacher').addEventListener('click', registerTeacher);
    await loadTeachersList();
}

/**
 * Fungsi mendaftar guru tanpa melog keluar Admin
 */
async function registerTeacher() {
    const name = document.getElementById('teacherName').value.trim();
    const email = document.getElementById('teacherEmail').value.trim();
    const password = document.getElementById('teacherPassword').value;
    const errorDiv = document.getElementById('teacherError');

    if (!name || !email || !password) {
        errorDiv.style.color = "red";
        errorDiv.textContent = 'Sila isi semua medan.';
        return;
    }

    // Wujudkan konteks kedua untuk pendaftaran
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryContext");
    const secondaryAuth = getAuth(secondaryApp);

    try {
        errorDiv.style.color = "blue";
        errorDiv.textContent = 'Sedang mendaftar ke Authentication & Firestore...';

        // 1. Cipta akaun di Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newTeacher = userCredential.user;

        // 2. Simpan ke koleksi 'users' menggunakan 'db' utama (Admin)
        // Ini memastikan 'role' guru dimasukkan dengan betul
        await setDoc(doc(db, 'users', newTeacher.uid), {
            uid: newTeacher.uid,
            name: name,
            email: email,
            role: 'guru',      // KRITIKAL: Pastikan huruf kecil
            status: 'active',
            createdAt: new Date()
        });

        // 3. Log keluar akaun guru dari konteks kedua dan tutup app tersebut
        await signOut(secondaryAuth);
        await secondaryApp.delete();

        errorDiv.style.color = "green";
        errorDiv.textContent = 'Berjaya! Guru didaftarkan dan data Firestore dicipta.';

        // Reset form
        document.getElementById('teacherName').value = '';
        document.getElementById('teacherEmail').value = '';
        document.getElementById('teacherPassword').value = '';

        await loadTeachersList();

    } catch (err) {
        console.error("Ralat:", err);
        errorDiv.style.color = "red";
        errorDiv.textContent = "Ralat: " + err.message;
        
        // Pastikan secondary app ditutup jika gagal
        if (secondaryApp) await secondaryApp.delete();
    }
}

/**
 * Memaparkan senarai guru dari koleksi 'users'
 */
async function loadTeachersList() {
    const tbody = document.querySelector('#teachersTable tbody');
    try {
        const q = query(collection(db, 'users'), where('role', '==', 'guru'));
        const querySnapshot = await getDocs(q);
        
        let htmlRows = '';
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const isDiasabled = data.status === 'disabled';
            
            htmlRows += `
                <tr>
                    <td>${data.name || 'Tiada Nama'}</td>
                    <td>${data.email}</td>
                    <td style="color: ${isDiasabled ? 'red' : 'green'}; font-weight:bold;">
                        ${isDiasabled ? 'Nyahaktif' : 'Aktif'}
                    </td>
                    <td>
                        <button class="btn ${isDiasabled ? 'btn-primary' : 'btn-delete'}" 
                                onclick="toggleTeacherStatus('${docSnap.id}', '${data.status}')">
                            ${isDiasabled ? 'Aktifkan' : 'Nyahaktif'}
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = htmlRows || '<tr><td colspan="4">Tiada guru ditemui.</td></tr>';
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4">Ralat: ${err.message}</td></tr>`;
    }
}

// Jadikan fungsi ini global untuk dipanggil dari HTML string
window.toggleTeacherStatus = async (docId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if (!confirm(`Tukar status guru kepada ${newStatus}?`)) return;

    try {
        await updateDoc(doc(db, 'users', docId), { status: newStatus });
        loadTeachersList();
    } catch (err) {
        alert("Gagal: " + err.message);
    }
};
