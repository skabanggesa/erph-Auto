import { db, auth } from './config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function createLog(action, details) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        await addDoc(collection(db, 'logs'), {
            uid: user.uid,
            userName: user.displayName || user.email,
            action: action,
            details: details,
            timestamp: serverTimestamp()
        });
    } catch (e) { console.error(e); }
}
