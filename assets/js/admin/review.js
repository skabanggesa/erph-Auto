// assets/js/admin/review.js (DIBETULKAN: PEMETAAN DATA FIRESTORE)

import { auth, db } from '../config.js';
import { 
  doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { loadRphListPage } from './rph-list.js'; 

let currentRphId = null;

// Fungsi pembantu untuk memaparkan data
function renderData(data) {
    if (!data) return '–';
    
    let items = [];
    if (Array.isArray(data)) {
        items = data;
    } 
    else if (typeof data === 'string') {
        let parts = data.split(/[\n,]/).map(s => s.trim()).filter(s => s.length > 0);
        if (parts.length > 1) {
             items = parts;
        } else {
             return String(data).trim() || '–';
        }
    } 
    else {
        return String(data).trim() || '–';
    }

    if (items.length === 0) return '–';
    return `<ul style="margin: 0; padding-left: 20px;">${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

export async function loadReviewPage(params) {
  const rphId = params?.id || params;
  const content = document.getElementById('adminContent');
  currentRphId = rphId; 

  if (!rphId || typeof rphId !== 'string') {
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

    // 1. PEMBETULAN TARIKH: Firestore anda simpan String, bukan Timestamp
    // Kita semak jika ia string, jika tidak baru guna toDate()
    const tarikh = (typeof rph.tarikh === 'string') ? rph.tarikh : 
                   (rph.tarikh?.toDate ? rph.tarikh.toDate().toLocaleDateString('ms-MY') : '–');
    
    // 2. PEMBETULAN STRUKTUR: Berdasarkan screenshot, data berada di root, bukan dataRPH
    // Jika anda masih mahu guna dataRPH sebagai fallback, gunakan logik di bawah
    const dataRPH = rph.dataRPH || {}; 

    // 3. PEMBETULAN STATUS
    let statusDisplay = '';
    const currentStatus = String(rph.status || 'N/A').toLowerCase(); 

    switch (currentStatus) {
        case 'submitted':
            statusDisplay = '<span style="color: blue; font-weight: bold;">MENUNGGU SEMAKAN</span>';
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
            statusDisplay = currentStatus.toUpperCase(); 
            break;
    }

    content.innerHTML = `
      <div class="admin-section">
        <h2>Semak RPH</h2>
        <div id="rphDetails">
            <p><strong>Guru:</strong> <span id="guruNamePlaceholder">Memuatkan...</span></p>
            <p><strong>Kelas:</strong> ${rph.kelas || '–'}</p>
            <p><strong>Mata Pelajaran:</strong> ${rph.matapelajaran || '–'}</p>
            
            <p><strong>Topik:</strong> ${rph.tajuk || rph.topik || '–'}</p>
            
            <p><strong>Tarikh:</strong> ${tarikh}</p>
            <p><strong>Status Semasa:</strong> ${statusDisplay}</p>
            <hr>
            <h3>Isi RPH</h3>
            <div style="background:#f9f9f9; padding:15px; border-radius:5px; margin:10px 0;">
                
                <h4>1. Sasaran Pembelajaran (Objectives & Skills)</h4>
                <p><strong>Objektif:</strong> ${renderData(rph.objektif || dataRPH.objectives)}</p>
                <p><strong>Standard:</strong> ${renderData(rph.standard || dataRPH.standards)}</p>
                <p><strong>Nama Kemahiran:</strong> ${renderData(rph.namaKemahiran || dataRPH.skill_name)}</p>
                
                <h4>2. Kandungan & Aktiviti</h4>
                <p><strong>Aktiviti P&P:</strong> ${renderData(rph.aktiviti || dataRPH.activities)}</p>
                <p><strong>Bahan Bantu Mengajar (BBM):</strong> ${renderData(rph.bbm || dataRPH.aids)}</p>

                <h4>3. Penilaian & Refleksi</h4>
                <p><strong>Penilaian:</strong> ${renderData(rph.penilaian || dataRPH.assessments)}</p>
                <p><strong>Refleksi:</strong> ${renderData(rph.refleksi)}</p> 
            </div>
            
            <p style="margin-top: 15px;">Masa Sesi: ${rph.masaMula || '–'} - ${rph.masaTamat || '–'}</p>
        </div>
        
        <div id="reviewActions" style="margin-top: 20px;">
            <div class="form-group">
                <label>Komen Pentadbir (Pilihan)</label>
                <textarea id="adminComment" rows="3" style="width:100%; padding:8px;" placeholder="Masukkan komen penolakan di sini, jika ada.">${rph.reviewerComment || ''}</textarea>
            </div>
            ${(currentStatus === 'submitted' || currentStatus === 'rejected') ? `
                <button id="btnApprove" class="btn btn-success" style="margin-right: 10px; background-color: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Luluskan</button>
                <button id="btnReject" class="btn btn-danger" style="margin-right: 10px; background-color: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Tolak</button>
            ` : `<p>RPH ini telah ${currentStatus.toUpperCase()}.</p>`}
            <button id="btnBack" class="btn btn-secondary">Kembali ke Senarai</button>
        </div>
        <div id="reviewStatusMessage" style="margin-top: 15px;"></div>
      </div>
    `;

    // Muatkan nama guru
    const teacherSnap = await getDoc(doc(db, 'users', rph.uid)); 
    if (teacherSnap.exists()) {
      document.getElementById('guruNamePlaceholder').textContent = teacherSnap.data().name;
    } else {
      document.getElementById('guruNamePlaceholder').textContent = 'Nama Guru Tidak Diketahui';
    }

    // Event Listeners
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
    console.error("Ralat memuatkan RPH:", err);
    content.innerHTML = `<p class="error">Gagal memuatkan RPH: ${err.message}</p>`;
  }
}

async function updateRphStatus(newStatus) {
    if (!currentRphId || !auth.currentUser) return;
    const comment = document.getElementById('adminComment').value;
    const statusDiv = document.getElementById('reviewStatusMessage');
    statusDiv.innerHTML = '<p>Mengemaskini status...</p>';

    try {
        await updateDoc(doc(db, 'rph', currentRphId), {
            status: newStatus,
            reviewDate: new Date(),
            reviewerUid: auth.currentUser.uid,
            reviewerComment: comment
        });

        statusDiv.innerHTML = `<p class="success">Berjaya dikemaskini kepada: ${newStatus.toUpperCase()}</p>`;
        setTimeout(() => { loadRphListPage(); }, 1000);
    } catch (e) {
        statusDiv.innerHTML = `<p class="error">Gagal: ${e.message}</p>`;
    }
}

