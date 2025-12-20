// assets/js/admin/audit-logs.js

import { db } from '../config.js';
import { 
  collection, query, orderBy, limit, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Memuatkan senarai aktiviti pengguna (Audit Log)
 */
export async function loadAuditLogs() {
  const content = document.getElementById('adminContent');
  
  content.innerHTML = `
    <div class="admin-section">
      <h2>Log Aktiviti Sistem (Audit Trail)</h2>
      <p>Memaparkan 50 aktiviti terbaru pengguna dalam sistem.</p>
      
      <div id="logsContainer" class="table-container" style="margin-top: 20px;">
          <p>Memuatkan log...</p>
      </div>
    </div>
  `;

  try {
    // Ambil 50 log terbaru, disusun mengikut masa (paling baru di atas)
    const logsRef = collection(db, 'logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      document.getElementById('logsContainer').innerHTML = '<p>Tiada rekod aktiviti dijumpai.</p>';
      return;
    }

    let html = `
      <table class="admin-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2; text-align: left;">
            <th style="padding: 12px; border-bottom: 2px solid #ddd;">Tarikh & Masa</th>
            <th style="padding: 12px; border-bottom: 2px solid #ddd;">Pengguna</th>
            <th style="padding: 12px; border-bottom: 2px solid #ddd;">Tindakan</th>
            <th style="padding: 12px; border-bottom: 2px solid #ddd;">Butiran</th>
          </tr>
        </thead>
        <tbody>
    `;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Formatkan timestamp Firestore ke format tempatan (ms-MY)
      const date = data.timestamp ? data.timestamp.toDate() : new Date();
      const timeStr = date.toLocaleString('ms-MY', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });

      // Warna label tindakan (Badge)
      let actionColor = '#7f8c8d'; // Default kelabu
      if (data.action === 'GENERATE_RPH') actionColor = '#27ae60'; // Hijau
      if (data.action === 'LOGIN') actionColor = '#2980b9'; // Biru
      if (data.action === 'DELETE_RPH') actionColor = '#e74c3c'; // Merah

      html += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; font-family: monospace;">${timeStr}</td>
          <td style="padding: 10px;"><strong>${data.userName || 'Unknown'}</strong></td>
          <td style="padding: 10px;">
            <span style="background: ${actionColor}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.85em;">
              ${data.action}
            </span>
          </td>
          <td style="padding: 10px; font-size: 0.9em; color: #555;">${data.details || '-'}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    document.getElementById('logsContainer').innerHTML = html;

  } catch (error) {
    console.error("Gagal memuatkan log:", error);
    document.getElementById('logsContainer').innerHTML = `
      <p class="error">Ralat: ${error.message}<br>
      <small>Pastikan Security Rules untuk koleksi /logs telah di-Publish.</small></p>
    `;
  }
}
