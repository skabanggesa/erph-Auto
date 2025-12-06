// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// Kemas kini: Penambahan Unit dan Penambaikkan ralat showNotification
// =======================================================

let currentTeacherUID = null;
let currentTeacherTimetable = null;

// Global variables untuk menyimpan data SP yang dimuatkan
let standardDataRBT = null; 
let standardDataBM = null;
let standardDataBI = null;
let standardDataMT = null;

// Helper untuk notifikasi (untuk mengelakkan ReferenceError jika ui_utils.js gagal)
function safeNotify(message, type) {
    if (typeof showNotification === 'function') {
        showNotification(message, type);
    } else {
        console.warn(`Notifikasi UI tidak berfungsi: ${message}`);
    }
}


// --- FUNGSI DATA SP ---

/**
 * Memuatkan data Standard Pembelajaran dari fail JSON.
 */
async function loadStandardData() {
    try {
        const [rbt, bm, bi, mt] = await Promise.all([
            fetch('data/sp-rbt.json').then(r => r.json()),
            fetch('data/sp-bm.json').then(r => r.json()),
            fetch('data/sp-bi.json').then(r => r.json()),
            fetch('data/sp-mt.json').then(r => r.json()),
        ]);
        standardDataRBT = rbt;
        standardDataBM = bm;
        standardDataBI = bi;
        standardDataMT = mt;
        console.log("Data Standard Pembelajaran (SP) berjaya dimuatkan.");
        return true;
    } catch (error) {
        console.error("Gagal memuatkan data Standard Pembelajaran:", error);
        safeNotify("Gagal memuatkan data SP yang diperlukan. Sila semak laluan fail JSON.", 'error');
        return false;
    }
}

/**
 * Memilih data SP Rawak dari struktur JSON berdasarkan Subjek dan Kelas, termasuk UNIT.
 */
function selectRandomStandard(subject, className) {
    // 1. Ekstrak Tahun dari Nama Kelas (Contoh: '4 Bestari' -> 'TAHUN 4')
    const yearMatch = className.match(/\d/);
    if (!yearMatch) return { standard: 'RALAT: Tahun Tidak Dikenal', objectives: 'Gagal mengekstrak tahun dari nama kelas', activities: [], aids: [] };
    
    // Gunakan TAHUN [NOMBOR] untuk memadankan kunci JSON anda ("TAHUN 4")
    const yearKey = `TAHUN ${yearMatch[0]}`; 

    // 2. Padankan Subjek dengan Pemboleh Ubah Data Global
    let data;
    switch (subject.toUpperCase().trim()) {
        // Guna singkatan yang konsisten dengan Jadual Waktu anda
        case 'RBT': data = standardDataRBT; break;
        case 'BM': data = standardDataBM; break;
        // ... tambah semua subjek lain (BI, MT, PAI, dll.)
        default: 
            return { standard: `RALAT: Subjek ${subject} Tidak Dikenali`, objectives: 'Sila semak singkatan subjek dalam Jadual Waktu', activities: [], aids: [] };
    }

    // 3. Semak Data Tahun
    const yearData = data?.[yearKey];
    if (!yearData) {
        // Ini adalah punca ralat "Data RBT Tiada"
        return { standard: `RALAT: Data Subjek ${subject} untuk ${yearKey} Tiada`, objectives: 'Sila semak fail JSON anda', activities: [], aids: [] };
    }

    // Pilih unit secara rawak
    const randomUnitKey = unitKeys[Math.floor(Math.random() * unitKeys.length)];
    const selectedUnitData = yearData[randomUnitKey];


    // Logik untuk mengendalikan dua jenis struktur JSON yang berbeza
    if (randomUnitKey === 'unit' && selectedUnitData.topics) {
        // Struktur 1: RBT (Menggunakan medan 'unit' dan 'topics')
        unitName = selectedUnitData.unit;
        selectedUnitData.topics.forEach(topic => {
            if (topic.lessons) {
                lessons = lessons.concat(topic.lessons);
            }
        });
    } else if (typeof selectedUnitData === 'object') {
        // Struktur 2: BM/BI/MT (Menggunakan Kunci Unit/Topik sebagai nama Unit)
        unitName = randomUnitKey;
        // Iterate over skills (Mendengar, Speaking, etc.)
        Object.keys(selectedUnitData).forEach(skillKey => {
            if (Array.isArray(selectedUnitData[skillKey])) {
                lessons = lessons.concat(selectedUnitData[skillKey]);
            }
        });
    }

    if (lessons.length === 0) {
        return { unit: unitName, standard: 'Tiada SP tersedia dalam unit ini', objective: 'Tiada Objektif tersedia dalam unit ini', activities: [], assessment: [], aids: [] };
    }

    const randomIndex = Math.floor(Math.random() * lessons.length);
    const selectedLesson = lessons[randomIndex];

    return {
        unit: unitName, 
        standard: selectedLesson.standards || 'SP Tiada',
        objective: selectedLesson.objectives || 'Objektif Tiada',
        activities: selectedLesson.activities || [],
        assessment: selectedLesson.assessment || [],
        aids: selectedLesson.aids || []
    };
}


// --- FUNGSI JADUAL WAKTU ---

function saveTimetable(timetableData, userUID) {
    db.collection('timetables').doc(userUID).set({ 
        timetable: timetableData 
    })
    .then(() => {
        currentTeacherTimetable = timetableData;
        safeNotify('Jadual Waktu berjaya disimpan!', 'success');
    })
    .catch(error => {
        console.error("Ralat menyimpan Jadual Waktu:", error);
        safeNotify('Gagal menyimpan Jadual Waktu. Sila semak Peraturan Firebase (Rules).', 'error');
    });
}

function loadExistingTimetable(userUID) {
    if (!db || !userUID) return;
    
    return db.collection('timetables').doc(userUID).get()
        .then(doc => {
            if (doc.exists) {
                const docData = doc.data();
                
                if (docData && docData.timetable) {
                    const timetableData = docData.timetable; 
                    currentTeacherTimetable = timetableData;
                    
                    if (typeof fillTimetableForm === 'function') {
                        fillTimetableForm(timetableData);
                    }
                    
                    safeNotify('Jadual Waktu berjaya dimuatkan.', 'success');
                } else {
                    console.warn("Ralat Data: Medan data Jadual Waktu MESTI bernama 'timetable'.");
                    currentTeacherTimetable = null;
                }
            } else {
                console.warn(`Tiada dokumen Jadual Waktu ditemui untuk UID: ${userUID}.`);
                safeNotify('Tiada Jadual Waktu ditemui. Sila isi borang Jadual Waktu.', 'info');
                currentTeacherTimetable = null;
            }
        })
        .catch(error => {
            console.error("Ralat Firebase Read:", error);
            // Gunakan safeNotify di sini untuk mengelakkan ralat
            safeNotify(`Gagal memuatkan Jadual Waktu: Sila semak Peraturan Firebase (Rules).`, 'error');
            currentTeacherTimetable = null;
        });
}


// --- FUNGSI JANA RPH AUTOMATIK ---

/**
 * [FUNGSI UTAMA] generateRPHData()
 */
async function generateRPHData() {
    const rphDateInput = document.getElementById('rph-date');
    const selectedDate = rphDateInput.value;
    
    if (!selectedDate) {
        safeNotify("Sila pilih tarikh RPH terlebih dahulu.", 'warning');
        return;
    }

    if (!currentTeacherTimetable || currentTeacherTimetable.length === 0) {
        safeNotify("Tiada Jadual Waktu ditemui. Sila isi dan simpan Jadual Waktu anda di tab 'Urus Jadual Waktu'.", 'error');
        return;
    }

    // Pastikan semua data SP telah dimuatkan
    if (!(standardDataRBT && standardDataBM && standardDataBI && standardDataMT)) {
         safeNotify("Data Standard Pembelajaran (SP) sedang dimuatkan atau gagal dimuatkan. Sila tunggu seketika.", 'warning');
         return;
    }

    if (typeof getDayNameFromDate !== 'function') {
        safeNotify("Ralat: Fungsi utiliti hari tidak ditemui. Pastikan ui_utils.js dimuatkan.", 'error');
        return;
    }

    const dayName = getDayNameFromDate(selectedDate);
    const dayData = currentTeacherTimetable.find(d => d.day.toLowerCase() === dayName.toLowerCase());

    if (!dayData || dayData.slots.length === 0) {
        safeNotify(`Tiada kelas dalam Jadual Waktu anda untuk hari ${dayName}.`, 'info');
        document.getElementById('rph-editor-section')?.classList.add('hidden');
        return;
    }
    
const generatedSlots = [];
    dayData.slots.forEach(slot => {
        // PANGGILAN KRITIKAL: Cuba dapatkan data SP
        const randomSP = selectRandomStandard(slot.subject, slot.class); 
        
        // --- PEMERIKSAAN KESELAMATAN (Handle 'Data RBT Tiada' / Gagal Muat) ---
        // Jika randomSP gagal (mengandungi mesej ralat), ia akan dimasukkan sebagai notifikasi ralat.
        if (!randomSP || randomSP.standard.startsWith('RALAT:')) {
             generatedSlots.push({
                time_start: slot.time_start, 
                // ... (medan lain)
                subject: slot.subject,
                class: slot.class,
                unit: randomSP?.unit || 'RALAT DATA',
                standard: randomSP?.standard || 'RALAT DATA',
                // Pastikan objektif menunjukkan ralat
                objective: randomSP?.objectives || 'Gagal menjana objektif. Sila semak konsistensi nama subjek dan tahun.',
                aktiviti: 'Tiada Aktiviti Ditemui (RALAT DATA)',
                penilaian: '',
                aids: '',
                refleksi: 'RALAT PENTING: Penjanaan gagal. Sila semak Jadual Waktu (Subjek/Kelas).'
             });
             return; // Pergi ke slot seterusnya
        }
        // --- END PEMERIKSAAN KESELAMATAN ---

generatedSlots.push({
            time_start: slot.time_start, 
            time_end: slot.time_end,     
            day: dayName,
            subject: slot.subject,
            class: slot.class,
            unit: randomSP.unit, 
            standard: randomSP.standard,
            // TAMBAH KOMA DI SINI! (Selepas objektif atau unit/standard jika ia baris sebelumnya)
            objective: randomSP.objectives || 'Objektif tidak ditemui dalam data JSON.', **// <--- PASTIKAN ADA KOMA (,) DI SINI**
            
            aktiviti: (randomSP.activities || []).join('\n- '), **// <--- PASTIKAN ADA KOMA (,) DI SINI**
            penilaian: (randomSP.assessment || []).join('\n- '), **// <--- PASTIKAN ADA KOMA (,) DI SINI**
            aids: (randomSP.aids || []).join('\n- '),
            
            // Baris terakhir tidak memerlukan koma
            refleksi: '20/30 murid menguasai. Perlu pengukuhan lanjut. [Draf Refleksi]' 
        });
    });            
            // Perubahan sebelumnya untuk aktiviti/penilaian/aids dikekalkan
            aktiviti: (randomSP.activities || []).join('\n- '), 
            penilaian: (randomSP.assessment || []).join('\n- '),
            aids: (randomSP.aids || []).join('\n- '),
            refleksi: '20/30 murid menguasai. Perlu pengukuhan lanjut. [Draf Refleksi]',
        });
    });

    if (typeof loadRPHFormWithData === 'function') {
        loadRPHFormWithData(generatedSlots);
        document.getElementById('rph-document-id').value = ''; 
        document.getElementById('rph-editor-section')?.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        safeNotify(`Draf RPH untuk ${dayName}, ${selectedDate} berjaya dijana! Sila semak dan sunting.`, 'success');
    }
}

// --- FUNGSI RPH DRAFT DAN PENGURUSAN ---

function saveRPHDraft() {
    if (typeof collectRPHDataFromForm !== 'function') {
        safeNotify("Ralat: Fungsi UI untuk mengumpul data borang tidak ditemui.", 'error');
        return;
    }
    const rphData = collectRPHDataFromForm();
    const rphDate = document.getElementById('rph-date').value;
    const docId = document.getElementById('rph-document-id').value;
    
    if (rphData.length === 0 || !rphDate) {
        safeNotify("Tiada slot RPH untuk disimpan atau tarikh tidak dipilih.", 'warning');
        return;
    }

    const docRef = db.collection('rph_drafts').doc(docId || undefined); 
    
    docRef.set({
        guru_uid: currentTeacherUID,
        date: firebase.firestore.Timestamp.fromDate(new Date(rphDate)),
        day: getDayNameFromDate(rphDate),
        slots_data: rphData,
        status: 'Draf',
        last_saved: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }) 
    .then(() => {
        document.getElementById('rph-document-id').value = docRef.id; 
        safeNotify('Draf RPH berjaya disimpan!', 'success');
        getTeacherRPH(currentTeacherUID); 
    })
    .catch(error => {
        console.error("Ralat menyimpan draf RPH:", error);
        safeNotify('Gagal menyimpan draf RPH. Sila semak Peraturan Firebase (Rules).', 'error');
    });
}


function submitRPH() {
    if (typeof collectRPHDataFromForm !== 'function') {
        safeNotify("Ralat: Fungsi UI untuk mengumpul data borang tidak ditemui.", 'error');
        return;
    }
    const rphData = collectRPHDataFromForm();
    const rphDate = document.getElementById('rph-date').value;
    const docId = document.getElementById('rph-document-id').value;

    if (rphData.length === 0 || !rphDate || !docId) {
        safeNotify("Sila simpan RPH sebagai draf dahulu sebelum dihantar.", 'warning');
        return;
    }

    db.collection('rph_drafts').doc(docId).update({
        status: 'Diserahkan',
        submission_time: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        safeNotify('RPH berjaya dihantar ke pentadbir!', 'success');
        getTeacherRPH(currentTeacherUID); 
    })
    .catch(error => {
        console.error("Ralat menghantar RPH:", error);
        safeNotify('Gagal menghantar RPH. Sila semak Peraturan Firebase (Rules).', 'error');
    });
}


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
            // Gunakan safeNotify di sini
            safeNotify(`Gagal memuatkan senarai RPH: Sila semak Peraturan Firebase (Rules).`, 'error');
            return [];
        });
}


window.loadRPHtoEdit = function(rphID) {
    if (!db) return;
    
    db.collection('rph_drafts').doc(rphID).get()
        .then(doc => {
            if (doc.exists && doc.data().guru_uid === currentTeacherUID) {
                document.getElementById('rph-document-id').value = doc.id;
                document.getElementById('rph-date').value = doc.data().date.toDate().toISOString().substring(0, 10);
                
                if (typeof loadRPHFormWithData === 'function') {
                    loadRPHFormWithData(doc.data().slots_data); 
                    document.getElementById('rph-editor-section')?.classList.remove('hidden');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    safeNotify(`RPH Draf (${doc.data().status}) berjaya dimuatkan untuk penyuntingan.`, 'success');
                } else {
                    safeNotify("Ralat: Fungsi UI untuk memuatkan RPH ke borang tidak ditemui.", 'error');
                }
                
            } else {
                safeNotify("Dokumen RPH tidak wujud atau anda tiada kebenaran untuk mengaksesnya.", 'error');
            }
        })
        .catch(error => {
            console.error("Ralat memuatkan RPH:", error);
            safeNotify(`Gagal memuatkan RPH: Sila semak Peraturan Firebase (Rules).`, 'error');
        });
}


// --- KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('guru_rph.html')) {

        if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db) {
            
            // Muatkan data SP dahulu
            loadStandardData();
            
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentTeacherUID = user.uid;
                    getTeacherRPH(currentTeacherUID);
                    if (typeof renderTimetableForm === 'function') {
                        renderTimetableForm(); 
                    }
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
                    if (typeof collectTimetableFormData !== 'function') {
                        safeNotify("Ralat: Fungsi UI untuk mengumpul data Jadual Waktu tidak ditemui.", 'error');
                        return;
                    }
                    const timetableData = collectTimetableFormData(); 
                    if (timetableData.length > 0 && currentTeacherUID) {
                        saveTimetable(timetableData, currentTeacherUID);
                    } else {
                        safeNotify("Sila isi sekurang-kurangnya satu slot Jadual Waktu.", 'warning');
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




