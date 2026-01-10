// assets/js/admin/rph-review.js (VERSI TINDAKAN PUKAL)

import { auth, db } from '../config.js'; 
import { 
    collection, query, where, getDocs, 
    doc, getDoc, writeBatch, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const navigate = window.router?.navigate; 

/**
 * Memuatkan halaman senarai semakan RPH untuk Admin.
 */
export async function loadRphReviewPage(params) {
    const content = document.getElementById('adminContent');
    const teacherUid = params?.uid;
    
    if (!teacherUid) {
        content.innerHTML = `
            <div class="admin-section">
                <p class="warning">⚠️ Sila pilih guru dari Analisis Laporan untuk memulakan semakan.</p>
                <button onclick="window.router.navigate('admin-analytics')" class="btn-primary">Kembali ke Analisis</button>
            </div>`;
        return;
    }

    // Menambah Panel Tindakan Pukal di bahagian atas senarai
    content.innerHTML = `
        <div class="admin-section">
            <h2>Semakan RPH Guru</h2>
            
            <div id="bulkActionContainer" style="display:none; background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #007bff;">
                <h4 style="margin-top:0; color: #007bff;">Tindakan Pukal (<span id="selectedCount">0</span> RPH dipilih)</h4>
                <p style="font-size: 0.9rem; color: #666;">Komen di bawah akan dimasukkan ke dalam semua RPH yang dipilih.</p>
                <textarea id="bulkComment" placeholder="Contoh: Tahniah, RPH lengkap dan memenuhi kriteria." style="width:100%; padding:10px; margin-bottom:12px; border-radius:4px; border:1px solid #ccc; font-family: inherit;"></textarea>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button id="btnBulkApprove" class="btn btn-success" style="background:#28a745; color:white; border:none; padding:10px 20px; cursor:pointer; border-radius:4px; font-weight:bold;">Luluskan Pilihan</button>
                    <span id="bulkStatus" style="font-weight:bold;"></span>
                </div>
            </div>

            <div id="rphReviewList" style="margin-top: 20px;">
                <p>Memuatkan maklumat guru dan senarai RPH...</p>
            </div>
        </div>
    `;

    try {
        let teacherName = "Guru";
        const teacherDoc = await getDoc(doc(db, 'users', teacherUid)); 
        if (teacherDoc.exists()) {
            teacherName = teacherDoc.data().name;
        }

        const rphQuery = query(
            collection(db, 'rph'),
            where('uid', '==', teacherUid)
        );
        const rphSnap = await getDocs(rphQuery);
        
        let html = `<h3>Senarai RPH untuk ${teacherName}</h3>`;
        
        if (rphSnap.empty) {
            html += `<p class="warning">Tiada RPH ditemui untuk guru ini.</p>`;
        } else {
            html += `
                <p>Jumlah RPH ditemui: <strong>${rphSnap.size}</strong></p>
                <div class="table-container">
                    <table id="rphTable" style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #fff0f0;">
                                <th style="width: 40px; padding: 12px;"><input type="checkbox" id="selectAll"></th>
                                <th style="padding: 12px; text-align: left;">Tarikh</th>
                                <th style="padding: 12px; text-align: left;">Mata Pelajaran & Tajuk</th>
                                <th style="padding: 12px; text-align: left;">Status</th>
                                <th style="padding: 12px; text-align: left;">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            rphSnap.forEach(docSnap => {
                const r = docSnap.data();
                const displayDate = r.tarikh || 'N/A';
                const displaySubject = r.matapelajaran || r.mataPelajaran || 'N/A';
                const displayTopic = r.tajuk || r.topik || '-';
                const statusValue = String(r.status || 'N/A').toLowerCase();
                
                // Logik Checkbox: Hanya benarkan pemilihan jika status 'submitted' atau 'rejected'
                const canSelect = (statusValue === 'submitted' || statusValue === 'rejected');

                html += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px; text-align: center;">
                            ${canSelect ? `<input type="checkbox" class="rph-checkbox" value="${docSnap.id}">` : ''}
                        </td>
                        <td style="padding: 12px;"><strong>${displayDate}</strong></td>
                        <td style="padding: 12px;">
                            <div style="font-weight:bold; color:#2c3e50;">${displaySubject}</div>
                            <div style="font-size:0.85rem; color:#666;">${displayTopic}</div>
                        </td>
                        <td style="padding: 12px;"><span class="status-${statusValue}">${statusValue.toUpperCase()}</span></td>
                        <td style="padding: 12px;">
                            <button class="btn-review" onclick="window.router.navigate('admin-rph-detail', { id: '${docSnap.id}' })" style="padding: 6px 12px; cursor: pointer;">
                                Semak
                            </button>
                        </td>
                    </tr>`;
            });

            html += `</tbody></table></div>`;
        }

        document.getElementById('rphReviewList').innerHTML = html;
        setupBulkListeners();

    } catch (error) {
        document.getElementById('rphReviewList').innerHTML = `<p class="error">Ralat: ${error.message}</p>`;
    }
}

/**
 * Menguruskan logik interaksi checkbox dan butang tindakan
 */
function setupBulkListeners() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.rph-checkbox');
    const bulkContainer = document.getElementById('bulkActionContainer');
    const selectedCount = document.getElementById('selectedCount');
    const btnBulkApprove = document.getElementById('btnBulkApprove');

    const updateUI = () => {
        const checked = document.querySelectorAll('.rph-checkbox:checked');
        selectedCount.textContent = checked.length;
        // Paparkan panel tindakan hanya jika ada RPH yang ditanda
        bulkContainer.style.display = checked.length > 0 ? 'block' : 'none';
    };

    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateUI();
        });
    }

    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateUI);
    });

    if (btnBulkApprove) {
        btnBulkApprove.addEventListener('click', () => handleBulkAction('approved'));
    }
}

/**
 * Fungsi untuk mengemaskini banyak dokumen sekaligus menggunakan writeBatch
 */
async function handleBulkAction(newStatus) {
    const checkedBoxes = document.querySelectorAll('.rph-checkbox:checked');
    const comment = document.getElementById('bulkComment').value;
    const statusMsg = document.getElementById('bulkStatus');
    const admin = auth.currentUser;

    if (!admin) return alert("Sesi tamat. Sila log masuk semula.");
    if (checkedBoxes.length === 0) return;

    if (!confirm(`Adakah anda pasti untuk meluluskan ${checkedBoxes.length} RPH ini secara serentak?`)) return;

    statusMsg.innerHTML = "Sedang memproses...";
    statusMsg.style.color = "orange";
    
    const batch = writeBatch(db);

    checkedBoxes.forEach(cb => {
        const rphId = cb.value;
        const rphRef = doc(db, 'rph', rphId);
        // Mengemaskini status, komen, dan info penyemak
        batch.update(rphRef, {
            status: newStatus,
            reviewerComment: comment,
            reviewerUid: admin.uid,
            reviewDate: serverTimestamp()
        });
    });

    try {
        await batch.commit();
        statusMsg.style.color = "green";
        statusMsg.innerHTML = "✅ Berjaya dikemaskini!";
        
        // Segarkan semula senarai selepas berjaya
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            loadRphReviewPage({ uid: urlParams.get('uid') });
        }, 1500);
        
    } catch (error) {
        console.error("Ralat tindakan pukal:", error);
        statusMsg.style.color = "red";
        statusMsg.innerHTML = "❌ Ralat: " + error.message;
    }
}
