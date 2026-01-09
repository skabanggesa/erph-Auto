import { auth, db, getTemplateUrl } from '../config.js';
import { 
  doc, getDoc, collection, addDoc, query, where, getDocs, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Import fungsi dari rph-history.js
import { loadRphHistory } from './rph-history.js'; 

/**
 * Memaparkan antaramuka Penjana RPH
 */
export function loadRphGenerator() {
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <style>
      .generator-container { max-width: 800px; margin: 20px auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); font-family: 'Segoe UI', system-ui, sans-serif; }
      .generator-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f0f2f5; margin-bottom: 25px; padding-bottom: 15px; }
      .form-group { margin-bottom: 25px; }
      .form-group label { display: block; margin-bottom: 10px; font-weight: 600; color: #333; font-size: 0.95rem; }
      .form-group input[type="date"] { width: 100%; padding: 12px; border: 1px solid #ced4da; border-radius: 8px; font-size: 1rem; }
      .btn-main { width: 100%; padding: 15px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 1rem; transition: 0.2s; }
      .btn-generate { background: #28a745; color: white; }
      .btn-generate:hover { background: #218838; }
      .btn-generate:disabled { background: #6c757d; cursor: not-allowed; }
      .btn-back-dashboard { background: #f8f9fa; color: #333; border: 1px solid #ddd; padding: 8px 15px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 5px; }
      #generatorResult { margin-top: 25px; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 1px solid #e9ecef; }
      .session-list { list-style: none; padding: 0; }
      .session-item { background: white; padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 4px solid #4a90e2; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    </style>

    <div class="generator-container">
      <div class="generator-header">
        <h2 style="margin: 0; color: #2c3e50;">🚀 Jana RPH Automatik</h2>
        <button class="btn-back-dashboard" onclick="window.router.navigate('guru-home')">🏠 Dashboard</button>
      </div>
      
      <div class="form-group">
        <label>Pilih Tarikh Pengajaran</label>
        <input type="date" id="rphDate" />
      </div>
      
      <button id="btnGenerateAll" class="btn-main btn-generate">Jana SEMUA RPH Sekarang</button>
      
      <div id="generatorResult">
          <p style="text-align: center; color: #666;">Sila pilih tarikh.</p>
      </div>
    </div>
  `;

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rphDate').value = today;

  document.getElementById('rphDate').addEventListener('change', loadScheduledSessions);
  document.getElementById('btnGenerateAll').addEventListener('click', generateAllRphInBatch);
  
  loadScheduledSessions();
}

/**
 * 🔄 Memuatkan sesi berdasarkan hari dalam jadual mingguan
 */
async function loadScheduledSessions() {
    const dateValue = document.getElementById('rphDate').value;
    const resultDiv = document.getElementById('generatorResult');
    if (!dateValue) return;

    const selectedDate = new Date(dateValue);
    const hari = selectedDate.toLocaleDateString('ms-MY', { weekday: 'long' });
    
    if (!['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'].includes(hari)) {
        resultDiv.innerHTML = '<p style="color: #dc3545; font-weight: bold;">RPH hanya boleh dijana untuk hari sekolah (Isnin - Jumaat).</p>';
        return;
    }
    
    resultDiv.innerHTML = `<p>Mencari sesi untuk <strong>${hari}</strong>...</p>`;
    
    try {
        const user = auth.currentUser;
        const jadualSnap = await getDoc(doc(db, 'jadual', user.uid));

        if (!jadualSnap.exists() || !jadualSnap.data().senarai) {
            resultDiv.innerHTML = `<p style="color: #dc3545;">Jadual belum diisi.</p>`;
            return;
        }

        const sesiHari = jadualSnap.data().senarai.filter(s => s.hari === hari);
        
        let html = `<h3>Sesi untuk ${hari}, ${dateValue}</h3>`;
        if (sesiHari.length === 0) {
            html += '<p>Tiada sesi mengajar.</p>';
        } else {
            html += `<div class="session-list">
                ${sesiHari.map(s => `<div class="session-item"><strong>${s.masaMula}-${s.masaTamat}</strong> | ${s.matapelajaran} | ${s.kelas}</div>`).join('')}
            </div>`;
        }
        resultDiv.innerHTML = html;
    } catch (error) {
        resultDiv.innerHTML = `Ralat: ${error.message}`;
    }
}

/**
 * 🔑 Proses batch menjana semua RPH pada tarikh dipilih
 */
async function generateAllRphInBatch() {
    const dateValue = document.getElementById('rphDate').value;
    const btn = document.getElementById('btnGenerateAll');
    const resultDiv = document.getElementById('generatorResult');
    
    btn.disabled = true;
    btn.textContent = '⏳ Menjana...';
    
    try {
        const user = auth.currentUser;
        const jadualSnap = await getDoc(doc(db, 'jadual', user.uid));
        const selectedDate = new Date(dateValue);
        const hari = selectedDate.toLocaleDateString('ms-MY', { weekday: 'long' });
        const sesiHari = jadualSnap.data().senarai.filter(s => s.hari === hari);
        
        let successCount = 0;
        let skipCount = 0;

        for (const sesi of sesiHari) {
            try {
                await generateRphForSingleSession(dateValue, sesi); 
                successCount++;
            } catch (err) {
                if (err.message.includes('sudah wujud')) skipCount++;
                else console.error("Ralat sesi:", err);
            }
        }

        resultDiv.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #28a745;">✅ Selesai!</h3>
                <p>Dijana: ${successCount} | Dilangkau: ${skipCount}</p>
                <button id="btnViewRphList" class="btn-main" style="background: #007bff; color: white; margin-top:10px;">Lihat Rekod RPH</button>
            </div>`;
        
        document.getElementById('btnViewRphList').onclick = () => loadRphHistory();
        
    } catch (error) {
        alert("Ralat Batch: " + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Jana SEMUA RPH Sekarang';
    }
}

/**
 * 🔄 Logik menjana satu RPH dan simpan ke Firestore
 */
async function generateRphForSingleSession(dateStr, sesi) {
    const user = auth.currentUser;

    // 1. Cek jika sudah wujud
    const q = query(collection(db, 'rph'), 
        where('uid', '==', user.uid),
        where('tarikh', '==', dateStr), 
        where('masaMula', '==', sesi.masaMula),
        where('matapelajaran', '==', sesi.matapelajaran)
    );
    const snap = await getDocs(q);
    if (!snap.empty) throw new Error('RPH sudah wujud');

    // 2. Dapatkan Template JSON
    const year = sesi.tahun || sesi.kelas.match(/\d+/)?.[0] || "1"; 
    const url = getTemplateUrl(sesi.matapelajaran, year);
    
    if (!url) throw new Error(`Tiada template untuk ${sesi.matapelajaran}`);

    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal muat turun template JSON');
    
    const topics = await res.json();
    const currentWeek = getWeekNumber(new Date(dateStr));
    const topicIndex = (currentWeek - 1) % topics.length;
    
    const rawData = topics[topicIndex];

    // 🔍 LOG UNTUK PENYEMAKAN
    console.log(`Menjana RPH Minggu ${currentWeek}:`, rawData);

    // 3. PROSES PEMETAAN (MAPPING) - VERSI ROBUST
    // Logik Fallback: Cari A, jika tiada cari B, jika tiada cari C
    const mappedData = {
        // Pemetaan Tajuk (Utama)
        tajuk: rawData.tajuk || rawData.topic || rawData.unit || "–",

        // Pemetaan Standard Kandungan/Pembelajaran
        standards: rawData.standard || rawData.standards || rawData.learning_standard || "–",

        // Pemetaan Objektif
        objectives: rawData.objektif || rawData.objectives || "–",

        // Pemetaan Aktiviti (Sokong String & Array)
        activities: Array.isArray(rawData.aktiviti) ? rawData.aktiviti.join(', ') : 
                   (Array.isArray(rawData.activities) ? rawData.activities.join(', ') : 
                   (rawData.aktiviti || rawData.activities || "–")),

        // Pemetaan Penilaian
        penilaian: Array.isArray(rawData.penilaian) ? rawData.penilaian.join(', ') : 
                  (Array.isArray(rawData.assessment) ? rawData.assessment.join(', ') : 
                  (rawData.penilaian || rawData.assessment || "–")),

        // Pemetaan BBM
        aids: Array.isArray(rawData.bbm) ? rawData.bbm.join(', ') : 
             (Array.isArray(rawData.aids) ? rawData.aids.join(', ') : 
             (rawData.bbm || rawData.aids || "–")),

        kategori: rawData.kategori || rawData.category || ""
    };

    // 4. Simpan ke Firestore
    await addDoc(collection(db, 'rph'), {
      uid: user.uid,
      tarikh: dateStr,
      matapelajaran: sesi.matapelajaran,
      kelas: sesi.kelas,
      tahun: year,
      masaMula: sesi.masaMula,
      masaTamat: sesi.masaTamat,
      status: 'draft',
      dataRPH: mappedData,
      refleksi: '',
      createdAt: Timestamp.now()
    });
}

/**
 * Fungsi Pembantu: Dapatkan nombor minggu
 */
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
