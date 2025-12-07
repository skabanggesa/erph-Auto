// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// Kemas kini: Memastikan pemuatan Jadual Waktu berfungsi dengan kuat, penambahan logik muat data SP dari JSON, dan pendedahan currentTeacherUID.
// =======================================================

// Pastikan showNotification, createEmptyTimetableForm, loadTimetableFormWithData, dll. dimuat dari ui_utils.js
let currentTeacherUID = null;
const db = firebase.firestore();

// =======================================================
// KONSTAN DAN CACHE DATA SP
// =======================================================

const SP_DATA_CACHE = {};
const SP_FILE_MAP = {
    'BM': 'sp-bm.json',
    'BI': 'sp-bi.json',
    'MT': 'sp-mt.json',
    'SN': 'sp-sn.json',
    'P.ISLAM': 'sp-pai.json',
    'RBT': 'sp-rbt.json',
    'PJ': 'sp-pj.json',
    'PK': 'sp-pk.json',
    'SJ': 'sp-sj.json',
};
const DATA_JSON_BASE_PATH = 'data/'; // Anggap fail JSON berada di folder 'data/'


/**
 * Memuatkan data Standard Pembelajaran (SP) untuk subjek tertentu.
 */
async function loadSPData(subjectCode) {
    const normalizedCode = subjectCode.toUpperCase().trim();
    if (SP_DATA_CACHE[normalizedCode]) {
        return SP_DATA_CACHE[normalizedCode];
    }

    const fileName = SP_FILE_MAP[normalizedCode];
    if (!fileName) {
        return null;
    }

    try {
        const response = await fetch(`${DATA_JSON_BASE_PATH}${fileName}`);
        if (!response.ok) {
            throw new Error(`Gagal memuatkan fail SP: ${fileName}`);
        }
        const data = await response.json();
        SP_DATA_CACHE[normalizedCode] = data;
        return data;
    } catch (error) {
        showNotification(`Ralat memuatkan data SP untuk ${normalizedCode}: ${error.message}`, 'error');
        return null;
    }
}


// =======================================================
// FUNGSI JADUAL WAKTU (TIMETABLE)
// =======================================================

/**
 * Menyimpan data Jadual Waktu guru ke Firestore.
 */
function saveTimetable(timetableData, uid) {
    if (!db) return;
    
    db.collection('timetables').doc(uid).set({
        guru_uid: uid,
        data: timetableData,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showNotification('Jadual Waktu berjaya disimpan!', 'success');
        getTeacherRPH(currentTeacherUID); // Muat semula senarai RPH
    })
    .catch(error => {
        showNotification(`Gagal menyimpan Jadual Waktu: ${error.message}`, 'error');
    });
}

/**
 * [FUNGSI WAJIB] loadExistingTimetable(uid) (Didedahkan ke Window)
 * Memuatkan Jadual Waktu dari Firestore dan memanggil fungsi UI untuk memaparkannya.
 */
window.loadExistingTimetable = function(uid) {
    if (!db || !uid) return;
    
    db.collection('timetables').doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                const timetableData = doc.data().data || [];
                // Panggil fungsi UI untuk memuatkan data ke borang
                if (typeof loadTimetableFormWithData === 'function') {
                    loadTimetableFormWithData(timetableData); 
                    showNotification('Jadual Waktu sedia ada berjaya dimuatkan.', 'info');
                }
            } else {
                // Tiada jadual ditemui, panggil fungsi UI untuk borang kosong
                if (typeof createEmptyTimetableForm === 'function') {
                    createEmptyTimetableForm(); 
                }
            }
        })
        .catch(error => {
            showNotification(`Gagal memuatkan Jadual Waktu: ${error.message}`, 'error');
        });
}


// =======================================================
// FUNGSI RPH GENERATION & DRAFT
// =======================================================

/**
 * Menjana RPH berdasarkan Jadual Waktu dan data SP (Perlu diimplementasikan sepenuhnya).
 */
async function generateRPHData() {
    const dateInput = document.getElementById('rph-date').value;
    if (!dateInput) {
        showNotification('Sila pilih Tarikh RPH.', 'warning');
        return;
    }
    if (!currentTeacherUID) {
        showNotification('Ralat Pengguna: Sila log masuk semula.', 'error');
        return;
    }

    // 1. Dapatkan hari
    const dayName = getDayNameFromDate(dateInput);

    // 2. Dapatkan Jadual Waktu dari Firestore/Cache
    let timetableData = [];
    try {
        const doc = await db.collection('timetables').doc(currentTeacherUID).get();
        if (doc.exists) {
            timetableData = doc.data().data || [];
        }
    } catch (error) {
        showNotification(`Gagal memuatkan Jadual Waktu untuk penjanaan RPH: ${error.message}`, 'error');
        return;
    }

    const dailySlots = timetableData.find(d => d.day.toLowerCase() === dayName.toLowerCase());
    if (!dailySlots || dailySlots.slots.length === 0) {
        showNotification(`Tiada slot Jadual Waktu ditemui untuk hari ${dayName}. Sila urus Jadual Waktu anda terlebih dahulu.`, 'warning');
        return;
    }

    // 3. Muatkan RPH yang dijana (Draf) ke borang
    const generatedSlots = [];
    for (const slot of dailySlots.slots) {
        const spData = await loadSPData(slot.subject);
        
        // Logik Ringkas Penjanaan RPH (Perlu diperluas untuk logik yang lebih pintar)
        let objectives = '';
        let activities = '';
        let assessment = '';
        let aids = '';

        if (spData) {
            // Logik mencari SP yang sepadan (contoh: cari RBT.1.1.1)
            for (const year in spData) {
                const yearData = spData[year];
                for (const unit in yearData) {
                    const unitData = yearData[unit];
                    for (const topic in unitData) {
                        const lessons = unitData[topic];
                        const lessonMatch = lessons.find(l => l.standards.trim().toUpperCase() === slot.standards.trim().toUpperCase());
                        
                        if (lessonMatch) {
                            objectives = lessonMatch.objectives;
                            activities = lessonMatch.activities.join('\n- ');
                            assessment = lessonMatch.assessment.join('\n- ');
                            aids = lessonMatch.aids.join('\n- ');
                            break; 
                        }
                    }
                    if (objectives) break;
                }
                if (objectives) break;
            }
        }
        
        generatedSlots.push({
            ...slot,
            standards: slot.standards,
            objectives: objectives || 'Objektif tidak dijana. Sila masukkan secara manual.',
            activities: activities ? `- ${activities}` : 'Aktiviti tidak dijana. Sila masukkan secara manual.',
            assessment: assessment ? `- ${assessment}` : 'Penilaian tidak dijana.',
            aids: aids ? `- ${aids}` : 'BBM tidak dijana.',
            refleksi: '' // Sentiasa kosong untuk diisi oleh guru
        });
    }

    // Tunjuk borang editor
    document.getElementById('rph-editor-section')?.classList.remove('hidden');
    // Muatkan data RPH ke borang UI
    if (typeof loadRPHFormWithData === 'function') {
        loadRPHFormWithData(generatedSlots, dayName, dateInput); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showNotification(`RPH Draf untuk ${dayName}, ${dateInput} berjaya dijana! Sila sunting dan Simpan.`, 'success');
    }
}


/**
 * Menyimpan data RPH sebagai draf ke Firestore.
 */
function saveRPHData(e) {
    e.preventDefault();
    if (!currentTeacherUID) return;

    const documentId = document.getElementById('rph-document-id').value;
    const rphDate = document.getElementById('rph-date').value;
    const dayName = getDayNameFromDate(rphDate);
    
    if (typeof collectRPHFormData !== 'function') {
        showNotification('Ralat: Fungsi mengumpul data RPH tidak ditemui.', 'error');
        return;
    }

    const slotsData = collectRPHFormData();
    if (slotsData.length === 0) {
        showNotification('Borang RPH kosong. Tiada data untuk disimpan.', 'warning');
        return;
    }

    const rphData = {
        guru_uid: currentTeacherUID,
        date: new Date(rphDate),
        hari: dayName,
        slots_data: slotsData,
        status: 'Draf',
        last_saved: firebase.firestore.FieldValue.serverTimestamp()
    };

    const collection = db.collection('rph_drafts');
    let promise;

    if (documentId) {
        promise = collection.doc(documentId).update(rphData);
    } else {
        promise = collection.add(rphData);
    }

    promise.then(docRef => {
        document.getElementById('rph-document-id').value = documentId || docRef.id;
        showNotification('RPH berjaya disimpan sebagai draf.', 'success');
        getTeacherRPH(currentTeacherUID);
    }).catch(error => {
        showNotification(`Gagal menyimpan draf RPH: ${error.message}`, 'error');
    });
}

/**
 * Menghantar RPH untuk semakan Pentadbir (mengubah status).
 */
function submitRPH() {
    if (!currentTeacherUID) return;
    const documentId = document.getElementById('rph-document-id').value;

    if (!documentId) {
        showNotification('Sila simpan RPH sebagai draf terlebih dahulu.', 'warning');
        return;
    }

    db.collection('rph_drafts').doc(documentId).update({
        status: 'Hantar',
        submitted_at: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showNotification('RPH berjaya dihantar untuk semakan Pentadbir.', 'success');
        getTeacherRPH(currentTeacherUID);
    })
    .catch(error => {
        showNotification(`Gagal menghantar RPH: ${error.message}`, 'error');
    });
}


/**
 * Memuatkan senarai RPH guru.
 */
function getTeacherRPH(uid) {
    if (!db || !uid) return;
    
    return db.collection('rph_drafts')
        .where('guru_uid', '==', uid)
        .orderBy('date', 'desc')
        .get()
        .then(snapshot => {
            const rphList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            
            // Panggil fungsi UI untuk memaparkan senarai
            if (typeof displayRPHList === 'function') {
                 displayRPHList(rphList, 'teacher-rph-list');
            }

            return rphList;
        })
        .catch(error => {
            showNotification(`Gagal memuatkan senarai RPH: ${error.message}`, 'error');
            return [];
        });
}

/**
 * [FUNGSI WAJIB] loadRPHtoEdit(rphID) (Didedahkan ke Window)
 */
window.loadRPHtoEdit = function(rphID) {
    if (!db) return;
    
    db.collection('rph_drafts').doc(rphID).get()
        .then(doc => {
            if (doc.exists && doc.data().guru_uid === currentTeacherUID) {
                document.getElementById('rph-document-id').value = doc.id;
                // Pastikan format tarikh betul (YYYY-MM-DD)
                const dateISO = doc.data().date.toDate().toISOString().substring(0, 10);
                
                // Panggil fungsi UI untuk mengisi semula borang RPH
                if (typeof loadRPHFormWithData === 'function') {
                    loadRPHFormWithData(doc.data().slots_data, doc.data().hari, dateISO); 
                    document.getElementById('rph-editor-section')?.classList.remove('hidden');
                    // Tukar tab ke RPH Tab
                    const rphTabButton = document.querySelector('[data-target="rph-tab"]');
                    if(rphTabButton) rphTabButton.click();
                    
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    showNotification(`RPH Draf (${doc.data().status}) berjaya dimuatkan untuk penyuntingan.`, 'success');
                } else {
                    showNotification("Ralat: Fungsi UI untuk memuatkan RPH ke borang tidak ditemui.", 'error');
                }
            } else {
                showNotification('RPH tidak ditemui atau anda tiada akses.', 'error');
            }
        })
        .catch(error => {
            showNotification(`Gagal memuatkan RPH: ${error.message}`, 'error');
        });
}

// --- KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('guru_rph.html')) {

        // Pastikan objek Firebase wujud (diasumsikan sudah diinisialisasi di fail lain)
        if (typeof firebase !== 'undefined' && firebase.auth() && db) {
            const auth = firebase.auth();
            
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentTeacherUID = user.uid;
                    window.currentTeacherUID = user.uid; // PENTING: Dedahkan ke window
                    document.getElementById('user-name').textContent = user.email; // Tukar display name
                    
                    getTeacherRPH(currentTeacherUID);
                    // PANGGILAN PENTING: Memuatkan borang Jadual Waktu semasa mula-mula log masuk
                    // Ia akan dimuat ke dalam tab 'hidden' dan dipaparkan apabila tab diklik
                    loadExistingTimetable(currentTeacherUID); 
                } else {
                    // Redirect ke login page jika tidak log masuk
                    // window.location.href = 'login.html'; 
                }
            });
            
            // --- EVENT LISTENERS UI KHAS GURU ---
            
            const generateRphBtn = document.getElementById('generate-rph-btn');
            if (generateRphBtn) {
                generateRphBtn.addEventListener('click', generateRPHData);
            }

            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    auth.signOut().then(() => {
                        window.location.href = 'index.html'; // Gantikan dengan halaman log masuk anda
                    });
                });
            }

            const saveRphBtn = document.getElementById('save-rph-btn');
            if (saveRphBtn) {
                saveRphBtn.addEventListener('click', saveRPHData);
            }
            
            const submitRphBtn = document.getElementById('submit-rph-btn');
            if (submitRphBtn) {
                submitRphBtn.addEventListener('click', submitRPH);
            }

            const saveTimetableBtn = document.getElementById('save-timetable-btn');
            if (saveTimetableBtn) {
                saveTimetableBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // collectTimetableFormData dari ui_utils.js
                    if (typeof collectTimetableFormData === 'function') {
                        const timetableData = collectTimetableFormData(); 
                        if (timetableData.length > 0 && currentTeacherUID) {
                            saveTimetable(timetableData, currentTeacherUID);
                        } else {
                            showNotification('Tiada slot Jadual Waktu untuk disimpan.', 'warning');
                        }
                    } else {
                         showNotification('Ralat: Fungsi mengumpul data Jadual Waktu tidak ditemui.', 'error');
                    }
                });
            }

        } else {
            showNotification('Ralat: Perkhidmatan Firebase tidak dimuatkan. Sila semak konfigurasi.', 'error');
        }
    }
});
