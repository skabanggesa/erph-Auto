// rph-history.js

import { auth, db } from '../config.js'; 
import { 
    collection, query, where, getDocs, orderBy, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Eksport deleteRph agar boleh digunakan oleh butang
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
    content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
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
                .rph-container { max-width: 1100px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .rph-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
                .rph-table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .rph-table th { background-color: #f8f9fa; color: #333; text-align: left; padding: 15px; border-bottom: 2px solid #dee2e6; font-weight: 600; }
                .rph-table td { padding: 15px; border-bottom: 1px solid #eee; vertical-align: middle; color: #444; }
                .rph-table tr:hover { background-color: #f1f7ff; }
                
                .badge { padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; display: inline-block; }
                .badge-draft { background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
                .badge-submitted { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                
                .action-btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; }
                .btn-edit { background-color: #4a90e2; color: white; }
                .btn-edit:hover { background-color: #357abd; }
                .btn-delete { background-color: #e74c3c; color: white; margin-left: 5px; }
                .btn-delete:hover { background-color: #c0392b; }
                .btn-back { background: #6c757d; color: white; border-radius: 8px; padding: 10px 20px; font-weight: 500; }
            </style>

            <div class="rph-container">
                <div class="rph-header">
                    <h2 style="color: #2c3e50; margin: 0;">📚 Senarai RPH Saya</h2>
                    <button class="action-btn btn-back" onclick="router.navigate('guru-home')">
                        ⬅️ Kembali ke Dashboard
                    </button>
                </div>
        `;
        
        if (querySnapshot.empty) {
            html += `
                <div style="text-align: center; padding: 50px; background: white; border-radius: 12px; border: 2px dashed #ccc;">
                    <p style="color: #7f8c8d; font-size: 1.1rem;">Anda belum mempunyai sebarang RPH.</p>
                    <button class="action-btn btn-edit" onclick="router.navigate('guru-rph-generator')" style="margin-top: 15px;">Jana RPH Sekarang</button>
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
            
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const tarikh = data.tarikh.toDate ? data.tarikh.toDate().toLocaleDateString('ms-MY') : 'N/A';
                const status = data.status ? data.status.toLowerCase() : 'draft';
                const statusClass = status === 'submitted' ? 'badge-submitted' : 'badge-draft';
                const statusLabel = status === 'submitted' ? 'Dihantar' : 'Draf';
                
                html += `
                    <tr>
                        <td style="font-weight: 500;">${tarikh}</td>
                        <td>${data.matapelajaran}</td>
                        <td><span style="background: #f0f2f5; padding: 4px 8px; border-radius: 4px;">${data.kelas}</span></td>
                        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                        <td>
                            <button class="action-btn btn-edit" onclick="router.navigate('guru-rph-edit', '${doc.id}')">
                                ✏️ Edit
                            </button>
                            <button class="action-btn btn-delete" onclick="deleteRph('${doc.id}')">
                                🗑️ Padam
                            </button>
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
        content.innerHTML = `<div class="rph-container"><p class="error">Ralat: ${e.message}</p></div>`;
    }
}
