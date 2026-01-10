// assets/js/guru/rph-history.js

import { auth, db } from '../config.js'; 
import { 
    collection, query, where, getDocs, orderBy, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Fungsi untuk memadam RPH (Hanya dibenarkan untuk Draf)
 */
window.deleteRph = async (rphId) => {
    if (!confirm("Adakah anda pasti mahu memadam RPH ini? Tindakan ini tidak boleh dibatalkan.")) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'rph', rphId));
        alert('RPH berjaya dipadam.');
        loadRphHistory(); 
    } catch (e) {
        console.error("Ralat memadam RPH:", e);
        alert(`Gagal memadam RPH: ${e.message}`);
    }
}

/**
 * Fungsi utama memaparkan senarai sejarah RPH
 */
export async function loadRphHistory() {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #666;">
            <p>Memuatkan Senarai RPH Saya...</p>
        </div>
    `;

    const user = auth.currentUser;
    if (!user) {
        content.innerHTML = '<p class="error">Sesi tamat. Sila log masuk semula.</p>';
        return;
    }

    try {
        const rphCollection = collection(db, 'rph');
        const q = query(
            rphCollection, 
            where("uid", "==", user.uid), 
            orderBy("tarikh", "desc") 
        );
        
        const querySnapshot = await getDocs(q);
        
        let html = `
            <style>
                .history-container { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 1100px; margin: 0 auto; }
                .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .rph-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .rph-table th { background-color: #f8f9fa; color: #2c3e50; text-align: left; padding: 15px; border-bottom: 2px solid #eee; font-weight: 600; }
                .rph-table td { padding: 15px; border-bottom: 1px solid #f1f1f1; color: #444; }
                .rph-table tr:hover { background-color: #f9fbff; }
                
                /* GAYA STATUS BADGE DIKEMASKINI */
                .status-badge { padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; display: inline-block; text-transform: uppercase; }
                .status-draft { background: #e9ecef; color: #495057; }
                .status-submitted { background: #fff3cd; color: #856404; }
                .status-approved { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .status-rejected { background: #f8d7da; color: #721c24; }

                .btn-action { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.85rem; margin-right: 5px; transition: 0.2s; }
                .btn-edit { background: #4a90e2; color: white; }
                .btn-delete { background: #e74c3c; color: white; }
                .btn-view { background: #6c757d; color: white; }
                .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
            </style>

            <div class="history-container">
                <div class="history-header">
                    <h2 style="margin: 0; color: #2c3e50;">📅 Senarai RPH Saya</h2>
                    <button class="btn btn-secondary" onclick="router.navigate('guru-home')">Kembali ke Dashboard</button>
                </div>
        `;
        
        if (querySnapshot.empty) {
            html += `
                <div style="text-align: center; padding: 50px; border: 2px dashed #eee; border-radius: 10px;">
                    <p style="color: #7f8c8d;">Anda belum mempunyai sebarang RPH.</p>
                    <button class="btn btn-primary" onclick="router.navigate('guru-rph-generator')">Jana RPH Sekarang</button>
                </div>`;
        } else {
            html += `
                <table class="rph-table">
                    <thead>
                        <tr>
                            <th>Tarikh</th>
                            <th>Mata Pelajaran</th>
                            <th>Kelas</th>
                            <th>Status</th>
                            <th>Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            querySnapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                const rphId = docSnap.id;
                
                // Format Tarikh
                let tarikhPaparan = 'N/A';
                if (data.tarikh) {
                    tarikhPaparan = data.tarikh.toDate ? data.tarikh.toDate().toLocaleDateString('ms-MY') : data.tarikh;
                }

                // --- PEMBAIKAN LOGIK STATUS ---
                const statusStr = (data.status || 'draft').toLowerCase();
                let statusLabel = 'Draf';
                let statusClass = 'status-draft';

                if (statusStr === 'submitted') {
                    statusLabel = 'Dihantar';
                    statusClass = 'status-submitted';
                } else if (statusStr === 'approved') {
                    statusLabel = 'Lulus';
                    statusClass = 'status-approved';
                } else if (statusStr === 'rejected') {
                    statusLabel = 'Ditolak';
                    statusClass = 'status-rejected';
                }

                // --- KAWALAN BUTANG TINDAKAN ---
                let actionsHtml = '';
                if (statusStr === 'draft') {
                    // Jika draf, boleh edit dan padam
                    actionsHtml = `
                        <button class="btn-action btn-edit" onclick="router.navigate('guru-rph-edit', '${rphId}')">Edit</button>
                        <button class="btn-action btn-delete" onclick="deleteRph('${rphId}')">Padam</button>
                    `;
                } else {
                    // Jika sudah dihantar atau lulus, hanya boleh "Lihat"
                    // (Butang Edit & Padam disembunyikan/dibuang)
                    actionsHtml = `
                        <button class="btn-action btn-view" onclick="router.navigate('guru-rph-edit', '${rphId}')">Lihat</button>
                        <span style="font-size:0.8rem; color:#999; margin-left:5px;">(Terkunci)</span>
                    `;
                }
                
                html += `
                    <tr>
                        <td style="font-weight: 600; color: #2c3e50;">${tarikhPaparan}</td>
                        <td style="font-weight: 500;">${data.matapelajaran}</td>
                        <td>${data.kelas}</td>
                        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                        <td>${actionsHtml}</td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
        }

        html += `</div>`;
        content.innerHTML = html;
        
    } catch (e) {
        console.error("Ralat memuatkan sejarah RPH:", e);
        content.innerHTML = `<p class="error">Ralat: ${e.message}</p>`;
    }
}
