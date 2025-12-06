// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// =======================================================

let currentTeacherUID = null;

// --- KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('guru_rph.html')) {

        if (typeof auth !== 'undefined' && auth) {
            
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentTeacherUID = user.uid;
                    getTeacherRPH(currentTeacherUID);
                    loadExistingTimetable(currentTeacherUID); 
                }
            });
            
            // --- EVENT LISTENERS UI KHAS GURU ---
            
            const generateRphBtn = document.getElementById('generate-rph-btn');
            if (generateRphBtn) {
                generateRphBtn.addEventListener('click', generateRPHData);
            }

            const saveTimetableBtn = document.getElementById('save-timetable-btn');
            if (saveTimetableBtn) {
                saveTimetableBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const timetableData = collectTimetableFormData(); 
                    if (timetableData.length > 0 && currentTeacherUID) {
                        saveTimetable(timetableData, currentTeacherUID);
                    } else {
                        showNotification("Sila isi sekurang-kurangnya satu slot Jadual Waktu yang lengkap.", 'error');
                    }
                });
            }
            
        } else {
            console.error("Objek Firebase Auth belum diinisialisasi atau tidak wujud.");
        }
    }
});


/**
 * [FUNGSI WAJIB] loadExistingTimetable(userUID)
 */
function loadExistingTimetable(userUID) {
    const container = document.getElementById('timetable-form-container');
    container.innerHTML = '<p>Memuatkan data Jadual Waktu...</p>';

    if (!db || typeof generateTimetableForm === 'undefined') {
        container.innerHTML = '<p>Ralat: Gagal memuatkan komponen sistem.</p>';
        return;
    }

    db.collection('timetables').doc(userUID).get()
        .then(doc => {
            let existingData = [];
            if (doc.exists) {
                existingData = doc.data().data;
                showNotification("Jadual Waktu sedia ada berjaya dimuatkan.", 'info');
            } else {
                showNotification("Tiada Jadual Waktu ditemui. Memulakan borang baru.", 'info');
            }
            
            container.innerHTML = generateTimetableForm(existingData);
        })
        .catch(error => {
            showNotification(`Ralat memuatkan Jadual Waktu: ${error.message}`, 'error');
            container.innerHTML = generateTimetableForm([]);
        });
}


/**
 * [FUNGSI WAJIB] saveTimetable(timetableData, userUID)
 */
function saveTimetable(timetableData, userUID) {
    if (!db || !userUID) return;
    
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
 */
function getTimetableByDay(userUID, date) {
    if (!db || !userUID) return Promise.resolve(null);
    const dayName = getDayNameFromDate(date); 
    
    return db.collection('timetables').doc(userUID).get()
        .then(doc => {
            if (doc.exists) {
                const timetableData = doc.data().data;
                return timetableData.find(item => item.day === dayName); 
            }
            return null;
        });
}

/**
 * [FUNGSI WAJIB] loadSubjectData(subjectCode)
 */
async function loadSubjectData(subjectCode) {
    // Pastikan kod subjek hanya huruf dan angka untuk keselamatan
    if (!/^[a-z0-9]+$/.test(subjectCode)) {
        console.error("Kod subjek tidak sah:", subjectCode);
        return null;
    }

    try {
        const filePath = `data/sp-${subjectCode}.json`;
        const response = await fetch(filePath);
        if (!response.ok) {
            // Ini akan berlaku jika fail JSON subjek tiada
            throw new Error(`Gagal memuatkan fail JSON: ${filePath}`);
        }
        return response.json();
    } catch (error) {
        console.error("Ralat memuatkan data SP:", error);
        return null;
    }
}

/**
 * [FUNGSI WAJIB] generateRPHData()
 * Fungsi Automasi Teras. 
 */
async function generateRPHData() {
    const selectedDate = document.getElementById('rph-date').value;
    if (!selectedDate || !currentTeacherUID) {
        return showNotification("Sila pilih tarikh RPH dan pastikan anda log masuk.", 'error');
    }
    
    // Periksa sama ada Jadual Waktu wujud
    const dateObject = new Date(selectedDate);
    const dayName = getDayNameFromDate(dateObject);
    const timetableEntry = await getTimetableByDay(currentTeacherUID, dateObject);
    
    if (!timetableEntry || !timetableEntry.slots || timetableEntry.slots.length === 0) {
        return showNotification(`Tiada Jadual Waktu ditemui untuk hari ${dayName}.`, 'error');
    }

    showNotification(`Memproses data subjek untuk ${dayName}...`, 'success');
    
    const slots = timetableEntry.slots;
    const subjectCodeSet = new Set(slots.map(s => s.subject.toLowerCase()));
    const subjectDataMap = {};

    // Kumpul semua data subjek JSON yang diperlukan secara serentak
    const promises = Array.from(subjectCodeSet).map(code => 
        loadSubjectData(code).then(data => {
            subjectDataMap[code] = data;
        })
    );
    await Promise.all(promises);
    
    // Jana borang RPH menggunakan data yang telah dikumpul
    if (typeof displayRPHSlots !== 'undefined') {
        displayRPHSlots(slots, subjectDataMap);
        document.getElementById('rph-editor-section').classList.remove('hidden');
    } else {
        showNotification("Ralat: Gagal memuatkan komponen penjanaan RPH.", 'error');
    }
}

/**
 * [FUNGSI WAJIB] saveRPH(rphObject, status)
 */
function saveRPH(rphObject, status) {
    if (!db || !currentTeacherUID) return;
    
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
            .then(() => showNotification(`RPH berjaya dikemas kini sebagai ${status}.`, 'success'));
    } else {
        return db.collection('rph_drafts').add(dataToSave)
            .then(() => getTeacherRPH(currentTeacherUID))
            .then(() => showNotification(`RPH baru disimpan sebagai ${status}.`, 'success'));
    }
}

/**
 * [FUNGSI WAJIB] getTeacherRPH(userUID)
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
                document.getElementById('rph-editor-section').classList.remove('hidden');
                // TODO: Logik mengisi data RPH ke dalam borang editor perlu ditambah di sini
                showNotification(`RPH Draf (${doc.data().status}) berjaya dimuatkan untuk penyuntingan.`, 'success');
            } else {
                showNotification("Dokumen RPH tidak wujud atau anda tiada kebenaran.", 'error');
            }
        });
}
