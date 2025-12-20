// assets/js/guru/rph-generator.js

import { auth, db, getTemplateUrl, getFullSubjectName } from '../config.js';
import { 
  doc, getDoc, collection, addDoc, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔑 IMPORT TAMBAHAN
import { createLog } from '../utils.js'; 
import { loadRphHistory } from './rph-history.js'; 

/**
 * Memuatkan Antaramuka Penjana RPH
 */
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
  
  // Muatkan sesi secara automatik untuk tarikh hari ini
  loadScheduledSessions();
}

/**
 * 🔄 FUNGSI 1: Memuatkan dan memaparkan sesi yang dijadualkan mengikut jadual guru.
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
    
    // Hadkan kepada hari bekerja sahaja
    if (!['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'].includes(hari)) {
        resultDiv.innerHTML = '<p class="error">RPH hanya boleh dijana untuk Isnin hingga Jumaat.</p>';
        return;
    }
    
    resultDiv.innerHTML = `<p class="info">Mencari sesi untuk <strong>${hari}</strong>...</p>`;
    
    try {
        const user = auth.currentUser;
        const jadualRef = doc(db, 'jadual', user.uid);
        const jadualSnap = await getDoc(jadualRef);

        if (!jadualSnap.exists() || !jadualSnap.data() || !jadualSnap.data().senarai) {
            resultDiv.innerHTML = `<p class="error">Jadual mingguan belum diisi. Sila isi jadual di menu 'Jadual' dahulu.</p>`;
            return;
        }

        const senaraiJadual = jadualSnap.data().senarai;
        const sesiHari = senaraiJadual.filter(s => s.hari === hari);
        
        let html = `<h3>Sesi untuk ${hari}, ${selectedDate.toLocaleDateString('ms-MY')}</h3>`;
        
        if (sesiHari.length === 0) {
            html += '<p>Tiada sesi mengajar dijadualkan pada hari ini.</p>';
        } else {
             // 🔑 KEMASKINI: Menggunakan getFullSubjectName() untuk paparan yang lebih profesional
             html += `<ul style="padding-left: 20px; list-style-type: none;">
                 ${sesiHari.map((sesi) => `
                     <li style="margin-bottom: 12px; padding: 10px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #3498db;">
                         <span style="font-weight: bold; color: #2c3e50;">${sesi.masaMula} - ${sesi.masaTamat}</span><br>
                         <span style="color: #e67e22; font-weight: bold;">${getFullSubjectName(sesi.matapelajaran)}</span> | 
                         <span style="color: #7f8c8d;">${sesi.kelas}</span>
                     </li>
                 `).join('')}
             </ul>
             <p class="success" style="margin-top: 15px; font-weight: bold;">
                Klik butang "Jana SEMUA RPH" untuk memproses ${sesiHari.length} sesi ini.
             </p>`;
        }
        
        document.getElementById('generatorResult').innerHTML = html;

    } catch (error) {
        console.error("Ralat memuatkan sesi:", error);
        resultDiv.innerHTML = `<p class="error">Gagal memuatkan sesi jadual: ${error.message}</p>`;
    }
}

/**
 * 🔑 FUNGSI 2: Menjana SEMUA RPH secara berkelompok (Batch Processing).
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
    
    const btn = document.getElementById('btnGenerateAll');
    btn.disabled = true;
    btn.textContent = 'Memproses... Sila Tunggu';
    resultDiv.innerHTML = `<p class="info">Menjana RPH untuk ${hari}, ${selectedDate.toLocaleDateString('ms-MY')}...</p>`;
    
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
                await generateRphForSingleSession(selectedDate, sesi); 
                successCount++;
            } catch (err) {
                if (err.message.includes('sudah wujud')) {
                    skipCount++;
                } else {
                    console.error(`Gagal pada sesi ${sesi.matapelajaran}:`, err);
                }
            }
        }

        // 🔑 REKOD AKTIVITI KE LOG (Audit Trail)
        if (successCount > 0) {
            await createLog('GENERATE_RPH', `Berjaya menjana ${successCount} draf RPH untuk tarikh ${dateInput}`);
        }

        resultDiv.innerHTML = `
            <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 8px;">
                <p style="font-weight: bold; margin-bottom: 5px;">✅ Penjanaan Selesai!</p>
                <p>Berjaya disimpan: <strong>${successCount} sesi</strong></p>
                ${skipCount > 0 ? `<p style="color: #856404;">Dilangkau (sudah wujud): <strong>${skipCount} sesi</strong></p>` : ''}
            </div>
            
            <div style="margin-top: 20px;">
                <button id="btnViewRphList" class="btn btn-primary">Lihat Senarai RPH</button>
            </div>
        `;
        
        // Pasang event listener pada butang yang baru dicipta
        const btnViewRphList = document.getElementById('btnViewRphList');
        if (btnViewRphList) {
             btnViewRphList.addEventListener('click', loadRphHistory);
        }
        
    } catch (error) {
        console.error("Ralat utama:", error);
        resultDiv.innerHTML = `<p class="error">Ralat Kritikal: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Jana SEMUA RPH';
    }
}

/**
 * 🔄 FUNGSI 3: Logik pemprosesan untuk satu sesi tunggal.
 */
async function generateRphForSingleSession(selectedDate, sesi) {
    const month = selectedDate.getMonth() + 1; 
    
    // 1. Semakan pertindihan data
    const existingRphQuery = query(
        collection(db, 'rph'),
        where('uid', '==', auth.currentUser.uid),
        where('tarikh', '==', selectedDate),
        where('kelas', '==', sesi.kelas),
        where('matapelajaran', '==', sesi.matapelajaran),
        where('masaMula', '==', sesi.masaMula)
    );

    const existingRphSnap = await getDocs(existingRphQuery);
    if (!existingRphSnap.empty) {
        throw new Error(`RPH sudah wujud.`);
    }
    
    // 2. Ambil Template (Kini menyokong tas.json secara automatik melalui config.js)
    const res = await fetch(getTemplateUrl(sesi.matapelajaran));
    if (!res.ok) throw new Error('Template tidak dijumpai.');
    
    const topics = await res.json();
    if (!Array.isArray(topics) || topics.length === 0) throw new Error('Topik kosong.');

    // 3. Pemilihan topik berdasarkan bulan semasa
    const topicIndex = (month - 1) % topics.length;
    const selectedTopic = topics[topicIndex];

    // 4. Struktur data draf RPH
    const rphData = {
      uid: auth.currentUser.uid, 
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
    
    await addDoc(collection(db, 'rph'), rphData);
}
