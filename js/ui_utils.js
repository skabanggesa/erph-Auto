// =======================================================
// UI UTILITIES LOGIC (js/ui_utils.js)
// KOD LENGKAP: Menguruskan semua interaksi UI dan penjanaan HTML
// =======================================================

const DAYS_OF_WEEK = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"];
// Medan data RPH yang perlu dikumpul
const RPH_FIELDS = ['standards', 'objectives', 'activities', 'assessment', 'aids', 'refleksi'];

// =======================================================
// 1. NOTIFIKASI
// =======================================================

/**
 * [FUNGSI 1/12] showNotification(message, type)
 * Memaparkan mesej kejayaan/ralat kepada pengguna.
 */
function showNotification(message, type) {
    const container = document.querySelector('.container');
    let notificationDiv = document.querySelector('.notification-alert');

    if (!notificationDiv) {
        notificationDiv = document.createElement('div');
        notificationDiv.className = 'notification-alert';
        // Menyisipkan notifikasi selepas header
        if (container) {
             const header = document.querySelector('.navbar');
             if (header && header.nextSibling) {
                 container.insertBefore(notificationDiv, header.nextSibling);
             } else {
                 container.insertBefore(notificationDiv, container.firstChild);
             }
        } else {
            document.body.insertBefore(notificationDiv, document.body.firstChild);
        }
    }
    
    notificationDiv.className = `notification-alert alert alert-${type}`;
    notificationDiv.textContent = message;
    notificationDiv.style.display = 'block';

    clearTimeout(window.notificationTimeout);
    window.notificationTimeout = setTimeout(() => {
        notificationDiv.style.display = 'none';
    }, 5000);
}

// =======================================================
// 2. LOGIK BORANG JADUAL WAKTU
// =======================================================

/**
 * [FUNGSI 2/12] createTimetableSlotRow(day, time, subject, class_name, index)
 * Menjana HTML baris slot Jadual Waktu untuk borang.
 */
function createTimetableSlotRow({ day = DAYS_OF_WEEK[0], start_time = '', end_time = '', subject = '', class: class_name = '' }, index) {
    // Fungsi ini dipanggil semasa memaparkan borang (kosong atau dengan data)
    const dayOptions = DAYS_OF_WEEK.map(d => `<option value="${d}" ${d === day ? 'selected' : ''}>${d}</option>`).join('');
    
    return `
        <div class="timetable-slot row mb-2" data-slot-index="${index}">
            <select class="form-control col-day" data-field="day" required>${dayOptions}</select>
            <input type="time" class="form-control col-time" data-field="start_time" value="${start_time}" required>
            <input type="time" class="form-control col-time" data-field="end_time" value="${end_time}" required>
            <input type="text" class="form-control col-subject" data-field="subject" value="${subject}" placeholder="Subjek (cth: BI/Matematik 1 Cerdas)" required>
            <input type="text" class="form-control col-class" data-field="class" value="${class_name}" placeholder="Kelas" required>
            <button type="button" class="btn btn-danger remove-slot-btn">X</button>
        </div>
    `;
}

/**
 * [FUNGSI 3/12] createEmptyTimetableForm()
 * Memaparkan borang kosong untuk Jadual Waktu.
 */
function createEmptyTimetableForm() {
    const formContainer = document.getElementById('timetable-input-form');
    if (!formContainer) return;
    
    formContainer.innerHTML = `
        <p>Tambah slot Jadual Waktu anda di sini:</p>
        <div id="timetable-slots-container">
            </div>
        <button type="button" id="add-slot-btn" class="btn btn-secondary mt-2">+ Tambah Slot</button>
    `;
    
    document.getElementById('add-slot-btn')?.addEventListener('click', () => {
        const container = document.getElementById('timetable-slots-container');
        const newIndex = container.children.length;
        container.insertAdjacentHTML('beforeend', createTimetableSlotRow({}, newIndex));
        attachTimetableListeners();
    });
    
    attachTimetableListeners();
}

/**
 * [FUNGSI 4/12] loadTimetableFormWithData(timetableData)
 * Memaparkan borang Jadual Waktu dengan data sedia ada.
 */
function loadTimetableFormWithData(timetableData) {
    const formContainer = document.getElementById('timetable-input-form');
    if (!formContainer) return;
    
    // Gunakan fungsi yang sama untuk setup borang kosong
    createEmptyTimetableForm();
    
    const container = document.getElementById('timetable-slots-container');
    container.innerHTML = ''; // Kosongkan bekas

    // Isi semula slot dengan data
    timetableData.forEach((slot, index) => {
        container.insertAdjacentHTML('beforeend', createTimetableSlotRow(slot, index));
    });

    attachTimetableListeners();
}


/**
 * [FUNGSI 5/12] collectTimetableFormData()
 * Mengumpul data dari borang Jadual Waktu yang dipaparkan.
 */
function collectTimetableFormData() {
    const slotsContainer = document.getElementById('timetable-slots-container');
    if (!slotsContainer) return [];
    
    const slots = [];
    slotsContainer.querySelectorAll('.timetable-slot').forEach(row => {
        const slot = {};
        row.querySelectorAll('[data-field]').forEach(input => {
            const field = input.getAttribute('data-field');
            slot[field] = input.value;
        });
        
        // Tetapkan semula kunci 'class' jika menggunakan objek destructuring
        if (slot.class) {
            slot.class_name = slot.class;
            delete slot.class;
        }

        if (slot.subject && slot.class_name) {
            slots.push(slot);
        }
    });
    
    return slots;
}

/**
 * [FUNGSI 6/12] attachTimetableListeners()
 * Melampirkan pendengar acara untuk butang buang slot Jadual Waktu.
 */
function attachTimetableListeners() {
    document.querySelectorAll('.remove-slot-btn').forEach(btn => {
        btn.onclick = function() {
            this.closest('.timetable-slot')?.remove();
        };
    });
}


// =======================================================
// 3. LOGIK BORANG RPH (CRITICAL)
// =======================================================

/**
 * [FUNGSI 7/12] loadRPHFormWithData(slots, dayName, date) - FUNGSI KRITIKAL BARU
 * Menjana dan mengisi HTML borang editor RPH.
 */
function loadRPHFormWithData(slots, dayName, date) {
    const editorSection = document.getElementById('rph-editor-section');
    if (!editorSection) return;

    // 1. Tetapkan struktur asas borang
    editorSection.innerHTML = `
        <h3>RPH Draf: ${dayName}, ${date}</h3>
        <input type="hidden" id="rph-date-hidden" value="${date}">
        <input type="hidden" id="rph-day-hidden" value="${dayName}">
        <div id="rph-slots-container">
            </div>
        <div class="rph-actions mt-3">
            <button id="save-rph-btn" class="btn btn-secondary">Simpan Draf</button>
            <button id="submit-rph-btn" class="btn btn-success">Hantar untuk Semakan</button>
        </div>
    `;

    const container = document.getElementById('rph-slots-container');
    if (!container) return;
    
    // 2. Gelung untuk menjana HTML bagi setiap slot masa
    slots.forEach((slot, index) => {
        const subjectCode = slot.subject_code || slot.subject.split(' ')[0].toUpperCase();
        
        // Memastikan aids, assessment, activities dipaparkan dengan betul (string atau array)
        const formatText = (data) => {
            if (!data) return '';
            const text = Array.isArray(data) ? data.join('\n- ') : data;
            // Hanya tambah bullet jika tiada bullet atau data tidak kosong
            return text ? (text.startsWith('-') ? text : `- ${text}`) : ''; 
        };
        
        const slotHtml = `
            <div class="rph-slot-card mt-3 p-3" data-slot-index="${index}">
                <h4>Slot ${slot.start_time}-${slot.end_time}: ${slot.subject} (${slot.class})</h4>
                
                <input type="hidden" class="subject-code-input" value="${subjectCode}">

                <label>Standard Pembelajaran (SP)</label>
                <select class="form-control sp-dropdown" data-index="${index}" data-field="standards">
                    <option value="${slot.standards}">${slot.standards}</option>
                </select>
                
                <label class="mt-2">Objektif Pembelajaran</label>
                <textarea class="form-control" rows="2" data-field="objectives">${slot.objectives}</textarea>
                
                <label class="mt-2">Aktiviti</label>
                <textarea class="form-control" rows="3" data-field="activities">${formatText(slot.activities)}</textarea>
                
                <label class="mt-2">Penilaian</label>
                <textarea class="form-control" rows="2" data-field="assessment">${formatText(slot.assessment)}</textarea>

                <label class="mt-2">Bahan Bantu Mengajar (BBM)</label>
                <textarea class="form-control" rows="2" data-field="aids">${formatText(slot.aids)}</textarea>
                
                <label class="mt-2">Refleksi</label>
                <textarea class="form-control" rows="2" data-field="refleksi">${slot.refleksi || ''}</textarea>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', slotHtml);
    });

    // 3. Panggil fungsi yang mengisi dropdown SP secara dinamik
    // initializeDropdowns mesti ada akses kepada SP_DATA_CACHE dan SP_FILE_MAP dalam guru_rph_logic.js
    if (typeof initializeDropdowns === 'function') {
        initializeDropdowns(slots);
    }
    
    // 4. Lampirkan Event Listeners
    if (typeof attachRPHListeners === 'function') {
        attachRPHListeners(); 
    }
}


/**
 * [FUNGSI 8/12] initializeDropdowns(slots)
 * Fungsi dummy. Logik sebenar perlu diletakkan di guru_rph_logic.js kerana ia memerlukan SP_DATA_CACHE.
 */
function initializeDropdowns(slots) {
    // Fungsi ini akan dipanggil selepas loadRPHFormWithData.
    // Ia sepatutnya memuatkan data SP yang telah di-cache 
    // dan mengisi dropdown 'sp-dropdown' dengan pilihan Standards.
    // Jika ia tiada, borang akan muncul, tetapi dropdown hanya akan mempunyai satu pilihan.
    console.log("Memulakan pengisian dropdown Standard Pembelajaran...");
    // Logik sebenar (yang bergantung kepada data SP_DATA_CACHE dari guru_rph_logic.js)
    // perlu diletakkan di dalam guru_rph_logic.js atau dideklarasikan secara global.
}

/**
 * [FUNGSI 9/12] attachRPHListeners()
 * Melampirkan pendengar acara untuk butang RPH (Save, Submit) dan perubahan dropdown.
 * Logik sebenar butang Save/Submit berada dalam guru_rph_logic.js.
 */
function attachRPHListeners() {
    // Listener untuk perubahan dropdown SP (untuk memuatkan Objektif/Aktiviti baru)
    document.querySelectorAll('.sp-dropdown').forEach(dropdown => {
        // Logik updateRPHSlotData harus berada dalam guru_rph_logic.js
        dropdown.addEventListener('change', (e) => {
            if (typeof updateRPHSlotData === 'function') {
                updateRPHSlotData(e.target.closest('.rph-slot-card').dataset.slotIndex, e.target.value);
            }
        });
    });
    
    // Listener untuk input textarea/input (simpan data secara langsung ke objek RPH draf)
    document.querySelectorAll('.rph-slot-card textarea, .rph-slot-card input[type="text"]').forEach(input => {
        input.addEventListener('input', (e) => {
            if (typeof updateDraftRPHData === 'function') {
                updateDraftRPHData(
                    e.target.closest('.rph-slot-card').dataset.slotIndex,
                    e.target.dataset.field,
                    e.target.value
                );
            }
        });
    });
    
    // Catatan: Listener butang save-rph-btn dan submit-rph-btn perlu diletakkan
    // dalam guru_rph_logic.js kerana ia memanggil fungsi Firebase (saveRPHData, submitRPH).
}


/**
 * [FUNGSI 10/12] collectRPHData()
 * Mengumpul semua data dari borang RPH Editor.
 */
function collectRPHData() {
    const date = document.getElementById('rph-date-hidden')?.value;
    const day = document.getElementById('rph-day-hidden')?.value;
    const slots = [];
    
    document.querySelectorAll('.rph-slot-card').forEach(card => {
        const slotIndex = card.dataset.slotIndex;
        const slotData = {
            start_time: card.querySelector('[data-field="start_time"]')?.value || '',
            end_time: card.querySelector('[data-field="end_time"]')?.value || '',
            subject: card.querySelector('[data-field="subject"]')?.value || '',
            class: card.querySelector('[data-field="class"]')?.value || '',
            subject_code: card.querySelector('.subject-code-input')?.value || '',
        };
        
        RPH_FIELDS.forEach(field => {
            const input = card.querySelector(`[data-field="${field}"]`);
            if (input) {
                // Untuk textarea, buang bullet points jika ada, dan pecahkan kepada array
                if (input.tagName === 'TEXTAREA' && (field === 'activities' || field === 'assessment' || field === 'aids')) {
                     // Tukar ke array (pecah mengikut newline, buang baris kosong)
                     slotData[field] = input.value.split('\n').map(line => line.replace(/^[-\s\•\*\d\.]+/g, '').trim()).filter(line => line.length > 0);
                } else {
                     slotData[field] = input.value;
                }
            }
        });
        
        slots.push(slotData);
    });
    
    return { date, day, slots };
}


// =======================================================
// 4. LOGIK PAPARAN RPH (Jadual Semakan)
// =======================================================

/**
 * [FUNGSI 11/12] renderRPHList(rphList)
 * Memaparkan senarai RPH di dalam jadual 'teacher-rph-list'.
 */
function renderRPHList(rphList) {
    const tableBody = document.querySelector('#teacher-rph-list tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (rphList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Tiada RPH disimpan atau dihantar lagi.</td></tr>';
        return;
    }

    rphList.forEach(rph => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${rph.date}</td>
            <td>${rph.day}</td>
            <td><span class="status-${rph.status.toLowerCase()}">${rph.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm view-rph-btn" data-id="${rph.id}">Lihat/Edit</button>
            </td>
        `;
    });
    
    // Melampirkan listener butang Lihat/Edit
    document.querySelectorAll('.view-rph-btn').forEach(btn => {
        // loadExistingRPHForEditing mesti ada dalam guru_rph_logic.js
        btn.addEventListener('click', () => {
             if (typeof loadExistingRPHForEditing === 'function') {
                 loadExistingRPHForEditing(btn.dataset.id);
             }
        });
    });
}

/**
 * [FUNGSI 12/12] renderRPHSlotsForEditing(rphData)
 * Mengisi borang RPH Editor dengan data RPH yang sedia ada.
 * (Pada dasarnya fungsi yang sama seperti loadRPHFormWithData, tetapi digunakan selepas fetch data lama)
 */
function renderRPHSlotsForEditing(rphData) {
    // Fungsi ini akan menggunakan loadRPHFormWithData untuk memaparkan borang.
    // Ia akan dipanggil dari guru_rph_logic.js.
    
    // Tetapkan ID dokumen RPH sedia ada
    document.getElementById('rph-document-id').value = rphData.id;
    
    loadRPHFormWithData(rphData.slots, rphData.day, rphData.date);
    showNotification(`Memuatkan RPH untuk ${rphData.date} (${rphData.status}). Sila edit dan simpan.`, 'info');
}


// =======================================================
// 5. INISIALISASI (Event Listeners)
// =======================================================

/**
 * [INIT] initializeTabSwitching()
 * Menguruskan penukaran antara tab RPH dan Jadual Waktu.
 */
function initializeTabSwitching() {
    const tabs = document.querySelectorAll('.btn-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = tab.getAttribute('data-tab'); // Menggunakan data-tab dari HTML guru_rph.html
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.querySelectorAll('.btn-tab').forEach(t => {
                t.classList.remove('active');
            });

            document.getElementById(targetId)?.classList.remove('hidden');
            tab.classList.add('active');
            
            // PENTING: Jika menukar ke tab Jadual Waktu, paksa muat semula data dan paparkan.
            // Memerlukan window.loadExistingTimetable didedahkan secara global oleh guru_rph_logic.js
            if (targetId === 'timetable-tab' && typeof window.loadExistingTimetable === 'function' && window.currentTeacherUID) {
                window.loadExistingTimetable(window.currentTeacherUID);
            }
            
            // Jika menukar ke tab RPH, paksa muat semula senarai RPH
            if (targetId === 'rph-tab' && typeof window.loadRPHList === 'function' && window.currentTeacherUID) {
                window.loadRPHList(window.currentTeacherUID);
            }
        });
    });
    
    // Tetapkan tab pertama sebagai aktif secara lalai
    const defaultTab = document.querySelector('.btn-tab.active');
    if (defaultTab) {
        const defaultContentId = defaultTab.getAttribute('data-tab');
        document.getElementById(defaultContentId)?.classList.remove('hidden');
    }
}

// Pastikan initializeTabSwitching dipanggil
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi awal UID global
    window.currentTeacherUID = null; 
    
    // Mulakan paparan borang kosong Jadual Waktu (akan diisi dengan data sedia ada kemudian oleh guru_rph_logic.js)
    createEmptyTimetableForm();
    
    // Mulakan penukaran tab
    initializeTabSwitching();
});
