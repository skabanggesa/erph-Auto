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
  // --- BAHASA ---
  'BM': 'bm', 
  'Bahasa Melayu': 'bm',
  'BMK': 'bmk', // Baru (Bahasa Melayu Khas)
  'BI': 'bi', 
  'Bahasa Inggeris': 'bi',
  'BIK': 'bik', // Baru (Bahasa Inggeris Khas)

  // --- STEM & TEKNOLOGI ---
  'MT': 'mt', 
  'Matematik': 'mt',
  'MTK': 'mtk', // Baru (Matematik Khas)
  'SN': 'sn', 
  'Sains': 'sn',
  'TMK': 'tmk', // Baru (Teknologi Maklumat & Komunikasi)
  'RBT': 'rbt', 
  'Reka Bentuk dan Teknologi': 'rbt',

  // --- PENDIDIKAN AGAMA & MORAL ---
  'PAI': 'pai', 
  'Pendidikan Islam': 'pai',
  'PAIK': 'paik', // Baru (Pendidikan Agama Islam Khas)
  'PMK': 'pmk',  // Baru (Pendidikan Moral Khas)
  'BA': 'ba', 
  'Bahasa Arab': 'ba', 
  'TAS': 'tas', 
  'Tasmik': 'tas',
  'PM': 'pm', 
  'Pendidikan Moral': 'pm',

  // --- KESENIAN & JASMANI ---
  'MZ': 'mz', 
  'Muzik': 'mz',
  'MZK': 'mzk',  // Baru (Muzik Khas)
  'PSV': 'psv', 
  'Pendidikan Seni Visual': 'psv',
  'PSVK': 'psvk', // Baru (Pendidikan Seni Visual Khas)
  'PJ': 'pj', 
  'Pendidikan Jasmani': 'pj',
  'PK': 'pk', 
  'Pendidikan Kesihatan': 'pk',
  'PJK': 'pjk', 
  'Pendidikan Jasmani Kesihatan': 'pjk',

  // --- KEMANUSIAAN & LAIN-LAIN ---
  'SJ': 'sj', 
  'Sejarah': 'sj',
  'KMK': 'kmk', // Baru (Kemahiran Manipulatif Khas / Kemanusiaan)
  'KHA': 'kha', // Baru (Kemahiran Hidup / KHA)
  'PD': 'pd',   // Baru (Pengurusan Diri)
  'PSAS': 'psas', // Baru
  'AFP': 'afp', 
  'Aktiviti Fizikal': 'afp',
  'BMP': 'bmp',
  'Bahasa Melayu Pra': 'bmp',
  'BIP': 'bip', 
  'Bahasa Inggeris Pra': 'bip',
  'MTP': 'mtp', 
  'Matematik Pra': 'mtp',
  'PAIP': 'paip', 
  'Pendidikan Agama Islam Pra': 'paip',
};

// Kamus Singkatan → Nama Penuh untuk paparan (UI)
export const MAP_SUBJECT_TO_FULLNAME = {
  'BM': 'BAHASA MELAYU',
  'BMK': 'BAHASA MELAYU KHAS',
  'BI': 'BAHASA INGGERIS',
  'BIK': 'BAHASA INGGERIS KHAS',
  'MT': 'MATEMATIK',
  'MTK': 'MATEMATIK KHAS',
  'SN': 'SAINS',
  'TMK': 'TEKNOLOGI MAKLUMAT & KOMUNIKASI',
  'RBT': 'REKA BENTUK DAN TEKNOLOGI',
  'PAI': 'PENDIDIKAN AGAMA ISLAM',
  'PAIK': 'PENDIDIKAN AGAMA ISLAM KHAS',
  'PMK': 'PENDIDIKAN MORAL KHAS',
  'TAS': 'TASAWWUR ISLAM', // Subjek baharu anda
  'SJ': 'SEJARAH',
  'PJ': 'PENDIDIKAN JASMANI',
  'PK': 'PENDIDIKAN KESIHATAN',
  'MZ': 'MUZIK',
  'MZK': 'MUZIK KHAS',
  'PSV': 'PENDIDIKAN SENI VISUAL',
  'PSVK': 'PENDIDIKAN SENI VISUAL KHAS',
  'KMK': 'KEMAHIRAN MANIPULATIF KHAS',
  'KHA': 'KEMAHIRAN HIDUP (KHA)',
  'PD': 'PENGURUSAN DIRI',
  'PSAS': 'PENDIDIKAN SAINS SOSIAL & ALAM SEKITAR',
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
export const getTemplateUrl = (subjectDisplayName) => {
  const filename = MAP_SUBJECT_TO_FILE[subjectDisplayName]; // <<< Menggunakan MAP_SUBJECT_TO_FILE yang dieksport
  if (!filename) {
    console.warn(`Tiada template fail JSON untuk matapelajaran: ${subjectDisplayName}`);
    return null;
  }
  // URL GitHub anda
  return `https://raw.githubusercontent.com/skabanggesa/erph-Auto/main/templates/rph/${filename}.json`;
};
