// assets/js/guru/rph-edit.js

import { db, getFullSubjectName } from '../config.js';
import { 
  doc, updateDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Memuatkan halaman edit untuk satu RPH (Draf)
 */
export async function loadRphEdit(rphId, rphData = null) {
  let data = rphData;
  
  // Jika data tidak dibekalkan (panggilan terus melalui URL/ID), ambil dari Firestore
  if (!data) {
    const docSnap = await getDoc(doc(db, 'rph', rphId));
    if (!docSnap.exists()) {
      alert('RPH tidak dijumpai.');
      import('./rph-history.js').then(m => m.loadRphHistory());
      return;
    }
    data = docSnap.data();
  }

  // Formatkan tarikh untuk paparan
  const tarikh = data.tarikh.toDate ? data.tarikh.toDate().toLocaleDateString('ms-MY') : data.tarikh;

  // 🔄 KEMASKINI: Menggunakan getFullSubjectName() untuk paparan subjek yang lebih jelas
  let html = `
    <div class="guru-section">
      <h2>Edit RPH (Draf)</h2>
      <div class="edit-info-card" style="background: #fdfefe; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Tarikh:</strong> ${tarikh}</p>
        <p><strong>Kelas:</strong> ${data.kelas}</p>
        <p><strong>Mata Pelajaran:</strong> <span style="color: #2c3e50; font-weight: bold;">${getFullSubjectName(data.matapelajaran)}</span></p>
      </div>
      <hr>
  `;

  const rph = data.dataRPH || {};
  const fields = [
    { key: 'topic_name', label: 'Tajuk' },
    { key: 'objectives', label: 'Objektif Pembelajaran' },
    { key: 'activities', label: 'Aktiviti Pengajaran & Pembelajaran' },
    { key: 'assessments', label: 'Penilaian' },
    { key: 'aids', label: 'Bahan Bantu Mengajar' }
  ];

  // Bina borang input secara dinamik
  fields.forEach(field => {
    html += `
      <div class="form-group">
        <label>${field.label}</label>
        <textarea id="field_${field.key}" rows="3" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">${rph[field.key] || ''}</textarea>
      </div>
    `;
  });

  html += `
      <div class="form-group">
        <label>Refleksi Pengajaran (akan diisi selepas PdP)</label>
        <textarea id="refleksi" rows="3" placeholder="Masukkan refleksi di sini..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">${data.refleksi || ''}</textarea>
      </div>
      
      <div class="action-buttons" style="margin-top: 20px; display: flex; gap: 10px;">
          <button id="btnSaveDraft" class="btn btn-save">Simpan Draf</button>
          <button id="btnSubmitRph" class="btn btn-primary" style="background-color: #27ae60;">Hantar RPH</button>
          <button id="btnCancel" class="btn btn-cancel" style="background-color: #95a5a6;">Kembali</button>
      </div>
      
      <div id="editError" style="color:red; margin-top:10px; font-weight: bold;"></div>
    </div>
  `;

  document.getElementById('content').innerHTML = html;

  // --- EVENT LISTENERS ---

  // Simpan sebagai draf (Kekalkan status 'draft')
  document.getElementById('btnSaveDraft').addEventListener('click', () => {
    saveRph(rphId, data, false);
  });

  // Hantar RPH (Tukar status kepada 'submitted')
  document.getElementById('btnSubmitRph').addEventListener('click', () => {
    saveRph(rphId, data, true);
  });

  // Kembali ke senarai sejarah RPH
  document.getElementById('btnCancel').addEventListener('click', () => {
    import('./rph-history.js').then(m => m.loadRphHistory());
  });
}

/**
 * Fungsi untuk menyimpan data yang dikemaskini ke Firestore
 */
async function saveRph(rphId, originalData, submit = false) {
  const errorDiv = document.getElementById('editError');
  errorDiv.textContent = '';

  // Kumpul data terkini daripada semua textarea
  const updatedRPH = { ...originalData.dataRPH };
  const fields = ['topic_name', 'objectives', 'activities', 'assessments', 'aids'];
  fields.forEach(key => {
    const element = document.getElementById(`field_${key}`);
    if (element) {
        updatedRPH[key] = element.value.trim();
    }
  });

  const refleksi = document.getElementById('refleksi').value.trim();

  // Pengesahan (Validation) jika menghantar RPH
  if (submit && !refleksi) {
    errorDiv.textContent = 'Peringatan: Sila isi refleksi sebelum menghantar RPH untuk semakan.';
    return;
  }

  try {
    // Kemaskini dokumen dalam koleksi /rph
    await updateDoc(doc(db, 'rph', rphId), {
      dataRPH: updatedRPH,
      refleksi: refleksi,
      status: submit ? 'submitted' : 'draft',
      updatedAt: new Date()
    });

    if (submit) {
      alert('RPH berjaya dihantar untuk semakan Pentadbir!');
      import('./rph-history.js').then(m => m.loadRphHistory());
    } else {
      alert('Draf RPH berjaya dikemaskini.');
    }
  } catch (err) {
    console.error("Ralat menyimpan RPH:", err);
    errorDiv.textContent = 'Gagal menyimpan perubahan: ' + err.message;
  }
}
