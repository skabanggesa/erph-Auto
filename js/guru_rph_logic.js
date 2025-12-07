// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// KOD LENGKAP: Logik Penjanaan RPH Baharu (Dengan dropdown SP dinamik)
// =======================================================

let currentTeacherUID = null;
let db = null; 
let auth = null; 

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
// Laluan Krusial: "../data/" mengandaikan folder 'js' dan 'data' adalah sebaris
const DATA_JSON_BASE_PATH = 'data/'; 


/**
 * Memuatkan data Standard Pembelajaran (SP) untuk subjek tertentu.
 * (Fungsi 1/10)
 */
async function loadSPData(subjectCode) {
    const normalizedCode = subjectCode.toUpperCase().trim();
    if (SP_DATA_CACHE[normalizedCode]) {
        return SP_DATA_CACHE[normalizedCode];
    }

    const fileName = SP_FILE_MAP[normalizedCode];
    if (!fileName) {
        showNotification(`Kod Subjek '${subjectCode}' tidak dikenali.`, 'warning');
        return null;
    }

    const fullPath = `${DATA_JSON_BASE_PATH}${fileName}`;

    try {
        const response = await fetch(fullPath);
        
        if (!response.ok) {
            throw new Error(`Gagal memuatkan fail SP: ${fullPath} (HTTP Status: ${response.status}). Sila semak laluan JSON anda.`);
        }
        
        const data = await response.json();
        SP_DATA_CACHE[normalizedCode] = data;
        return data;
    } catch (error) {
        showNotification(`Ralat memuatkan data SP: ${error.message}.`, 'error');
        console.error(`[FATAL ERROR] Gagal memuatkan SP Data: ${error.message}`);
        return null;
    }
}


/**
 * Mengeluarkan semua data pelajaran (lessons) daripada struktur JSON.
 * (Fungsi 2/10)
 */
function extractAllLessons(spData) {
    const allLessons = [];
    if (!spData) return allLessons;

    for (const year in spData) {
        const yearData = spData[year];
        for (const unit in yearData) {
            const unitOrTopic = yearData[unit];
            
            if (Array.isArray(unitOrTopic)) {
                unitOrTopic.forEach(lesson => allLessons.push(lesson));
            } else if (unitOrTopic && unitOrTopic.topics && Array.isArray(unitOrTopic.topics)) {
                // Struktur RBT
                for (const topic of unitOrTopic.topics) {
                    if (topic.lessons && Array.isArray(topic.lessons)) {
                        topic.lessons.forEach(lesson => allLessons.push(lesson));
                    }
                }
            } else if (unitOrTopic && typeof unitOrTopic === 'object') {
                // Struktur BM/BI/MT/dll. (mengandungi sub-kunci: Mendengar, Menulis)
                for (const key in unitOrTopic) {
                    if (Array.isArray(unitOrTopic[key])) {
                        unitOrTopic[key].forEach(lesson => allLessons.push(lesson));
                    }
                }
            }
        }
    }
    return allLessons.filter(lesson => lesson.standards);
}


// =======================================================
// FUNGSI PENGURUSAN JADUAL WAKTU (FIREBASE)
// =======================================================

/**
 * Menyimpan data Jadual Waktu ke Firestore.
 * (Fungsi 3/10)
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
 * Memuatkan Jadual Waktu sedia ada (Didedahkan ke Window)
 * (Fungsi 4/10 - KRITIKAL dipanggil oleh ui_utils.js)
 */
window.loadExistingTimetable = async function(uid) {
    if (!db || !uid) return;
    
    // Pastikan UID global ditetapkan (penting untuk UI Utils)
    window.currentTeacherUID = uid;

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
 * (Fungsi 5/10)
 */
function getDayNameFromDate(dateInput) {
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput + 'T00:00:00'); 
    if (isNaN(date)) return "Tarikh Tidak Sah"; 
    // Guna 'ms-MY' untuk format Bahasa Malaysia
    return date.toLocaleDateString('ms-MY', { weekday: 'long' }); 
}

/**
 * Menjana RPH berdasarkan Jadual Waktu dan data SP (memuatkan semua pilihan SP).
 * (Fungsi 6/10 - KRITIKAL)
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
        showNotification(`Tiada slot Jadual Waktu ditemui untuk hari ${dayName}.`, 'warning');
        return;
    }

    const generatedSlots = [];
    for (const slot of dailySlots.slots) {
        
        // --- PENGESANAN KOD SUBJEK ---
        let subjectCode = slot.subject.split(' ')[0].toUpperCase();
        const normalizedSlotSubject = slot.subject.toUpperCase().replace(/\s/g, ''); 
        if (normalizedSlotSubject.includes('P.ISLAM')) {
            subjectCode = 'P.ISLAM';
        } else if (!SP_FILE_MAP[subjectCode]) {
             subjectCode = slot.subject.split(' ')[0].toUpperCase();
        }
        
        const spData = await loadSPData(subjectCode);
        
        // --- KUMPUL SEMUA LESSONS DAN PILIH DEFAULT ---
        const allLessons = extractAllLessons(spData);
        const defaultLesson = allLessons.length > 0 ? allLessons[0] : null; 

        let objectives = '';
        let activities = '';
        let assessment = '';
        let aids = '';
        let standardsDefault = ''; 
        
        // Fungsi pembantu untuk memformat teks (pastikan array bertukar jadi teks bertitik)
        const formatText = (data) => {
            if (!data) return '';
            const text = Array.isArray(data) ? data.join('\n- ') : data;
            return text ? (text.startsWith('-') ? text : `- ${text}`) : ''; 
        };

        if (defaultLesson) {
            standardsDefault = defaultLesson.standards;
            objectives = defaultLesson.objectives;
            activities = defaultLesson.activities;
            assessment = defaultLesson.assessment;
            aids = defaultLesson.aids;
        }
        
        // --- DATA AKHIR SLOT ---
        generatedSlots.push({
            ...slot,
            // PENTING: Simpan semua pilihan data lessons ke dalam slot untuk kegunaan UI (dropdown)
            sp_data_options: allLessons, 
            
            // Nilai lalai yang akan dipaparkan (berdasarkan SP pertama)
            standards: standardsDefault || '⚠️ Sila pilih SP',
            objectives: objectives || '❌ Objektif belum dijana. (Pilih SP)',
            activities: formatText(activities),
            assessment: formatText(assessment),
            aids: formatText(aids),
            refleksi: '' 
        });
    }

    document.getElementById('rph-editor-section')?.classList.remove('hidden');
    
    if (typeof loadRPHFormWithData === 'function') {
        loadRPHFormWithData(generatedSlots, dayName, dateInput); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showNotification(`RPH Draf untuk ${dayName}, ${dateInput} berjaya dijana! Sila gunakan dropdown SP untuk memilih SP yang betul.`, 'success');
    }
}


// =======================================================
// FUNGSI PENGURUSAN RPH (FIREBASE)
// =======================================================

/**
 * Menyimpan atau Mengemas kini draf RPH ke Firestore.
 * (Fungsi 7/10)
 */
async function saveRPHData(e) {
    if (e) e.preventDefault();
    if (!db || !currentTeacherUID || typeof collectRPHFormData !== 'function') return;

    const docId = document.getElementById('rph-document-id').value || db.collection('rph_drafts').doc().id;
    const dateInput = document.getElementById('rph-date').value;
    const dayName = getDayNameFromDate(dateInput);
    const slotsData = collectRPHFormData();
    
    if (slotsData.length === 0 || !dateInput) {
        showNotification('Ralat: Sila pastikan Tarikh dan sekurang-kurangnya satu slot RPH ada untuk disimpan.', 'warning');
        return;
    }

    try {
        await db.collection('rph_drafts').doc(docId).set({
            guru_uid: currentTeacherUID,
            date: new Date(dateInput + 'T00:00:00'), // Simpan sebagai tarikh
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
 * (Fungsi 8/10)
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
 * (Fungsi 9/10)
 */
async function getTeacherRPH(uid) {
    if (!db || !uid) return;

    try {
        const snapshot = await db.collection('rph_drafts')
            .where('guru_uid', '==', uid)
            .orderBy('date', 'desc')
            .get();

        const rphList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
 * loadRPHtoEdit(rphID) - Memuatkan RPH sedia ada untuk disunting (Didedahkan ke Window)
 * (Fungsi 10/10 - KRITIKAL dipanggil dari HTML yang dijana oleh ui_utils.js)
 */
window.loadRPHtoEdit = function(rphID) {
    if (!db) return;
    
    db.collection('rph_drafts').doc(rphID).get()
        .then(doc => {
            if (doc.exists && doc.data().guru_uid === currentTeacherUID) {
                document.getElementById('rph-document-id').value = doc.id;
                
                // Format tarikh ke ISO (YYYY-MM-DD) untuk input type="date"
                const rphDate = doc.data().date.toDate().toISOString().substring(0, 10);
                document.getElementById('rph-date').value = rphDate;
                
                if (typeof loadRPHFormWithData === 'function') {
                    loadRPHFormWithData(doc.data().slots_data, doc.data().day_name, rphDate); 
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


// =======================================================
// INISIALISASI UTAMA
// =======================================================

// --- KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('guru_rph.html')) {

        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            // INISIALISASI FIREBASE
            auth = firebase.auth();
            db = firebase.firestore();
            
            // PENGURUSAN STATUS AUTENTIKASI
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentTeacherUID = user.uid;
                    window.currentTeacherUID = user.uid; // Didedahkan ke global untuk ui_utils
                    document.getElementById('user-name').textContent = user.email; 
                    
                    getTeacherRPH(currentTeacherUID);
                    
                    // Muatkan Jadual Waktu pada permulaan jika tab Jadual Waktu aktif secara lalai
                    const timetableTab = document.getElementById('timetable-tab');
                    if (timetableTab && !timetableTab.classList.contains('hidden')) {
                        window.loadExistingTimetable(currentTeacherUID);
                    }
                    
                } else {
                    // Logik jika tiada pengguna: Redirect ke login page
                    // window.location.href = 'index.html'; 
                }
            });
            
            // --- EVENT LISTENERS UI ---
            
            document.getElementById('generate-rph-btn')?.addEventListener('click', generateRPHData);

            document.getElementById('logout-btn')?.addEventListener('click', () => {
                auth.signOut().then(() => {
                    window.location.href = 'index.html'; 
                });
            });

            document.getElementById('save-rph-btn')?.addEventListener('click', saveRPHData);
            
            document.getElementById('submit-rph-btn')?.addEventListener('click', submitRPH);

            document.getElementById('save-timetable-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                // Memanggil fungsi dari ui_utils.js
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

        } else {
            showNotification('Ralat: Perkhidmatan Firebase tidak dimuatkan. Sila semak konfigurasi.', 'error');
        }
    }
});


