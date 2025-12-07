// =======================================================
// UI UTILITIES LOGIC (js/ui_utils.js)
// KOD LENGKAP: Menguruskan semua interaksi UI dan penjanaan HTML
// =======================================================

const DAYS_OF_WEEK = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"];

// =======================================================
// 1. NOTIFIKASI
// =======================================================

/**
 * [FUNGSI WAJIB] showNotification(message, type)
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
// 2. LOGIK JADUAL WAKTU
// =======================================================

/**
 * Menjana HTML untuk satu slot Jadual Waktu kosong.
 * (Fungsi 2/11)
 */
function createEmptyTimetableSlot(slot = {}) {
    return `
        <div class="timetable-slot">
            <input type="time" name="start_time" value="${slot.start_time || ''}" required>
            <input type="time" name="end_time" value="${slot.end_time || ''}" required>
            <input type="text" name="subject" placeholder="Contoh: BM 1 Cerdas" value="${slot.subject || ''}" required>
            <input type="text" name="class_name" placeholder="Contoh: 1 Cerdas" value="${slot.class_name || ''}" required>
            <button type="button" class="btn btn-danger remove-slot-btn" onclick="this.parentNode.remove()">Buang</button>
        </div>
    `;
}

/**
 * Menjana borang Jadual Waktu kosong.
 * (Fungsi 3/11)
 */
function createEmptyTimetableForm() {
    const formContainer = document.getElementById('timetable-input-form');
    if (!formContainer) return;

    let html = '';
    DAYS_OF_WEEK.forEach(day => {
        const dayId = day.toLowerCase();
        html += `
            <div class="timetable-day-section card mt-3">
                <h4>${day}</h4>
                <div id="slots-${dayId}">
                    ${createEmptyTimetableSlot()}
                </div>
                <button type="button" class="btn btn-secondary add-slot-btn" 
                        onclick="document.getElementById('slots-${dayId}').insertAdjacentHTML('beforeend', createEmptyTimetableSlot())">
                    + Tambah Slot
                </button>
            </div>
        `;
    });

    formContainer.innerHTML = html;
}

/**
 * Memuatkan data Jadual Waktu sedia ada ke dalam borang.
 * (Fungsi 4/11)
 */
function loadTimetableFormWithData(data) {
    const formContainer = document.getElementById('timetable-input-form');
    if (!formContainer) return;

    let html = '';
    
    DAYS_OF_WEEK.forEach(day => {
        const dayId = day.toLowerCase();
        const dayData = data.find(d => d.day.toLowerCase() === dayId);
        let slotsHtml = '';

        if (dayData && dayData.slots && dayData.slots.length > 0) {
            dayData.slots.forEach(slot => {
                slotsHtml += createEmptyTimetableSlot(slot);
            });
        } else {
            slotsHtml = createEmptyTimetableSlot();
        }

        html += `
            <div class="timetable-day-section card mt-3">
                <h4>${day}</h4>
                <div id="slots-${dayId}">
                    ${slotsHtml}
                </div>
                <button type="button" class="btn btn-secondary add-slot-btn" 
                        onclick="document.getElementById('slots-${dayId}').insertAdjacentHTML('beforeend', createEmptyTimetableSlot())">
                    + Tambah Slot
                </button>
            </div>
        `;
    });

    formContainer.innerHTML = html;
}

/**
 * Mengumpul data Jadual Waktu dari borang.
 * (Fungsi 5/11 - Dipanggil oleh guru_rph_logic.js)
 */
function collectTimetableFormData() {
    const timetableData = [];
    
    DAYS_OF_WEEK.forEach(day => {
        const daySlotsContainer = document.getElementById(`slots-${day.toLowerCase()}`);
        if (!daySlotsContainer) return;

        const dayData = {
            day: day,
            slots: []
        };
        
        daySlotsContainer.querySelectorAll('.timetable-slot').forEach(slotGroup => {
            dayData.slots.push({
                start_time: slotGroup.querySelector('input[name="start_time"]').value,
                end_time: slotGroup.querySelector('input[name="end_time"]').value,
                subject: slotGroup.querySelector('input[name="subject"]').value,
                class_name: slotGroup.querySelector('input[name="class_name"]').value,
                standards: '' // Dibiarkan kosong kerana tidak lagi ada dalam Jadual Waktu
            });
        });
        
        if (dayData.slots.length > 0) {
            timetableData.push(dayData);
        }
    });
    return timetableData;
}


// =======================================================
// 3. LOGIK RPH (DENGAN DROPDOWN SP)
// =======================================================

/**
 * Mengemas kini medan RPH secara automatik berdasarkan pilihan SP dalam dropdown.
 * (Fungsi 6/11 - KRITIKAL)
 */
function updateRPHFields(selectElement) {
    const selectedSP = selectElement.value;
    const slotGroup = selectElement.closest('.rph-slot');
    
    const allLessonsJson = slotGroup.getAttribute('data-sp-options');
    let allLessons;
    try {
        allLessons = JSON.parse(allLessonsJson);
    } catch (e) {
        showNotification('Ralat memuatkan data SP dari UI.', 'error');
        return;
    }

    const lessonMatch = allLessons.find(l => l.standards && l.standards.trim() === selectedSP.trim());

    const formatText = (data) => {
        if (!data) return '';
        const text = Array.isArray(data) ? data.join('\n- ') : data;
        // Pastikan ia bermula dengan '- ' jika tidak kosong
        return text ? (text.startsWith('-') ? text : `- ${text}`) : ''; 
    };

    if (lessonMatch) {
        slotGroup.querySelector('textarea[name="objektif"]').value = lessonMatch.objectives || '';
        slotGroup.querySelector('textarea[name="aktiviti"]').value = formatText(lessonMatch.activities);
        slotGroup.querySelector('textarea[name="penilaian"]').value = formatText(lessonMatch.assessment);
        slotGroup.querySelector('textarea[name="aids"]').value = formatText(lessonMatch.aids);
        
        showNotification(`Data RPH dikemas kini untuk SP: ${selectedSP}`, 'info');

    } else {
        slotGroup.querySelector('textarea[name="objektif"]').value = 'SP tidak sah atau data gagal dimuatkan.';
        slotGroup.querySelector('textarea[name="aktiviti"]').value = 'Tiada data aktiviti ditemui.';
        slotGroup.querySelector('textarea[name="penilaian"]').value = 'Tiada data penilaian ditemui.';
        slotGroup.querySelector('textarea[name="aids"]').value = 'Tiada data BBM ditemui.';
    }
}


/**
 * Menjana HTML untuk satu slot RPH (menggunakan dropdown).
 * (Fungsi 7/11)
 */
function createRPHSlotHTML(slot, index) {
    
    const spOptionsJson = JSON.stringify(slot.sp_data_options || []);

    let standardsOptionsHTML = '';
    const currentStandards = slot.standards ? slot.standards.trim() : '⚠️ Sila pilih SP';

    if (slot.sp_data_options && slot.sp_data_options.length > 0) {
        slot.sp_data_options.forEach(lesson => {
            if (!lesson.standards) return; 
            const spValue = lesson.standards.trim();
            const isSelected = spValue === currentStandards;
            standardsOptionsHTML += `<option value="${spValue}" ${isSelected ? 'selected' : ''}>${spValue}</option>`;
        });
    } 
    
    // Tambah pilihan lalai jika tiada SP yang dipilih atau tiada data
    if (!standardsOptionsHTML || !slot.standards || slot.standards.includes('⚠️')) {
        standardsOptionsHTML = `<option value="" selected disabled>-- Sila Pilih Standard Pembelajaran --</option>` + standardsOptionsHTML;
    }


    return `
        <div class="rph-slot card mt-3" data-slot-index="${index}" data-sp-options='${spOptionsJson}'>
            <h4>${slot.subject} (${slot.start_time} - ${slot.end_time}) - Kelas: ${slot.class_name}</h4>
            
            <label>Standard Pembelajaran (SP):</label>
            <select name="standards" class="form-control" onchange="updateRPHFields(this)" required>
                 ${standardsOptionsHTML}
            </select>
            
            <label>Objektif:</label>
            <textarea name="objektif" class="form-control">${slot.objectives || ''}</textarea>

            <label>Aktiviti:</label>
            <textarea name="aktiviti" class="form-control" rows="4">${slot.activities || ''}</textarea>

            <label>Penilaian:</label>
            <textarea name="penilaian" class="form-control" rows="3">${slot.assessment || ''}</textarea>

            <label>BBM / Catatan:</label>
            <textarea name="aids" class="form-control" rows="3">${slot.aids || ''}</textarea>
            
            <label>Refleksi:</label>
            <textarea name="refleksi" class="form-control" rows="2">${slot.refleksi || ''}</textarea>
        </div>
    `;
}

/**
 * Memuatkan data RPH ke dalam borang penyuntingan.
 * (Fungsi 8/11 - Dipanggil oleh guru_rph_logic.js)
 */
function loadRPHFormWithData(slotsData, dayName, dateInput) {
    const editorSection = document.getElementById('rph-editor-section');
    const form = document.getElementById('rph-editor-form');

    if (!editorSection || !form) return;

    document.getElementById('rph-date').value = dateInput; 
    
    let slotsHtml = `<h3>RPH Draf: ${dayName}, ${dateInput}</h3>`;
    
    slotsData.forEach((slot, index) => {
        slotsHtml += createRPHSlotHTML(slot, index);
    });

    form.querySelector('#rph-slots-container').innerHTML = slotsHtml;
    editorSection.classList.remove('hidden');
}


/**
 * Mengumpul data RPH yang telah disunting dari borang.
 * (Fungsi 9/11 - Dipanggil oleh guru_rph_logic.js)
 */
function collectRPHFormData() {
    const slotsData = [];
    const rphSlotsContainer = document.getElementById('rph-slots-container');
    
    rphSlotsContainer.querySelectorAll('.rph-slot').forEach(slotGroup => {
        
        const tempSlot = {};
        
        tempSlot.standards = slotGroup.querySelector('select[name="standards"]').value || '';
        tempSlot.objectives = slotGroup.querySelector('textarea[name="objektif"]').value || '';
        tempSlot.activities = slotGroup.querySelector('textarea[name="aktiviti"]').value || '';
        tempSlot.assessment = slotGroup.querySelector('textarea[name="penilaian"]').value || '';
        tempSlot.aids = slotGroup.querySelector('textarea[name="aids"]').value || '';
        tempSlot.refleksi = slotGroup.querySelector('textarea[name="refleksi"]').value || '';
        
        // Dapatkan data slot asal dari tajuk
        const headerText = slotGroup.querySelector('h4').textContent;
        const match = headerText.match(/^(.*?) \((.*?) - (.*?)\) - Kelas: (.*?)$/);

        if (match) {
            tempSlot.subject = match[1].trim();
            tempSlot.start_time = match[2].trim();
            tempSlot.end_time = match[3].trim();
            tempSlot.class_name = match[4].trim();
        } else {
             // Fallback
             tempSlot.subject = 'Unknown';
             tempSlot.start_time = '00:00';
             tempSlot.end_time = '00:00';
             tempSlot.class_name = 'Unknown';
        }
        
        // PENTING: Ambil semula sp_data_options yang disimpan untuk kegunaan muat semula/penyuntingan
        const spOptionsJson = slotGroup.getAttribute('data-sp-options');
        if (spOptionsJson) {
             tempSlot.sp_data_options = JSON.parse(spOptionsJson);
        }

        slotsData.push(tempSlot);
    });
    
    return slotsData;
}


/**
 * Memaparkan senarai RPH guru dalam jadual.
 * (Fungsi 10/11 - Dipanggil oleh guru_rph_logic.js)
 */
function renderRPHList(rphList) {
    const tableBody = document.querySelector('#teacher-rph-list tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    rphList.forEach(rph => {
        // Semak jika tarikh wujud dan ubah kepada format MS-MY
        const dateString = rph.date && rph.date.toDate ? rph.date.toDate().toLocaleDateString('ms-MY') : 'Tarikh Tidak Sah';
        const statusClass = rph.status === 'Dikemukakan' ? 'status-submitted' : 'status-draft';
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${dateString}</td>
            <td>${rph.day_name || '-'}</td>
            <td class="${statusClass}">${rph.status}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="window.loadRPHtoEdit('${rph.id}')">Sunting</button>
            </td>
        `;
    });
}


// =======================================================
// 4. INITALIZATION
// =======================================================

/**
 * Menguruskan penukaran antara tab dan memastikan data dimuatkan apabila menukar ke tab Jadual Waktu.
 * (Fungsi 11/11 - KRITIKAL)
 */
function initializeTabSwitching() {
    const tabs = document.querySelectorAll('.btn-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = tab.getAttribute('data-tab'); 
            
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
    initializeTabSwitching();
});
