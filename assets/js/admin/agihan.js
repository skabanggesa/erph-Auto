// assets/js/admin/agihan.js

import { db } from '../config.js';
import { 
    collection, getDocs, query, where, doc, setDoc, getDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Fungsi utama untuk memuatkan halaman Agihan Guru
 */
export async function loadAgihanPage() {
    const content = document.getElementById('adminContent');
    
    content.innerHTML = `
        <div class="admin-section">
            <h2>Pengurusan Agihan Guru (Distributor)</h2>
            <p>Sila pilih Penolong Kanan dan tandakan guru di bawah seliaan mereka.</p>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 25px; border-top: 4px solid #007bff;">
                <div style="margin-bottom: 15px;">
                    <label style="font-weight: bold; display: block; margin-bottom: 8px;">1. Pilih Penolong Kanan (Penyemak):</label>
                    <select id="reviewerSelect" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ccc;">
                        <option value="">-- Sila Pilih PK --</option>
                    </select>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="font-weight: bold; display: block; margin-bottom: 8px;">2. Pilih Guru di bawah seliaan:</label>
                    <div id="teacherCheckboxList" style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; padding: 10px; border-radius: 4px; background: #f9f9f9;">
                        <p style="color: #888;">Memuatkan senarai guru...</p>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; align-items: center;">
                    <button id="btnSaveAgihan" class="btn-primary" style="padding: 10px 25px;">Simpan Agihan</button>
                    <span id="agihanStatus" style="font-weight: bold;"></span>
                </div>
            </div>

            <div id="currentAssignments">
                <h3>Senarai Agihan Semasa</h3>
                <div id="assignmentList" class="table-container">
                    <p>Memuatkan senarai agihan...</p>
                </div>
            </div>
        </div>
    `;

    // Jalankan proses inisialisasi
    await initializeAgihan();
}

/**
 * Mengambil data dari Firestore dan mengisi UI
 */
async function initializeAgihan() {
    try {
        const reviewerSelect = document.getElementById('reviewerSelect');
        const teacherListDiv = document.getElementById('teacherCheckboxList');

        // 1. Ambil semua Penolong Kanan (PK1, PKHEM, PKKK)
        const pkQuery = query(collection(db, 'users'), where('role', 'in', ['PK1', 'PKHEM', 'PKKK', 'admin']));
        const pkSnap = await getDocs(pkQuery);
        
        pkSnap.forEach(docSnap => {
            const pk = docSnap.data();
            const opt = document.createElement('option');
            opt.value = docSnap.id; // UID
            opt.textContent = `${pk.name} (${pk.role})`;
            reviewerSelect.appendChild(opt);
        });

        // 2. Ambil semua Guru
        const teacherQuery = query(collection(db, 'users'), where('role', '==', 'guru'));
        const teacherSnap = await getDocs(teacherQuery);
        
        let teacherHtml = '';
        teacherSnap.forEach(docSnap => {
            const teacher = docSnap.data();
            teacherHtml += `
                <div style="padding: 5px 0; border-bottom: 1px solid #eee;">
                    <label style="cursor:pointer; display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" class="teacher-cb" value="${docSnap.id}"> 
                        ${teacher.name}
                    </label>
                </div>
            `;
        });
        teacherListDiv.innerHTML = teacherHtml || '<p>Tiada guru ditemui.</p>';

        // 3. Paparkan Agihan Sedia Ada
        await refreshAssignmentList();

        // 4. Listener apabila PK dipilih (untuk auto-tick checkbox)
        reviewerSelect.addEventListener('change', async (e) => {
            const pkUid = e.target.value;
            resetCheckboxes();
            if (pkUid) {
                const docRef = doc(db, 'distributor', pkUid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const assignedTeachers = docSnap.data().teacherUids || [];
                    document.querySelectorAll('.teacher-cb').forEach(cb => {
                        if (assignedTeachers.includes(cb.value)) cb.checked = true;
                    });
                }
            }
        });

        // 5. Listener Simpan
        document.getElementById('btnSaveAgihan').addEventListener('click', saveAgihan);

    } catch (error) {
        console.error("Ralat agihan:", error);
    }
}

/**
 * Fungsi untuk simpan data ke Firestore
 */
async function saveAgihan() {
    const pkUid = document.getElementById('reviewerSelect').value;
    const pkName = document.getElementById('reviewerSelect').selectedOptions[0].text;
    const statusMsg = document.getElementById('agihanStatus');
    
    if (!pkUid) return alert("Sila pilih Penolong Kanan terlebih dahulu.");

    const selectedTeachers = [];
    document.querySelectorAll('.teacher-cb:checked').forEach(cb => {
        selectedTeachers.push(cb.value);
    });

    statusMsg.innerHTML = "Menyimpan...";
    statusMsg.style.color = "orange";

    try {
        const docRef = doc(db, 'distributor', pkUid);
        
        if (selectedTeachers.length === 0) {
            // Jika tiada guru dipilih, padamkan rekod agihan untuk PK ini
            await deleteDoc(docRef);
            statusMsg.innerHTML = "✅ Agihan dipadamkan (Tiada guru dipilih).";
        } else {
            // Simpan/Kemaskini
            await setDoc(docRef, {
                reviewerUid: pkUid,
                reviewerName: pkName,
                teacherUids: selectedTeachers,
                updatedAt: new Date()
            });
            statusMsg.innerHTML = "✅ Agihan berjaya disimpan!";
        }

        statusMsg.style.color = "green";
        await refreshAssignmentList();

    } catch (error) {
        console.error("Ralat simpan:", error);
        statusMsg.innerHTML = "❌ Gagal simpan: " + error.message;
        statusMsg.style.color = "red";
    }
}

/**
 * Paparkan jadual siapa selia siapa
 */
async function refreshAssignmentList() {
    const listDiv = document.getElementById('assignmentList');
    const distSnap = await getDocs(collection(db, 'distributor'));
    
    // Ambil nama semua guru untuk mapping UID ke Nama
    const teachers = {};
    const userSnap = await getDocs(collection(db, 'users'));
    userSnap.forEach(d => teachers[d.id] = d.data().name);

    if (distSnap.empty) {
        listDiv.innerHTML = '<p>Tiada agihan dibuat lagi.</p>';
        return;
    }

    let html = `
        <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
            <thead style="background: #f4f4f4;">
                <tr>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Penolong Kanan (Reviewer)</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Guru di bawah Seliaan</th>
                </tr>
            </thead>
            <tbody>
    `;

    distSnap.forEach(docSnap => {
        const data = docSnap.data();
        const names = (data.teacherUids || []).map(uid => teachers[uid] || 'Guru Tidak Dikenali');
        html += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${data.reviewerName}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">
                    <ul style="margin:0; padding-left:15px;">
                        ${names.map(n => `<li>${n}</li>`).join('')}
                    </ul>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    listDiv.innerHTML = html;
}

function resetCheckboxes() {
    document.querySelectorAll('.teacher-cb').forEach(cb => cb.checked = false);
}
