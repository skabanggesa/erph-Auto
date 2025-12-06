// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// Kemas kini: Memastikan pemuatan Jadual Waktu berfungsi dengan kuat
// =======================================================

let currentTeacherUID = null;
let currentTeacherTimetable = null; // Menyimpan jadual waktu guru yang dimuatkan

// --- KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT ---\
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('guru_rph.html')) {

        // Pastikan objek Firebase wujud
        if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db) {
            
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentTeacherUID = user.uid;
                    getTeacherRPH(currentTeacherUID);
                    
                    // PANGGILAN PENTING: Menjana borang Jadual Waktu semasa mula-mula log masuk
                    if (typeof renderTimetableForm === 'function') {
                        renderTimetableForm();
                    }
                    
                    loadExistingTimetable(currentTeacherUID); 
                }
            });
            
            // --- EVENT LISTENERS UI KHAS GURU ---\
            
            const generateRphBtn = document.getElementById('generate-rph-btn');
            if (generateRphBtn) {
                generateRphBtn.addEventListener('click', generateRPHData);
            }

            const saveTimetableBtn = document.getElementById('save-timetable-btn');
            if (saveTimetableBtn) {
                saveTimetableBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Fungsi ini dijangka ada dalam ui_utils.js
                    const timetableData = collectTimetableFormData(); 
                    if (timetableData.length > 0 && currentTeacherUID) {
                        saveTimetable(timetableData, currentTeacherUID);
                    } else {
                        showNotification('Sila isikan sekurang-kurangnya satu slot Jadual Waktu.', 'warning');
                    }
                });
            }
            
            // Event listener untuk save draf dan submit RPH kini dikendalikan oleh ui_utils.js
        } else {
            // Ini akan berlaku jika skrip Firebase tidak dimuatkan dengan betul
            showNotification('Ralat: Firebase tidak dimuatkan. Sila semak sambungan skrip.', 'error');
        }
    }
});

/**
 * [FUNGSI WAJIB] loadExistingTimetable(userUID)
 * Memuatkan Jadual Waktu sedia ada dari Firestore.
 */
function loadExistingTimetable(userUID) {
    if (!db || !userUID) return;

    return db.collection('timetables').doc(userUID).get()
        .then(doc => {
            if (doc.exists) {
                const timetableData = doc.data().timetable;
                currentTeacherTimetable = timetableData; // Simpan data di sini
                
                // PANGGILAN PENTING: Mengisi borang yang telah dijana
                if (typeof fillTimetableForm === 'function') {
                    fillTimetableForm(timetableData);
                }
                
                return timetableData;
            } else {
                showNotification('Tiada Jadual Waktu ditemui. Anda perlu mengisi borang.', 'info');
                currentTeacherTimetable = null;
                // Pastikan borang kosong dijana jika tiada data (Redundancy check)
                if (typeof renderTimetableForm === 'function') {
                    renderTimetableForm();
                }
                return null;
            }
        })
        .catch(error => {
            showNotification(`Gagal memuatkan Jadual Waktu: ${error.message}`, 'error');
            currentTeacherTimetable = null;
            return null;
        });
}

/**
 * saveTimetable(timetableData, userUID)
 * Menyimpan data Jadual Waktu ke Firestore.
 */
function saveTimetable(timetableData, userUID) {
    if (!db || !userUID) return;

    db.collection('timetables').doc(userUID).set({
        guru_uid: userUID,
        timetable: timetableData,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        currentTeacherTimetable = timetableData; // Kemas kini pemboleh ubah
        showNotification('Jadual Waktu berjaya disimpan!', 'success');
    })
    .catch(error => {
        showNotification(`Gagal menyimpan Jadual Waktu: ${error.message}`, 'error');
    });
}

/**
 * [FUNGSI WAJIB] generateRPHData()
 * Menjana slot RPH berdasarkan tarikh dan jadual waktu yang dimuatkan.
 */
function generateRPHData() {
    const rphDateInput = document.getElementById('rph-date');
    const rphDate = rphDateInput ? rphDateInput.value : null;

    if (!rphDate) {
        showNotification('Sila pilih tarikh RPH.', 'warning');
        return;
    }

    if (!currentTeacherTimetable || currentTeacherTimetable.length === 0) {
        showNotification('Sila lengkapkan Jadual Waktu anda terlebih dahulu.', 'warning');
        return;
    }

    const date = new Date(rphDate + 'T00:00:00'); // Memastikan zon masa yang betul
    const dayName = getDayNameFromDate(date); // Fungsi dari ui_utils.js
    
    // Cari slot untuk hari tersebut
    const todayTimetable = currentTeacherTimetable.find(d => d.day.toLowerCase() === dayName.toLowerCase());

    if (!todayTimetable || todayTimetable.slots.length === 0) {
        showNotification(`Tiada kelas ditemui untuk hari ${dayName}.`, 'info');
        document.getElementById('rph-editor-section').classList.add('hidden');
        document.getElementById('rph-slots-container').innerHTML = '<p>Tiada slot kelas untuk hari yang dipilih.</p>';
        return;
    }

    // Ubah format data Jadual Waktu ke format Slot RPH
    const rphSlotsData = todayTimetable.slots.map((slot, index) => ({
        id: index.toString(),
        masa: slot.time,
        subjek: slot.subject,
        kelas: slot.class,
        // TODO: Carian SP/Objektif/Aktiviti secara automatik di sini
        // Buat sementara, gunakan placeholder
        modul_unit: `[Cari: Modul/Unit untuk ${slot.subject} ${slot.standards}]`,
        standard_kandungan: `[Cari: Standard Kandungan untuk ${slot.standards}]`,
        standard_pembelajaran: slot.standards, // Guna kod SP sebagai permulaan
        objektif: `[Cari: Objektif untuk ${slot.standards}]`,
        aktiviti: `[Cari: Aktiviti untuk ${slot.standards}]`,
        penilaian: `[Cari: Penilaian untuk ${slot.standards}]`,
        aids: `[Cari: BBM/Aids untuk ${slot.standards}]`,
        refleksi: ''
    }));

    // Panggil fungsi UI untuk mengisi borang RPH
    if (typeof loadRPHFormWithData === 'function') {
        loadRPHFormWithData(rphSlotsData);
        document.getElementById('rph-document-id').value = ''; // RPH baharu, kosongkan ID dokumen
        document.getElementById('rph-editor-section').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showNotification(`Draf RPH untuk ${dayName}, ${rphDate} berjaya dijana.`, 'success');
    } else {
        showNotification("Ralat: Fungsi UI untuk memuatkan data RPH tidak ditemui.", 'error');
    }
}


/**
 * [FUNGSI WAJIB] saveRPHDraft() (Didedahkan ke Window)
 * Menyimpan data RPH sebagai draf ke Firestore.
 */
window.saveRPHDraft = function() {
    const rphID = document.getElementById('rph-document-id').value;
    const rphDateInput = document.getElementById('rph-date');
    const rphDate = rphDateInput ? rphDateInput.value : null;
    
    if (!rphDate || !currentTeacherUID) {
        showNotification('Ralat: Tarikh atau ID Guru tidak tersedia.', 'error');
        return;
    }

    const slots_data = collectRPHFormData(); // Fungsi dari ui_utils.js
    if (slots_data.length === 0) {
        showNotification('Tiada slot RPH untuk disimpan.', 'warning');
        return;
    }

    const rphData = {
        guru_uid: currentTeacherUID,
        date: new Date(rphDate), // Simpan sebagai timestamp
        slots_data: slots_data,
        status: 'Draf',
        last_modified: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = rphID 
        ? db.collection('rph_drafts').doc(rphID) 
        : db.collection('rph_drafts').doc();

    docRef.set(rphData, { merge: true })
        .then(() => {
            document.getElementById('rph-document-id').value = docRef.id; // Pastikan ID dokumen ditetapkan
            showNotification('RPH berjaya disimpan sebagai Draf.', 'success');
            getTeacherRPH(currentTeacherUID); // Muat semula senarai
        })
        .catch(error => {
            showNotification(`Gagal menyimpan RPH: ${error.message}`, 'error');
        });
}

/**
 * [FUNGSI WAJIB] submitRPH() (Didedahkan ke Window)
 * Menyerahkan RPH kepada pentadbir.
 */
window.submitRPH = function() {
    // Logik yang sama seperti saveRPHDraft, tetapi tukar status kepada 'Diserahkan'
    const rphID = document.getElementById('rph-document-id').value;
    const rphDateInput = document.getElementById('rph-date');
    const rphDate = rphDateInput ? rphDateInput.value : null;
    
    if (!rphDate || !currentTeacherUID) {
        showNotification('Ralat: Tarikh atau ID Guru tidak tersedia.', 'error');
        return;
    }

    const slots_data = collectRPHFormData();
    if (slots_data.length === 0) {
        showNotification('Tiada slot RPH untuk diserahkan.', 'warning');
        return;
    }

    if (!rphID) {
        showNotification('Sila simpan RPH ini sebagai Draf terlebih dahulu sebelum menyerahkan.', 'warning');
        return;
    }

    const rphData = {
        guru_uid: currentTeacherUID,
        date: new Date(rphDate),
        slots_data: slots_data,
        status: 'Diserahkan', // Tukar status kepada Diserahkan
        last_modified: firebase.firestore.FieldValue.serverTimestamp(),
        submitted_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('rph_drafts').doc(rphID).set(rphData, { merge: true })
        .then(() => {
            showNotification('RPH berjaya diserahkan kepada Pentadbir!', 'success');
            getTeacherRPH(currentTeacherUID); // Muat semula senarai
            document.getElementById('rph-editor-section').classList.add('hidden'); // Sembunyikan borang selepas serah
        })
        .catch(error => {
            showNotification(`Gagal menyerahkan RPH: ${error.message}`, 'error');
        });
}


/**
 * [FUNGSI WAJIB] getTeacherRPH(userUID)
 * Memuatkan senarai RPH draf/diserahkan guru.
 */
function getTeacherRPH(userUID) {
    if (!db || !userUID) return;
    
    return db.collection('rph_drafts')
        .where('guru_uid', '==', userUID)
        .orderBy('date', 'desc')
        .get()
        .then(snapshot => {
            const rphList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
 * [FUNGSI WAJIB] loadRPHtoEdit(rphID) (Didedahkan ke Window)
 */
window.loadRPHtoEdit = function(rphID) {
    if (!db) return;
    
    db.collection('rph_drafts').doc(rphID).get()
        .then(doc => {
            if (doc.exists && doc.data().guru_uid === currentTeacherUID) {
                document.getElementById('rph-document-id').value = doc.id;
                document.getElementById('rph-date').value = doc.data().date.toDate().toISOString().substring(0, 10);
                
                // Panggil fungsi UI untuk mengisi semula borang RPH
                if (typeof loadRPHFormWithData === 'function') {
                    loadRPHFormWithData(doc.data().slots_data); 
                    document.getElementById('rph-editor-section')?.classList.remove('hidden');
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
