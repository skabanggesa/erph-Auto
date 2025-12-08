import { auth, db } from '../config.js';
import { 
  collection, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Hari dalam minggu (Isnin = 1, ... Jumaat = 5)
const weekdays = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];

export function loadTimetableModule() {
  const content = document.getElementById('content');
  content.innerHTML = '<p>Memuatkan jadual...</p>';

  checkAndLoadTimetable();
}

async function checkAndLoadTimetable() {
  const user = auth.currentUser;
  if (!user) return;

  const docRef = doc(db, 'jadual', user.uid);
  const docSnap = await getDoc(docRef);

  const content = document.getElementById('content');
  if (docSnap.exists()) {
    // Papar dashboard utama guru
    loadGuruDashboard();
  } else {
    // Papar borang jadual mingguan
    showTimetableForm();
  }
}

function showTimetableForm() {
  let html = `
    <div class="guru-section">
      <h2>Isi Jadual Mengajar Mingguan</h2>
      <p>Sila isi jadual anda untuk Isnin hingga Jumaat.</p>
  `;

  weekdays.forEach((day, idx) => {
    const dayId = day.toLowerCase();
    html += `
      <div class="weekday">
        <div class="day-header">${day}</div>
        <div id="sessions-${dayId}"></div>
        <button type="button" class="btn" onclick="addSession('${dayId}')">+ Tambah Sesi</button>
      </div>
    `;
  });

  html += `
      <button id="saveTimetable" class="btn btn-save">Simpan Jadual</button>
      <div id="timetableError" style="color:red; margin-top:10px;"></div>
    </div>
    <script>
      window.sessions = {};
      ${weekdays.map(d => `window.sessions['${d.toLowerCase()}'] = [];`).join('\n')}

      window.addSession = function(dayId) {
        const id = 'sess_' + Date.now();
        window.sessions[dayId].push({ id, start: '08:00', end: '09:00', subject: '', class: '' });
        renderSessions(dayId);
      };

      window.renderSessions = function(dayId) {
        const container = document.getElementById('sessions-' + dayId);
        container.innerHTML = '';
        window.sessions[dayId].forEach(sess => {
          const div = document.createElement('div');
          div.className = 'session-item';
          div.innerHTML = \`
            <div>
              <input type="time" value="\${sess.start}" onchange="window.updateSession('\${dayId}', '\${sess.id}', 'start', this.value)">
              - 
              <input type="time" value="\${sess.end}" onchange="window.updateSession('\${dayId}', '\${sess.id}', 'end', this.value)">
              <input type="text" placeholder="Mata Pelajaran" value="\${sess.subject}" onchange="window.updateSession('\${dayId}', '\${sess.id}', 'subject', this.value)" style="width:120px;margin:0 5px;">
              <input type="text" placeholder="Kelas" value="\${sess.class}" onchange="window.updateSession('\${dayId}', '\${sess.id}', 'class', this.value)" style="width:80px;">
            </div>
            <button type="button" onclick="window.removeSession('\${dayId}', '\${sess.id}')" style="background:#f44336;color:white;border:none;padding:2px 6px;">X</button>
          \`;
          container.appendChild(div);
        });
      };

      window.updateSession = function(dayId, id, field, value) {
        const sess = window.sessions[dayId].find(s => s.id === id);
        if (sess) sess[field] = value;
      };

      window.removeSession = function(dayId, id) {
        window.sessions[dayId] = window.sessions[dayId].filter(s => s.id !== id);
        window.renderSessions(dayId);
      };

      // Tambah sesi awal untuk setiap hari
      ${weekdays.map(d => `addSession('${d.toLowerCase()}');`).join('\n')}
    </script>
  `;

  document.getElementById('content').innerHTML = html;
  document.getElementById('saveTimetable').addEventListener('click', saveTimetableToFirestore);
}

async function saveTimetableToFirestore() {
  const errorDiv = document.getElementById('timetableError');
  errorDiv.textContent = '';

  // Kumpul data
  const jadual = [];
  weekdays.forEach(day => {
    const dayId = day.toLowerCase();
    const sessions = window.sessions[dayId].filter(s => s.subject.trim() && s.class.trim());
    sessions.forEach(sess => {
      jadual.push({
        hari: day,
        masaMula: sess.start,
        masaTamat: sess.end,
        matapelajaran: sess.subject.trim(),
        kelas: sess.class.trim()
      });
    });
  });

  if (jadual.length === 0) {
    errorDiv.textContent = 'Sila isi sekurang-kurangnya satu sesi pengajaran.';
    return;
  }

  try {
    const user = auth.currentUser;
    await setDoc(doc(db, 'jadual', user.uid), {
      userId: user.uid,
      senarai: jadual,
      updatedAt: new Date()
    });
    alert('Jadual berjaya disimpan!');
    loadGuruDashboard();
  } catch (err) {
    errorDiv.textContent = 'Ralat: ' + err.message;
  }
}

function loadGuruDashboard() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="guru-section">
      <h2>Dashboard Guru</h2>
      <button id="btnGenerateRph" class="btn">Jana RPH Baru</button>
      <button id="btnViewRph" class="btn">Senarai RPH Saya</button>
      <div id="guruContent" style="margin-top:20px;"></div>
    </div>
  `;

  document.getElementById('btnGenerateRph').addEventListener('click', () => {
    import('./rph-generator.js').then(m => m.loadRphGenerator());
  });

  document.getElementById('btnViewRph').addEventListener('click', () => {
    import('./rph-history.js').then(m => m.loadRphHistory());
  });
}

// Panggil mula
loadTimetableModule();