import { auth, db, getTemplateUrl } from '../config.js';
import { 
  doc, getDoc, collection, addDoc, query, where, getDocs // Tambah query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Import fungsi dari fail rph-edit.js jika anda mahu terus edit satu RPH selepas penjanaan batch
// Jika anda tidak mahu import/redirect selepas batch, buang baris ini dan baris yang memanggilnya.
// import { loadRphEdit } from './rph-edit.js'; 


export function loadRphGenerator() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="guru-section">
      <h2>Jana RPH Automatik</h2>
      <div class="form-group">
        <label>Pilih Tarikh Pengajaran</label>
        <input type="date" id="rphDate" />
      </div>
      
      <button id="btnGenerateAll" class="btn btn-save" style="margin-bottom: 20px;">Jana SEMUA RPH</button>
      
      <div id="generatorResult" style="margin-top:20px;">
          <p>Sila pilih tarikh untuk melihat sesi yang dijadualkan.</p>
      </div>
    </div>
  `;

  // Tetapkan tarikh hari ini sebagai default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rphDate').value = today;

  // Pasang Event Listeners
  document.getElementById('rphDate').addEventListener('change', loadScheduledSessions);
  document.getElementById('btnGenerateAll').addEventListener('click', generateAllRphInBatch);
  
  // Muatkan sesi secara automatik apabila halaman dimuatkan
  loadScheduledSessions();
}


/**
 * 🔄 FUNGSI 1: Hanya memuatkan dan memaparkan sesi yang dijadualkan (Menggantikan fungsi generateRphForDate lama)
 */
async function loadScheduledSessions() {
    const dateInput = document.getElementById('rphDate').value;
    const resultDiv = document.getElementById('generatorResult');
    if (!dateInput) {
        resultDiv.innerHTML = '<p class="warning">Sila pilih tarikh.</p>';
        return;
    }

    const selectedDate = new Date(dateInput);
    const hari = selectedDate.toLocaleDateString('ms-MY', { weekday: 'long' });
    
    if (!['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'].includes(hari)) {
        document.getElementById('generatorResult').innerHTML = 
          '<p class="error">RPH hanya boleh dijana untuk Isnin hingga Jumaat.</p>';
        return;
    }
    
    resultDiv.innerHTML = `<p>Mencari sesi untuk **${hari}**...</p>`;
    
    try {
        const user = auth.currentUser;
        const jadualRef = doc(db, 'jadual', user.uid);
        const jadualSnap = await getDoc(jadualRef);

        if (!jadualSnap.exists() || !jadualSnap.data() || !jadualSnap.data().senarai) {
            resultDiv.innerHTML = `<p class="error">Jadual mingguan belum diisi. Sila isi jadual dahulu.</p>`;
            return;
        }

        const senaraiJadual = jadualSnap.data().senarai;
        const sesiHari = senaraiJadual.filter(s => s.hari === hari);
        
        let html = `<h3>Sesi untuk ${hari}, ${selectedDate.toLocaleDateString('ms-MY')}</h3>`;
        
        if (sesiHari.length === 0) {
            html += '<p>Tiada sesi mengajar dijadualkan pada hari ini.</p>';
        } else {
             // Paparkan senarai sesi sahaja (BUTANG PILIH DIBUANG)
             html += `<ul style="padding-left: 20px;">
                 ${sesiHari.map((sesi) => `
                     <li style="margin-bottom: 10px;">
                         **${sesi.masaMula} - ${sesi.masaTamat}** | ${sesi.matapelajaran} | ${sesi.kelas}
                     </li>
                 `).join('')}
             </ul>
             <p class="success">Klik butang **Jana SEMUA RPH** di atas untuk menjana ${sesiHari.length} RPH sekaligus.</p>`;
        }
        
        resultDiv.innerHTML = html;

    } catch (error) {
        console.error("Ralat memuatkan sesi:", error);
        resultDiv.innerHTML = `<p class="error">Gagal memuatkan sesi jadual: ${error.message}</p>`;
    }
}


/**
 * 🔑 FUNGSI 2: Menjana SEMUA RPH untuk setiap sesi pada tarikh yang dipilih (BATCH PROCESS).
 */
async function generateAllRphInBatch() {
    const dateInput = document.getElementById('rphDate').value;
    const resultDiv = document.getElementById('generatorResult');
    
    if (!dateInput) {
        alert('Sila pilih tarikh.');
        return;
    }

    const selectedDate = new Date(dateInput);
    const hari = selectedDate.toLocaleDateString('ms-MY', { weekday: 'long' });
    
    if (!['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'].includes(hari)) {
        alert('RPH hanya boleh dijana untuk Isnin hingga Jumaat.');
        return;
    }

    // Matikan butang dan paparkan status
    const btn = document.getElementById('btnGenerateAll');
    btn.disabled = true;
    btn.textContent = 'Memproses... Sila Tunggu';
    resultDiv.innerHTML = `<p class="info">Memulakan penjanaan RPH kelompok untuk ${hari}, ${selectedDate.toLocaleDateString('ms-MY')}...</p>`;
    
    try {
        const user = auth.currentUser;
        const jadualRef = doc(db, 'jadual', user.uid);
        const jadualSnap = await getDoc(jadualRef);

        const senaraiJadual = jadualSnap.data().senarai;
        const sesiHari = senaraiJadual.filter(s => s.hari === hari);
        
        let successCount = 0;
        let skipCount = 0;

        for (const sesi of sesiHari) {
            try {
                // Panggil fungsi penjanaan RPH tunggal
                await generateRphForSingleSession(selectedDate, sesi); 
                successCount++;
            } catch (err) {
                // Jika ralat adalah kerana RPH sudah wujud, kira sebagai skip
                if (err.message.includes('RPH sudah wujud')) {
                    skipCount++;
                    console.log(`DILANGKAU: RPH untuk ${sesi.matapelajaran} - ${sesi.kelas} sudah wujud.`);
                } else {
                    console.error(`Gagal menjana RPH untuk sesi ${sesi.matapelajaran} - ${sesi.kelas}:`, err);
                }
            }
        }

        resultDiv.innerHTML = `
            <p class="success">✅ Penjanaan Selesai!</p>
            <p>RPH berjaya dijana dan disimpan sebagai draf: **${successCount} sesi**</p>
            ${skipCount > 0 ? `<p class="warning">RPH yang dilangkau kerana sudah wujud: **${skipCount} sesi**</p>` : ''}
            <p>Sila pergi ke 'Lihat RPH' untuk menyemak dan menghantar.</p>
        `;
        
    } catch (error) {
        console.error("Ralat utama semasa penjanaan kelompok:", error);
        resultDiv.innerHTML = `<p class="error">Ralat Kritikal semasa penjanaan: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Jana SEMUA RPH';
    }
}


/**
 * 🔄 FUNGSI 3: Logik untuk menjana RPH untuk satu sesi (Diubah suai dari window.selectSession yang lama)
 */
async function generateRphForSingleSession(selectedDate, sesi) {
    const month = selectedDate.getMonth() + 1; // 1 (Jan) hingga 12 (Dis)
    
    // 1. Semak sama ada RPH sudah wujud
    const existingRphQuery = query(
        collection(db, 'rph'),
        where('uid', '==', auth.currentUser.uid),
        where('tarikh', '==', selectedDate),
        where('kelas', '==', sesi.kelas),
        where('matapelajaran', '==', sesi.matapelajaran),
        where('masaMula', '==', sesi.masaMula),
        where('masaTamat', '==', sesi.masaTamat)
    );

    const existingRphSnap = await getDocs(existingRphQuery);

    if (!existingRphSnap.empty) {
        // Jika RPH sudah wujud, langkau penjanaan dan baling ralat
        throw new Error(`RPH sudah wujud (${sesi.matapelajaran} - ${sesi.kelas}).`);
    }
    
    // 2. Dapatkan URL template & Muatkan template
    // Guna getTemplateUrl(sesi.matapelajaran)
    const res = await fetch(getTemplateUrl(sesi.matapelajaran));
    if (!res.ok) {
        throw new Error('Template tidak dijumpai untuk ' + sesi.matapelajaran);
    }
    
    const topics = await res.json();
    
    if (!Array.isArray(topics) || topics.length === 0) { 
        throw new Error('Tiada topik dalam template.');
    }

    // 3. Kira indeks topik berdasarkan bulan (Urutan topik dikira berdasarkan BULAN tarikh)
    const topicIndex = (month - 1) % topics.length;
    const selectedTopic = topics[topicIndex];

    // 4. Simpan sebagai draf
    const rphData = {
      uid: auth.currentUser.uid, 
      tarikh: selectedDate, // Simpan objek Date (Firestore Timestamp)
      matapelajaran: sesi.matapelajaran,
      kelas: sesi.kelas,
      masaMula: sesi.masaMula,
      masaTamat: sesi.masaTamat,
      status: 'draft',
      dataRPH: selectedTopic,
      refleksi: '',
      updatedAt: new Date() 
    };
    
    // Operasi addDoc
    const docRef = await addDoc(collection(db, 'rph'), rphData);
    
    // TIDAK membuat alert atau redirect ke halaman edit kerana ia adalah proses kelompok.
    // console log untuk tujuan debug
    console.log(`RPH untuk ${sesi.matapelajaran} - ${sesi.kelas} berjaya dijana. Doc ID: ${docRef.id}`);
}
