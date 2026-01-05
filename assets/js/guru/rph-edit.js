// assets/js/guru/rph-edit.js

import { db } from '../config.js';
import { 
  doc, updateDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadRphEdit(rphId, rphData = null) {
  let data = rphData;
  if (!data) {
    const docSnap = await getDoc(doc(db, 'rph', rphId));
    if (!docSnap.exists()) {
      alert('RPH tidak dijumpai.');
      import('./rph-history.js').then(m => m.loadRphHistory());
      return;
    }
    data = docSnap.data();
  }

  const tarikh = data.tarikh.toDate ? data.tarikh.toDate().toLocaleDateString('ms-MY') : data.tarikh;

  let html = `
    <style>
      .edit-container { max-width: 900px; margin: 20px auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); font-family: 'Segoe UI', system-ui, sans-serif; }
      .edit-header { border-bottom: 2px solid #f0f2f5; margin-bottom: 25px; padding-bottom: 15px; }
      .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #4a90e2; }
      .info-item label { font-size: 0.75rem; color: #6c757d; text-transform: uppercase; font-weight: bold; display: block; }
      .info-item span { font-size: 1rem; color: #2c3e50; font-weight: 600; }
      
      .form-group { margin-bottom: 20px; }
      .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; font-size: 0.95rem; }
      .form-group textarea { width: 100%; padding: 12px; border: 1px solid #ced4da; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s; font-family: inherit; resize: vertical; }
      .form-group textarea:focus { border-color: #4a90e2; outline: none; box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1); }
      
      .action-area { display: flex; gap: 10px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
      .btn-edit-rph { padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: 0.2s; }
      .btn-save-draft { background: #6c757d; color: white; }
      .btn-save-draft:hover { background: #5a6268; }
      .btn-submit-rph { background: #28a745; color: white; flex-grow: 1; }
      .btn-submit-rph:hover { background: #218838; }
      .btn-cancel-edit { background: #f8f9fa; color: #333; border: 1px solid #ddd; }
      .btn-cancel-edit:hover { background: #e2e6ea; }
      
      .refleksi-box { background: #fff3cd; border: 1px solid #ffeeba; }
    </style>

    <div class="edit-container">
      <div class="edit-header">
        <h2 style="margin: 0; color: #2c3e50;">📝 Kemaskini RPH</h2>
        <p style="color: #6c757d; margin: 5px 0 0 0;">Sila lengkapkan butiran pengajaran anda di bawah.</p>
      </div>

      <div class="info-grid">
        <div class="info-item"><label>Tarikh</label><span>${tarikh}</span></div>
        <div class="info-item"><label>Kelas</label><span>${data.kelas}</span></div>
        <div class="info-item"><label>Mata Pelajaran</label><span>${data.matapelajaran}</span></div>
      </div>
  `;

  const rph = data.dataRPH || {};
  const fields = [
    { key: 'topic_name', label: 'Tajuk / Fokus Utama' },
    { key: 'objectives', label: 'Objektif Pembelajaran' },
    { key: 'activities', label: 'Aktiviti Pengajaran & Pembelajaran' },
    { key: 'assessments', label: 'Penilaian / Pentaksiran' },
    { key: 'aids', label: 'Bahan Bantu Mengajar (BBM)' }
  ];

  fields.forEach(field => {
    html += `
      <div class="form-group">
        <label>${field.label}</label>
        <textarea id="field_${field.key}" rows="3">${rph[field.key] || ''}</textarea>
      </div>
    `;
  });

  html += `
      <div class="form-group">
        <label>Refleksi Pengajaran (Wajib diisi untuk Hantar)</label>
        <textarea id="refleksi" class="refleksi-box" rows="4" placeholder="Contoh: 25/30 murid mencapai objektif...">${data.refleksi || ''}</textarea>
      </div>

      <div id="editError" style="color:#dc3545; margin-bottom:15px; font-weight:bold; font-size:0.9rem;"></div>

      <div class="action-area">
        <button id="btnCancel" class="btn-edit-rph btn-cancel-edit">Batal</button>
        <button id="btnSaveDraft" class="btn-edit-rph btn-save-draft">Simpan Draf</button>
        <button id="btnSubmitRph" class="btn-edit-rph btn-submit-rph">Hantar RPH Sekarang</button>
      </div>
    </div>
  `;

  document.getElementById('content').innerHTML = html;

  // Event Listeners
  document.getElementById('btnSaveDraft').addEventListener('click', () => saveRph(rphId, data, false));
  document.getElementById('btnSubmitRph').addEventListener('click', () => saveRph(rphId, data, true));
  document.getElementById('btnCancel').addEventListener('click', () => {
    import('./rph-history.js').then(m => m.loadRphHistory());
  });
}

async function saveRph(rphId, originalData, submit = false) {
  const errorDiv = document.getElementById('editError');
  errorDiv.textContent = '';

  const updatedRPH = { ...originalData.dataRPH };
  const fields = ['topic_name', 'objectives', 'activities', 'assessments', 'aids'];
  fields.forEach(key => {
    updatedRPH[key] = document.getElementById(`field_${key}`).value.trim();
  });

  const refleksi = document.getElementById('refleksi').value.trim();

  if (submit && !refleksi) {
    errorDiv.textContent = '⚠️ Sila isi refleksi sebelum menghantar RPH.';
    document.getElementById('refleksi').focus();
    return;
  }

  try {
    await updateDoc(doc(db, 'rph', rphId), {
      dataRPH: updatedRPH,
      refleksi: refleksi,
      status: submit ? 'submitted' : 'draft',
      updatedAt: new Date()
    });

    if (submit) {
      alert('RPH telah berjaya dihantar!');
      import('./rph-history.js').then(m => m.loadRphHistory());
    } else {
      alert('Draf RPH telah disimpan.');
    }
  } catch (err) {
    errorDiv.textContent = 'Ralat: ' + err.message;
  }
}
