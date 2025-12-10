// jadual-editor.js

import { auth, db } from '../config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const HARI = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"];
let currentJadual = []; // Simpan state jadual semasa

export async function loadJadualEditor() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="guru-section">
            <h2>Urus Jadual Waktu Mingguan</h2>
            <div id="jadualForm">
                <p>Memuatkan jadual semasa...</p>
            </div>
            <div id="editorStatus" style="margin-top: 15px;"></div>
            <button id="addSessionBtn" class="btn" style="margin-top: 20px;">+ Tambah Sesi</button>
            <button id="saveJadualBtn" class="btn btn-primary" style="margin-top: 20px;">Simpan Perubahan</button>
            <button class="btn btn-secondary" onclick="router.navigate('home')">Kembali ke Dashboard</button>
        </div>
    `;

    document.getElementById('addSessionBtn').addEventListener('click', () => addSessionToUI({
        hari: HARI[0], masaMula: "08:00", masaTamat: "09:00", matapelajaran: "", kelas: ""
    }));
    document.getElementById('saveJadualBtn').addEventListener('click', saveJadual);

    await fetchAndDisplayJadual();
}

// ----------------------------------------------------------------------
// Fungsi Pemuatan
// ----------------------------------------------------------------------

async function fetchAndDisplayJadual() {
    const user = auth.currentUser;
    const formDiv = document.getElementById('jadualForm');
    
    if (!user) {
        formDiv.innerHTML = '<p class="error">Sila log masuk untuk mengurus jadual.</p>';
        return;
    }

    const jadualRef = doc(db, 'jadual', user.uid);
    try {
        const jadualSnap = await getDoc(jadualRef);
        
        if (jadualSnap.exists()) {
            // Data sudah ada, muatkan senarai
            currentJadual = jadualSnap.data().senarai || []; 
            if (currentJadual.length === 0) {
                 formDiv.innerHTML = '<p>Anda belum mempunyai sebarang sesi. Sila tambah sesi baru.</p>';
            }
        } else {
            // Dokumen belum wujud, sediakan array kosong
            currentJadual = []; 
            formDiv.innerHTML = '<p>Dokumen jadual anda belum wujud. Sila tambah sesi pertama anda.</p>';
        }

        renderJadualUI(currentJadual);

    } catch (e) {
        console.error("Ralat memuatkan jadual:", e);
        document.getElementById('editorStatus').innerHTML = '<p class="error">Gagal memuatkan jadual. Sila cuba lagi.</p>';
    }
}

// ----------------------------------------------------------------------
// Fungsi Render UI
// ----------------------------------------------------------------------

function renderJadualUI(jadualArray) {
    const formDiv = document.getElementById('jadualForm');
    formDiv.innerHTML = ''; 

    if (jadualArray.length === 0) {
        formDiv.innerHTML = '<p>Sila klik "Tambah Sesi" untuk memulakan.</p>';
    }

    jadualArray.forEach((sesi, index) => {
        formDiv.appendChild(createSessionElement(sesi, index));
    });
}

function createSessionElement(sesi, index) {
    const div = document.createElement('div');
    div.className = 'session-entry';
    div.dataset.index = index;
    
    // HTML untuk borang editor
    div.innerHTML = `
        <hr/>
        <h4>Sesi ${index + 1}</h4>
        <div class="form-group">
            <label>Hari:</label>
            <select data-key="hari" value="${sesi.hari}">
                ${HARI.map(h => `<option value="${h}" ${sesi.hari === h ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Masa Mula:</label>
            <input type="time" data-key="masaMula" value="${sesi.masaMula}" required>
        </div>
        <div class="form-group">
            <label>Masa Tamat:</label>
            <input type="time" data-key="masaTamat" value="${sesi.masaTamat}" required>
        </div>
        <div class="form-group">
            <label>Mata Pelajaran:</label>
            <input type="text" data-key="matapelajaran" value="${sesi.matapelajaran}" required>
        </div>
        <div class="form-group">
            <label>Kelas:</label>
            <input type="text" data-key="kelas" value="${sesi.kelas}" required>
        </div>
        <button class="btn btn-danger btn-sm remove-session-btn" data-index="${index}">Buang</button>
    `;

    // Pasang Event Listeners untuk mengemas kini currentJadual apabila input berubah
    div.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', (e) => updateCurrentJadual(index, e.target.dataset.key, e.target.value));
    });

    // Event Listener untuk butang Buang
    div.querySelector('.remove-session-btn').addEventListener('click', (e) => removeSession(index));

    return div;
}

function addSessionToUI(defaultSesi) {
    currentJadual.push(defaultSesi);
    renderJadualUI(currentJadual); // Render semula keseluruhan UI
}

function updateCurrentJadual(index, key, value) {
    // Memastikan nombor disimpan sebagai nombor jika perlu, tetapi di sini semua adalah string/masa
    currentJadual[index][key] = value; 
}

function removeSession(indexToRemove) {
    if (confirm('Anda pasti mahu membuang sesi ini?')) {
        currentJadual = currentJadual.filter((_, index) => index !== indexToRemove);
        renderJadualUI(currentJadual);
    }
}

// ----------------------------------------------------------------------
// Fungsi Penyimpanan
// ----------------------------------------------------------------------

async function saveJadual() {
    const user = auth.currentUser;
    const statusDiv = document.getElementById('editorStatus');
    statusDiv.innerHTML = '<p>Menyimpan perubahan...</p>';

    if (!user) {
        statusDiv.innerHTML = '<p class="error">Pengguna tidak log masuk.</p>';
        return;
    }
    
    // Semakan Asas: Pastikan semua sesi mempunyai data penting (cth. masa mula/tamat)
    const isValid = currentJadual.every(sesi => 
        sesi.hari && sesi.masaMula && sesi.masaTamat && sesi.matapelajaran && sesi.kelas
    );
    if (!isValid) {
         statusDiv.innerHTML = '<p class="error">Ralat: Sila isi semua medan dalam setiap sesi.</p>';
         return;
    }

    // Menggunakan setDoc untuk menimpa dokumen sedia ada atau mencipta yang baru
    const jadualRef = doc(db, 'jadual', user.uid);
    try {
        await setDoc(jadualRef, { senarai: currentJadual });
        
        statusDiv.innerHTML = '<p class="success">Jadual waktu berjaya dikemas kini!</p>';
        // Reload UI untuk mengesahkan data
        setTimeout(() => fetchAndDisplayJadual(), 1000); 

    } catch (e) {
        console.error("Ralat menyimpan jadual:", e);
        statusDiv.innerHTML = '<p class="error">Gagal menyimpan perubahan. Ralat: ' + e.message + '</p>';
    }
}
