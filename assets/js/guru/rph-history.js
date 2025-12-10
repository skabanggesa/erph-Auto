// rph-history.js (Pastikan fail ini berada dalam folder assets/js/guru/)

import { auth, db } from '../config.js'; 
import { 
    collection, query, where, getDocs, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Fungsi untuk memuatkan senarai RPH yang hanya dimiliki oleh guru semasa
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
        
        // KLAUSA KRITIKAL: Hanya meminta RPH di mana medan 'uid' sepadan dengan UID pengguna semasa.
        // Ini mematuhi Peraturan Keselamatan Firestore yang baru.
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
        // Memaparkan ralat kepada pengguna
        content.innerHTML = `<p class="error">Ralat memuatkan senarai RPH: ${e.message}</p>
        <button class="btn btn-secondary" onclick="router.navigate('home')">Kembali ke Dashboard</button>`;
    }
}


// Nota: Anda mungkin perlu menambah fungsi rph-edit ke router.js anda
// router.js:
// 'rph-edit': (rphId) => import('./guru/rph-edit.js').then(m => m.loadRphEdit(rphId)), 
// Jika anda belum melakukannya.
