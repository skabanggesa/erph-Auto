// jadual-editor.js (KOD LENGKAP & DIKEMASKINI: Paparan Grid)

import { auth, db } from '../config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const HARI = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"];
let currentJadual = []; // Simpan state jadual semasa (Array of session objects)
let editingIndex = -1;  // -1 untuk menambah, >= 0 untuk mengedit sesi sedia ada

export async function loadJadualEditor() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="guru-section">
            <h2>Urus Jadual Waktu Mingguan</h2>
            <button class="btn btn-secondary" onclick="router.navigate('home')" style="margin-bottom: 20px;">Kembali ke Dashboard</button>
            
            <div id="jadualGridContainer">
                <p>Memuatkan jadual semasa...</p>
            </div>
            
            <div id="editorFormContainer" style="margin-top: 20px;">
                <button id="addSessionBtn" class="btn btn-primary">+ Tambah Sesi Baru</button>
                <div id="sessionEditor" class="session-editor" style="display:none;"></div>
            </div>

            <div id="editorStatus" style="margin-top: 15px;"></div>
        </div>
    `;

    document.getElementById('addSessionBtn').addEventListener('click', () => renderEditorForm());

    // Jadikan fungsi global supaya boleh dicetuskan oleh sel jadual yang dijana secara dinamik
    window.editSession = editSession;
    window.deleteSession = deleteSession;
    window.saveSession = saveSession;
    window.cancelEdit = cancelEdit;
    
    // Sesi baru akan dimuatkan dan dipaparkan dalam format grid
    await fetchAndDisplayJadual();
}

// ----------------------------------------------------------------------
// Fungsi Pemuatan Data dari Firestore
// ----------------------------------------------------------------------

async function fetchAndDisplayJadual() {
    const user = auth.currentUser;
    const gridDiv = document.getElementById('jadualGridContainer');
    
    if (!user) {
        gridDiv.innerHTML = '<p class="error">Sila log masuk untuk mengurus jadual.</p>';
        return;
    }

    const jadualRef = doc(db, 'jadual', user.uid);
    try {
        const jadualSnap = await getDoc(jadualRef);
        
        if (jadualSnap.exists()) {
            currentJadual = jadualSnap.data().senarai || []; 
        } else {
            currentJadual = []; 
        }

        renderJadualGrid(currentJadual);

    } catch (e) {
        console.error("Ralat memuatkan jadual:", e);
        document.getElementById('editorStatus').innerHTML = '<p class="error">Gagal memuatkan jadual. Sila cuba lagi.</p>';
    }
}

// ----------------------------------------------------------------------
// Logik Reorganisasi Data & Render Grid
// ----------------------------------------------------------------------

function formatJadualData(senaraiSesi) {
    const jadualGrid = {};
    const masaUnik = new Set(); 

    // 1. Kumpulkan sesi mengikut Hari dan Masa
    senaraiSesi.forEach((sesi, index) => {
        if (!jadualGrid[sesi.hari]) {
            jadualGrid[sesi.hari] = {};
        }
        // Simpan sesi dan indexnya
        jadualGrid[sesi.hari][sesi.masaMula] = { sesi: sesi, index: index };
        masaUnik.add(sesi.masaMula);
    });

    // 2. Susun masa secara kronologi untuk baris
    const masaSesiTersusun = Array.from(masaSesiTersusun).sort();

    return { jadualGrid, masaSesiTersusun };
}

function renderJadualGrid(jadualArray) {
    const gridDiv = document.getElementById('jadualGridContainer');
    
    if (jadualArray.length === 0) {
        gridDiv.innerHTML = '<p>Anda belum mempunyai sesi pengajaran. Sila tambah sesi baru.</p>';
        return;
    }

    const { jadualGrid, masaSesiTersusun } = formatJadualData(jadualArray);

    let html = `
        <p>Klik pada sesi di bawah untuk mengedit atau memadam. Setelah selesai, klik "Simpan Semua Perubahan".</p>
        <table class="timetable-grid">
            <thead>
                <tr>
                    <th>Masa Mula</th>
                    ${HARI.map(hari => `<th>${hari}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    // Bina Baris
    masaSesiTersusun.forEach((masa) => {
        html += `<tr><td class="time-cell">${masa}</td>`;
        
        // Bina Sel untuk setiap Hari
        HARI.forEach(hari => {
            const entry = jadualGrid[hari] ? jadualGrid[hari][masa] : null;

            if (entry) {
                // Sesi Wujud: Paparkan data lengkap mengikut format permintaan pengguna
                const sesi = entry.sesi;
                html += `
                    <td class="session-cell filled" 
                        data-index="${entry.index}"
                        onclick="editSession(${entry.index})">
                        <span class="subject">${sesi.matapelajaran}</span>
                        <span class="class">${sesi.kelas}</span>
                        <span class="time">${sesi.masaMula} - ${sesi.masaTamat}</span>
                    </td>
                `;
            } else {
                // Sesi Tidak Wujud: Sel kosong
                html += `<td class="session-cell empty"></td>`;
            }
        });

        html += `</tr>`;
    });

    html += `
            </tbody>
        </table>
        <button id="saveAllBtn" class="btn btn-primary" style="margin-top: 20px; margin-right: 10px;">Simpan Semua Perubahan</button>
        <button id="cancelAllBtn" class="btn btn-secondary" style="margin-top: 20px;">Batal</button>
    `;

    gridDiv.innerHTML = html;
    
    document.getElementById('saveAllBtn').addEventListener('click', saveJadual);
    // Batal akan memuat semula data asal dari Firestore
    document.getElementById('cancelAllBtn').addEventListener('click', fetchAndDisplayJadual);
}

// ----------------------------------------------------------------------
// Logik Editor Sesi (Borang)
// ----------------------------------------------------------------------

function renderEditorForm(sesi = null, index = -1) {
    editingIndex = index;
    const editorDiv = document.getElementById('sessionEditor');
    document.getElementById('addSessionBtn').style.display = 'none';
    editorDiv.style.display = 'block';

    const defaultSesi = sesi || {
        hari: HARI[0], masaMula: "08:00", masaTamat: "09:00", matapelajaran: "", kelas: ""
    };

    editorDiv.innerHTML = `
        <hr>
        <h4>${sesi ? 'Edit Sesi' : 'Tambah Sesi Baru'}</h4>
        <div class="form-group">
            <label>Hari:</label>
            <select id="editorHari">
                ${HARI.map(h => `<option value="${h}" ${defaultSesi.hari === h ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Masa Mula:</label>
            <input type="time" id="editorMasaMula" value="${defaultSesi.masaMula}" required>
        </div>
        <div class="form-group">
            <label>Masa Tamat:</label>
            <input type="time" id="editorMasaTamat" value="${defaultSesi.masaTamat}" required>
        </div>
        <div class="form-group">
            <label>Mata Pelajaran:</label>
            <input type="text" id="editorMatapelajaran" value="${defaultSesi.matapelajaran}" required>
        </div>
        <div class="form-group">
            <label>Kelas:</label>
            <input type="text" id="editorKelas" value="${defaultSesi.kelas}" required>
        </div>
        
        <button class="btn btn-success" onclick="saveSession()">Simpan Sesi</button>
        ${index !== -1 ? `<button class="btn btn-danger" onclick="deleteSession(${index}, true)">Padam Sesi Ini</button>` : ''}
        <button class="btn btn-secondary" onclick="cancelEdit()">Batal</button>
    `;
}

function cancelEdit() {
    document.getElementById('sessionEditor').style.display = 'none';
    document.getElementById('addSessionBtn').style.display = 'block';
    editingIndex = -1;
    document.getElementById('editorStatus').innerHTML = '';
}

function editSession(index) {
    renderEditorForm(currentJadual[index], index);
}

// ----------------------------------------------------------------------
// Logik Manipulasi Data (CRUD pada Array)
// ----------------------------------------------------------------------

function saveSession() {
    const statusDiv = document.getElementById('editorStatus');
    statusDiv.textContent = '';

    const newSesi = {
        hari: document.getElementById('editorHari').value,
        masaMula: document.getElementById('editorMasaMula').value,
        masaTamat: document.getElementById('editorMasaTamat').value,
        matapelajaran: document.getElementById('editorMatapelajaran').value.trim(),
        kelas: document.getElementById('editorKelas').value.trim(),
    };

    // Semakan validasi
    if (!newSesi.hari || !newSesi.masaMula || !newSesi.masaTamat || !newSesi.matapelajaran || !newSesi.kelas) {
        statusDiv.innerHTML = '<p class="error">Sila isi semua medan sesi.</p>';
        return;
    }
    
    // Semakan Konflik: Hari & Masa Mula yang sama
    const conflictIndex = currentJadual.findIndex((sesi, idx) => 
        idx !== editingIndex && 
        sesi.hari === newSesi.hari && 
        sesi.masaMula === newSesi.masaMula
    );

    if (conflictIndex !== -1) {
        statusDiv.innerHTML = '<p class="error">Ralat: Sudah ada sesi pada hari dan masa mula yang sama. Sila pilih masa mula yang berbeza.</p>';
        return;
    }

    if (editingIndex === -1) {
        // Tambah Sesi Baru
        currentJadual.push(newSesi);
    } else {
        // Edit Sesi Sedia Ada
        currentJadual[editingIndex] = newSesi;
    }

    statusDiv.innerHTML = '<p class="success">Sesi berjaya dikemas kini dalam draf tempatan. Sila klik "Simpan Semua Perubahan" untuk menyimpan ke Firebase.</p>';
    
    // Tutup borang dan muat semula grid
    cancelEdit();
    renderJadualGrid(currentJadual);
}

function deleteSession(indexToRemove, fromEditor = false) {
    if (confirm('Anda pasti mahu membuang sesi ini?')) {
        currentJadual.splice(indexToRemove, 1);
        
        document.getElementById('editorStatus').innerHTML = '<p class="success">Sesi berjaya dibuang dari draf tempatan. Sila klik "Simpan Semua Perubahan" untuk menyimpan ke Firebase.</p>';
        
        // Tutup borang dan muat semula grid
        if (fromEditor) {
            cancelEdit();
        }
        renderJadualGrid(currentJadual);
    }
}

// ----------------------------------------------------------------------
// Fungsi Penyimpanan ke Firestore
// ----------------------------------------------------------------------

async function saveJadual() {
    const user = auth.currentUser;
    const statusDiv = document.getElementById('editorStatus');
    statusDiv.innerHTML = '<p>Menyimpan perubahan ke Firebase...</p>';

    if (!user) {
        statusDiv.innerHTML = '<p class="error">Pengguna tidak log masuk.</p>';
        return;
    }

    // Semak Konflik sekali lagi sebelum simpanan akhir (terutamanya masa mula yang sama)
    const masaMulaMap = {};
    let hasConflict = false;
    currentJadual.forEach(sesi => {
        const key = `${sesi.hari}-${sesi.masaMula}`;
        if (masaMulaMap[key]) {
            hasConflict = true;
        }
        masaMulaMap[key] = true;
    });

    if (hasConflict) {
        statusDiv.innerHTML = '<p class="error">Gagal menyimpan: Terdapat konflik masa mula/hari yang sama dalam jadual. Sila betulkan.</p>';
        return;
    }

    const jadualRef = doc(db, 'jadual', user.uid);
    try {
        await setDoc(jadualRef, { senarai: currentJadual });
        
        statusDiv.innerHTML = '<p class="success">Jadual waktu berjaya disimpan ke Firebase!</p>';
        
        cancelEdit();
        setTimeout(() => fetchAndDisplayJadual(), 1500); 

    } catch (e) {
        console.error("Ralat menyimpan jadual:", e);
        statusDiv.innerHTML = '<p class="error">Gagal menyimpan perubahan. Ralat: ' + e.message + '</p>';
    }
}
