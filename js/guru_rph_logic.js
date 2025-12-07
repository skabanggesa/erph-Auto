// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// KOD LENGKAP: Merangkumi semua fungsi Firebase, Logik Penjanaan RPH, dan Pembetulan Data SP
// =======================================================

let currentTeacherUID = null;
let db = null; 
let auth = null; 

// =======================================================
// KONSTAN DAN CACHE DATA SP
// =======================================================

const SP_DATA_CACHE = {};
const SP_FILE_MAP = {
    // PENTING: Pastikan kod ini sepadan dengan permulaan input subjek anda (cth: "BM 1 Cerdas")
    'BM': 'sp-bm.json',
    'BI': 'sp-bi.json',
    'MT': 'sp-mt.json',
    'SN': 'sp-sn.json',
    'P.ISLAM': 'sp-pai.json', // Mesti guna P.ISLAM (tanpa ruang)
    'RBT': 'sp-rbt.json',
    'PJ': 'sp-pj.json',
    'PK': 'sp-pk.json',
    'SJ': 'sp-sj.json',
};
// Menggunakan 'data/' sebagai laluan standard relatif (anda boleh tukar jika perlu, cth: './data/')
const DATA_JSON_BASE_PATH = 'data/'; 


/**
 * Memuatkan data Standard Pembelajaran (SP) untuk subjek tertentu.
 * @param {string} subjectCode - Kod subjek (cth: 'BM', 'RBT').
 */
async function loadSPData(subjectCode) {
    const normalizedCode = subjectCode.toUpperCase().trim();
    if (SP_DATA_CACHE[normalizedCode]) {
        return SP_DATA_CACHE[normalizedCode];
    }

    const fileName = SP_FILE_MAP[normalizedCode];
    if (!fileName) {
        showNotification(`Kod Subjek '${subjectCode}' tidak dikenali. Sila pastikan ia sepadan dengan SP_FILE_MAP.`, 'warning');
        return null;
    }

    try {
        const response = await fetch(`${DATA_JSON_BASE_PATH}${fileName}`);
        
        if (!response.ok) {
            // Ini akan menunjukkan masalah 404 jika laluan salah
            throw new Error(`Gagal memuatkan fail SP: ${DATA_JSON_BASE_PATH}${fileName} (HTTP Status: ${response.status}). Sila semak laluan JSON anda.`);
        }
        
        const data = await response.json();
        SP_DATA_CACHE[normalizedCode] = data;
        return data;
    } catch (error) {
        showNotification(`Ralat memuatkan data SP: ${error.message}.`, 'error');
        return null;
    }
}

// =======================================================
// FUNGSI PENGURUSAN JADUAL WAKTU (FIREBASE)
// =======================================================

/**
 * Menyimpan data Jadual Waktu ke Firestore.
 */
async function saveTimetable(timetableData, uid) {
    if (!db || !uid) return;

    try {
        await db.collection('timetables').doc(uid).set({
            data: timetableData,
            last_updated: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification('Data Jadual Waktu berjaya disimpan!', 'success');
    } catch (error) {
        showNotification(`Gagal menyimpan Jadual Waktu: ${error.message}`, 'error');
    }
}

/**
 * [FUNGSI WAJIB] Memuatkan Jadual Waktu sedia ada (Didedahkan ke Window)
 */
window.loadExistingTimetable = async function(uid) {
    if (!db || !uid) return;
    
    window.currentTeacherUID = uid; // Pastikan ia tersedia secara global

    try {
        const doc = await db.collection('timetables').doc(uid).get();
        if (doc.exists) {
            const data = doc.data().data || [];
            if (typeof loadTimetableFormWithData === 'function') {
                loadTimetableFormWithData(data); 
                showNotification('Data Jadual Waktu berjaya dimuatkan.', 'success');
            }
        } else {
            if (typeof createEmptyTimetableForm === 'function') {
                createEmptyTimetableForm();
                showNotification('Tiada Jadual Waktu ditemui. Borang kosong telah dijana.', 'info');
            }
        }
    } catch (error) {
        showNotification(`Ralat memuatkan Jadual Waktu: ${error.message}`, 'error');
    }
}

// =======================================================
// FUNGSI RPH GENERATION
// =======================================================

/**
 * Mencari nama hari dari input tarikh.
 */
function getDayNameFromDate(dateInput) {
    // Menambah 'T00:00:00' untuk mengelakkan isu zon waktu dalam pelayar
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput + 'T00:00:00'); 
    if (isNaN(date)) return "Tarikh Tidak Sah"; 
    // Diandaikan 'ms-MY' adalah locale untuk hari dalam bahasa Melayu
    return date.toLocaleDateString('ms-MY', { weekday: 'long' }); 
}

/**
 * Menjana RPH berdasarkan Jadual Waktu dan data SP. (Logik traversal diperbaiki)
 */
async function generateRPHData() {
    if (!db || !currentTeacherUID) return; 

    const dateInput = document.getElementById('rph-date').value;
    if (!dateInput) {
        showNotification('Sila pilih Tarikh RPH.', 'warning');
        return;
    }
    
    const dayName = getDayNameFromDate(dateInput);

    let timetableData = [];
    try {
        const doc = await db.collection('timetables').doc(currentTeacherUID).get();
        if (doc.exists) {
            timetableData = doc.data().data || [];
        }
    } catch (error) {
        showNotification(`Gagal memuatkan Jadual Waktu: ${error.message}`, 'error');
        return;
    }

    const dailySlots = timetableData.find(d => d.day.toLowerCase() === dayName.toLowerCase());
    if (!dailySlots || dailySlots.slots.length === 0) {
        showNotification(`Tiada slot Jadual Waktu ditemui untuk hari ${dayName}. Sila urus Jadual Waktu anda terlebih dahulu.`, 'warning');
        return;
    }

    const generatedSlots = [];
    for (const slot of dailySlots.slots) {
        // Logik PENGESANAN KOD SUBJEK YANG LEBIH BAIK
        let subjectCode = slot.subject.split(' ')[0].toUpperCase();

        const normalizedSlotSubject = slot.subject.toUpperCase().replace(/\s/g, ''); 
        if (normalizedSlotSubject.includes('P.ISLAM')) {
            subjectCode = 'P.ISLAM';
        } else if (SP_FILE_MAP[subjectCode]) {
            // Kekalkan kod pendek seperti BM, RBT
        } else {
             subjectCode = slot.subject.split(' ')[0].toUpperCase();
        }
        
        const spData = await loadSPData(subjectCode);
        
        let objectives = '';
        let activities = '';
        let assessment = '';
        let aids = '';
        let standardsFound = false; 

        if (spData) {
            const targetSP = slot.standards.trim().toUpperCase();
            
            // Loop Tahap 1: TAHUN (cth: TAHUN 1)
            outerLoop:
            for (const year in spData) {
                const yearData = spData[year];
                // Loop Tahap 2: UNIT/TOPIK UTAMA (cth: Unit 1: Keluarga Saya)
                for (const unit in yearData) {
                    const unitOrTopic = yearData[unit];
                    let lessonsArray = [];
                    
                    // LOGIK TRAVERSAL DATA
                    if (Array.isArray(unitOrTopic)) {
                         lessonsArray = unitOrTopic;
                    } else if (unitOrTopic && unitOrTopic.topics && Array.isArray(unitOrTopic.topics)) {
                        // Untuk struktur RBT
                        for (const topic of unitOrTopic.topics) {
                            if (topic.lessons && Array.isArray(topic.lessons)) {
                                lessonsArray.push(...topic.lessons);
                            }
                        }
                    } else if (unitOrTopic && typeof unitOrTopic === 'object') {
                        // Untuk struktur BM/BI/MT/PAI/PJ/PK/SJ (Unit mengandungi sub-kunci Mendengar/Menulis/dll.)
                        for (const key in unitOrTopic) {
                            if (Array.isArray(unitOrTopic[key])) {
                                lessonsArray.push(...unitOrTopic[key]);
                            }
                        }
                    }
                    
                    // Cari SP yang sepadan
                    const lessonMatch = lessonsArray.find(l => l.standards && l.standards.trim().toUpperCase() === targetSP);
                    
                    if (lessonMatch) {
                        objectives = lessonMatch.objectives;
                        // Formatkan array ke dalam format teks bertitik
                        activities = Array.isArray(lessonMatch.activities) ? lessonMatch.activities.join('\n- ') : lessonMatch.activities;
                        assessment = Array.isArray(lessonMatch.assessment) ? lessonMatch.assessment.join('\n- ') : lessonMatch.assessment;
                        aids = Array.isArray(lessonMatch.aids) ? lessonMatch.aids.join('\n- ') : lessonMatch.aids;
                        standardsFound = true;
                        break outerLoop; 
                    }
                }
            }
        }
        
        // Tetapkan teks lalai jika SP tidak ditemui
        generatedSlots.push({
            ...slot,
            standards: slot.standards,
            // Berikan mesej yang jelas kepada pengguna jika gagal
            objectives: standardsFound ? objectives : '❌ Objektif gagal dijana. (SP tidak ditemui atau ralat data)',
            activities: standardsFound ? (activities.startsWith('-') ? activities : `- ${activities}`) : '❌ Aktiviti gagal dijana.',
            assessment: standardsFound ? (assessment.startsWith('-') ? assessment : `- ${assessment}`) : '❌ Penilaian gagal dijana.',
            aids: standardsFound ? (aids.startsWith('-') ? aids : `- ${aids}`) : '❌ BBM gagal dijana.',
            refleksi: '' 
        });
    }

    document.getElementById('rph-editor-section')?.classList.remove('hidden');
    
    if (typeof loadRPHFormWithData === 'function') {
        loadRPHFormWithData(generatedSlots, dayName, dateInput); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showNotification(`RPH Draf untuk ${dayName}, ${dateInput} berjaya dijana! Sila semak medan yang gagal dimuatkan (berlabel ❌).`, 'success');
    }
}


// =======================================================
// FUNGSI PENGURUSAN RPH (FIREBASE)
// =======================================================

/**
 * Menyimpan atau Mengemas kini draf RPH ke Firestore.
 */
async function saveRPHData(e) {
    if (e) e.preventDefault();
    // collectRPHFormData diandaikan ada dalam ui_utils.js
    if (!db || !currentTeacherUID || typeof collectRPHFormData !== 'function') return;

    const docId = document.getElementById('rph-document-id').value || db.collection('rph_drafts').doc().id;
    const dateInput = document.getElementById('rph-date').value;
    const dayName = getDayNameFromDate(dateInput);
    const slotsData = collectRPHFormData();
    
    if (slotsData.length === 0) {
        showNotification('Ralat: Tiada slot RPH untuk disimpan.', 'warning');
        return;
    }

    try {
        await db.collection('rph_drafts').doc(docId).set({
            guru_uid: currentTeacherUID,
            date: new Date(dateInput),
            day_name: dayName,
            status: 'Draf', 
            slots_data: slotsData,
            last_updated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        document.getElementById('rph-document-id').value = docId; 
        showNotification('Draf RPH berjaya disimpan!', 'success');
        getTeacherRPH(currentTeacherUID); 
    } catch (error) {
        showNotification(`Gagal menyimpan RPH: ${error.message}`, 'error');
    }
}

/**
 * Mengemukakan RPH kepada Pentadbir.
 */
async function submitRPH() {
    if (!db || !currentTeacherUID) return;

    const docId = document.getElementById('rph-document-id').value;
    if (!docId) {
        showNotification('Sila simpan RPH sebagai draf sebelum mengemukakan.', 'warning');
        return;
    }

    // Panggil saveRPHData dahulu untuk memastikan data terkini disimpan
    await saveRPHData(); 

    try {
        await db.collection('rph_drafts').doc(docId).update({
            status: 'Dikemukakan',
            submitted_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification('RPH berjaya dikemukakan kepada Pentadbir!', 'success');
        getTeacherRPH(currentTeacherUID); 
    } catch (error) {
        showNotification(`Gagal mengemukakan RPH: ${error.message}`, 'error');
    }
}

/**
 * Memuatkan senarai RPH guru.
 */
async function getTeacherRPH(uid) {
    if (!db || !uid) return;

    try {
        const snapshot = await db.collection('rph_drafts')
            .where('guru_uid', '==', uid)
            .orderBy('date', 'desc')
            .get();

        const rphList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // renderRPHList diandaikan ada dalam ui_utils.js
        if (typeof renderRPHList === 'function') {
             renderRPHList(rphList); 
        }
        
        return rphList;
    } catch (error) {
        showNotification(`Gagal memuatkan senarai RPH: ${error.message}`, 'error');
        return [];
    }
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
                
                const rphDate = doc.data().date.toDate().toISOString().substring(0, 10);
                document.getElementById('rph-date').value = rphDate;
                
                if (typeof loadRPHFormWithData === 'function') {
                    // PENTING: Muatkan semula data borang RPH
                    loadRPHFormWithData(doc.data().slots_data, doc.data().day_name, rphDate); 
                    document.getElementById('rph-editor-section')?.classList.remove('hidden');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    showNotification(`RPH Draf (${doc.data().status}) berjaya dimuatkan untuk penyuntingan.`, 'success');
                } else {
                    showNotification("Ralat: Fungsi UI untuk memuatkan RPH ke borang (loadRPHFormWithData) tidak ditemui.", 'error');
                }
            } else {
                showNotification('RPH tidak ditemui atau anda tiada akses.', 'error');
            }
        })
        .catch(error => {
            showNotification(`Gagal memuatkan RPH: ${error.message}`, 'error');
        });
}


// =======================================================
// INISIALISASI DAN PENGENDALI ACARA (EVENT HANDLERS)
// =======================================================

// --- KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('guru_rph.html')) {

        // Pastikan objek Firebase wujud
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            auth = firebase.auth();
            db = firebase.firestore();
            
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentTeacherUID = user.uid;
                    window.currentTeacherUID = user.uid; // Dedahkan ke global untuk ui_utils
                    document.getElementById('user-name').textContent = user.email; 
                    
                    getTeacherRPH(currentTeacherUID);
                    // loadExistingTimetable hanya akan dipanggil jika tab Jadual Waktu diaktifkan 
                    // atau dipanggil secara eksplisit oleh initializeTabSwitching dalam ui_utils.js.
                    // Jika anda ingin ia dimuatkan sejurus log masuk (jika anda berada di tab yang betul), buka komen baris di bawah:
                    // window.loadExistingTimetable(currentTeacherUID); 
                } else {
                    // Logik jika tiada pengguna (cth: redirect ke login.html)
                    // window.location.href = 'index.html'; 
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
                        window.location.href = 'index.html'; 
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
                         showNotification('Ralat: Fungsi mengumpul data Jadual Waktu (collectTimetableFormData) tidak ditemui.', 'error');
                    }
                });
            }

        } else {
            showNotification('Ralat: Perkhidmatan Firebase tidak dimuatkan. Sila semak konfigurasi.', 'error');
        }
    }
});
