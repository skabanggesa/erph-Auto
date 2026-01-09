// assets/js/guru/rph-history.js

import { auth, db } from '../config.js'; 
import { 
    collection, query, where, getDocs, orderBy, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Fungsi untuk memadam RPH
 * Diletakkan dalam 'window' supaya boleh dipanggil dari HTML string
 */
window.deleteRph = async (rphId) => {
    if (!confirm("Adakah anda pasti mahu memadam RPH ini? Tindakan ini tidak boleh dibatalkan.")) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'rph', rphId));
        alert('RPH berjaya dipadam.');
        loadRphHistory(); // Refresh senarai selepas padam
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
        // Susun mengikut tarikh paling baru di atas
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
                .status-badge { padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; display: inline-block; text-transform: uppercase; }
                .status-draft { background: #fff3cd; color: #856404; }
                .status-submitted { background: #d4edda; color: #155724; }
                .btn-action { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.85rem; margin-right: 5px; transition: 0.2s; }
                .btn-edit { background: #4a90e2; color: white; }
                .btn-edit:hover { background: #357abd; }
                .btn-delete { background: #e74c3c; color: white; }
                .btn-delete:hover { background: #c0392b; }
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
                
                // --- PENYELESAIAN MASALAH N/A ---
                // Jika tarikh ada fungsi .toDate() (Firestore Timestamp), tukar. 
                // Jika tidak, guna data.tarikh terus (String). Jika langsung tiada, baru 'N/A'.
                let tarikhPaparan = 'N/A';
                if (data.tarikh) {
                    if (data.tarikh.toDate) {
                        tarikhPaparan = data.tarikh.toDate().toLocaleDateString('ms-MY');
                    } else {
                        tarikhPaparan = data.tarikh;
                    }
                }

                const statusStr = (data.status || 'draft').toLowerCase();
                const statusLabel = statusStr === 'submitted' ? 'Dihantar' : 'Draf';
                const statusClass = statusStr === 'submitted' ? 'status-submitted' : 'status-draft';
                
                html += `
                    <tr>
                        <td style="font-weight: 600; color: #2c3e50;">${tarikhPaparan}</td>
                        <td style="font-weight: 500;">${data.matapelajaran}</td>
                        <td>${data.kelas}</td>
                        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                        <td>
                            <button class="btn-action btn-edit" onclick="router.navigate('guru-rph-edit', '${docSnap.id}')">Edit</button>
                            <button class="btn-action btn-delete" onclick="deleteRph('${docSnap.id}')">Padam</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
        }

        html += `</div>`;
        content.innerHTML = html;
        
    } catch (e) {
        console.error("Ralat memuatkan sejarah RPH:", e);
        content.innerHTML = `
            <div style="padding: 20px; color: #dc3545; background: #fff5f5; border-radius: 8px; margin: 20px;">
                <p><strong>Ralat:</strong> ${e.message}</p>
                <button class="btn btn-secondary" onclick="router.navigate('guru-home')">Kembali ke Dashboard</button>
            </div>
        `;
    }
}
