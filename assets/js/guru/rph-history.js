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
        // Muat semula senarai selepas berjaya memadam
        loadRphHistory(); 
    } catch (e) {
        console.error("Ralat memadam RPH:", e);
        alert(`Gagal memadam RPH: ${e.message}`);
    }
}

export async function loadRphHistory() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="guru-section">
            <h2>Memuatkan Senarai RPH Saya...</h2>
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
            <div class="guru-section">
                <h2>Senarai RPH Saya</h2>
                <button class="btn btn-secondary" onclick="router.navigate('home')" style="margin-bottom: 20px;">Kembali ke Dashboard</button>
        `;
        
        if (querySnapshot.empty) {
            html += '<p>Anda belum mempunyai sebarang RPH. Sila jana RPH baru.</p>';
        } else {
            html += '<table class="rph-list-table">';
            // PERUBAHAN: Tambah lajur 'Padam'
            html += '<thead><tr><th>Tarikh</th><th>Mata Pelajaran</th><th>Kelas</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>';
            
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const tarikh = data.tarikh.toDate ? data.tarikh.toDate().toLocaleDateString('ms-MY') : 'N/A';
                
                html += `
                    <tr>
                        <td>${tarikh}</td>
                        <td>${data.matapelajaran}</td>
                        <td>${data.kelas}</td>
                        <td>${data.status.toUpperCase()}</td>
                        <td>
                            <button class="btn btn-sm" onclick="router.navigate('rph-edit', '${doc.id}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteRph('${doc.id}')">Padam</button>
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
        content.innerHTML = `<p class="error">Ralat memuatkan senarai RPH: ${e.message}</p>
        <button class="btn btn-secondary" onclick="router.navigate('home')">Kembali ke Dashboard</button>`;
    }
}
