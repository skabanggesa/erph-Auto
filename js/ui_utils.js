// =======================================================
// UI UTILITIES LOGIC (js/ui_utils.js)
// Kemas kini: Memulihkan Logik Jadual Waktu dan RPH
// =======================================================

const DAYS_OF_WEEK = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"];

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
        // noti...
    }, 5000);
}

/**
 * [FUNGSI WAJIB] displayRPHList(dataArray, tableId)
 * Menjana dan memaparkan senarai data RPH secara dinamik dalam HTML.
 */
function displayRPHList(dataArray, tableId) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    tbody.innerHTML = ''; 

    dataArray.forEach(item => {
        const row = tbody.insertRow();
        // Pastikan item.date adalah objek Timestamp Firebase atau objek Date
        const dateObject = item.date.toDate ? item.date.toDate() : new Date(item.date);
        const dateString = dateObject.toLocaleDateString('ms-MY');

        row.insertCell().textContent = dateString;
        row.insertCell().textContent = item.hari || getDayNameFromDate(dateObject);
        row.insertCell().textContent = item.status || 'Draf';
        
        const actionCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-secondary';
        editButton.textContent = 'Sunting';
        editButton.onclick = () => window.loadRPHtoEdit(item.id);
        
        actionCell.appendChild(editButton);
    });
}

/**
 * Memuatkan data RPH sedia ada ke dalam borang penyuntingan.
 * @param {Array<Object>} slotsData - Data slot RPH
 * @param {string} day - Hari RPH
 * @param {string} dateInput - Tarikh RPH (YYYY-MM-DD)
 */
function loadRPHFormWithData(slotsData, day, dateInput) {
    const editor = document.getElementById('rph-slots-editor');
    if (!editor) return;

    editor.innerHTML = ''; 

    slotsData.forEach((slot, index) => {
        editor.insertAdjacentHTML('beforeend', createRPHSlotHTML(slot, index));
    });
    
    // Pastikan tarikh dikemaskini
    document.getElementById('rph-date').value = dateInput;
    
    // Pasang listener untuk butang buang slot RPH jika ada
    attachRPHSlotListeners(editor);
}

/**
 * Fungsi pembantu untuk menjana HTML slot RPH
 */
function createRPHSlotHTML(slot = {}, index = 0) {
    const { time = '', subject = '', class: className = '', standards = '', objectives = '', activities = '', assessment = '', aids = '', refleksi = '' } = slot;

    return `
        <div class="rph-slot-group card mt-3" data-index="${index}">
            <button type="button" class="btn btn-danger btn-remove-rph-slot">Buang Slot</button>
            <h4>Slot RPH ${index + 1}</h4>
            <div class="rph-slot-header">
                <input type="text" name="time" placeholder="Masa" value="${time}" readonly>
                <input type="text" name="subject" placeholder="Subjek" value="${subject}" readonly>
                <input type="text" name="class" placeholder="Kelas" value="${className}" readonly>
            </div>
            
            <label>Standard Pembelajaran (SP)</label>
            <textarea name="standards" rows="2">${standards}</textarea>

            <label>Objektif Pembelajaran</label>
            <textarea name="objektif" rows="4" required>${objectives}</textarea>
            
            <label>Aktiviti Pengajaran & Pembelajaran</label>
            <textarea name="aktiviti" rows="6" required>${activities}</textarea>

            <label>Penilaian</label>
            <textarea name="penilaian" rows="3">${assessment}</textarea>

            <label>Bahan Bantu Mengajar (BBM)</label>
            <textarea name="aids" rows="3">${aids}</textarea>
            
            <label>Refleksi</label>
            <textarea name="refleksi" rows="3">${refleksi}</textarea>
        </div>
    `;
}

/**
 * Mengumpul data RPH dari borang editor.
 */
function collectRPHFormData() {
    const slotsData = [];
    const rphSlotGroups = document.querySelectorAll('#rph-slots-editor .rph-slot-group');

    rphSlotGroups.forEach(slotGroup => {
        const slot = {
            time: slotGroup.querySelector('input[name="time"]').value,
            subject: slotGroup.querySelector('input[name="subject"]').value,
            class: slotGroup.querySelector('input[name="class"]').value,
            standards: slotGroup.querySelector('textarea[name="standards"]').value,
            objectives: slotGroup.querySelector('textarea[name="objektif"]').value,
            activities: slotGroup.querySelector('textarea[name="aktiviti"]').value,
            assessment: slotGroup.querySelector('textarea[name="penilaian"]').value, 
            aids: slotGroup.querySelector('textarea[name="aids"]').value, 
            refleksi: slotGroup.querySelector('textarea[name="refleksi"]').value
        };
        slotsData.push(slot);
    });
    return slotsData;
}

// =======================================================
// FUNGSI JADUAL WAKTU BARU YANG HILANG
// =======================================================

/**
 * Fungsi pembantu untuk menjana HTML input slot jadual waktu
 */
function createSlotInputHTML(slot = {}) {
    const { time = '', subject = '', class: className = '', standards = '' } = slot; 
    
    return `
        <div class="slot-group">
            <input type="time" name="time" placeholder="Masa" value="${time}" required>
            <input type="text" name="subject" placeholder="Subjek" value="${subject}" required>
            <input type="text" name="class" placeholder="Kelas" value="${className}" required>
            <input type="text" name="standards" placeholder="Kod SP (cth: RBT.1.1.1)" value="${standards}" required>
            <button type="button" class="btn btn-danger btn-remove-slot">X</button>
        </div>
    `;
}

/**
 * Menjana dan memaparkan borang Jadual Waktu yang kosong (untuk pengguna baru).
 * Fungsi ini dipanggil jika tiada Jadual Waktu ditemui.
 */
function createEmptyTimetableForm() {
    const container = document.getElementById('timetable-input-form');
    if (!container) return;
    
    container.innerHTML = DAYS_OF_WEEK.map(day => `
        <div class="day-section card mt-2" data-day="${day}">
            <h4>${day}</h4>
            <div id="${day.toLowerCase()}-slots-container" class="slots-container">
                ${createSlotInputHTML()}
                ${createSlotInputHTML()}
                <p class="text-muted">Masukkan slot masa anda (Subjek, Kelas, Kod SP)</p>
            </div>
            <button type="button" class="btn btn-secondary btn-add-slot mt-1" data-day="${day}">+ Tambah Slot</button>
        </div>
    `).join('');
    
    attachSlotListeners(container); // Lampirkan listener untuk butang tambah/buang slot
    showNotification('Borang Jadual Waktu kosong telah dijana. Sila masukkan data anda.', 'info');
}

/**
 * Memuatkan data Jadual Waktu sedia ada ke dalam borang HTML.
 * Fungsi ini dipanggil jika data Jadual Waktu ditemui.
 * @param {Array<Object>} timetableData - Data jadual waktu dari Firestore
 */
function loadTimetableFormWithData(timetableData) {
    const container = document.getElementById('timetable-input-form');
    if (!container) return;

    let formHTML = '';
    
    DAYS_OF_WEEK.forEach(day => {
        const dayData = timetableData.find(d => d.day.toLowerCase() === day.toLowerCase());
        const slots = dayData ? dayData.slots : [];
        
        let slotsHTML = '';
        if (slots.length > 0) {
            slotsHTML = slots.map(slot => createSlotInputHTML(slot)).join('');
        } else {
            // Jika tiada slot untuk hari itu, sediakan satu input kosong
            slotsHTML = createSlotInputHTML() + '<p class="text-muted">Tiada slot untuk hari ini.</p>';
        }

        formHTML += `
            <div class="day-section card mt-2" data-day="${day}">
                <h4>${day}</h4>
                <div id="${day.toLowerCase()}-slots-container" class="slots-container">
                    ${slotsHTML}
                </div>
                <button type="button" class="btn btn-secondary btn-add-slot mt-1" data-day="${day}">+ Tambah Slot</button>
            </div>
        `;
    });

    container.innerHTML = formHTML;
    attachSlotListeners(container);
}

/**
 * Melampirkan pendengar acara pada butang tambah/buang slot
 */
function attachSlotListeners(container) {
    // Listener untuk butang Tambah Slot
    container.querySelectorAll('.btn-add-slot').forEach(button => {
        button.addEventListener('click', () => {
            const day = button.getAttribute('data-day');
            const slotsContainer = document.querySelector(`#${day.toLowerCase()}-slots-container`);
            if (slotsContainer) {
                // Buang placeholder 'Tiada slot...' jika ada
                const placeholder = slotsContainer.querySelector('.text-muted');
                if(placeholder) placeholder.remove();
                
                slotsContainer.insertAdjacentHTML('beforeend', createSlotInputHTML());
                // Attach listener to the newly added remove button
                slotsContainer.lastElementChild.querySelector('.btn-remove-slot').addEventListener('click', function() {
                    this.parentElement.remove();
                });
            }
        });
    });

    // Listener untuk butang Buang Slot (pada elemen sedia ada dan baru dimuat)
    container.querySelectorAll('.btn-remove-slot').forEach(button => {
        button.addEventListener('click', function() {
            this.parentElement.remove();
        });
    });
}


/**
 * Melampirkan pendengar acara pada butang buang slot RPH
 */
function attachRPHSlotListeners(container) {
     container.querySelectorAll('.btn-remove-rph-slot').forEach(button => {
        button.addEventListener('click', function() {
            this.parentElement.remove();
        });
    });
}


function getDayNameFromDate(dateInput) {
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    if (isNaN(date)) return "Tarikh Tidak Sah"; 
    // Format hari dalam bahasa Melayu (contoh: Isnin)
    return date.toLocaleDateString('ms-MY', { weekday: 'long' }); 
}

function initializeTabSwitching() {
    const tabs = document.querySelectorAll('.btn-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target'); // Menggunakan data-target
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.querySelectorAll('.btn-tab').forEach(t => {
                t.classList.remove('active');
            });

            document.getElementById(targetId)?.classList.remove('hidden');
            tab.classList.add('active');
            
            // Tambahan: Pastikan Jadual Waktu dimuat semula apabila tab ditukar ke Jadual Waktu
            if (targetId === 'timetable-tab' && typeof loadExistingTimetable === 'function') {
                // loadExistingTimetable akan memuatkan data dan memanggil loadTimetableFormWithData
                loadExistingTimetable(window.currentTeacherUID);
            }
        });
    });
}


document.addEventListener('DOMContentLoaded', () => {
    initializeTabSwitching();
    // ...
});
