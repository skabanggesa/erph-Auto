// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// Kemas kini: Memastikan pemuatan Jadual Waktu berfungsi dengan kuat dan penambahan logik muat data SP dari JSON.
// =======================================================

let currentTeacherUID = null;

// =======================================================
// KONSTAN DAN CACHE DATA SP
// =======================================================

// Cache untuk menyimpan data SP yang telah dimuatkan
const SP_DATA_CACHE = {};
// Peta untuk menghubungkan kod subjek dengan nama fail JSON
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
    // Tambah subjek lain mengikut fail JSON yang tersedia
};
// Laluan dasar fail JSON seperti yang diminta oleh pengguna
const DATA_JSON_BASE_PATH = 'erph-Auto/data/'; 

/**
 * Memuatkan data Standard Pembelajaran (SP) untuk subjek tertentu.
 * Menggunakan cache untuk mengelakkan pemuatan berulang.
 * @param {string} subjectCode - Kod subjek (cth: 'BM', 'BI').
 * @returns {Promise<Object>} Data SP untuk subjek tersebut.
 */
async function loadSPData(subjectCode) {
    if (SP_DATA_CACHE[subjectCode]) {
        return SP_DATA_CACHE[subjectCode];
    }

    const fileName = SP_FILE_MAP[subjectCode];
    if (!fileName) {
        showNotification(`Ralat: Fail SP untuk subjek ${subjectCode} tidak ditemui dalam peta.`, 'warning');
        return null;
    }

    const filePath = DATA_JSON_BASE_PATH + fileName;

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Gagal memuatkan fail: ${filePath} (Status: ${response.status})`);
        }
        const data = await response.json();
        SP_DATA_CACHE[subjectCode] = data;
        return data;
    } catch (error) {
        showNotification(`Ralat memuatkan data SP untuk ${subjectCode}: ${error.message}`, 'error');
        console.error('Error loading SP data:', error);
        return null;
    }
}


/**
 * Fungsi pembantu untuk menjana kandungan RPH automatik (Objektif, Aktiviti, Penilaian, BBM).
 * @param {Object} slot - Objek slot jadual waktu ({ time, subject, class, standards })
 * @returns {Promise<Object|null>} Objek yang mengandungi standards, objectives, activities, assessment, aids atau null.
 */
async function generateAutoRPHContent(slot) {
    if (!slot.subject || !slot.standards || !slot.class) return null;
    
    const subjectCode = slot.subject.toUpperCase(); 
    // Cuba ekstrak nombor tahun dari nama kelas (cth: 5_BESTARI -> TAHUN 5)
    const year = `TAHUN ${slot.class.match(/(\d)/)?.[1] || '1'}`; 
    const standardCode = slot.standards.trim();

    const spData = await loadSPData(subjectCode);
    if (!spData) return null;

    let foundLesson = null;
    
    // Cari dalam data tahun yang sepadan
    const yearData = spData[year];
    
    // Struktur JSON boleh berbeza, cuba cari di dalam 'topics' atau terus di bawah unit/bahagian
    if (yearData && yearData.topics) { // Contoh struktur: RBT, SJ, MT (menggunakan array topics)
        for (const topic of yearData.topics) {
            for (const lesson of topic.lessons) {
                if (lesson.standards === standardCode) {
                    foundLesson = lesson;
                    slot.tahun = year.replace('TAHUN ', ''); 
                    slot.bidang = topic.topic_name; 
                    break;
                }
            }
            if (foundLesson) break;
        }
    } else if (yearData) { // Contoh struktur alternatif: BI, BM, P.ISLAM (unit diikuti sections/bidang)
         for (const unit in yearData) {
             for (const section in yearData[unit]) {
                 for (const lesson of yearData[unit][section]) {
                    if (lesson.standards === standardCode) {
                        foundLesson = lesson;
                        slot.tahun = year.replace('TAHUN ', '');
                        slot.bidang = unit + ' - ' + section; // Contoh: 'Unit 1: My Classroom - Listening'
                        break;
                    }
                 }
                 if (foundLesson) break;
             }
             if (foundLesson) break;
         }
    }


    if (foundLesson) {
        // Gabungkan array menjadi string berbaris baru jika perlu
        return {
            standards: standardCode, 
            objectives: Array.isArray(foundLesson.objectives) ? foundLesson.objectives.join('\n') : foundLesson.objectives,
            activities: Array.isArray(foundLesson.activities) ? foundLesson.activities.join('\n') : foundLesson.activities,
            assessment: Array.isArray(foundLesson.assessment) ? foundLesson.assessment.join('\n') : foundLesson.assessment,
            aids: Array.isArray(foundLesson.aids) ? foundLesson.aids.join('\n') : foundLesson.aids,
        };
    } else {
        showNotification(`Ralat: Standard Pembelajaran ${standardCode} untuk ${subjectCode} (${year}) tidak ditemui.`, 'warning');
        return {
            standards: standardCode,
            objectives: `**Sila masukkan Objektif, Aktiviti, Penilaian dan BBM secara manual untuk SP ${standardCode}.**`,
            activities: '',
            assessment: '',
            aids: ''
        };
    }
}


// =======================================================
// FUNGSI UTAMA RPH & JADUAL WAKTU
// =======================================================

/**
 * Menyimpan data Jadual Waktu ke Firestore.
 * @param {Array<Object>} timetableData 
 * @param {string} userUID 
 */
function saveTimetable(timetableData, userUID) {
    if (!db || !userUID) return;
    
    db.collection('timetables').doc(userUID).set({
        guru_uid: userUID,
        data: timetableData,
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showNotification('Jadual Waktu berjaya disimpan!', 'success');
        // Update cache selepas simpan
        SP_DATA_CACHE.timetable = timetableData;
    })
    .catch(error => {
        showNotification(`Gagal menyimpan Jadual Waktu: ${error.message}`, 'error');
    });
}

/**
 * Memuatkan Jadual Waktu sedia ada dari Firestore dan memaparkannya.
 * @param {string} userUID 
 * @param {Object} options - {returnData: boolean} untuk hanya mengembalikan data
 * @returns {Promise<Array<Object>|void>} Data Jadual Waktu atau void
 */
async function loadExistingTimetable(userUID, options = {}) {
    if (!db || !userUID) {
        if (!options.returnData) showNotification('Firebase atau UID guru tidak tersedia.', 'error');
        return options.returnData ? [] : undefined;
    }

    try {
        const doc = await db.collection('timetables').doc(userUID).get();

        if (doc.exists) {
            const timetableData = doc.data().data || [];
            SP_DATA_CACHE.timetable = timetableData; // Simpan dalam cache
            
            if (options.returnData) {
                return timetableData;
            }

            // Panggil fungsi UI untuk mengisi borang Jadual Waktu (dari ui_utils.js)
            if (typeof loadTimetableFormWithData === 'function') {
                loadTimetableFormWithData(timetableData); 
                showNotification('Jadual Waktu sedia ada berjaya dimuatkan.', 'info');
            } else {
                 showNotification('Gagal memuatkan Jadual Waktu ke borang (Fungsi UI tidak ditemui).', 'error');
            }
            return timetableData;
        } else {
            if (!options.returnData) showNotification('Tiada Jadual Waktu ditemui. Sila masukkan Jadual Waktu anda.', 'warning');
            SP_DATA_CACHE.timetable = [];
            // Panggil fungsi UI untuk mencipta borang kosong
            if (typeof createEmptyTimetableForm === 'function') {
                 createEmptyTimetableForm(); 
            }
            return [];
        }
    } catch (error) {
        showNotification(`Gagal memuatkan Jadual Waktu: ${error.message}`, 'error');
        console.error('Error loading timetable:', error);
        return options.returnData ? [] : undefined;
    }
}


/**
 * [FUNGSI WAJIB] generateRPHData()
 * Mengumpul data borang RPH, menjana data automatik (SP), dan menyimpan sebagai draf.
 */
async function generateRPHData() {
    document.getElementById('generate-rph-btn').disabled = true;
    showNotification('Menganalisis jadual waktu dan menjana draf RPH...', 'info');

    const dateInput = document.getElementById('rph-date')?.value;
    // getDayNameFromDate dari ui_utils.js
    const hari = typeof getDayNameFromDate === 'function' ? getDayNameFromDate(dateInput) : 'Hari Tidak Dikenal Pasti';

    if (!dateInput || !currentTeacherUID) {
        showNotification('Sila pilih tarikh RPH dan pastikan anda telah log masuk.', 'error');
        document.getElementById('generate-rph-btn').disabled = false;
        return;
    }

    // 1. Dapatkan Jadual Waktu Guru (Cuba dari cache, jika tiada muat dari Firestore)
    const timetable = SP_DATA_CACHE.timetable || await loadExistingTimetable(currentTeacherUID, { returnData: true });

    if (!timetable || timetable.length === 0) {
        showNotification('Gagal memuatkan Jadual Waktu. Sila uruskan Jadual Waktu anda dahulu.', 'error');
        document.getElementById('generate-rph-btn').disabled = false;
        return;
    }
    
    // Cari slot untuk hari yang dipilih
    const dayData = timetable.find(d => d.day.toLowerCase().trim() === hari.toLowerCase().trim());
    
    if (!dayData || dayData.slots.length === 0) {
        showNotification(`Tiada kelas ditemui dalam Jadual Waktu untuk hari ${hari}.`, 'warning');
        document.getElementById('generate-rph-btn').disabled = false;
        return;
    }

    // 2. Jana slot RPH dengan data SP
    const slotsData = [];
    let spLoadingFailed = false;

    for (const slot of dayData.slots) {
        const autoData = await generateAutoRPHContent(slot);
        if (autoData === null) {
            spLoadingFailed = true;
            break;
        }

        slotsData.push({
            ...slot,
            ...autoData,
            status: 'Draf',
            refleksi: '', // Kosongkan refleksi untuk draf baru
            
            // Data tambahan untuk borang (disediakan dalam generateAutoRPHContent)
            tahun: slot.tahun || 'Tidak Diketahui', 
            bidang: slot.bidang || 'Tidak Diketahui'
        });
    }

    if (spLoadingFailed) {
        document.getElementById('generate-rph-btn').disabled = false;
        return;
    }

    // 3. Paparkan RPH dalam borang editor
    // loadRPHFormWithData dari ui_utils.js
    if (typeof loadRPHFormWithData === 'function') {
        loadRPHFormWithData(slotsData, hari, dateInput); 
        document.getElementById('rph-document-id').value = ''; // Pastikan ID dikosongkan untuk draf baru
        document.getElementById('rph-editor-section')?.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showNotification(`RPH untuk ${hari}, ${dateInput} berjaya dijana secara automatik. Sila semak dan simpan sebagai draf.`, 'success');
    } else {
        console.error('loadRPHFormWithData function not found.');
        showNotification('Ralat: Fungsi UI untuk memuatkan borang RPH tidak ditemui.', 'error');
    }

    document.getElementById('generate-rph-btn').disabled = false;
}

/**
 * Menyimpan data RPH ke Firestore sebagai draf.
 */
function saveRPHData() {
    document.getElementById('save-rph-btn').disabled = true;

    if (!db || !currentTeacherUID) {
        showNotification('Ralat: Pangkalan data atau UID guru tidak tersedia.', 'error');
        document.getElementById('save-rph-btn').disabled = false;
        return;
    }

    // collectRPHFormData dari ui_utils.js
    if (typeof collectRPHFormData !== 'function') {
        showNotification('Ralat: Fungsi mengumpul data borang RPH tidak ditemui.', 'error');
        document.getElementById('save-rph-btn').disabled = false;
        return;
    }

    const rphData = {
        guru_uid: currentTeacherUID,
        date: new Date(document.getElementById('rph-date').value),
        hari: typeof getDayNameFromDate === 'function' ? getDayNameFromDate(document.getElementById('rph-date').value) : 'Tidak Diketahui',
        slots_data: collectRPHFormData(), 
        status: 'Draf', 
        last_saved: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const docId = document.getElementById('rph-document-id').value;
    
    // Tentukan sama ada simpan baru atau kemas kini
    const savePromise = docId 
        ? db.collection('rph_drafts').doc(docId).update(rphData)
        : db.collection('rph_drafts').add(rphData);

    savePromise
        .then(docRef => {
            const newDocId = docId || docRef.id;
            document.getElementById('rph-document-id').value = newDocId; // Kemas kini ID untuk draf baru
            showNotification('RPH berjaya disimpan sebagai Draf.', 'success');
            getTeacherRPH(currentTeacherUID); // Muat semula senarai
        })
        .catch(error => {
            showNotification(`Gagal menyimpan RPH: ${error.message}`, 'error');
            console.error('Error saving RPH: ', error);
        })
        .finally(() => {
            document.getElementById('save-rph-btn').disabled = false;
        });
}


/**
 * Mengemukakan draf RPH kepada Pentadbir.
 */
function submitRPH() {
    const docId = document.getElementById('rph-document-id').value;
    if (!docId) {
        showNotification('Sila simpan RPH sebagai draf sebelum mengemukakan.', 'warning');
        return;
    }

    if (!confirm("Adakah anda pasti mahu mengemukakan RPH ini untuk semakan Pentadbir?")) {
        return;
    }

    db.collection('rph_drafts').doc(docId).update({
        status: 'Disemak',
        submitted_at: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showNotification('RPH berjaya dikemukakan untuk semakan.', 'success');
        getTeacherRPH(currentTeacherUID); 
    })
    .catch(error => {
        showNotification(`Gagal mengemukakan RPH: ${error.message}`, 'error');
    });
}


/**
 * Memuatkan senarai RPH untuk guru semasa
 * @param {string} userUID 
 */
function getTeacherRPH(userUID) {
    if (!db || !userUID) return;
    
    return db.collection('rph_drafts')
        .where('guru_uid', '==', userUID)
        .orderBy('date', 'desc')
        .get()
        .then(snapshot => {
            const rphList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // displayRPHList dari ui_utils.js
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
                document.getElementById('rph-date').value = doc.data().date.toDate().toISOString().substring(0, 10);
                
                // Panggil fungsi UI untuk mengisi semula borang RPH
                if (typeof loadRPHFormWithData === 'function') {
                    loadRPHFormWithData(doc.data().slots_data, doc.data().hari, document.getElementById('rph-date').value); 
                    document.getElementById('rph-editor-section')?.classList.remove('hidden');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    showNotification(`RPH Draf (${doc.data().status}) berjaya dimuatkan untuk penyuntingan.`, 'success');
                } else {
                    showNotification("Ralat: Fungsi UI untuk memuatkan RPH ke borang tidak ditemui.", 'error');
                }
            } else {
                showNotification("Ralat: Dokumen RPH tidak ditemui atau anda tiada kebenaran untuk menyuntingnya.", 'error');
            }
        })
        .catch(error => {
            showNotification(`Gagal memuatkan RPH untuk penyuntingan: ${error.message}`, 'error');
        });
};

// =======================================================
// KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan kod ini hanya berjalan pada halaman guru_rph.html
    if (window.location.pathname.includes('guru_rph.html')) {

        // Pastikan objek Firebase wujud (dari auth.js & app.js)
        if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db) {
            
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentTeacherUID = user.uid;
                    getTeacherRPH(currentTeacherUID);
                    // PANGGILAN PENTING: Memuatkan borang Jadual Waktu semasa mula-mula log masuk
                    loadExistingTimetable(currentTeacherUID); 
                } else {
                    // Jika tiada pengguna, redirect ke halaman log masuk
                    if (!window.location.pathname.includes('index.html')) {
                         // Asumsi: login page adalah index.html atau guru_rph.html adalah gated
                         // Di sini, kita hanya tunjukkan notifikasi
                         showNotification('Sesi tamat. Sila log masuk semula.', 'warning');
                    }
                }
            });
            
            // --- EVENT LISTENERS UI KHAS GURU ---
            
            const generateRphBtn = document.getElementById('generate-rph-btn');
            if (generateRphBtn) {
                generateRphBtn.addEventListener('click', generateRPHData);
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
