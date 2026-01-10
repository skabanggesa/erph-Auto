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

    content.innerHTML = `
        <div class="admin-section">
            <h2>Semakan RPH Guru</h2>
            <div id="bulkActionContainer" style="display:none; background: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #ced4da;">
                <h4 style="margin-top:0;">Tindakan Pukal (<span id="selectedCount">0</span> dipilih)</h4>
                <textarea id="bulkComment" placeholder="Komen untuk semua RPH yang dipilih..." style="width:100%; padding:8px; margin-bottom:10px; border-radius:4px; border:1px solid #ccc;"></textarea>
                <button id="btnBulkApprove" class="btn btn-success" style="background:#28a745; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:4px;">Luluskan Pilihan</button>
                <span id="bulkStatus" style="margin-left:10px; font-weight:bold;"></span>
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
                    <table id="rphTable">
                        <thead>
                            <tr>
                                <th style="width: 40px;"><input type="checkbox" id="selectAll"></th>
                                <th>Tarikh</th>
                                <th>Mata Pelajaran & Tajuk</th>
                                <th>Status</th>
                                <th>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            rphSnap.forEach(docSnap => {
                const r = docSnap.data();
                const displayDate = r.tarikh || 'N/A';
                const displaySubject = r.matapelajaran || r.mataPelajaran || 'N/A';
                const displayTopic = r.tajuk || r.topik || '-';
                const statusValue = String(r.status || 'N/A').toLowerCase();
                
                // Hanya benarkan RPH yang belum lulus (submitted/rejected) untuk dipilih secara pukal
                const canSelect = (statusValue === 'submitted' || statusValue === 'rejected');

                html += `
                    <tr>
                        <td>
                            ${canSelect ? `<input type="checkbox" class="rph-checkbox" value="${docSnap.id}">` : ''}
                        </td>
                        <td><strong>${displayDate}</strong></td>
                        <td>
                            <div style="font-weight:bold; color:#2c3e50;">${displaySubject}</div>
                            <div style="font-size:0.85rem; color:#666;">${displayTopic}</div>
                        </td>
                        <td><span class="status-${statusValue}">${statusValue.toUpperCase()}</span></td>
                        <td>
                            <button class="btn-review" onclick="window.router.navigate('admin-rph-detail', { id: '${docSnap.id}' })">
                                Semak RPH
                            </button>
                        </td>
                    </tr>`;
            });

            html += `</tbody></table></div>`;
        }

        document.getElementById('rphReviewList').innerHTML = html;
        setupBulkListeners();

    } catch (error) {
        document.getElementById('rphReviewList').innerHTML = `<p class="error">Gagal: ${error.message}</p>`;
    }
}

/**
 * Menguruskan logik checkbox dan butang pukal
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
 * Fungsi untuk mengemaskini banyak dokumen sekaligus (Firestore WriteBatch)
 */
async function handleBulkAction(newStatus) {
    const checkedBoxes = document.querySelectorAll('.rph-checkbox:checked');
    const comment = document.getElementById('bulkComment').value;
    const statusMsg = document.getElementById('bulkStatus');
    const admin = auth.currentUser;

    if (!admin) return alert("Sesi tamat. Sila log masuk.");
    if (checkedBoxes.length === 0) return;

    if (!confirm(`Luluskan ${checkedBoxes.length} RPH secara serentak?`)) return;

    statusMsg.innerHTML = "Memproses...";
    const batch = writeBatch(db);

    checkedBoxes.forEach(cb => {
        const rphId = cb.value;
        const rphRef = doc(db, 'rph', rphId);
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
        
        // Segarkan halaman selepas 1.5 saat
        setTimeout(() => {
            const currentParams = new URLSearchParams(window.location.search);
            loadRphReviewPage({ uid: currentParams.get('uid') || null });
        }, 1500);
        
    } catch (error) {
        console.error("Batch error:", error);
        statusMsg.style.color = "red";
        statusMsg.innerHTML = "❌ Ralat: " + error.message;
    }
}
