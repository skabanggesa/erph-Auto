// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// Fail ini mengendalikan semua logik Jadual Waktu dan RPH.
// =======================================================

let currentTeacherUID = null;

// --- KOD YANG DIPERBAIKI ---
// Semua logik yang bergantung pada objek global (auth, db) 
// kini dibungkus dalam listener DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan kita berada di laman yang betul
    if (window.location.pathname.includes('guru_rph.html')) {

        // Pastikan objek 'auth' wujud sebelum memanggil methodnya
        if (typeof auth !== 'undefined' && auth) {
            
            // Listener status pengesahan
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentTeacherUID = user.uid;
                    // Muatkan data yang diperlukan sebaik sahaja UID guru tersedia
                    getTeacherRPH(currentTeacherUID);
                    // Panggil fungsi untuk memuatkan borang Jadual Waktu sedia ada (jika ada)
                    loadExistingTimetable(currentTeacherUID); 
                }
            });
            
            // --- EVENT LISTENERS UI KHAS GURU ---
            
            // 1. Event untuk butang Jana RPH
            const generateRphBtn = document.getElementById('generate-rph-btn');
            if (generateRphBtn) {
                generateRphBtn.addEventListener('click', generateRPHData);
            }

            // 2. Event untuk Borang Jadual Waktu (Perlu dijana secara dinamik terlebih dahulu)
            const saveTimetableBtn = document.getElementById('save-timetable-btn');
            if (saveTimetableBtn) {
                saveTimetableBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Fungsi ini memerlukan anda mengumpul data borang Jadual Waktu terlebih dahulu
                    // Contoh: const timetableData = collectTimetableFormData(); 
                    // saveTimetable(timetableData, currentTeacherUID);
                    showNotification("Fungsi simpan Jadual Waktu sedia untuk dihubungkan.", 'info');
                });
            }

            // 3. Event untuk Borang RPH (handleFormSubmission diuruskan dalam ui_utils.js)
            
        } else {
            console.error("Objek Firebase Auth belum diinisialisasi atau tidak wujud.");
            // Logik tambahan jika auth undefined
        }
    }
});
// --- TAMAT KOD YANG DIPERBAIKI ---


/**
 * Fungsi utiliti untuk mendapatkan nama hari (Sila pastikan ini wujud dalam ui_utils.js atau di sini)
 */
function getDayNameFromDate(dateInput) {
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    return date.toLocaleDateString('ms-MY', { weekday: 'long' });
}


/**
 * Fungsi untuk memuatkan borang Jadual Waktu sedia ada
 */
function loadExistingTimetable(userUID) {
    // Placeholder: Ini akan memanggil getTimetableByDay(userUID) dan menjana borang.
    showNotification("Memuatkan Jadual Waktu sedia ada...", 'info');
    // ... Logik pembinaan borang Jadual Waktu akan diimplementasikan di sini.
}

/**
 * [FUNGSI WAJIB] saveTimetable(timetableData, userUID)
 * Menyimpan/mengemas kini data Jadual Waktu ke /timetables.
 */
function saveTimetable(timetableData, userUID) {
    if (!db || !userUID) return;
    
    // Gunakan UID sebagai Document ID untuk setiap Jadual Waktu
    return db.collection('timetables').doc(userUID).set({
        guru_uid: userUID,
        data: timetableData, 
        last_saved: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showNotification("Jadual Waktu berjaya disimpan!", 'success');
    })
    .catch((error) => {
        showNotification(`Ralat simpan Jadual Waktu: ${error.message}`, 'error');
    });
}

/**
 * [FUNGSI WAJIB] getTimetableByDay(userUID, date)
 * Mengambil Jadual Waktu guru yang sepadan untuk hari yang dipilih.
 */
function getTimetableByDay(userUID, date) {
    if (!db || !userUID) return Promise.resolve(null);
    
    const dayName = getDayNameFromDate(date); 
    
    return db.collection('timetables').doc(userUID).get()
        .then(doc => {
            if (doc.exists) {
                const timetableData = doc.data().data;
                // Cari slot yang sepadan dengan hari
                return timetableData.find(item => item.day === dayName); 
            }
            return null;
        });
}

/**
 * [FUNGSI WAJIB] loadSubjectData(subjectCode)
 * Memuatkan fail JSON Standard Pembelajaran (SP) yang berkaitan secara dinamik.
 */
async function loadSubjectData(subjectCode) {
    try {
        const filePath = `data/sp-${subjectCode.toLowerCase()}.json`;
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Gagal memuatkan fail: ${filePath}`);
        }
        return response.json();
    } catch (error) {
        console.error("Ralat memuatkan data SP:", error);
        return null;
    }
}

/**
 * [FUNGSI WAJIB] generateRPHData()
 * Fungsi Automasi Teras. Menggabungkan Jadual Waktu & JSON untuk mengisi semua medan RPH.
 */
async function generateRPHData() {
    const selectedDate = document.getElementById('rph-date').value;
    if (!selectedDate || !currentTeacherUID) {
        return showNotification("Sila pilih tarikh RPH dan pastikan anda log masuk.", 'error');
    }
    
    const timetableDay = await getTimetableByDay(currentTeacherUID, selectedDate);
    
    if (!timetableDay || timetableDay.slots.length === 0) {
        return showNotification("Tiada Jadual Waktu ditemui untuk hari ini.", 'error');
    }

    // Logik kompleks untuk mengambil Jadual Waktu, memuatkan JSON, dan mengisi #rph-slots-container
    showNotification("Menjana RPH. Sila tunggu...", 'success');
    
    // ... Logik untuk memuatkan subjectData dan memaparkan borang (akan datang)
    // displayRPHSlots(timetableDay.slots); 
}

/**
 * [FUNGSI WAJIB] saveRPH(rphObject, status)
 * Menyimpan/mengemas kini RPH ke /rph_drafts.
 */
function saveRPH(rphObject, status) {
    if (!db || !currentTeacherUID) return;
    // ... (Logik penyimpanan RPH sama seperti sebelumnya) ...
    const rphID = rphObject.id; 
    const dataToSave = {
        guru_uid: currentTeacherUID,
        date: firebase.firestore.Timestamp.fromDate(new Date(rphObject.date)),
        status: status,
        slots_data: rphObject.slots_data,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (rphID) {
        return db.collection('rph_drafts').doc(rphID).update(dataToSave)
            .then(() => getTeacherRPH(currentTeacherUID))
            .then(() => showNotification(`RPH berjaya dikemas kini sebagai ${status}.`, 'success'))
            .catch((error) => showNotification(`Ralat kemaskini RPH: ${error.message}`, 'error'));
    } else {
        return db.collection('rph_drafts').add(dataToSave)
            .then(() => getTeacherRPH(currentTeacherUID))
            .then(() => showNotification(`RPH baru disimpan sebagai ${status}.`, 'success'))
            .catch((error) => showNotification(`Ralat simpan RPH: ${error.message}`, 'error'));
    }
}

/**
 * [FUNGSI WAJIB] getTeacherRPH(userUID)
 * Mengambil senarai RPH HANYA milik guru yang sedang log masuk.
 */
function getTeacherRPH(userUID) {
    if (!db || !userUID) return;
    
    return db.collection('rph_drafts')
        .where('guru_uid', '==', userUID)
        .orderBy('date', 'desc')
        .get()
        .then(snapshot => {
            const rphList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Pastikan displayRPHList telah diimport atau didefinisikan 
            if (typeof displayRPHList !== 'undefined') {
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
 * [FUNGSI WAJIB] loadRPHtoEdit(rphID)
 * Memuatkan RPH sedia ada ke borang HTML yang boleh diedit.
 */
function loadRPHtoEdit(rphID) {
    if (!db) return;
    
    db.collection('rph_drafts').doc(rphID).get()
        .then(doc => {
            if (doc.exists && doc.data().guru_uid === currentTeacherUID) {
                document.getElementById('rph-document-id').value = doc.id;
                document.getElementById('rph-editor-section').classList.remove('hidden');
                // ... logik mengisi data ke borang akan datang ...
                showNotification(`RPH Draf (${doc.data().status}) berjaya dimuatkan untuk penyuntingan.`, 'success');
            } else {
                showNotification("Dokumen RPH tidak wujud atau anda tiada kebenaran.", 'error');
            }
        })
        .catch(error => {
            showNotification(`Ralat memuatkan RPH: ${error.message}`, 'error');
        });
}
