// =======================================================
// GURU RPH LOGIC (guru_rph_logic.js)
// =======================================================

let currentTeacherUID = null;

// Pastikan UID guru ditetapkan apabila log masuk
auth.onAuthStateChanged(user => {
    if (user) {
        currentTeacherUID = user.uid;
        // Panggil fungsi untuk memuatkan senarai RPH guru
        if (window.location.pathname.includes('guru_rph.html')) {
            getTeacherRPH(currentTeacherUID);
        }
    }
});

/**
 * [FUNGSI WAJIB] saveTimetable(timetableData, userUID)
 * Menyimpan/mengemas kini data Jadual Waktu ke /timetables.
 */
function saveTimetable(timetableData, userUID) {
    if (!db || !userUID) return;
    
    // Gunakan UID sebagai Document ID untuk setiap Jadual Waktu
    return db.collection('timetables').doc(userUID).set({
        guru_uid: userUID,
        data: timetableData, // data ini adalah array Jadual Waktu hari-hari
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
    
    const dayName = getDayNameFromDate(date); // Fungsi utiliti yang perlu anda bina
    
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
    // Logik kompleks untuk mengambil Jadual Waktu, memuatkan JSON, dan mengisi #rph-slots-container
    // ... Implementasi memerlukan butiran lanjut borang...
    showNotification("Fungsi 'Jana RPH' sedang memuatkan slot waktu dan butiran SP/SK secara automatik...", 'success');
    
    // Contoh Panggilan: 
    // const timetableDay = await getTimetableByDay(currentTeacherUID, document.getElementById('rph-date').value);
    // const subjectData = await loadSubjectData(timetableDay.slots[0].subject);
    // ...
    // displayRPHSlots(timetableDay.slots, subjectData); // (dari ui_utils)
}

/**
 * [FUNGSI WAJIB] saveRPH(rphObject, status)
 * Menyimpan/mengemas kini RPH ke /rph_drafts (termasuk Draf dan Penghantaran Semakan).
 */
function saveRPH(rphObject, status) {
    if (!db || !currentTeacherUID) return;

    const rphID = rphObject.id; // Jika RPH sudah ada (update), ia akan mempunyai ID
    const dataToSave = {
        guru_uid: currentTeacherUID,
        date: firebase.firestore.Timestamp.fromDate(new Date(rphObject.date)),
        status: status,
        slots_data: rphObject.slots_data,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (rphID) {
        // UPDATE (Draf atau Hantar Semula)
        return db.collection('rph_drafts').doc(rphID).update(dataToSave)
            .then(() => showNotification(`RPH berjaya dikemas kini sebagai ${status}.`, 'success'))
            .catch((error) => showNotification(`Ralat kemaskini RPH: ${error.message}`, 'error'));
    } else {
        // CREATE (Draf Pertama)
        return db.collection('rph_drafts').add(dataToSave)
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
            displayRPHList(rphList, 'teacher-rph-list'); // (dari ui_utils)
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
                // Sediakan borang dan isi data untuk penyuntingan
                // ... Implementasi logik mengisi medan borang RPH ...
                document.getElementById('rph-document-id').value = doc.id;
                document.getElementById('rph-editor-section').classList.remove('hidden');
                showNotification(`RPH Draf (${doc.data().status}) berjaya dimuatkan untuk penyuntingan.`, 'success');
            } else {
                showNotification("Dokumen RPH tidak wujud atau anda tiada kebenaran.", 'error');
            }
        })
        .catch(error => {
            showNotification(`Ralat memuatkan RPH: ${error.message}`, 'error');
        });
}
