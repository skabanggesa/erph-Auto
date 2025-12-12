// assets/js/admin/review.js (KOD LENGKAP & DIKEMASKINI)

import { auth, db } from '../config.js';
import { 
  doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Import loadRphListPage supaya boleh kembali ke senarai
import { loadRphListPage } from './rph-list.js'; 

let currentRphId = null;

export async function loadReviewPage(rphId) {
  const content = document.getElementById('adminContent');
  currentRphId = rphId;

  // 🔑 KRITIKAL: Semakan awal untuk mengelak ralat 'indexOf'
  if (!rphId || typeof rphId !== 'string') {
      content.innerHTML = '<p class="error">Ralat: ID RPH tidak sah. Sila kembali ke senarai.</p>';
      return;
  }
  
  content.innerHTML = '<p>Memuatkan RPH...</p>';

  try {
    // Baris ini akan berfungsi kerana rphId telah disahkan
    const docSnap = await getDoc(doc(db, 'rph', rphId)); 
    if (!docSnap.exists()) {
      content.innerHTML = '<p>RPH tidak dijumpai.</p>';
      return;
    }

    const rph = docSnap.data();
    const tarikh = rph.tarikh.toDate ? rph.tarikh.toDate().toLocaleDateString('ms-MY') : '–';
    
    // Asumsi: Guru telah menyimpan data 'matapelajaran' dan 'kelas' dalam RPH
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
            <p><strong>Tarikh:</strong> ${tarikh}</p>
            <p><strong>Status Semasa:</strong> ${statusDisplay}</p>
            <hr>
            <h3>Isi RPH</h3>
            <div style="background:#f9f9f9; padding:15px; border-radius:5px; margin:10px 0;">
                <h4>Sasaran Pembelajaran</h4>
                <p><strong>Fokus:</strong> ${rph.fokus || '–'}</p>
                <p><strong>Standard Kandungan:</strong> ${rph.standardKandungan || '–'}</p>
                <p><strong>Standard Pembelajaran:</strong> ${rph.standardPembelajaran || '–'}</p>
                <h4>Aktiviti & Refleksi</h4>
                <p><strong>Aktiviti:</strong> ${rph.aktiviti || '–'}</p>
                <p><strong>Refleksi:</strong> ${rph.refleksi || '–'}</p>
            </div>
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

    // Muatkan nama guru secara berasingan
    // KRITIKAL: Menggunakan rph.uid, bukan rph.userId
    const teacherSnap = await getDoc(doc(db, 'users', rph.uid)); 
    if (teacherSnap.exists()) {
      document.getElementById('guruNamePlaceholder').textContent = teacherSnap.data().name;
    } else {
      document.getElementById('guruNamePlaceholder').textContent = 'Nama Guru Tidak Diketahui';
    }

    // Pasang Event Listeners
    document.getElementById('btnBack').addEventListener('click', () => {
      loadRphListPage(); // Guna import function
    });
    
    if (document.getElementById('btnApprove')) {
        document.getElementById('btnApprove').addEventListener('click', () => updateRphStatus('approved'));
    }

    if (document.getElementById('btnReject')) {
        document.getElementById('btnReject').addEventListener('click', () => updateRphStatus('rejected'));
    }

  } catch (e) {
    console.error("Ralat memuatkan RPH untuk semakan:", e);
    content.innerHTML = `<p class="error">Gagal memuatkan RPH: ${e.message}</p>`;
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
            reviewerComment: comment 
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
