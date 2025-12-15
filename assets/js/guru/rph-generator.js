import { auth, db, getTemplateUrl } from '../config.js';
import { 
  doc, getDoc, collection, addDoc, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Import fungsi dari fail rph-form.js atau fail generator anda yang lain
// Anda perlu memastikan fungsi ini dieksport dan tersedia.
// import { loadRphForm } from './rph-form.js'; 

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
 * Memuatkan sesi yang dijadualkan untuk tarikh yang dipilih (daripada Firestore /jadual)
 */
async function loadScheduledSessions() {
    const dateInput = document.getElementById('rphDate').value;
    const resultDiv = document.getElementById('generatorResult');
    if (!dateInput) {
        resultDiv.innerHTML = '<p class="warning">Sila pilih tarikh.</p>';
        return;
    }

    const dayOfWeek = new Date(dateInput).getDay(); // 0=Ahad, 1=Isnin, ... 6=Sabtu
    const dayMap = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    const currentDay = dayMap[dayOfWeek];
    
    resultDiv.innerHTML = `<p>Mencari sesi untuk **${currentDay}**...</p>`;
    
    try {
        const jadwalRef = doc(db, 'jadual', auth.currentUser.uid);
        const jadwalSnap = await getDoc(jadwalRef);

        if (!jadwalSnap.exists() || !jadwalSnap.data() || !jadwalSnap.data()[currentDay]) {
            resultDiv.innerHTML = `<p class="warning">Tiada jadual waktu ditemui untuk hari ${currentDay}.</p>`;
            return;
        }

        const dailyJadwal = jadwalSnap.data()[currentDay];
        
        let html = `<h3>Sesi untuk ${currentDay}, ${new Date(dateInput).toLocaleDateString('ms-MY')}</h3>`;
        
        if (dailyJadwal.length === 0) {
            html += '<p>Tiada sesi mengajar dijadualkan pada hari ini.</p>';
        } else {
             // ❌ MENGHILANGKAN BUTANG PILIH SATU PERSATU.
             // Butang "Jana SEMUA RPH" yang baru di atas akan mengendalikan semua sesi.
             
             html += `<ul style="padding-left: 20px;">
                 ${dailyJadwal.map((sesi, index) => `
                     <li style="margin-bottom: 10px;">
                         **${sesi.masaMula} - ${sesi.masaTamat}** | ${sesi.matapelajaran} | ${sesi.kelas}
                     </li>
                 `).join('')}
             </ul>
             <p class="success">Klik butang **Jana SEMUA RPH** di atas untuk menjana ${dailyJadwal.length} RPH sekaligus.</p>`;
        }
        
        resultDiv.innerHTML = html;

    } catch (error) {
        console.error("Ralat memuatkan sesi:", error);
        resultDiv.innerHTML = `<p class="error">Gagal memuatkan sesi jadual: ${error.message}</p>`;
    }
}


/**
 * 🔑 FUNGSI UTAMA BARU: Menjana SEMUA RPH untuk setiap sesi pada tarikh yang dipilih.
 */
async function generateAllRphInBatch() {
    const dateInput = document.getElementById('rphDate').value;
    const resultDiv = document.getElementById('generatorResult');
    
    if (!dateInput) {
        alert('Sila pilih tarikh.');
        return;
    }

    const dayOfWeek = new Date(dateInput).getDay(); 
    const dayMap = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    const currentDay = dayMap[dayOfWeek];
    
    // Matikan butang dan paparkan status
    const btn = document.getElementById('btnGenerateAll');
    btn.disabled = true;
    btn.textContent = 'Memproses... Sila Tunggu';
    resultDiv.innerHTML = `<p class="info">Memulakan penjanaan RPH kelompok untuk ${currentDay}, ${new Date(dateInput).toLocaleDateString('ms-MY')}...</p>`;
    
    const selectedDate = new Date(dateInput);
    
    try {
        const jadwalRef = doc(db, 'jadual', auth.currentUser.uid);
        const jadwalSnap = await getDoc(jadwalRef);
        
        if (!jadwalSnap.exists() || !jadwalSnap.data() || !jadwalSnap.data()[currentDay]) {
            resultDiv.innerHTML = `<p class="warning">Tiada jadual waktu ditemui untuk hari ${currentDay}. Penjanaan dibatalkan.</p>`;
            btn.disabled = false;
            btn.textContent = 'Jana SEMUA RPH';
            return;
        }

        const dailyJadwal = jadwalSnap.data()[currentDay];
        let successCount = 0;
        let failCount = 0;

        for (const sesi of dailyJadwal) {
            try {
                // Panggil fungsi penjanaan RPH tunggal yang diubah suai
                await generateRphForSingleSession(selectedDate, sesi); 
                successCount++;
            } catch (err) {
                console.error(`Gagal menjana RPH untuk sesi ${sesi.matapelajaran} - ${sesi.kelas}:`, err);
                failCount++;
            }
        }

        resultDiv.innerHTML = `
            <p class="success">✅ Penjanaan Selesai!</p>
            <p>RPH berjaya dijana dan disimpan sebagai draf: **${successCount} sesi**</p>
            ${failCount > 0 ? `<p class="error">RPH gagal dijana: **${failCount} sesi** (Sila semak log konsol)</p>` : ''}
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
 * 🔄 FUNGSI UTAMA: Logik untuk menjana RPH untuk satu sesi.
 * (Diubah suai daripada generateRphForDate asal anda untuk menerima tarikh & sesi sebagai parameter)
 */
async function generateRphForSingleSession(selectedDate, sesi) {
    const month = selectedDate.getMonth() + 1; // 1 (Jan) hingga 12 (Dis)
    
    // Semak sama ada RPH sudah wujud
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
        // Jika RPH sudah wujud, langkau penjanaan dan baling ralat yang boleh ditangkap
        throw new Error(`RPH sudah wujud (${sesi.matapelajaran} - ${sesi.kelas}).`);
    }
    
    // 1. Dapatkan URL template
    const templateName = sesi.matapelajaran.toLowerCase().replace(/[^a-z0-9]/g, '');
    const template_url = getTemplateUrl(templateName);

    // 2. Muatkan template
    const res = await fetch(template_url);
    if (!res.ok) {
        throw new Error(`Gagal memuatkan template untuk ${sesi.matapelajaran} (${template_url}).`);
    }
    const topics = await res.json();
    
    if (!Array.isArray(topics) || topics.length === 0) { 
        throw new Error('Tiada topik dalam template.');
    }

    // 3. Kira indeks topik berdasarkan bulan
    // Urutan topik dikira berdasarkan BULAN tarikh
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
    
    // Tiada alert di sini, kerana ia adalah proses kelompok.
    // Console log untuk tujuan debug:
    console.log(`RPH untuk ${sesi.matapelajaran} - ${sesi.kelas} berjaya dijana. Doc ID: ${docRef.id}`);
}

// FUNGSI LAMA generateRphForDate TELAH DIGABUNGKAN DAN DIUBAH SUAI KE generateRphForSingleSession.
// Anda boleh memadamkan fungsi generateRphForDate yang lama sepenuhnya.
