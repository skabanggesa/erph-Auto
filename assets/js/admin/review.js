import { db } from '../config.js';
import { 
  doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadReviewPage(rphId) {
  const content = document.getElementById('adminContent');
  content.innerHTML = '<p>Memuatkan RPH...</p>';

  try {
    const docSnap = await getDoc(doc(db, 'rph', rphId));
    if (!docSnap.exists()) {
      content.innerHTML = '<p>RPH tidak dijumpai.</p>';
      return;
    }

    const rph = docSnap.data();
    const tarikh = rph.tarikh.toDate ? rph.tarikh.toDate().toLocaleDateString('ms-MY') : '–';

    content.innerHTML = `
      <div class="admin-section">
        <h2>Semak RPH</h2>
        <p><strong>Guru:</strong> ${rph.guruName || '–'}</p>
        <p><strong>Kelas:</strong> ${rph.kelas}</p>
        <p><strong>Mata Pelajaran:</strong> ${rph.matapelajaran}</p>
        <p><strong>Tarikh:</strong> ${tarikh}</p>
        <hr>
        <h3>Isi RPH</h3>
        <div style="background:#f9f9f9; padding:15px; border-radius:5px; margin:10px 0;">
          <p><strong>Tajuk:</strong> ${rph.dataRPH?.topic_name || '–'}</p>
          <p><strong>Objektif:</strong> ${rph.dataRPH?.objectives || '–'}</p>
          <p><strong>Aktiviti:</strong> ${rph.dataRPH?.activities || '–'}</p>
          <p><strong>Refleksi Guru:</strong> ${rph.refleksi || '<em>Tiada</em>'}</p>
        </div>
        <div class="form-group">
          <label>Komen Semakan</label>
          <textarea id="adminComment" rows="4" style="width:100%; padding:8px;">${rph.komenAdmin || ''}</textarea>
        </div>
        <button id="btnSaveReview" class="btn">Hantar Semakan</button>
        <button id="btnBack" class="btn" style="background:#888;">Kembali</button>
      </div>
    `;

    document.getElementById('btnSaveReview').addEventListener('click', async () => {
      const komen = document.getElementById('adminComment').value;
      await updateDoc(doc(db, 'rph', rphId), {
        status: 'reviewed',
        komenAdmin: komen,
        updatedAt: new Date()
      });
      alert('Semakan berjaya dihantar.');
      import('./rph-list.js').then(m => m.loadRphListPage());
    });

    document.getElementById('btnBack').addEventListener('click', () => {
      import('./rph-list.js').then(m => m.loadRphListPage());
    });

    // Muatkan nama guru
    const teacherSnap = await getDoc(doc(db, 'users', rph.userId));
    if (teacherSnap.exists()) {
      const name = teacherSnap.data().name;
      document.querySelector('p strong').nextSibling.textContent = ` ${name}`;
      // Simpan untuk paparan
      const rphDiv = document.querySelector('.admin-section');
      rphDiv.innerHTML = rphDiv.innerHTML.replace('Guru:</strong> –', `Guru:</strong> ${name}`);
    }
  } catch (err) {
    console.error(err);
    content.innerHTML = `<p>Ralat: ${err.message}</p>`;
  }
}