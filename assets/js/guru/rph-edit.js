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
    <div class="guru-section">
      <h2>Edit RPH (Draf)</h2>
      <p><strong>Tarikh:</strong> ${tarikh}</p>
      <p><strong>Kelas:</strong> ${data.kelas}</p>
      <p><strong>Mata Pelajaran:</strong> ${data.matapelajaran}</p>
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
        <label>Refleksi Pengajaran (akan diisi selepas PdP)</label>
        <textarea id="refleksi" rows="3">${data.refleksi || ''}</textarea>
      </div>
      <button id="btnSaveDraft" class="btn btn-save">Simpan Draf</button>
      <button id="btnSubmitRph" class="btn">Hantar RPH</button>
      <button id="btnCancel" class="btn btn-cancel">Kembali</button>
      <div id="editError" style="color:red; margin-top:10px;"></div>
    </div>
  `;

  document.getElementById('content').innerHTML = html;

  // Simpan draf
  document.getElementById('btnSaveDraft').addEventListener('click', () => {
    saveRph(rphId, data, false);
  });

  // Hantar
  document.getElementById('btnSubmitRph').addEventListener('click', () => {
    saveRph(rphId, data, true);
  });

  document.getElementById('btnCancel').addEventListener('click', () => {
    import('./rph-history.js').then(m => m.loadRphHistory());
  });
}

async function saveRph(rphId, originalData, submit = false) {
  const errorDiv = document.getElementById('editError');
  errorDiv.textContent = '';

  // Kumpul data terkini
  const updatedRPH = { ...originalData.dataRPH };
  const fields = ['topic_name', 'objectives', 'activities', 'assessments', 'aids'];
  fields.forEach(key => {
    updatedRPH[key] = document.getElementById(`field_${key}`).value.trim();
  });

  const refleksi = document.getElementById('refleksi').value.trim();

  if (submit && !refleksi) {
    errorDiv.textContent = 'Sila isi refleksi sebelum menghantar.';
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
      alert('RPH berjaya dihantar untuk semakan!');
      import('./rph-history.js').then(m => m.loadRphHistory());
    } else {
      alert('Draf berjaya disimpan.');
    }
  } catch (err) {
    errorDiv.textContent = 'Ralat: ' + err.message;
  }
}