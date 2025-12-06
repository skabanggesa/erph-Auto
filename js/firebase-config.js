// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAo-FyVocjOa8rD-ALoTeDdkJCqDyvQSt0",
  authDomain: "erph-auto.firebaseapp.com",
  projectId: "erph-auto",
  storageBucket: "erph-auto.firebasestorage.app",
  messagingSenderId: "28301521058",
  appId: "1:28301521058:web:47cd64e3cf098e2cb067fb",
  measurementId: "G-NV65Z5R7JH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Export for use in other files
window.firebase = firebase;
window.auth = auth;
window.db = db;
window.storage = storage;

console.log("Firebase initialized successfully");