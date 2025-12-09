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

// FUNGSI INI TELAH DIBETULKAN UNTUK MENGGUNAKAN DATA ATTRIBUTES
async function generateRphForDate() {
  const dateInput = document.getElementById('rphDate').value;
  if (!dateInput) {
    alert('Sila pilih tarikh.');
    return;
  }

  const selectedDate = new Date(dateInput);
  // Pastikan format hari adalah sama dengan yang disimpan dalam jadual (contoh: "Isnin")
  const hari = selectedDate.toLocaleDateString('ms-MY', { weekday: 'long' });
  
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
    // Escape quote marks (") dalam JSON string ke &quot; untuk selamat dalam atribut HTML
    const safeSesi = JSON.stringify(sesi).replace(/"/g, '&quot;'); 
    
    html += `
      <div class="session-item">
        <span>${sesi.masaMula} - ${sesi.masaTamat} | ${sesi.matapelajaran} | ${sesi.kelas}</span>
        <button 
          class="btn select-session-btn" 
          data-sesi="${safeSesi}" 
          data-date="${dateInput}">Pilih</button>
      </div>
    `;
  });

  const resultDiv = document.getElementById('generatorResult');
  resultDiv.innerHTML = html;
  
  // Pasang Event Listeners pada butang selepas HTML disuntik
  document.querySelectorAll('.select-session-btn').forEach(button => {
    button.addEventListener('click', function() {
      // Ambil semula JSON string, gantikan &quot; dengan " asal, dan parse
      const sesiString = this.getAttribute('data-sesi').replace(/&quot;/g, '"');
      try {
        const sesi = JSON.parse(sesiString);
        const dateStr = this.getAttribute('data-date');
        
        // Panggil fungsi global
        window.selectSession(sesi, dateStr);
      } catch (e) {
        console.error("Ralat parsing sesi JSON:", e);
        alert("Ralat: Gagal memproses data sesi.");
      }
    });
  });
}

// Fungsi global untuk pilih sesi (telah diperbetulkan)
window.selectSession = async (sesi, dateStr) => {
  document.getElementById('generatorResult').innerHTML = '<p>Memuatkan template...</p>';
  // Objek Date tanpa masa (hanya digunakan untuk mengira bulan)
  const selectedDate = new Date(dateStr); 
  const month = selectedDate.getMonth() + 1; // Jan = 1

  // Ambil template dari GitHub
  try {
    const res = await fetch(getTemplateUrl(sesi.matapelajaran));
    if (!res.ok) throw new Error('Template tidak dijumpai untuk ' + sesi.matapelajaran);
    
    const topics = await res.json();
    
    if (!Array.isArray(topics) || topics.length === 0) { 
        throw new Error('Tiada topik dalam template.');
    }

    // Kira indeks topik berdasarkan bulan
    const topicIndex = (month - 1) % topics.length;
    const selectedTopic = topics[topicIndex];
    
    // --- KOD PEMBETULAN MASA UTAMA ---
    
    // 1. Dapatkan jam dan minit dari sesi.masaMula (e.g., "07:10")
    const [startHour, startMinute] = sesi.masaMula.split(':').map(Number);

    // 2. Cipta objek Tarikh yang baharu
    const rphDate = new Date(dateStr); 

    // 3. Tetapkan masa pada objek Tarikh dalam zon waktu tempatan
    rphDate.setHours(startHour, startMinute, 0, 0); 
    
    // --- KOD PEMBETULAN MASA TAMAT ---

    // Simpan sebagai draf
    const rphData = {
      // PEMBETULAN: Menggunakan rphDate yang dibetulkan masanya
      uid: auth.currentUser.uid, 
      
      tarikh: rphDate, // <--- OBJEK DATE KINI MENGANDUNGI MASA SESI (cth. 07:10)
      
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
