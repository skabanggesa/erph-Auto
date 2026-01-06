// assets/js/guru/rph-generator.js

import { auth, db, getTemplateUrl } from '../config.js';
import { 
  doc, getDoc, collection, addDoc, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Import fungsi dari rph-history.js
import { loadRphHistory } from './rph-history.js'; 

export function loadRphGenerator() {
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <style>
      .generator-container { 
        max-width: 800px; 
        margin: 20px auto; 
        background: white; 
        padding: 30px; 
        border-radius: 12px; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        font-family: 'Segoe UI', system-ui, sans-serif; 
      }
      .generator-header { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        border-bottom: 2px solid #f0f2f5; 
        margin-bottom: 25px; 
        padding-bottom: 15px; 
      }
      .form-group { margin-bottom: 25px; }
      .form-group label { display: block; margin-bottom: 10px; font-weight: 600; color: #333; font-size: 0.95rem; }
      .form-group input[type="date"] { 
        width: 100%; 
        padding: 12px; 
        border: 1px solid #ced4da; 
        border-radius: 8px; 
        font-size: 1rem; 
      }
      .btn-main { 
        width: 100%; 
        padding: 15px; 
        border-radius: 8px; 
        border: none; 
        cursor: pointer; 
        font-weight: 600; 
        font-size: 1rem; 
        transition: 0.2s; 
      }
      .btn-generate { background: #28a745; color: white; }
      .btn-generate:hover { background: #218838; }
      .btn-generate:disabled { background: #6c757d; cursor: not-allowed; }
      
      .btn-back-dashboard { 
        background: #f8f9fa; 
        color: #333; 
        border: 1px solid #ddd; 
        padding: 8px 15px; 
        border-radius: 6px; 
        font-size: 0.85rem; 
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .btn-back-dashboard:hover { background: #e2e6ea; }

      #generatorResult { 
        margin-top: 25px; 
        padding: 20px; 
        background: #f8f9fa; 
        border-radius: 10px; 
        border: 1px solid #e9ecef; 
      }
      .session-list { list-style: none; padding: 0; }
      .session-item { 
        background: white; 
        padding: 12px; 
        margin-bottom: 8px; 
        border-radius: 6px; 
        border-left: 4px solid #4a90e2;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      }
    </style>

    <div class="generator-container">
      <div class="generator-header">
        <h2 style="margin: 0; color: #2c3e50;">🚀 Jana RPH Automatik</h2>
        <button class="btn-back-dashboard" onclick="router.navigate('guru-home')">🏠 Kembali Ke Dashboard</button>
      </div>
      
      <div class="form-group">
        <label>Pilih Tarikh Pengajaran</label>
        <input type="date" id="rphDate" />
      </div>
      
      <button id="btnGenerateAll" class="btn-main btn-generate">Jana SEMUA RPH Sekarang</button>
      
      <div id="generatorResult">
          <p style="text-align: center; color: #666;">Sila pilih tarikh untuk melihat sesi yang dijadualkan.</p>
      </div>
    </div>
  `;

  // Tetapkan tarikh hari ini sebagai default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rphDate').value = today;

  // Pasang Event Listeners
  document.getElementById('rphDate').addEventListener('change', loadScheduledSessions);
  document.getElementById('btnGenerateAll').addEventListener('click', generateAllRphInBatch);
  
  loadScheduledSessions();
}

/**
 * 🔄 FUNGSI 1: Memuatkan dan memaparkan sesi yang dijadualkan.
 */
async function loadScheduledSessions() {
    const dateInput = document.getElementById('rphDate').value;
    const resultDiv = document.getElementById('generatorResult');
    if (!dateInput) {
        resultDiv.innerHTML = '<p style="color: #856404;">Sila pilih tarikh.</p>';
        return;
    }

    const selectedDate = new Date(dateInput);
    const hari = selectedDate.toLocaleDateString('ms-MY', { weekday: 'long' });
    
    if (!['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'].includes(hari)) {
        resultDiv.innerHTML = '<p style="color: #dc3545; font-weight: bold;">RPH hanya boleh dijana untuk hari persekolahan (Isnin - Jumaat).</p>';
        return;
    }
    
    resultDiv.innerHTML = `<p>Mencari sesi untuk <strong>${hari}</strong>...</p>`;
    
    try {
        const user = auth.currentUser;
        const jadualRef = doc(db, 'jadual', user.uid);
        const jadualSnap = await getDoc(jadualRef);

        if (!jadualSnap.exists() || !jadualSnap.data() || !jadualSnap.data().senarai) {
            resultDiv.innerHTML = `<p style="color: #dc3545;">Jadual mingguan belum diisi. Sila kemaskini jadual anda dahulu.</p>`;
            return;
        }

        const senaraiJadual = jadualSnap.data().senarai;
        const sesiHari = senaraiJadual.filter(s => s.hari === hari);
        
        let html = `<h3 style="margin-top: 0; color: #2c3e50;">Sesi untuk ${hari}, ${selectedDate.toLocaleDateString('ms-MY')}</h3>`;
        
        if (sesiHari.length === 0) {
            html += '<p>Tiada sesi mengajar dijadualkan pada hari ini.</p>';
        } else {
             html += `<div class="session-list">
                 ${sesiHari.map((sesi) => `
                     <div class="session-item">
                         <strong>${sesi.masaMula} - ${sesi.masaTamat}</strong> | ${sesi.matapelajaran} | ${sesi.kelas}
                     </div>
                 `).join('')}
             </div>
             <p style="margin-top: 15px; color: #28a745; font-weight: 600;">Klik butang di atas untuk menjana ${sesiHari.length} RPH draf.</p>`;
        }
        
        resultDiv.innerHTML = html;

    } catch (error) {
        console.error("Ralat memuatkan sesi:", error);
        resultDiv.innerHTML = `<p style="color: #dc3545;">Gagal memuatkan sesi jadual: ${error.message}</p>`;
    }
}

/**
 * 🔑 FUNGSI 2: Menjana SEMUA RPH (BATCH PROCESS).
 */
async function generateAllRphInBatch() {
    const dateInput = document.getElementById('rphDate').value;
    const resultDiv = document.getElementById('generatorResult');
    
    if (!dateInput) return;

    const selectedDate = new Date(dateInput);
    const btn = document.getElementById('btnGenerateAll');
    btn.disabled = true;
    btn.textContent = '⏳ Sedang Menjana...';
    
    try {
        const user = auth.currentUser;
        const jadualRef = doc(db, 'jadual', user.uid);
        const jadualSnap = await getDoc(jadualRef);

        const senaraiJadual = jadualSnap.data().senarai;
        const hari = selectedDate.toLocaleDateString('ms-MY', { weekday: 'long' });
        const sesiHari = senaraiJadual.filter(s => s.hari === hari);
        
        let successCount = 0;
        let skipCount = 0;

        for (const sesi of sesiHari) {
            try {
                await generateRphForSingleSession(selectedDate, sesi); 
                successCount++;
            } catch (err) {
                if (err.message.includes('RPH sudah wujud')) {
                    skipCount++;
                }
            }
        }

        resultDiv.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #28a745;">✅ Penjanaan Selesai!</h3>
                <p>Berjaya dijana: <strong>${successCount} sesi</strong></p>
                ${skipCount > 0 ? `<p style="color: #856404;">Dilangkau (sudah ada): <strong>${skipCount} sesi</strong></p>` : ''}
                
                <div style="margin-top: 20px;">
                    <button id="btnViewRphList" class="btn-main" style="background: #007bff; color: white;">Lihat Senarai RPH Saya</button>
                </div>
            </div>
        `;
        
        document.getElementById('btnViewRphList').addEventListener('click', () => {
             loadRphHistory(); 
        });
        
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #dc3545;">Ralat: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Jana SEMUA RPH Sekarang';
    }
}

/**
 * 🔄 FUNGSI 3: Logik simpan ke Firestore.
 */
async function generateRphForSingleSession(selectedDate, sesi) {
    const month = selectedDate.getMonth() + 1; 
    
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
        throw new Error(`RPH sudah wujud.`);
    }
    
    const res = await fetch(getTemplateUrl(sesi.matapelajaran));
    if (!res.ok) throw new Error('Template tidak dijumpai.');
    
    const topics = await res.json();
    const topicIndex = (month - 1) % topics.length;

    await addDoc(collection(db, 'rph'), {
      uid: auth.currentUser.uid, 
      tarikh: selectedDate, 
      matapelajaran: sesi.matapelajaran,
      kelas: sesi.kelas,
      masaMula: sesi.masaMula,
      masaTamat: sesi.masaTamat,
      status: 'draft',
      dataRPH: topics[topicIndex],
      refleksi: '',
      updatedAt: new Date() 
    });
}
