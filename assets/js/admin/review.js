import { auth, db } from '../config.js';
import { 
  doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { loadRphListPage } from './rph-list.js'; 

let currentRphId = null;

function renderData(data) {
    if (!data) return '–';
    let items = [];
    if (Array.isArray(data)) {
        items = data;
    } else if (typeof data === 'string') {
        let parts = data.split(/[\n,]/).map(s => s.trim()).filter(s => s.length > 0);
        if (parts.length > 1) {
            items = parts;
        } else {
            return String(data).trim() || '–';
        }
    } else {
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
    const dataRPH = rph.dataRPH || {}; 

    // 🔍 DEBUG UNTUK ANDA SEMAK
    console.log("Struktur rph (Root):", rph);
    console.log("Struktur dataRPH (Nested):", dataRPH);

    // 1. Tarikh (Peringkat Root)
    const tarikh = (typeof rph.tarikh === 'string') ? rph.tarikh : 
                   (rph.tarikh?.toDate ? rph.tarikh.toDate().toLocaleDateString('ms-MY') : '–');
    
    // 2. Status
    let statusDisplay = '';
    const currentStatus = String(rph.status || 'N/A').toLowerCase(); 
    switch (currentStatus) {
        case 'submitted': statusDisplay = '<span style="color: blue; font-weight: bold;">MENUNGGU SEMAKAN</span>'; break;
        case 'approved': statusDisplay = '<span style="color: green; font-weight: bold;">LULUS</span>'; break;
        case 'rejected': statusDisplay = `<span style="color: red; font-weight: bold;">DITOLAK</span> <br> <small>Komen: ${rph.reviewerComment || 'Tiada'}</small>`; break;
        default: statusDisplay = currentStatus.toUpperCase(); break;
    }

    content.innerHTML = `
      <div class="admin-section">
        <h2>Semak RPH</h2>
        <div id="rphDetails">
            <p><strong>Guru:</strong> <span id="guruNamePlaceholder">Memuatkan...</span></p>
            <p><strong>Kelas:</strong> ${rph.kelas || '–'}</p>
            <p><strong>Mata Pelajaran:</strong> ${rph.matapelajaran || '–'}</p>
            
            <p><strong>Topik:</strong> ${dataRPH.tajuk || rph.tajuk || '–'}</p>
            
            <p><strong>Tarikh:</strong> ${tarikh}</p>
            <p><strong>Status Semasa:</strong> ${statusDisplay}</p>
            <hr>
            <h3>Isi RPH</h3>
            <div style="background:#f9f9f9; padding:15px; border-radius:5px; margin:10px 0; border: 1px solid #ddd;">
                <p><strong>Objektif:</strong> ${renderData(dataRPH.objectives || rph.objektif)}</p>
                <p><strong>Standard:</strong> ${renderData(dataRPH.standards || rph.standard)}</p>
                <p><strong>Aktiviti P&P:</strong> ${renderData(dataRPH.activities || rph.aktiviti)}</p>
                <p><strong>Refleksi:</strong> ${renderData(rph.refleksi)}</p> 
            </div>
        </div>
        
        <div id="reviewActions" style="margin-top: 20px;">
            <textarea id="adminComment" rows="3" style="width:100%; padding:8px;" placeholder="Komen pentadbir...">${rph.reviewerComment || ''}</textarea>
            <div style="margin-top: 10px;">
                ${(currentStatus === 'submitted' || currentStatus === 'rejected') ? `
                    <button id="btnApprove" class="btn btn-success" style="background:#28a745; color:white; padding:8px 16px; border:none; cursor:pointer;">Luluskan</button>
                    <button id="btnReject" class="btn btn-danger" style="background:#dc3545; color:white; padding:8px 16px; border:none; cursor:pointer;">Tolak</button>
                ` : ''}
                <button id="btnBack" class="btn btn-secondary">Kembali</button>
            </div>
        </div>
        <div id="reviewStatusMessage" style="margin-top: 15px;"></div>
      </div>
    `;

    // Ambil Nama Guru
    const teacherSnap = await getDoc(doc(db, 'users', rph.uid)); 
    if (teacherSnap.exists()) document.getElementById('guruNamePlaceholder').textContent = teacherSnap.data().name;

    // Listeners
    document.getElementById('btnBack').addEventListener('click', loadRphListPage);
    if (document.getElementById('btnApprove')) document.getElementById('btnApprove').addEventListener('click', () => updateRphStatus('approved'));
    if (document.getElementById('btnReject')) document.getElementById('btnReject').addEventListener('click', () => updateRphStatus('rejected'));

  } catch (err) {
    console.error("Ralat:", err);
    content.innerHTML = `<p class="error">Gagal: ${err.message}</p>`;
  }
}

async function updateRphStatus(newStatus) {
    if (!currentRphId || !auth.currentUser) return;
    const comment = document.getElementById('adminComment').value;
    const statusDiv = document.getElementById('reviewStatusMessage');
    statusDiv.innerHTML = 'Mengemaskini...';

    try {
        await updateDoc(doc(db, 'rph', currentRphId), {
            status: newStatus,
            reviewDate: new Date(),
            reviewerUid: auth.currentUser.uid,
            reviewerComment: comment
        });
        statusDiv.innerHTML = `<p style="color:green">Berjaya: ${newStatus}</p>`;
        setTimeout(loadRphListPage, 1000);
    } catch (e) {
        statusDiv.innerHTML = `<p style="color:red">Ralat: ${e.message}</p>`;
    }
}
