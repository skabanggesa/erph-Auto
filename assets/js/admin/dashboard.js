// Muatkan UI admin utama
import { db } from '../config.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.getElementById('content').innerHTML = `
  <div class="admin-section">
    <h2>Panel Pentadbir</h2>
    <button id="btnTeachers" class="btn">Urus Guru</button>
    <button id="btnRph" class="btn">Lihat RPH</button>
    <button id="btnAnalytics" class="btn">Analisis</button>
    <div id="adminContent" style="margin-top: 20px;"></div>
  </div>
`;

document.getElementById('btnTeachers').addEventListener('click', () => {
  import('./teachers.js').then(m => m.loadTeachersPage());
});

document.getElementById('btnRph').addEventListener('click', () => {
  import('./rph-list.js').then(m => m.loadRphListPage());
});

document.getElementById('btnAnalytics').addEventListener('click', async () => {
  const content = document.getElementById('adminContent');
  content.innerHTML = '<p>Muatkan analisis...</p>';
  import('./analytics.js').then(m => m.loadAnalytics());
});