// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// Mengandungi semua logik data dan pemprosesan
// =======================================================

let currentTeacherUID = null;
let currentTeacherTimetable = null;

// Global variables untuk menyimpan data SP yang dimuatkan
let standardDataRBT = null; 
let standardDataBM = null;
let standardDataBI = null;
let standardDataMT = null;

// --- FUNGSI DATA SP ---

/**
 * Memuatkan data Standard Pembelajaran dari fail JSON.
 */
async function loadStandardData() {
    try {
        const [rbt, bm, bi, mt] = await Promise.all([
            fetch('sp-rbt.json').then(r => r.json()),
            fetch('sp-bm.json').then(r => r.json()),
            fetch('sp-bi.json').then(r => r.json()),
            fetch('sp-mt.json').then(r => r.json()),
        ]);
        standardDataRBT = rbt;
        standardDataBM = bm;
        standardDataBI = bi;
        standardDataMT = mt;
        console.log("Data Standard Pembelajaran (SP) berjaya dimuatkan.");
        return true;
    } catch (error) {
        console.error("Gagal memuatkan data Standard Pembelajaran:", error);
        showNotification("Gagal memuatkan data SP yang diperlukan untuk penjanaan RPH. Sila semak fail JSON.", 'error');
        return false;
    }
}

/**
 * Memilih data SP Rawak dari struktur JSON berdasarkan Subjek dan Kelas.
 * Ini adalah logik penting yang menggantikan input SP dari Jadual Waktu.
 */
function selectRandomStandard(subject, className) {
    const year = className.split(' ')[0].toUpperCase(); // Contoh: 4 Bestari -> TAHUN 4
    let standardDataSet;
    
    // Pemetaan Subjek kepada fail JSON (Anda boleh kembangkan ini)
    if (subject.toUpperCase().includes('RBT') || subject.toUpperCase().includes('REKA BENTUK')) {
        standardDataSet = standardDataRBT;
    } else if (subject.toUpperCase().includes('BM') || subject.toUpperCase().includes('BAHASA MELAYU')) {
        standardDataSet = standardDataBM;
    } else if (subject.toUpperCase().includes('BI') || subject.toUpperCase().includes('BAHASA INGGERIS')) {
        standardDataSet = standardDataBI;
    } else if (subject.toUpperCase().includes('MATEMATIK') || subject.toUpperCase().includes('MT')) {
        standardDataSet = standardDataMT;
    } else {
        return { standard: 'Sila masukkan SP secara manual', objective: 'Sila masukkan Objektif Pembelajaran secara manual', activities: [], assessment: [], aids: [] };
    }

    if (!standardDataSet || !standardDataSet[year]) {
        console.warn(`Tiada data SP ditemui untuk Subjek: ${subject} dan Tahun: ${year}.`);
        return { standard: 'Tiada data SP tersedia', objective: 'Tiada data Objektif tersedia', activities: [], assessment: [], aids: [] };
    }
    
    // Logik pemilihan rawak (Ini adalah contoh asas)
    const unitKeys = Object.keys(standardDataSet[year]);
    if (unitKeys.length === 0) return { standard: 'Tiada Unit', objective: 'Tiada Unit', activities: [], assessment: [], aids: [] };
    
    // Pilih Unit/Topik/Kemahiran secara rawak dari Unit pertama (Untuk mudah)
    const firstUnit = standardDataSet[year][unitKeys[0]]; 
    
    // Struktur JSON anda berbeza (topics/lessons/standards)
    let lessons = [];
    if (firstUnit.topics) { // Untuk RBT
        firstUnit.topics.forEach(topic => {
            if (topic.lessons) {
                lessons = lessons.concat(topic.lessons);
            }
        });
    } else { // Untuk BM/BI/MT (Menggunakan Unit/Kemahiran)
        Object.keys(firstUnit).forEach(kemahiran => {
            lessons = lessons.concat(firstUnit[kemahiran]);
        });
    }

    if (lessons.length === 0) {
        return { standard: 'Tiada SP tersedia', objective: 'Tiada Objektif tersedia', activities: [], assessment: [], aids: [] };
    }

    // Pilih satu pengajaran secara rawak dari lessons yang ada
    const randomIndex = Math.floor(Math.random() * lessons.length);
    const selectedLesson = lessons[randomIndex];

    return {
        standard: selectedLesson.standards || 'SP Tiada',
        objective: selectedLesson.objectives || 'Objektif Tiada',
        activities: selectedLesson.activities || [],
        assessment: selectedLesson.assessment || [],
        aids: selectedLesson.aids || []
    };
}


// --- FUNGSI JADUAL WAKTU (Diperbetulkan) ---

/**
 * [FUNGSI WAJIB] saveTimetable(timetableData, userUID)
 */
function saveTimetable(timetableData, userUID) {
    db.collection('timetables').doc(userUID).set({ 
        timetable: timetableData // <--- NAMA MEDAN YANG BETUL (singular)
    })
    .then(() => {
        currentTeacherTimetable = timetableData;
        showNotification('Jadual Waktu berjaya disimpan!', 'success');
    })
    .catch(error => {
        console.error("Ralat menyimpan Jadual Waktu:", error);
        showNotification('Gagal menyimpan Jadual Waktu. Sila cuba lagi.', 'error');
    });
}

/**
 * [FUNGSI WAJIB] loadExistingTimetable(userUID)
 */
function loadExistingTimetable(userUID) {
    if (!db || !userUID) return;

    // console.log(`Mencuba memuatkan Jadual Waktu dari Firestore di: timetables/${userUID}`); // Debugging
    
    // Panggil renderTimetableForm() di onAuthStateChanged sebelum ini untuk memastikan UI sedia
    
    return db.collection('timetables').doc(userUID).get()
        .then(doc => {
            if (doc.exists) {
                const docData = doc.data();
                
                // PENTING: Semak jika medan 'timetable' (singular) wujud di dalam dokumen
                if (docData && docData.timetable) {
                    const timetableData = docData.timetable; 
                    currentTeacherTimetable = timetableData; // Simpan data
                    
                    if (typeof fillTimetableForm === 'function') {
                        fillTimetableForm(timetableData);
                    }
                    
                    showNotification('Jadual Waktu berjaya dimuatkan.', 'success');
                } else {
                    // Dokumen wujud, tetapi medan data salah / kosong
                    console.warn("Ralat Data: Medan data Jadual Waktu MESTI bernama 'timetable' (singular) atau kosong.");
                    currentTeacherTimetable = null;
                }
            } else {
                // Tiada dokumen ditemui. Borang kosong sudah sedia.
                console.warn(`Tiada dokumen Jadual Waktu ditemui untuk UID: ${userUID}.`);
                showNotification('Tiada Jadual Waktu ditemui. Sila isi borang Jadual Waktu.', 'info');
                currentTeacherTimetable = null;
            }
        })
        .catch(error => {
            console.error("Ralat Firebase Read:", error);
            showNotification(`Gagal memuatkan Jadual Waktu: ${error.message}`, 'error');
            currentTeacherTimetable = null;
        });
}


// --- FUNGSI JANA RPH AUTOMATIK (Telah Dipulihkan) ---

/**
 * [FUNGSI UTAMA] generateRPHData()
 * Menjana slot RPH untuk tarikh yang dipilih.
 */
async function generateRPHData() {
    const rphDateInput = document.getElementById('rph-date');
    const selectedDate = rphDateInput.value;
    
    if (!selectedDate) {
        showNotification("Sila pilih tarikh RPH terlebih dahulu.", 'warning');
        return;
    }

    if (!currentTeacherTimetable || currentTeacherTimetable.length === 0) {
        showNotification("Tiada Jadual Waktu ditemui. Sila isi dan simpan Jadual Waktu anda di tab 'Urus Jadual Waktu'.", 'error');
        return;
    }

    if (!(standardDataRBT && standardDataBM && standardDataBI && standardDataMT)) {
         showNotification("Data Standard Pembelajaran (SP) sedang dimuatkan atau gagal dimuatkan. Sila tunggu seketika.", 'warning');
         return;
    }

    const dayName = getDayNameFromDate(selectedDate);
    const dayData = currentTeacherTimetable.find(d => d.day.toLowerCase() === dayName.toLowerCase());

    if (!dayData || dayData.slots.length === 0) {
        showNotification(`Tiada kelas dalam Jadual Waktu anda untuk hari ${dayName}.`, 'info');
        // Kosongkan dan sembunyikan editor jika tiada kelas
        document.getElementById('rph-editor-section')?.classList.add('hidden');
        return;
    }
    
    const generatedSlots = [];
    dayData.slots.forEach(slot => {
        // Panggil fungsi untuk mendapatkan Standard Pembelajaran (SP) secara rawak
        const randomSP = selectRandomStandard(slot.subject, slot.class); 

        generatedSlots.push({
            time: slot.time,
            day: dayName,
            subject: slot.subject,
            class: slot.class,
            
            // Data yang dijana
            standard: randomSP.standard,
            objective: randomSP.objective,
            aktiviti: randomSP.activities.join('\n- '), // Ubah array ke string
            penilaian: randomSP.assessment.join('\n- '),
            aids: randomSP.aids.join('\n- '),
            refleksi: '20/30 murid menguasai. Perlu pengukuhan lanjut. [Draf Refleksi]',
        });
    });

    // Paparkan borang editor
    if (typeof loadRPHFormWithData === 'function') {
        loadRPHFormWithData(generatedSlots);
        document.getElementById('rph-document-id').value = ''; // Reset ID untuk draft baru
        document.getElementById('rph-editor-section')?.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showNotification(`Draf RPH untuk ${dayName}, ${selectedDate} berjaya dijana! Sila semak dan sunting.`, 'success');
    }
}


// --- FUNGSI RPH DRAFT DAN PENGURUSAN ---

/**
 * [FUNGSI WAJIB] saveRPHDraft()
 */
function saveRPHDraft() {
    const rphData = collectRPHDataFromForm();
    const rphDate = document.getElementById('rph-date').value;
    const docId = document.getElementById('rph-document-id').value;
    
    if (rphData.length === 0 || !rphDate) {
        showNotification("Tiada slot RPH untuk disimpan atau tarikh tidak dipilih.", 'warning');
        return;
    }

    const docRef = db.collection('rph_drafts').doc(docId || undefined); // Guna ID sedia ada jika wujud
    
    docRef.set({
        guru_uid: currentTeacherUID,
        date: firebase.firestore.Timestamp.fromDate(new Date(rphDate)),
        day: getDayNameFromDate(rphDate),
        slots_data: rphData,
        status: 'Draf',
        last_saved: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }) // Merge=true untuk mengemas kini tanpa menimpa semua
    .then(() => {
        document.getElementById('rph-document-id').value = docRef.id; // Simpan ID baru jika ini adalah dokumen baru
        showNotification('Draf RPH berjaya disimpan!', 'success');
        getTeacherRPH(currentTeacherUID); // Muatkan semula senarai
    })
    .catch(error => {
        console.error("Ralat menyimpan draf RPH:", error);
        showNotification('Gagal menyimpan draf RPH. Sila cuba lagi.', 'error');
    });
}


/**
 * [FUNGSI WAJIB] submitRPH()
 */
function submitRPH() {
    const rphData = collectRPHDataFromForm();
    const rphDate = document.getElementById('rph-date').value;
    const docId = document.getElementById('rph-document-id').value;

    if (rphData.length === 0 || !rphDate || !docId) {
        showNotification("Sila simpan RPH sebagai draf dahulu sebelum dihantar.", 'warning');
        return;
    }

    db.collection('rph_drafts').doc(docId).update({
        status: 'Diserahkan',
        submission_time: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showNotification('RPH berjaya dihantar ke pentadbir!', 'success');
        getTeacherRPH(currentTeacherUID); // Muatkan semula senarai
    })
    .catch(error => {
        console.error("Ralat menghantar RPH:", error);
        showNotification('Gagal menghantar RPH. Sila cuba lagi.', 'error');
    });
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
                showNotification("Dokumen RPH tidak wujud atau anda tiada kebenaran untuk mengaksesnya.", 'error');
            }
        })
        .catch(error => {
            console.error("Ralat memuatkan RPH:", error);
            showNotification(`Gagal memuatkan RPH: ${error.message}`, 'error');
        });
}


// --- KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('guru_rph.html')) {

        // Pastikan objek Firebase wujud
        if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db) {
            
            // Muatkan data SP dahulu
            loadStandardData();
            
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentTeacherUID = user.uid;
                    getTeacherRPH(currentTeacherUID);
                    // PANGGILAN PENTING: Memastikan borang dijana dan data dimuatkan
                    if (typeof renderTimetableForm === 'function') {
                        renderTimetableForm(); // Jana borang kosong dahulu
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
                    const timetableData = collectTimetableFormData(); 
                    if (timetableData.length > 0 && currentTeacherUID) {
                        saveTimetable(timetableData, currentTeacherUID);
                    } else {
                        showNotification("Sila isi sekurang-kurangnya satu slot Jadual Waktu.", 'warning');
                    }
                });
            }

            const saveRphBtn = document.getElementById('save-rph-btn');
            if (saveRphBtn) {
                saveRphBtn.addEventListener('click', saveRPHDraft);
            }

            const submitRphBtn = document.getElementById('submit-rph-btn');
            if (submitRphBtn) {
                submitRphBtn.addEventListener('click', submitRPH);
            }
        } else {
            console.error("Objek Firebase 'auth' atau 'db' tidak tersedia. Semak app.js.");
        }
    }
});
