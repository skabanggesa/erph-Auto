// assets/js/guru/rph-history.js (VERSI DIKEMASKINI DENGAN STATUS PENUH)

import { auth, db } from '../config.js'; 
import { 
    collection, query, where, getDocs, orderBy, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

export async function loadRphHistory() {
    const content = document.getElementById('content');
    content.innerHTML = `<div style="padding: 40px; text-align: center; color: #666;"><p>Memuatkan Senarai RPH Saya...</p></div>`;

    const user = auth.currentUser;
    if (!user) {
        content.innerHTML = '<p class="error">Sesi tamat. Sila log masuk semula.</p>';
        return;
    }

    try {
        const q = query(collection(db, 'rph'), where("uid", "==", user.uid), orderBy("tarikh", "desc"));
        const querySnapshot = await getDocs(q);
        
        let html = `
            <style>
                .history-container { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 1100px; margin: 0 auto; }
                .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .rph-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .rph-table th { background-color: #f8f9fa; color: #2c3e50; text-align: left; padding: 15px; border-bottom: 2px solid #eee; font-weight: 600; }
                .rph-table td { padding: 15px; border-bottom: 1px solid #f1f1f1; color: #444; }
                .status-badge { padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; display: inline-block; text-transform: uppercase; }
                
                /* Penambahan Warna Status */
                .status-draft { background: #fff3cd; color: #856404; }
                .status-submitted { background: #cfe2ff; color: #084298; }
                .status-approved { background: #d4edda; color: #155724; }
                .status-rejected { background: #f8d7da; color: #842029; }

                .btn-action { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.85rem; margin-right: 5px; transition: 0.2s; }
                .btn-edit { background: #4a90e2; color: white; }
                .btn-delete { background: #e74c3c; color: white; }
                .btn-disabled { background: #ccc; color: #666; cursor: not-allowed; }
            </style>
            <div class="history-container">
                <div class="history-header">
                    <h2 style="margin: 0; color: #2c3e50;">📅 Senarai RPH Saya</h2>
                    <button class="btn btn-secondary" onclick="router.navigate('guru-home')">Kembali</button>
                </div>
        `;
        
        if (querySnapshot.empty) {
            html += `<div style="text-align: center; padding: 50px;"><p>Tiada RPH ditemui.</p></div>`;
        } else {
            html += `<table class="rph-table"><thead><tr><th>Tarikh</th><th>Mata Pelajaran</th><th>Kelas</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>`;
            
            querySnapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                const tarikhPaparan = data.tarikh?.toDate ? data.tarikh.toDate().toLocaleDateString('ms-MY') : (data.tarikh || 'N/A');
                
                // --- LOGIK STATUS YANG DIPERBAIKI ---
                const status = (data.status || 'draft').toLowerCase();
                let statusLabel = 'Draf';
                let statusClass = 'status-draft';

                if (status === 'submitted') {
                    statusLabel = 'Dihantar';
                    statusClass = 'status-submitted';
                } else if (status === 'approved') {
                    statusLabel = 'Lulus';
                    statusClass = 'status-approved';
                } else if (status === 'rejected') {
                    statusLabel = 'Ditolak';
                    statusClass = 'status-rejected';
                }

                // Sekat butang Edit/Padam jika sudah diluluskan
                const isDisabled = status === 'approved';

                html += `
                    <tr>
                        <td><strong>${tarikhPaparan}</strong></td>
                        <td>${data.matapelajaran}</td>
                        <td>${data.kelas}</td>
                        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                        <td>
                            ${isDisabled ? 
                                `<span style="font-size:0.8rem; color:gray;">Selesai (Tiada Tindakan)</span>` : 
                                `<button class="btn-action btn-edit" onclick="router.navigate('guru-rph-edit', '${docSnap.id}')">Edit</button>
                                 <button class="btn-action btn-delete" onclick="deleteRph('${docSnap.id}')">Padam</button>`
                            }
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
        }
        content.innerHTML = html + `</div>`;
    } catch (e) {
        console.error("Ralat:", e);
        content.innerHTML = `<p class="error">Ralat: ${e.message}</p>`;
    }
}
