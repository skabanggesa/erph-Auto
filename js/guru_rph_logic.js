// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// Kemas kini: Membetulkan ralat sintaks dan logik penjanaan SP
// =======================================================

// --- PEMBOLEH UBAH GLOBAL ---
let currentTeacherUID = null;
let currentTeacherTimetable = [];

// Pemboleh ubah untuk data Standard Pembelajaran (SP)
let standardDataRBT = null;
let standardDataBM = null;
let standardDataBI = null;
let standardDataMT = null;
// Tambah subjek lain di sini (cth: standardDataSN, standardDataSJ, dll.)

// --- KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('guru_rph.html')) {

        // Pastikan objek Firebase wujud (auth, db) dan fungsi UI (showNotification)
        if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db && typeof showNotification === 'function') {
            
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentTeacherUID = user.uid;
                    getTeacherRPH(currentTeacherUID);
                    loadExistingTimetable(currentTeacherUID); 
                    loadStandardData(); // Muatkan data SP semasa log masuk
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
                        showNotification("Sila isi Jadual Waktu terlebih dahulu.", 'warning');
                    }
                });
            }

            const saveRphBtn = document.getElementById('save-rph-btn');
            if (saveRphBtn) {
                saveRphBtn.addEventListener('click', saveRPHData);
            }

            const deleteRphBtn = document.getElementById('delete-rph-btn');
            if (deleteRphBtn) {
                deleteRphBtn.addEventListener('click', deleteRPHData);
            }

            const submitRphBtn = document.getElementById('submit-rph-btn');
            if (submitRphBtn) {
                submitRphBtn.addEventListener('click', () => saveRPHData(true));
            }

        } else {
             console.error("Firebase atau fungsi showNotification tidak dimuatkan.");
        }
    }
});

// =======================================================
// LOGIK MUATAN DATA STANDARD PEMBELAJARAN (SP)
// =======================================================

/**
 * [HELPER] loadStandardData()
 * Mengambil data SP dari fail JSON
 */
async function loadStandardData() {
    try {
        const [rbt, bm, bi, mt] = await Promise.all([
            fetch('sp-rbt.json').then(res => res.json()),
            fetch('sp-bm.json').then(res => res.json()),
            fetch('sp-bi.json').then(res => res.json()),
            fetch('sp-mt.json').then(res => res.json()),
            // Tambah fetch untuk fail JSON subjek lain di sini
        ]);
        standardDataRBT = rbt;
        standardDataBM = bm;
        standardDataBI = bi;
        standardDataMT = mt;
        showNotification("Data Standard Pembelajaran (SP) berjaya dimuatkan!", 'info');
    } catch (error) {
        console.error("Gagal memuatkan data SP:", error);
        showNotification("Gagal memuatkan data Standard Pembelajaran (SP).", 'error');
    }
}

/**
 * [HELPER KRITIKAL] selectRandomStandard(subject, className)
 * Logik untuk memilih Standard Pembelajaran secara rawak
 * Menangani isu "Data RBT Tiada" dan struktur JSON yang berbeza.
 */
function selectRandomStandard(subject, className) {
    // 1. Bersihkan & Ekstrak Tahun dari Nama Kelas
    const yearMatch = className.match(/\d/);
    if (!yearMatch) return { standard: 'RALAT: Tahun Tidak Dikenal', objectives: 'Gagal mengekstrak tahun dari nama kelas', activities: [], assessment: [], aids: [] };
    
    const yearNumber = yearMatch[0];
    const yearKeySpace = `TAHUN ${yearNumber}`; // Cth: TAHUN 4
    const yearKeyUnder = `TAHUN_${yearNumber}`; // Cth: TAHUN_4 (Untuk RBT)

    // 2. Padankan Subjek dengan Pemboleh Ubah Data Global
    let data;
    switch (subject.toUpperCase().trim()) {
        case 'RBT': data = standardDataRBT; break;
        case 'BM': data = standardDataBM; break;
        case 'BI': data = standardDataBI; break;
        case 'MT': data = standardDataMT; break;
        // Tambah subjek lain di sini
        default: 
            return { standard: `RALAT: Subjek ${subject} Tidak Dikenali`, objectives: 'Sila semak singkatan subjek dalam Jadual Waktu', activities: [], assessment: [], aids: [] };
    }

    // 3. Cari Data Tahun dalam JSON
    let yearData = data?.[yearKeySpace] || data?.[yearKeyUnder];
    
    if (!yearData) {
        return { standard: `RALAT: Data Subjek ${subject} untuk TAHUN ${yearNumber} Tiada`, objectives: 'Sila semak fail JSON anda (Kunci Tahun)', activities: [], assessment: [], aids: [] };
    }

    // 4. Kumpul Semua 'Lessons' ke dalam satu array
    let allLessons = [];
    let unitName = 'Unit Tidak Dikenal';

    if (yearData.topics) {
        // Struktur RBT (Menggunakan 'topics' -> 'lessons')
        unitName = yearData.unit || 'Unit RBT';
        yearData.topics.forEach(topic => {
            if (topic.lessons && Array.isArray(topic.lessons)) {
                allLessons.push(...topic.lessons);
            }
        });
    } else {
        // Struktur Subjek Lain (Menggunakan Kunci Topik langsung di bawah Tahun)
        const topicKeys = Object.keys(yearData).filter(key => key !== 'unit');
        
        if (topicKeys.length === 0) {
            return { standard: `RALAT: Tiada Topik/Unit ditemui untuk ${subject} ${yearNumber}`, objectives: 'Sila semak fail JSON anda (Unit/Topik)', activities: [], assessment: [], aids: [] };
        }
        
        const randomTopicKey = topicKeys[Math.floor(Math.random() * topicKeys.length)];
        const randomTopic = yearData[randomTopicKey];
        unitName = randomTopicKey;
        
        // Kumpul semua lessons dari sub-kategori dalam topik itu (cth: 'Mendengar', 'Menulis')
        Object.keys(randomTopic).forEach(category => {
            if (Array.isArray(randomTopic[category])) {
                allLessons.push(...randomTopic[category]);
            }
        });
    }
    
    // 5. Pilih Lesson Rawak
    if (allLessons.length === 0) {
        return { standard: `RALAT: Tiada Data SP Ditemui untuk ${subject} ${yearNumber}`, objectives: 'Data lessons kosong. Sila semak fail JSON anda.', activities: [], assessment: [], aids: [] };
    }

    const randomLesson = allLessons[Math.floor(Math.random() * allLessons.length)];
    
    // 6. Kembalikan Data yang Diperlukan
    return {
        unit: unitName,
        standard: randomLesson.standards || 'Tiada Standard',
        objectives: randomLesson.objectives || 'Tiada Objektif',
        activities: randomLesson.activities || [],
        assessment: randomLesson.assessment || [],
        aids: randomLesson.aids || [],
    };
}


// =======================================================
// LOGIK UTAMA RPH
// =======================================================

/**
 * [FUNGSI UTAMA] generateRPHData()
 * Menjana data RPH dari Jadual Waktu guru.
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

    // Pastikan semua data SP telah dimuatkan
    if (!(standardDataRBT || standardDataBM || standardDataBI || standardDataMT)) {
         showNotification("Data Standard Pembelajaran (SP) sedang dimuatkan atau gagal dimuatkan. Sila tunggu seketika atau refresh.", 'warning');
         return;
    }

    if (typeof getDayNameFromDate !== 'function') {
        showNotification("Ralat: Fungsi utiliti hari tidak ditemui. Pastikan ui_utils.js dimuatkan.", 'error');
        return;
    }

    const dayName = getDayNameFromDate(selectedDate);
    // Menggunakan normalize untuk membandingkan nama hari (Isnin vs isnin)
    const dayData = currentTeacherTimetable.find(d => d.day.toLowerCase().trim() === dayName.toLowerCase().trim());

    if (!dayData || dayData.slots.length === 0) {
        showNotification(`Tiada kelas dalam Jadual Waktu anda untuk hari ${dayName}.`, 'info');
        document.getElementById('rph-editor-section')?.classList.add('hidden');
        return;
    }
    
    const generatedSlots = [];
    dayData.slots.forEach(slot => {
        const randomSP = selectRandomStandard(slot.subject, slot.class); 
        
        // --- PEMERIKSAAN KESELAMATAN (Handle 'Data RBT Tiada' / Gagal Muat) ---
        if (!randomSP || randomSP.standard.startsWith('RALAT:')) {
             generatedSlots.push({
                time_start: slot.time_start, 
                time_end: slot.time_end,     
                day: dayName,
                subject: slot.subject,
                class: slot.class,
                unit: randomSP?.unit || 'RALAT DATA',
                standard: randomSP?.standard || 'RALAT DATA',
                objective: randomSP?.objectives || 'Gagal menjana objektif. Sila semak Jadual Waktu.',
                aktiviti: 'Tiada Aktiviti Ditemui (RALAT DATA)',
                penilaian: '',
                aids: '',
                refleksi: 'RALAT PENTING: Penjanaan gagal. Sila semak Jadual Waktu (Subjek/Kelas).'
             });
             return; 
        }
        // --- END PEMERIKSAAN KESELAMATAN ---

        // KEMAS KINI FOKUS: Memastikan semua koma (,) diletakkan dengan betul
        generatedSlots.push({
            time_start: slot.time_start, 
            time_end: slot.time_end,     
            day: dayName,
            subject: slot.subject,
            class: slot.class,
            unit: randomSP.unit, 
            standard: randomSP.standard,
            // Objektif: Menggunakan || untuk nilai string jika tiada data
            objective: randomSP.objectives || 'Objektif tidak ditemui dalam data JSON.', 
            
            // Aktiviti, Penilaian, Aids: Menggunakan join() pada array dan || [] untuk keselamatan.
            aktiviti: (randomSP.activities || []).join('\n- '), 
            penilaian: (randomSP.assessment || []).join('\n- '), 
            aids: (randomSP.aids || []).join('\n- '),
            
            refleksi: '20/30 murid menguasai. Perlu pengukuhan lanjut. [Draf Refleksi]',
        });
    });

    if (typeof loadRPHFormWithData === 'function') {
        loadRPHFormWithData(generatedSlots);
        document.getElementById('rph-document-id').value = ''; // Kosongkan ID untuk RPH baharu
        document.getElementById('rph-editor-section')?.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showNotification(`Draf RPH untuk ${dayName}, ${selectedDate} berjaya dijana! Sila semak dan sunting.`, 'success');
    }
}


/**
 * [FIREBASE] saveRPHData(isSubmit)
 * Menyimpan data RPH ke Firestore.
 */
function saveRPHData(isSubmit = false) {
    if (!currentTeacherUID) {
        showNotification("Ralat: UID Guru tidak ditemui. Sila log masuk semula.", 'error');
        return;
    }

    const rphDate = document.getElementById('rph-date').value;
    const rphID = document.getElementById('rph-document-id').value;
    const slotsData = collectRPHFormData(); // Fungsi dari ui_utils.js
    const status = isSubmit ? 'Submitted' : 'Draft';
    const dayName = getDayNameFromDate(rphDate);

    if (!rphDate || slotsData.length === 0) {
        showNotification("Sila lengkapkan tarikh dan sekurang-kurangnya satu slot RPH.", 'warning');
        return;
    }

    const rphData = {
        guru_uid: currentTeacherUID,
        date: firebase.firestore.Timestamp.fromDate(new Date(rphDate)), // Simpan sebagai Timestamp
        day: dayName,
        slots_data: slotsData,
        status: status,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    };

    let promise;
    if (rphID) {
        // Kemas kini RPH sedia ada
        promise = db.collection('rph_drafts').doc(rphID).update(rphData);
    } else {
        // Simpan RPH baharu
        promise = db.collection('rph_drafts').add(rphData);
    }

    promise.then(docRef => {
        // Jika ia RPH baharu, simpan ID dokumen
        if (!rphID && docRef.id) {
            document.getElementById('rph-document-id').value = docRef.id;
        }
        const action = isSubmit ? 'Hantar' : 'Simpan';
        showNotification(`RPH berjaya ${action} sebagai ${status}.`, 'success');
        getTeacherRPH(currentTeacherUID); // Muatkan semula senarai
    })
    .catch(error => {
        console.error("Ralat menyimpan RPH:", error);
        showNotification(`Gagal ${isSubmit ? 'menghantar' : 'menyimpan'} RPH: ${error.message}`, 'error');
    });
}

/**
 * [FIREBASE] deleteRPHData()
 */
function deleteRPHData() {
    const rphID = document.getElementById('rph-document-id').value;

    if (!rphID || !confirm("Adakah anda pasti mahu memadam RPH draf ini? Tindakan ini tidak boleh diundur.")) {
        return;
    }

    db.collection('rph_drafts').doc(rphID).delete()
        .then(() => {
            showNotification("RPH draf berjaya dipadam.", 'success');
            document.getElementById('rph-editor-section').classList.add('hidden');
            getTeacherRPH(currentTeacherUID);
        })
        .catch(error => {
            console.error("Ralat memadam RPH:", error);
            showNotification(`Gagal memadam RPH: ${error.message}`, 'error');
        });
}


// =======================================================
// LOGIK JADUAL WAKTU (TIMETABLE)
// =======================================================

/**
 * [FIREBASE] saveTimetable(timetableData, userUID)
 * Menyimpan data Jadual Waktu ke Firestore.
 */
function saveTimetable(timetableData, userUID) {
    db.collection('timetables').doc(userUID).set({
        guru_uid: userUID,
        timetable: timetableData,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        currentTeacherTimetable = timetableData;
        showNotification("Jadual Waktu berjaya disimpan!", 'success');
    })
    .catch(error => {
        console.error("Ralat menyimpan Jadual Waktu:", error);
        showNotification(`Gagal menyimpan Jadual Waktu: ${error.message}`, 'error');
    });
}

/**
 * [FIREBASE] loadExistingTimetable(userUID)
 * Memuatkan Jadual Waktu sedia ada dari Firestore dan mengisi borang.
 */
function loadExistingTimetable(userUID) {
    db.collection('timetables').doc(userUID).get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                currentTeacherTimetable = data.timetable || [];
                // Fungsi dari ui_utils.js untuk memaparkan borang jadual waktu
                if (typeof displayTimetableForm === 'function') {
                    displayTimetableForm(data.timetable);
                    showNotification("Jadual Waktu sedia ada berjaya dimuatkan.", 'info');
                }
            } else {
                // Jika tiada jadual waktu, paparkan borang kosong
                 if (typeof displayTimetableForm === 'function') {
                    displayTimetableForm([]);
                 }
                showNotification("Tiada Jadual Waktu ditemui. Sila isi dan simpan.", 'warning');
            }
        })
        .catch(error => {
            console.error("Ralat memuatkan Jadual Waktu:", error);
            showNotification(`Gagal memuatkan Jadual Waktu: ${error.message}`, 'error');
        });
}


// =======================================================
// LOGIK MUATAN & PAPARAN RPH
// =======================================================

/**
 * [FIREBASE] getTeacherRPH(userUID)
 */
function getTeacherRPH(userUID) {
    if (!db || !userUID) return;
    
    return db.collection('rph_drafts')
        .where('guru_uid', '==', userUID)
        .orderBy('date', 'desc')
        .get()
        .then(snapshot => {
            const rphList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Fungsi dari ui_utils.js untuk memaparkan senarai RPH
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
                // Tetapkan tarikh input
                if (doc.data().date && doc.data().date.toDate) {
                    document.getElementById('rph-date').value = doc.data().date.toDate().toISOString().substring(0, 10);
                }
                
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
                showNotification("Ralat: Dokumen RPH tidak ditemui atau anda tidak mempunyai akses.", 'error');
            }
        })
        .catch(error => {
            console.error("Ralat memuatkan RPH:", error);
            showNotification(`Gagal memuatkan RPH: ${error.message}`, 'error');
        });
}
