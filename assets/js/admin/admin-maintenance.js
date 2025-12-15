import { db } from '../config.js'; 
import { 
    collection, getDocs, deleteDoc, doc, 
    writeBatch, runTransaction, 
    addDoc, 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Eksport fungsi utama untuk router anda
export function loadAdminMaintenancePage() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="admin-section">
            <h2>Penyelenggaraan & Statistik Sistem</h2>
            
            <h3>1. Statistik Penggunaan Sistem</h3>
            <div id="usageStats" style="border: 1px solid #ccc; padding: 15px; border-radius: 5px; margin-bottom: 30px;">
                <p>Memuatkan statistik...</p>
            </div>

            <h3>2. Pengurusan Data Koleksi /rph</h3>
            <div style="background-color: #ffe0b2; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="color: #e65100; font-weight: bold;">⚠️ AMARAN KRITIKAL:</p>
                <p>Pengendalian data secara besar-besaran (Eksport/Padam) boleh memakan masa dan berpotensi membebankan kuota bacaan Firestore. Gunakan dengan berhati-hati.</p>
                <p>Fungsi Padam *Batch* ini hanya disyorkan untuk data *non-production* atau apabila anda telah membuat sandaran lengkap.</p>
            </div>

            <div class="maintenance-actions" style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                    <h4>Eksport Data RPH (Sandaran)</h4>
                    <p>Muat turun semua dokumen dari koleksi /rph ke dalam fail JSON.</p>
                    <button id="btnExportRPH" class="btn btn-primary">Muat Turun Data</button>
                </div>
                
                <div style="flex: 1;">
                    <h4>Import Data RPH (Pulihkan)</h4>
                    <p>Muat naik fail JSON sandaran untuk memulihkan koleksi /rph.</p>
                    <input type="file" id="fileImportRPH" accept="application/json" style="margin-bottom: 10px;" />
                    <button id="btnImportRPH" class="btn btn-success" disabled>Muat Naik & Pulihkan</button>
                </div>

                <div style="flex: 1;">
                    <h4>Kosongkan Koleksi RPH (Padam)</h4>
                    <p>Padam **SEMUA** dokumen dalam koleksi /rph. Tindakan ini tidak boleh diundur.</p>
                    <button id="btnDeleteRPH" class="btn btn-danger">Padam Semua Data RPH</button>
                </div>
            </div>

            <div id="maintenanceStatus" style="margin-top: 20px;"></div>
        </div>
    `;

    showUsageStatistics();
    
    // Pasang Event Listeners
    document.getElementById('btnExportRPH').addEventListener('click', exportRphData);
    
    const fileImportRPH = document.getElementById('fileImportRPH');
    const btnImportRPH = document.getElementById('btnImportRPH');

    fileImportRPH.addEventListener('change', () => {
        btnImportRPH.disabled = fileImportRPH.files.length === 0;
    });
    btnImportRPH.addEventListener('click', importRphData);
    
    document.getElementById('btnDeleteRPH').addEventListener('click', deleteRphData);
}

/**
 * Memaparkan statistik penggunaan sistem (berasaskan data yang boleh diakses klien).
 */
async function showUsageStatistics() {
    const statsDiv = document.getElementById('usageStats');
    statsDiv.innerHTML = '<p>Mengira dokumen...</p>';
    
    try {
        // 1. Kira jumlah RPH
        const rphSnap = await getDocs(collection(db, 'rph'));
        const totalRph = rphSnap.size;

        // 2. Kira jumlah pengguna (Guru/Admin)
        const userSnap = await getDocs(collection(db, 'users'));
        const totalUsers = userSnap.size;

        // 3. Kira RPH yang dihantar hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Catatan: Firestore tidak menyokong carian timestamp mudah. 
        // Untuk meminimumkan bacaan, kita hanya boleh mengira semua dan menapis 
        // atau bergantung pada medan updateAt/createdAt jika ia disimpan sebagai Timestamp.
        // Kita gunakan anggaran mudah berdasarkan tarikh (ini memerlukan tarikh disimpan sebagai Timestamp)
        
        const rphToday = rphSnap.docs.filter(doc => {
            const data = doc.data();
            if (data.updatedAt && data.updatedAt.toDate) {
                return data.updatedAt.toDate() >= today;
            }
            return false;
        }).length;
        

        statsDiv.innerHTML = `
            <h4>Anggaran Kesihatan Pangkalan Data</h4>
            <ul>
                <li><strong>Jumlah Dokumen RPH:</strong> ${totalRph} dokumen</li>
                <li><strong>Jumlah Pengguna (Guru + Admin):</strong> ${totalUsers} pengguna</li>
                <li><strong>RPH Dikemas Kini Hari Ini:</strong> ${rphToday} sesi</li>
            </ul>
            <p>Ini menggunakan ${totalRph + totalUsers} bacaan Firestore untuk dikira.</p>
        `;
        
    } catch (error) {
        statsDiv.innerHTML = `<p class="error">Gagal memuatkan statistik: ${error.message}</p>`;
        console.error("Ralat memuatkan statistik:", error);
    }
}

/**
 * Mengeksport data RPH sebagai fail JSON.
 */
async function exportRphData() {
    const statusDiv = document.getElementById('maintenanceStatus');
    statusDiv.innerHTML = '<p class="info">Memulakan eksport... Sila tunggu.</p>';
    
    try {
        const rphSnap = await getDocs(collection(db, 'rph'));
        const exportData = {};

        rphSnap.forEach(doc => {
            const data = doc.data();
            // Penting: Tukar Timestamp Firestore kepada string ISO yang boleh dibaca
            for (const key in data) {
                if (data[key] && typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
            exportData[doc.id] = data;
        });

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `rph_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        statusDiv.innerHTML = `<p class="success">✅ Eksport Selesai! ${rphSnap.size} dokumen telah dimuat turun.</p>`;

    } catch (error) {
        statusDiv.innerHTML = `<p class="error">Gagal mengeksport data: ${error.message}</p>`;
        console.error("Ralat eksport:", error);
    }
}

/**
 * Mengimport data RPH dari fail JSON.
 */
function importRphData() {
    const statusDiv = document.getElementById('maintenanceStatus');
    const fileImportRPH = document.getElementById('fileImportRPH');
    
    if (fileImportRPH.files.length === 0) {
        statusDiv.innerHTML = '<p class="warning">Sila pilih fail JSON untuk diimport.</p>';
        return;
    }

    if (!confirm("Anda pasti ingin memulihkan data RPH? Ini akan MENCIPTA dokumen baharu. Pastikan anda telah MENGOSONGKAN koleksi terlebih dahulu untuk mengelakkan pendua.")) {
        return;
    }
    
    const file = fileImportRPH.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const jsonText = e.target.result;
            const importData = JSON.parse(jsonText);
            let importedCount = 0;
            let importError = 0;
            
            statusDiv.innerHTML = '<p class="info">Memulakan proses import...</p>';
            
            // Menggunakan Write Batch untuk import yang efisien
            const batch = writeBatch(db);
            let batchCount = 0;
            
            for (const docId in importData) {
                const data = importData[docId];
                
                // Konversi kembali string ISO ke Date object sebelum menyimpan
                for (const key in data) {
                    if (typeof data[key] === 'string' && (key.toLowerCase().includes('date') || key.toLowerCase().includes('at') || key === 'tarikh')) {
                         // Cuba tukar kepada tarikh jika formatnya adalah string ISO
                         if (!isNaN(new Date(data[key]))) {
                             data[key] = new Date(data[key]);
                         }
                    }
                }
                
                // Peringatan: Kita MENGGUNAKAN addDoc untuk MENGELAKKAN isu permission jika docId dikekalkan.
                // Ini akan mencipta ID baharu, tetapi lebih selamat.
                batch.set(doc(collection(db, 'rph'), docId), data); // Jika anda mahu kekalkan ID asal (perlukan batch.set & permission yang sesuai)
                // ATAU:
                // batch.set(doc(collection(db, 'rph'), docId), data);
                // Kita gunakan addDoc (ID baru) kerana ia lebih selamat dari segi permission.
                
                batchCount++;
                if (batchCount >= 499) { // Firebase limit: 500 operasi per batch
                    await batch.commit();
                    batchCount = 0;
                    // Mulakan batch baharu
                    batch = writeBatch(db);
                }

                importedCount++;
            }
            
            // Komit batch yang terakhir
            if (batchCount > 0) {
                await batch.commit();
            }

            statusDiv.innerHTML = `<p class="success">✅ Import Selesai! ${importedCount} dokumen telah diimport semula.</p>`;
            showUsageStatistics();

        } catch (error) {
            statusDiv.innerHTML = `<p class="error">Gagal mengimport data: ${error.message}</p>`;
            console.error("Ralat import:", error);
        }
    };

    reader.readAsText(file);
}


/**
 * Memadam semua dokumen dalam koleksi /rph.
 */
async function deleteRphData() {
    const statusDiv = document.getElementById('maintenanceStatus');
    
    if (!confirm("ADAKAH ANDA PASTI? Tindakan ini akan memadam SEMUA data dalam koleksi /rph dan TIDAK BOLEH DIBATALKAN. Sila muat turun sandaran terlebih dahulu.")) {
        return;
    }
    
    statusDiv.innerHTML = '<p class="info">Memulakan pemadaman data... Sila tunggu.</p>';

    try {
        const collectionRef = collection(db, 'rph');
        let deletedCount = 0;
        let batch;
        let documents;

        do {
            // Kita hadkan fetch kepada 500 dokumen setiap kali untuk pemadaman batch
            documents = await getDocs(collectionRef); 
            if (documents.size === 0) break;

            batch = writeBatch(db);
            
            documents.forEach(docSnapshot => {
                batch.delete(doc(db, 'rph', docSnapshot.id));
                deletedCount++;
            });

            await batch.commit();
            statusDiv.innerHTML = `<p class="info">Memadam... ${deletedCount} dokumen telah dipadam sejauh ini.</p>`;

        } while (documents.size > 0); 
        
        statusDiv.innerHTML = `<p class="success">✅ Pemadaman Selesai! Sebanyak ${deletedCount} dokumen telah dipadam dari koleksi /rph.</p>`;
        showUsageStatistics();

    } catch (error) {
        statusDiv.innerHTML = `<p class="error">Gagal memadam data: ${error.message}</p>`;
        console.error("Ralat pemadaman batch:", error);
    }
}