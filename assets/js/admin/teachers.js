// assets/js/admin/teachers.js (VERSI KEMASKINI DENGAN TUKAR ROLE)

import { auth, db, firebaseConfig } from '../config.js'; 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    doc, setDoc, collection, getDocs, query, where, updateDoc, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Memaparkan halaman pengurusan guru & pengguna
 */
export async function loadTeachersPage() {
    const adminContent = document.getElementById('adminContent');
    adminContent.innerHTML = `
        <div class="admin-section">
            <h2>1. Daftar Guru/Staf Baru</h2>
            <p style="font-size: 0.9rem; color: #666;">Gunakan borang ini untuk mendaftar akaun baru ke dalam sistem.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 30px;">
                <div class="form-group">
                    <label>Nama Penuh</label>
                    <input type="text" id="teacherName" class="form-control" placeholder="Contoh: AHMAD BIN ALI" />
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
                    <button id="btnRegisterTeacher" class="btn btn-primary">Daftar Pengguna</button>
                </div>
                <div id="teacherError" class="status-message" style="margin-top:10px;"></div>
            </div>

            <hr>

            <h2 style="margin-top: 30px;">2. Senarai & Pengurusan Peranan (Role)</h2>
            <p style="font-size: 0.9rem; color: #666;">Kemaskini peranan (PK/Guru) dan status aktif akaun di sini.</p>
            
            <div id="statusUpdate" class="status-message" style="margin-bottom: 10px; font-weight: bold;"></div>

            <div class="table-container">
                <table id="teachersTable">
                    <thead>
                        <tr>
                            <th>Nama & Emel</th>
                            <th>Peranan (Role)</th>
                            <th>Status</th>
                            <th>Tindakan</th>
                        </tr>
                    </thead>
                    <tbody id="userTableBody">
                        <tr><td colspan="4">Memuatkan data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('btnRegisterTeacher').addEventListener('click', registerTeacher);
    await loadTeachersList();
}

/**
 * Fungsi mendaftar guru tanpa melog keluar Admin (Guna Secondary Context)
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

    const secondaryApp = initializeApp(firebaseConfig, "SecondaryContext");
    const secondaryAuth = getAuth(secondaryApp);

    try {
        errorDiv.style.color = "blue";
        errorDiv.textContent = 'Sedang mendaftar...';

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newTeacher = userCredential.user;

        await setDoc(doc(db, 'users', newTeacher.uid), {
            uid: newTeacher.uid,
            name: name.toUpperCase(),
            email: email,
            role: 'guru', 
            status: 'active',
            createdAt: new Date()
        });

        await signOut(secondaryAuth);
        await secondaryApp.delete();

        errorDiv.style.color = "green";
        errorDiv.textContent = 'Berjaya didaftarkan!';

        document.getElementById('teacherName').value = '';
        document.getElementById('teacherEmail').value = '';
        document.getElementById('teacherPassword').value = '';

        await loadTeachersList();

    } catch (err) {
        console.error("Ralat:", err);
        errorDiv.style.color = "red";
        errorDiv.textContent = "Ralat: " + err.message;
        if (secondaryApp) await secondaryApp.delete();
    }
}

/**
 * Memaparkan senarai semua staf dan membolehkan pertukaran Role
 */
async function loadTeachersList() {
    const tbody = document.getElementById('userTableBody');
    try {
        // Ambil semua pengguna, susun mengikut nama
        const q = query(collection(db, 'users'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        
        let htmlRows = '';
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const uid = docSnap.id;
            const isActive = data.status === 'active';
            
            htmlRows += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td>
                        <div style="font-weight:bold;">${data.name || 'Tiada Nama'}</div>
                        <div style="font-size:0.8rem; color:#666;">${data.email}</div>
                    </td>
                    <td>
                        <select class="role-select" onchange="updateUserRole('${uid}', this.value)" style="padding:5px; border-radius:4px;">
                            <option value="guru" ${data.role === 'guru' ? 'selected' : ''}>Guru Biasa</option>
                            <option value="PK1" ${data.role === 'PK1' ? 'selected' : ''}>PK Pentadbiran</option>
                            <option value="PKHEM" ${data.role === 'PKHEM' ? 'selected' : ''}>PK HEM</option>
                            <option value="PKKK" ${data.role === 'PKKK' ? 'selected' : ''}>PK Kokurikulum</option>
                            <option value="admin" ${data.role === 'admin' ? 'selected' : ''}>Admin Utama</option>
                        </select>
                    </td>
                    <td style="color: ${isActive ? 'green' : 'red'}; font-weight:bold;">
                        ${isActive ? 'AKTIF' : 'NYAHAKTIF'}
                    </td>
                    <td>
                        <button class="btn ${isActive ? 'btn-delete' : 'btn-primary'}" 
                                onclick="toggleTeacherStatus('${uid}', '${data.status}')"
                                style="font-size: 0.75rem; padding: 5px 10px;">
                            ${isActive ? 'Nyahaktifkan' : 'Aktifkan'}
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = htmlRows || '<tr><td colspan="4">Tiada pengguna ditemui.</td></tr>';
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:red;">Ralat memuatkan senarai: ${err.message}</td></tr>`;
    }
}

/**
 * Fungsi Global untuk tukar Role (Dipanggil dari Dropdown)
 */
window.updateUserRole = async (uid, newRole) => {
    const statusUpdate = document.getElementById('statusUpdate');
    
    try {
        statusUpdate.style.color = "blue";
        statusUpdate.textContent = "Mengemaskini peranan...";
        
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { role: newRole });
        
        statusUpdate.style.color = "green";
        statusUpdate.textContent = "✅ Peranan berjaya dikemaskini!";
        
        setTimeout(() => { statusUpdate.textContent = ""; }, 3000);
    } catch (err) {
        console.error(err);
        alert("Gagal menukar peranan: " + err.message);
    }
};

/**
 * Fungsi Global untuk tukar Status (Aktif/Nyahaktif)
 */
window.toggleTeacherStatus = async (uid, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if (!confirm(`Tukar status pengguna ini kepada ${newStatus.toUpperCase()}?`)) return;

    try {
        await updateDoc(doc(db, 'users', uid), { status: newStatus });
        loadTeachersList();
    } catch (err) {
        alert("Gagal mengemaskini status: " + err.message);
    }
};
