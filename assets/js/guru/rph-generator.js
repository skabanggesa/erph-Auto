import { auth, db, getTemplateUrl } from '../config.js';
import { 
  doc, getDoc, collection, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function loadRphGenerator() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="guru-section">
      <h2>Jana RPH Automatik</h2>
      <div class="form-group">
        <label>Pilih Tarikh Pengajaran</label>
        <input type="date" id="rphDate" />
      </div>
      <button id="btnGenerate" class="btn">Jana RPH</button>
      <div id="generatorResult" style="margin-top:20px;"></div>
    </div>
  `;

  // Tetapkan tarikh hari ini sebagai default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rphDate').value = today;

  document.getElementById('btnGenerate').addEventListener('click', generateRphForDate);
}

async function generateRphForDate() {
  const dateInput = document.getElementById('rphDate').value;
  if (!dateInput) {
    alert('Sila pilih tarikh.');
    return;
  }

  const selectedDate = new Date(dateInput);
  const hari = selectedDate.toLocaleDateString('ms-MY', { weekday: 'long' });
  
  // Semak jika hari dalam jadual (Isnin-Jumaat)
  if (!['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'].includes(hari)) {
    document.getElementById('generatorResult').innerHTML = 
      '<p class="error">RPH hanya boleh dijana untuk Isnin hingga Jumaat.</p>';
    return;
  }

  // Dapatkan jadual guru
  const user = auth.currentUser;
  const jadualRef = doc(db, 'jadual', user.uid);
  const jadualSnap = await getDoc(jadualRef);
  
  if (!jadualSnap.exists()) {
    document.getElementById('generatorResult').innerHTML = 
      '<p class="error">Jadual mingguan belum diisi. Sila isi jadual dahulu.</p>';
    return;
  }

  const jadual = jadualSnap.data().senarai;
  const sesiHari = jadual.filter(s => s.hari === hari);

  if (sesiHari.length === 0) {
    document.getElementById('generatorResult').innerHTML = 
      `<p>Tiada sesi pengajaran pada ${hari}.</p>`;
    return;
  }

  // Paparkan pilihan sesi
  let html = `<h3>Pilih Sesi untuk ${hari}, ${selectedDate.toLocaleDateString('ms-MY')}</h3>`;
  sesiHari.forEach((sesi, idx) => {
    html += `
      <div class="session-item">
        <span>${sesi.masaMula} - ${sesi.masaTamat} | ${sesi.matapelajaran} | ${sesi.kelas}</span>
        <button class="btn" onclick="window.selectSession(${JSON.stringify(sesi)}, '${dateInput}')">Pilih</button>
      </div>
    `;
  });

  document.getElementById('generatorResult').innerHTML = html;
}

// Fungsi global untuk pilih sesi
window.selectSession = async (sesi, dateStr) => {
  const selectedDate = new Date(dateStr);
  const month = selectedDate.getMonth() + 1; // Jan = 1

  // Ambil template dari GitHub
  const subjectKey = sesi.matapelajaran.toLowerCase().replace(/\s+/g, '_');
  try {
    const res = await fetch(getTemplateUrl(subjectKey));
    if (!res.ok) throw new Error('Template tidak dijumpai untuk ' + sesi.matapelajaran);
    const topics = await res.json();

    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error('Tiada topik dalam template.');
    }

    // Kira indeks topik berdasarkan bulan
    const topicIndex = (month - 1) % topics.length;
    const selectedTopic = topics[topicIndex];

    // Simpan sebagai draf
    const rphData = {
      userId: auth.currentUser.uid,
      tarikh: selectedDate,
      matapelajaran: sesi.matapelajaran,
      kelas: sesi.kelas,
      masaMula: sesi.masaMula,
      masaTamat: sesi.masaTamat,
      status: 'draft',
      dataRPH: selectedTopic,
      refleksi: '',
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'rph'), rphData);
    alert('RPH berjaya dijana dan disimpan sebagai draf!');
    
    // Terus ke edit
    import('./rph-edit.js').then(m => m.loadRphEdit(docRef.id, rphData));
  } catch (err) {
    console.error(err);
    document.getElementById('generatorResult').innerHTML = 
      `<p class="error">Ralat: ${err.message}</p>`;
  }
};