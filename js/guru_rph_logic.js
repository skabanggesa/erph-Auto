// =======================================================
// GURU RPH LOGIC (js/guru_rph_logic.js)
// =======================================================

let currentTeacherUID = null;

// --- KOD UTAMA DIJALANKAN SELEPAS DOM DIMUAT ---
document.addEventListener('DOMContentLoaded', () => {
    // Menggunakan window.location.pathname.includes('guru_rph.html') dari kod asal anda
    if (window.location.pathname.includes('guru_rph.html')) {

        // Pastikan auth dan komponen luaran lain wujud
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
    if (!container) return; // Exit jika container tiada
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
            
            // Anggapkan container adalah div kosong yang akan diisi dengan borang
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
                // timetableData adalah array objek {day: 'Isnin', slots: [...] }
                return timetableData.find(item => item.day === dayName); 
            }
            return null;
        });
}

/**
 * [FUNGSI WAJIB] loadSubjectData(subjectCode)
 * Mengendalikan ralat 404/pemuatan data dan mengembalikan null jika gagal.
 */
async function loadSubjectData(subjectCode) {
    const subject = subjectCode.toLowerCase();
    
    // Pastikan kod subjek hanya huruf dan angka untuk keselamatan
    if (!/^[a-z0-9]+$/.test(subject)) {
        console.error("Kod subjek tidak sah:", subjectCode);
        return null;
    }

    try {
        const filePath = `data/sp-${subject}.json`;
        const response = await fetch(filePath);
        
        // 💡 PEMBAIKAN: Semak respons HTTP (Menangkap 404 Not Found)
        if (!response.ok) {
            showNotification(`Ralat: Fail data untuk subjek ${subjectCode} gagal dimuatkan. (Kod ${response.status})`, 'error');
            // Guna console.error untuk butiran lanjut kepada pembangun
            console.error(`Gagal memuatkan fail JSON: ${filePath}`, response); 
            return null;
        }
        
        return await response.json();
    } catch (error) {
        showNotification(`Ralat memuatkan data SP: ${error.message}`, 'error');
        console.error("Ralat memuatkan data SP:", error);
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
 * Fungsi Automasi Teras. 
 */
async function generateRPHData() {
    const selectedDate = document.getElementById('rph-date')?.value;
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

    showNotification(`Memproses data subjek untuk ${dayName}...`, 'info');
    
    const slots = timetableEntry.slots;
    
    // 💡 PEMBAIKAN: Tapis dan Semak Slot RBT/Sejarah Tahun 1-3
    const filteredSlots = slots.filter(slot => {
        const subject = slot.subject.toUpperCase();
        const year = getYearFromClass(slot.class);
        
        // Cuma semak jika subjek adalah RBT atau SEJARAH
        if ((subject === 'RBT' || subject === 'SEJARAH') && year > 0 && year < 4) {
            showNotification(`Slot ${slot.subject} (${slot.class}) dilangkau kerana ia hanya bermula dari Tahun 4.`, 'warning');
            return false; // Langkau slot ini
        }
        return true; // Kekalkan slot ini
    });
    
    if (filteredSlots.length === 0) {
        return showNotification("Tiada slot subjek yang sah ditemui untuk dijana RPH.", 'warning');
    }


    const subjectCodeSet = new Set(filteredSlots.map(s => s.subject.toLowerCase()));
    const subjectDataMap = {};
    let loadErrorOccurred = false;

    // Kumpul semua data subjek JSON yang diperlukan secara serentak
    const promises = Array.from(subjectCodeSet).map(code => 
        // Menggunakan logik akses fail JSON anda yang disesuaikan untuk yearKey
        loadSubjectData(code).then(data => {
            if (data !== null) {
                // Dalam data JSON anda, key adalah TAHUN_N. Kita perlu mengubah data ini sedikit
                // kepada format array SK/SP yang dijangka oleh UI
                
                // Cari tahun pertama yang sah dalam data JSON
                const firstYearKey = Object.keys(data).find(key => key.startsWith('TAHUN_'));
                
                // Ambil data untuk tahun dari slot yang dijana
                const targetSlot = filteredSlots.find(s => s.subject.toLowerCase() === code);
                const targetYear = getYearFromClass(targetSlot.class);
                const yearKey = `TAHUN_${targetYear}`;
                
                // Data subjek mengikut tahun yang dipilih
                const yearData = data[yearKey];
                
                // Kita perlu flat-map struktur JSON anda ke array SK/SP yang dijangka oleh UI
                const flatData = [];
                if (yearData && yearData.topics && Array.isArray(yearData.topics)) {
                     yearData.topics.forEach(topic => {
                        if (topic.lessons && Array.isArray(topic.lessons)) {
                            topic.lessons.forEach(lesson => {
                                // Asumsi: SK/SP dalam UI bermaksud standards/objectives dalam JSON anda
                                flatData.push({
                                    SK: lesson.standards, // Guna standards sebagai SK
                                    SP: lesson.objectives, // Guna objectives sebagai SP
                                    topic_name: topic.topic_name,
                                    activities: lesson.activities 
                                });
                            });
                        }
                    });
                    subjectDataMap[code] = flatData;
                } else {
                    // Jika struktur data tidak dijangka
                    console.error(`Gagal memproses data JSON untuk ${code} ${yearKey}.`, data);
                    loadErrorOccurred = true;
                }
            } else {
                loadErrorOccurred = true; // Tandakan ralat muatan
            }
        })
    );
    await Promise.all(promises);
    
    if (loadErrorOccurred) {
        showNotification("Amaran: Beberapa data subjek gagal dimuatkan. Borang RPH mungkin tidak lengkap.", 'warning');
    }

    // Jana borang RPH menggunakan data yang telah dikumpul
    if (typeof displayRPHSlots !== 'undefined') {
        // Hantar slot yang telah ditapis dan peta data subjek
        displayRPHSlots(filteredSlots, subjectDataMap);
        document.getElementById('rph-editor-section')?.classList.remove('hidden');
        showNotification(`Borang RPH untuk ${filteredSlots.length} slot berjaya dijana.`, 'success');
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
        // Pastikan firebase.firestore.Timestamp wujud (dari firebase-firestore.js)
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
