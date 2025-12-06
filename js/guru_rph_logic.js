// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// PEMBAIKAN STRUKTUR DATA JSON PELBAGAI SUBJEK
// =======================================================

let currentTeacherUID = null;

// --- KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('guru_rph.html')) {

        if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db) {
            
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
            console.error("Objek Firebase/Database belum diinisialisasi atau tidak wujud.");
            showNotification("Ralat: Sambungan kepada sistem pangkalan data gagal.", 'error');
        }
    }
});


/**
 * [FUNGSI WAJIB] loadExistingTimetable(userUID)
 */
function loadExistingTimetable(userUID) {
    const container = document.getElementById('timetable-input-form');
    if (!container) return; 
    container.innerHTML = '<p>Memuatkan data Jadual Waktu...</p>';

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
    const subject = subjectCode.toLowerCase();
    if (!/^[a-z0-9]+$/.test(subject)) return null;

    try {
        const filePath = `data/sp-${subject}.json`;
        const response = await fetch(filePath);
        
        if (!response.ok) {
            showNotification(`Ralat: Fail data untuk subjek ${subjectCode} gagal dimuatkan. (Kod ${response.status})`, 'error');
            return null;
        }
        
        return await response.json();
    } catch (error) {
        showNotification(`Ralat memuatkan data SP: ${error.message}`, 'error');
        return null;
    }
}

/**
 * [HELPER] Mengeluarkan tahun (nombor) dari rentetan kelas (cth: '4 Anggun' -> 4)
 */
function getYearFromClass(classString) {
    const match = classString.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
}


/**
 * [FUNGSI WAJIB] generateRPHData()
 */
async function generateRPHData() {
    const selectedDate = document.getElementById('rph-date')?.value;
    const editorSection = document.getElementById('rph-editor-section');
    
    if (!selectedDate || !currentTeacherUID) {
        return showNotification("Sila pilih tarikh RPH dan pastikan anda log masuk.", 'error');
    }
    
    editorSection?.classList.add('hidden'); 

    const dateObject = new Date(selectedDate);
    const dayName = getDayNameFromDate(dateObject);
    const timetableEntry = await getTimetableByDay(currentTeacherUID, dateObject);
    
    if (!timetableEntry || !timetableEntry.slots || timetableEntry.slots.length === 0) {
        return showNotification(`Tiada Jadual Waktu ditemui untuk hari ${dayName}.`, 'error');
    }

    showNotification(`Memproses data subjek untuk ${dayName}...`, 'info');
    
    const slots = timetableEntry.slots;
    const subjectDataMap = {};
    
    // Tapis Slot (RBT/Sejarah Tahun 1-3 - Subjek yang bermula Tahun 4)
    const filteredSlots = slots.filter(slot => {
        const subject = slot.subject.toUpperCase();
        const year = getYearFromClass(slot.class);
        
        if ((subject === 'RBT' || subject === 'SEJARAH') && year > 0 && year < 4) {
            showNotification(`Slot ${slot.subject} (${slot.class}) dilangkau kerana ia hanya bermula dari Tahun 4.`, 'warning');
            return false; 
        }
        return true; 
    });
    
    if (filteredSlots.length === 0) {
        return showNotification("Tiada slot subjek yang sah ditemui untuk dijana RPH.", 'warning');
    }

    // Muatkan data JSON untuk subjek unik sahaja
    const subjectCodeSet = new Set(filteredSlots.map(s => s.subject.toLowerCase()));

    const promises = Array.from(subjectCodeSet).map(code => 
        loadSubjectData(code).then(data => {
            subjectDataMap[code] = data; 
        })
    );
    await Promise.all(promises);
    
    // ----------------------------------------------------
    // LOGIK FINAL UNTUK MEMAPARKAN SLOT RPH
    // ----------------------------------------------------
    
    const finalSlots = [];
    const finalSubjectDataMap = {};
    let loadErrorOccurred = false;
    
    filteredSlots.forEach(slot => {
        const code = slot.subject.toLowerCase();
        let rawSubjectData = subjectDataMap[code];
        
        if (rawSubjectData === null) {
            finalSlots.push(slot);
            finalSubjectDataMap[code] = null; 
            loadErrorOccurred = true;
            return;
        }
        
        const targetYear = getYearFromClass(slot.class);
        let yearKey = `TAHUN_${targetYear}`; // Cuba TAHUN_N
        
        // 1. Dapatkan kunci tahunan yang betul ("TAHUN 4" vs "TAHUN_4")
        if (!rawSubjectData[yearKey]) {
            const spacedKey = `TAHUN ${targetYear}`;
            if (rawSubjectData[spacedKey]) {
                yearKey = spacedKey; // Guna TAHUN N
            }
        }
        
        let yearData = rawSubjectData[yearKey];
        
        // 2. Tangani Lapisan Bersarang (cth: {kurikulum_rbt: {TAHUN_6: ...}})
        if (!yearData) {
             const topKeys = Object.keys(rawSubjectData);
             if (topKeys.length === 1 && typeof rawSubjectData[topKeys[0]] === 'object') {
                 // Cuba akses kunci tahun di bawah lapisan bersarang ini
                 yearData = rawSubjectData[topKeys[0]][yearKey];
             }
         }
        
        // 3. Flat-map data lessons ke format Array SK/SP yang dijangka oleh UI
        let flatData = [];
        let processingSuccess = false;

        if (yearData) {
            if (yearData.topics && Array.isArray(yearData.topics)) {
                // --- STRUKTUR RBT/GEOGRAFI (TAHUN -> topics -> lessons) ---
                yearData.topics.forEach(topic => {
                    if (topic.lessons && Array.isArray(topic.lessons)) {
                        topic.lessons.forEach(lesson => {
                            flatData.push({
                                SK: lesson.standards || topic.topic_name,
                                SP: lesson.objectives,
                                topic_name: topic.topic_name,
                                activities: lesson.activities 
                            });
                        });
                    }
                });
                processingSuccess = flatData.length > 0;

            } else if (Object.keys(yearData).length > 0) {
                // --- STRUKTUR BI/BM/MT (TAHUN -> Unit Name -> Skill Name/Sub-topic Name -> lessons array) ---
                
                // Iterasi melalui setiap unit/kunci peringkat seterusnya dalam tahun tersebut
                for (const unitKey in yearData) {
                    const unit = yearData[unitKey]; // Unit Name (cth: "Unit 1: Keluarga Saya")
                    
                    if (typeof unit === 'object' && unit !== null) {
                        const unitName = unitKey;
                        
                        // Iterasi melalui Skill/Aspek/Sub-topic dalam unit
                        for (const skillKey in unit) {
                            const lessonsArray = unit[skillKey];
                            if (Array.isArray(lessonsArray)) {
                                lessonsArray.forEach(lesson => {
                                    // SK = standards, SP = objectives, topic_name = Unit Name, skill = Skill Name
                                    flatData.push({
                                        SK: lesson.standards || unitName, 
                                        SP: lesson.objectives,
                                        topic_name: unitName, 
                                        skill: skillKey,
                                        activities: lesson.activities 
                                    });
                                });
                            }
                        }
                    } else if (Array.isArray(unit)) {
                         // Fallback jika Unit Name terus ke array of lessons (Struktur yang jarang)
                          unit.forEach(lesson => {
                            flatData.push({
                                SK: lesson.standards || unitKey,
                                SP: lesson.objectives,
                                topic_name: unitKey,
                                activities: lesson.activities 
                            });
                        });
                    }
                }
                processingSuccess = flatData.length > 0;
            }
        } // End if (yearData)

        
        if (processingSuccess) {
            finalSubjectDataMap[code] = flatData; 
            finalSlots.push(slot);
        } else {
            console.error(`Gagal memproses data JSON untuk ${code} ${yearKey}. Sila semak struktur fail.`, rawSubjectData);
            showNotification(`Ralat memproses data JSON untuk ${code} ${yearKey}. Sila semak fail data.`, 'error');
             
            finalSlots.push(slot);
            finalSubjectDataMap[code] = null; 
            loadErrorOccurred = true;
        }
    });

    if (loadErrorOccurred) {
        showNotification("Amaran: Beberapa data subjek gagal dimuatkan atau diproses. Borang RPH mungkin tidak lengkap.", 'warning');
    }

    if (finalSlots.length > 0 && typeof displayRPHSlots !== 'undefined') {
        displayRPHSlots(finalSlots, finalSubjectDataMap); 
        editorSection.classList.remove('hidden'); 
        showNotification(`Borang RPH untuk ${finalSlots.length} slot berjaya dijana.`, 'success');
    } else {
        showNotification("Gagal menjana sebarang slot RPH. Sila semak Jadual Waktu dan fail data.", 'error');
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
                document.getElementById('rph-editor-section')?.classList.remove('hidden');
                // TODO: Logik mengisi data RPH ke dalam borang editor perlu ditambah di sini
                showNotification(`RPH Draf (${doc.data().status}) berjaya dimuatkan untuk penyuntingan.`, 'success');
            } else {
                showNotification("Dokumen RPH tidak wujud atau anda tiada kebenaran.", 'error');
            }
        });
}
