// config.js (KOD LENGKAP & DIKEMASKINI)

// Firebase modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Konfigurasi Firebase projek anda
const firebaseConfig = {
  apiKey: "AIzaSyAo-FyVocjOa8rD-ALoTeDdkJCqDyvQSt0", // Gantikan dengan kunci anda yang sebenar
  authDomain: "erph-auto.firebaseapp.com",
  projectId: "erph-auto",
  storageBucket: "erph-auto.firebasestorage.app",
  messagingSenderId: "28301521058",
  appId: "1:28301521058:web:47cd64e3cf098e2cb067fb",
  measurementId: "G-NV65Z5R7JH"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig); // <<< KRITIKAL: 'app' kini dieksport

// Mendapatkan dan Mengeksport Objek Utama
export const auth = getAuth(app);
export const db = getFirestore(app);

// Peta nama matapelajaran → nama fail JSON
export const MAP_SUBJECT_TO_FILE = {
  // --- BAHASA MELAYU (BM) ---
  'BM_1': 'sp-bm-1',
  'BM_2': 'sp-bm-2',
  'BM_3': 'sp-bm-3',
  'BM_4': 'sp-bm-4',
  'BM_5': 'sp-bm-5',
  'BM_6': 'sp-bm-6',

  // --- BAHASA INGGERIS (BI) ---
  'BI_1': 'sp-bi-1',
  'BI_2': 'sp-bi-2',
  'BI_3': 'sp-bi-3',
  'BI_4': 'sp-bi-4',
  'BI_5': 'sp-bi-5',
  'BI_6': 'sp-bi-6',

  // --- BAHASA ARAB (BA) ---
  'BA_1': 'sp-ba-1',
  'BA_2': 'sp-ba-2',
  'BA_3': 'sp-ba-3',
  'BA_4': 'sp-ba-4',
  'BA_5': 'sp-ba-5',
  'BA_6': 'sp-ba-6',

  // --- MATEMATIK (MT) ---
  'MT_1': 'sp-mt-1',
  'MT_2': 'sp-mt-2',
  'MT_3': 'sp-mt-3',
  'MT_4': 'sp-mt-4',
  'MT_5': 'sp-mt-5',
  'MT_6': 'sp-mt-6',

  // --- SAINS (SN) ---
  'SN_1': 'sp-sn-1',
  'SN_2': 'sp-sn-2',
  'SN_3': 'sp-sn-3',
  'SN_4': 'sp-sn-4',
  'SN_5': 'sp-sn-5',
  'SN_6': 'sp-sn-6',

  // --- PENDIDIKAN AGAMA ISLAM (PAI) ---
  'PAI_1': 'sp-pai-1',
  'PAI_2': 'sp-pai-2',
  'PAI_3': 'sp-pai-3',
  'PAI_4': 'sp-pai-4',
  'PAI_5': 'sp-pai-5',
  'PAI_6': 'sp-pai-6',

  // --- PENDIDIKAN JASMANI (PJ) ---
  'PJ_1': 'sp-pj-1',
  'PJ_2': 'sp-pj-2',
  'PJ_3': 'sp-pj-3',
  'PJ_4': 'sp-pj-4',
  'PJ_5': 'sp-pj-5',
  'PJ_6': 'sp-pj-6',

  // --- PENDIDIKAN KESIHATAN (PK) ---
  'PK_1': 'sp-pk-1',
  'PK_2': 'sp-pk-2',
  'PK_3': 'sp-pk-3',
  'PK_4': 'sp-pk-4',
  'PK_5': 'sp-pk-5',
  'PK_6': 'sp-pk-6',

  // --- SEJARAH (SJ) - Bermula Tahun 4 ---
  'SJ_4': 'sp-sj-4',
  'SJ_5': 'sp-sj-5',
  'SJ_6': 'sp-sj-6',

  // --- REKA BENTUK & TEKNOLOGI (RBT) - Bermula Tahun 4 ---
  'RBT_4': 'sp-rbt-4',
  'RBT_5': 'sp-rbt-5',
  'RBT_6': 'sp-rbt-6',

  // --- SUBJEK UMUM (Satu fail untuk semua tahun) ---
  'PM': 'sp-pm',
  'PSV': 'sp-psv'

  // --- ALIRAN PRASEKOLAH (pra-) ---
  'BMP_P': 'pra-bm',     // Bahasa Melayu Pra
  'BIP_P': 'pra-bi',     // Bahasa Inggeris Pra
  'EST_P': 'pra-estik',  // Perkembangan Kreativiti & Estetika
  'FIZ_P': 'pra-fiz',    // Perkembangan Fizikal & Penjagaan Kesihatan
  'KOG_P': 'pra-kog',    // Sains & Teknologi (Kognitif)
  'NIL_P': 'pra-nilai',  // Pendidikan Moral / Nilai
  'SOS_P': 'pra-sosio',  // Perkembangan Sosioemosi
  'WAR_P': 'pra-warga'   // Kemanusiaan / Kewarganegaraan

// --- ALIRAN PPKI (ppki-) ---

  // Bahasa (Tahun 1 - 6)
  'BMK_1': 'ppki-bm', 'BMK_2': 'ppki-bm', 'BMK_3': 'ppki-bm', 'BMK_4': 'ppki-bm', 'BMK_5': 'ppki-bm', 'BMK_6': 'ppki-bm',
  'BIK_1': 'ppki-bi', 'BIK_2': 'ppki-bi', 'BIK_3': 'ppki-bi', 'BIK_4': 'ppki-bi', 'BIK_5': 'ppki-bi', 'BIK_6': 'ppki-bi',

  // Kemahiran & Pengurusan (Tahun 1 - 6)
  'KHA_1': 'ppki-kha', 'KHA_2': 'ppki-kha', 'KHA_3': 'ppki-kha', 'KHA_4': 'ppki-kha', 'KHA_5': 'ppki-kha', 'KHA_6': 'ppki-kha',
  'KMK_1': 'ppki-km',  'KMK_2': 'ppki-km',  'KMK_3': 'ppki-km',  'KMK_4': 'ppki-km',  'KMK_5': 'ppki-km',  'KMK_6': 'ppki-km',
  'PD_1': 'ppki-pd',   'PD_2': 'ppki-pd',   'PD_3': 'ppki-pd',   'PD_4': 'ppki-pd',   'PD_5': 'ppki-pd',   'PD_6': 'ppki-pd',

  // STEM & Agama/Moral (Tahun 1 - 6)
  'MTK_1': 'ppki-mt', 'MTK_2': 'ppki-mt', 'MTK_3': 'ppki-mt', 'MTK_4': 'ppki-mt', 'MTK_5': 'ppki-mt', 'MTK_6': 'ppki-mt',
  'PAIK_1': 'ppki-pai', 'PAIK_2': 'ppki-pai', 'PAIK_3': 'ppki-pai', 'PAIK_4': 'ppki-pai', 'PAIK_5': 'ppki-pai', 'PAIK_6': 'ppki-pai',
  'PMK_1': 'ppki-pm', 'PMK_2': 'ppki-pm', 'PMK_3': 'ppki-pm', 'PMK_4': 'ppki-pm', 'PMK_5': 'ppki-pm', 'PMK_6': 'ppki-pm',

  // Kesenian & Jasmani (Tahun 1 - 6)
  'MZK_1': 'ppki-mz', 'MZK_2': 'ppki-mz', 'MZK_3': 'ppki-mz', 'MZK_4': 'ppki-mz', 'MZK_5': 'ppki-mz', 'MZK_6': 'ppki-mz',
  'PJK_1': 'ppki-pjk', 'PJK_2': 'ppki-pjk', 'PJK_3': 'ppki-pjk', 'PJK_4': 'ppki-pjk', 'PJK_5': 'ppki-pjk', 'PJK_6': 'ppki-pjk'
};

// Kamus Singkatan → Nama Penuh untuk paparan (UI)
export const MAP_SUBJECT_TO_FULLNAME = {
  // --- ALIRAN PERDANA ---
  'BM': 'BAHASA MELAYU',
  'BI': 'BAHASA INGGERIS',
  'BA': 'BAHASA ARAB',
  'MT': 'MATEMATIK',
  'SN': 'SAINS',
  'PAI': 'PENDIDIKAN AGAMA ISLAM',
  'PM': 'PENDIDIKAN MORAL',
  'PSV': 'PENDIDIKAN SENI VISUAL',
  'PJ': 'PENDIDIKAN JASMANI',
  'PK': 'PENDIDIKAN KESIHATAN',
  'SJ': 'SEJARAH',
  'RBT': 'REKA BENTUK DAN TEKNOLOGI',
  'TMK': 'TEKNOLOGI MAKLUMAT & KOMUNIKASI',
  'TAS': 'TASAWWUR ISLAM',

  // --- ALIRAN PRASEKOLAH (PRA) ---
  'BMP': 'BAHASA MELAYU (PRA)',
  'BIP': 'BAHASA INGGERIS (PRA)',
  'EST': 'KREATIVITI DAN ESTETIKA (PRA)',
  'FIZ': 'FIZIKAL DAN KESIHATAN (PRA)',
  'KOG': 'SAINS DAN TEKNOLOGI (PRA)',
  'NIL': 'PENDIDIKAN MORAL (PRA)',
  'SOS': 'SOSIOEMOSI (PRA)',
  'WAR': 'KEMANUSIAAN (PRA)',

  // --- ALIRAN PPKI ---
  'BMK': 'BAHASA MELAYU (PPKI)',
  'BIK': 'BAHASA INGGERIS (PPKI)',
  'MTK': 'MATEMATIK (PPKI)',
  'PAIK': 'PENDIDIKAN AGAMA ISLAM (PPKI)',
  'PMK': 'PENDIDIKAN MORAL (PPKI)',
  'MZK': 'PENDIDIKAN MUZIK (PPKI)',
  'PJK': 'PENDIDIKAN JASMANI & KESIHATAN (PPKI)',
  'KMK': 'KEMAHIRAN MANIPULATIF (PPKI)',
  'KHA': 'KEMAHIRAN HIDUP (PPKI)',
  'PD': 'PENGURUSAN DIRI (PPKI)',
  'PSAS': 'PENDIDIKAN SAINS SOSIAL & ALAM SEKITAR (PPKI)',
  'PRA': 'PRAVOCATIONAL'
};
/**
 * Fungsi pembantu untuk mendapatkan nama penuh matapelajaran
 */
export function getFullSubjectName(code) {
  if (!code) return 'TIADA MAKLUMAT';
  // Ambil nama penuh dari kamus, jika tiada pulangkan kod asal (e.g. BI)
  return MAP_SUBJECT_TO_FULLNAME[code.toUpperCase()] || code.toUpperCase();
}

// Fungsi untuk dapatkan URL template JSON dari GitHub
export const getTemplateUrl = (subjectCode, year) => {
  let lookupKey;

  // 1. Logik untuk subjek yang tiada pecahan tahun (Perdana)
  if (subjectCode === 'PM' || subjectCode === 'PSV') {
    lookupKey = subjectCode.toUpperCase();
  } 
  // 2. Logik untuk subjek Prasekolah (Sentiasa guna suffix _P)
  else if (['BMP', 'BIP', 'EST', 'FIZ', 'KOG', 'NIL', 'SOS', 'WAR'].includes(subjectCode.toUpperCase())) {
    lookupKey = `${subjectCode.toUpperCase()}_P`;
  }
  // 3. Logik untuk subjek lain (Perdana & PPKI yang ada tahun 1-6)
  else {
    lookupKey = `${subjectCode.toUpperCase()}_${year}`;
  }

  const filename = MAP_SUBJECT_TO_FILE[lookupKey];

  if (!filename) {
    console.warn(`Tiada template fail JSON untuk kunci: ${lookupKey}`);
    return null;
  }

  // URL GitHub anda
  return `https://raw.githubusercontent.com/skabanggesa/erph-Auto/main/templates/rph/${filename}.json`;
};
