// assets/js/admin/review.js (KOD LENGKAP & PEMBETULAN STRUKTUR DATA)

import { auth, db } from '../config.js';
import { 
  doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Import loadRphListPage supaya boleh kembali ke senarai
// *** Pastikan fail rph-list.js wujud dan fungsi loadRphListPage() dieksport ***
import { loadRphListPage } from './rph-list.js'; 

let currentRphId = null;

// Fungsi pembantu KRITIKAL untuk memaparkan data (string, array, atau kosong)
function renderData(data) {
    if (!data) return '–';
    
    let items = [];

    // Jika data adalah array (contoh: standards)
    if (Array.isArray(data)) {
        items = data;
    } 
    // Jika data adalah string (contoh: activities, objectives)
    else if (typeof data === 'string') {
        // Cuba pecahkan string berdasarkan koma atau baris baru
        let parts = data.split(/[\n,]/).map(s => s.trim()).filter(s => s.length > 0);
        
        if (parts.length > 1) {
             // Jika terdapat pemisah yang ditemui, gunakan senarai
             items = parts;
        } else {
             // Jika tiada pemisah (atau hanya satu item), pulangkan sebagai string biasa
             return String(data).trim() || '–';
        }
    } 
    else {
        return String(data).trim() || '–';
    }

    if (items.length === 0) return '–';
    
    // Paparkan item dalam senarai tidak berturutan
    return `<ul style="margin: 0; padding-left: 20px;">${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
}


export async function loadReviewPage(rphId) {
  const content = document.getElementById('adminContent');
  currentRphId = rphId; // Simpan ID RPH untuk fungsi update

  if (!rphId) {
    content.innerHTML = '<p class="error">Ralat: ID RPH tidak sah.</p>';
    return;
  }

  content.innerHTML = '<p>Memuatkan RPH...</p>';

  try {
    const docSnap = await getDoc(doc(db, 'rph', rphId));
    if (!docSnap.exists()) {
      content.innerHTML = '<p>RPH tidak dijumpai.</p>';
      return;
    }

    const rph = docSnap.data();
    const tarikh = rph.tarikh.toDate ? rph.tarikh.toDate().toLocaleDateString('ms-MY') : '–';
    
    // AKSES DATA RPH: Guna rph.dataRPH.medan_sebenar
    const dataRPH = rph.dataRPH || {}; 

    // Logik paparan status
    let statusDisplay = '';
    switch (rph.status) {
        case 'submitted':
            statusDisplay = '<span style="color: blue;">MENUNGGU SEMAKAN</span>';
            break;
        case 'approved':
            statusDisplay = '<span style="color: green; font-weight: bold;">LULUS</span>';
            break;
        case 'rejected':
            statusDisplay = `<span style="color: red; font-weight: bold;">DITOLAK</span> <br> <em>Komen: ${rph.reviewerComment || 'Tiada komen'}</em>`;
            break;
        case 'draft':
            statusDisplay = 'DRAF';
            break;
        default:
            statusDisplay = rph.status.toUpperCase();
    }


    content.innerHTML = `
      <div class="admin-section">
        <h2>Semak RPH</h2>
        <div id="rphDetails">
            <p><strong>Guru:</strong> <span id="guruNamePlaceholder">Memuatkan...</span></p>
            <p><strong>Kelas:</strong> ${rph.kelas || '–'}</p>
            <p><strong>Mata Pelajaran:</strong> ${rph.matapelajaran || '–'}</p>
            <p><strong>Topik:</strong> ${dataRPH.topic_name || '–'}</p>
            <p><strong>Tarikh:</strong> ${tarikh}</p>
            <p><strong>Status Semasa:</strong> ${statusDisplay}</p>
            <hr>
            <h3>Isi RPH</h3>
            <div style="background:#f9f9f9; padding:15px; border-radius:5px; margin:10px 0;">
                
                <h4>1. Sasaran Pembelajaran (Objectives & Skills)</h4>
                <p><strong>Objektif:</strong> ${renderData(dataRPH.objectives)}</p>
                <p><strong>Standard:</strong> ${renderData(dataRPH.standards)}</p>
                <p><strong>Nama Kemahiran:</strong> ${renderData(dataRPH.skill_name)}</p>
                
                <h4>2. Kandungan & Aktiviti</h4>
                <p><strong>Aktiviti P&P:</strong> ${renderData(dataRPH.activities)}</p>
                <p><strong>Bahan Bantu Mengajar (BBM):</strong> ${renderData(dataRPH.aids)}</p>

                <h4>3. Penilaian & Refleksi</h4>
                <p><strong>Penilaian:</strong> ${renderData(dataRPH.assessments)}</p>
                <p><strong>Refleksi:</strong> ${renderData(rph.refleksi)}</p> 
            </div>
            
            <p style="margin-top: 15px;">Masa Sesi: ${rph.masaMula || '–'} - ${rph.masaTamat || '–'}</p>
        </div>
        
        <div id="reviewActions" style="margin-top: 20px;">
            <div class="form-group">
                <label>Komen Pentadbir (Pilihan)</label>
                <textarea id="adminComment" rows="3" style="width:100%; padding:8px;" placeholder="Masukkan komen penolakan di sini, jika ada.">${rph.reviewerComment || ''}</textarea>
            </div>
            ${(rph.status === 'submitted' || rph.status === 'rejected') ? `
                <button id="btnApprove" class="btn btn-success" style="margin-right: 10px;">Luluskan</button>
                <button id="btnReject" class="btn btn-danger" style="margin-right: 10px;">Tolak</button>
            ` : `<p>RPH ini telah ${rph.status.toUpperCase()}.</p>`}
            <button id="btnBack" class="btn btn-secondary">Kembali ke Senarai</button>
        </div>
        <div id="reviewStatusMessage" style="margin-top: 15px;"></div>
      </div>
    `;

    // Muatkan nama guru
    const teacherSnap = await getDoc(doc(db, 'users', rph.uid)); // Guna rph.uid, bukan rph.userId
    if (teacherSnap.exists()) {
      document.getElementById('guruNamePlaceholder').textContent = teacherSnap.data().name;
    } else {
      document.getElementById('guruNamePlaceholder').textContent = 'Nama Guru Tidak Diketahui';
    }

    // Pasang Event Listeners
    document.getElementById('btnBack').addEventListener('click', () => {
      loadRphListPage(); 
    });
    
    if (document.getElementById('btnApprove')) {
        document.getElementById('btnApprove').addEventListener('click', () => updateRphStatus('approved'));
    }

    if (document.getElementById('btnReject')) {
        document.getElementById('btnReject').addEventListener('click', () => updateRphStatus('rejected'));
    }

  } catch (err) {
    console.error("Ralat memuatkan RPH untuk semakan:", err);
    content.innerHTML = `<p class="error">Gagal memuatkan RPH: ${err.message}</p>`;
  }
}


/**
 * Mengemaskini status RPH.
 * @param {string} newStatus - Status baharu ('approved' atau 'rejected').
 */
async function updateRphStatus(newStatus) {
    if (!currentRphId || !auth.currentUser) return;

    const comment = document.getElementById('adminComment').value;
    const statusDiv = document.getElementById('reviewStatusMessage');
    statusDiv.innerHTML = '<p>Mengemaskini status...</p>';

    const rphRef = doc(db, 'rph', currentRphId);
    try {
        await updateDoc(rphRef, {
            status: newStatus,
            reviewDate: new Date(),
            reviewerUid: auth.currentUser.uid,
            reviewerComment: comment // Simpan komen Admin
        });

        statusDiv.innerHTML = `<p class="success">Status RPH berjaya dikemaskini kepada: ${newStatus.toUpperCase()}</p>`;
        
        // Muat semula senarai semakan selepas kemaskini
        setTimeout(() => {
            loadRphListPage(); 
        }, 1000);

    } catch (e) {
        console.error("Gagal mengemaskini status RPH:", e);
        statusDiv.innerHTML = `<p class="error">Gagal mengemaskini status: ${e.message}</p>`;
    }
}
