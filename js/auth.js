// Authentication functions
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.initAuthListener();
    }

    // Initialize auth state listener
    initAuthListener() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserRole(user.uid);
                console.log("User logged in:", user.email, "Role:", this.userRole);
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { 
                        loggedIn: true, 
                        user: user,
                        role: this.userRole 
                    } 
                }));
            } else {
                this.currentUser = null;
                this.userRole = null;
                console.log("User logged out");
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { loggedIn: false } 
                }));
            }
        });
    }

    // Load user role from Firestore
async loadUserRole(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
            this.userRole = userDoc.data().role || 'guru';
            console.log("User role loaded:", this.userRole);
        } else {
            console.log("User document not found, creating new one...");
            
            // Get current user info
            const user = auth.currentUser;
            if (!user) {
                this.userRole = 'guru';
                return;
            }
            
            // Check if this is the first user (become admin)
            const usersSnapshot = await db.collection('users').get();
            const isFirstUser = usersSnapshot.empty;
            
            // Determine role
            const role = isFirstUser ? 'admin' : 'guru';
            
            // Create user document
            await db.collection('users').doc(uid).set({
                email: user.email,
                name: user.email.split('@')[0], // Use email prefix as default name
                role: role,
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.userRole = role;
            console.log(`New user document created with role: ${role}`);
        }
    } catch (error) {
        console.error("Error loading/creating user role:", error);
        this.userRole = 'guru'; // Default fallback
    }
}

    // Login function
    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error("Login error:", error);
            let errorMessage = "Ralat login. Sila cuba lagi.";
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = "Email tidak dijumpai.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Kata laluan salah.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Format email tidak sah.";
                    break;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    // Register function (admin only)
    async register(email, password, name, role = 'guru') {
        try {
            // Create user in Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Create user document in Firestore
            await db.collection('users').doc(user.uid).set({
                email: email,
                name: name,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                active: true
            });

            return { success: true, user: user };
        } catch (error) {
            console.error("Registration error:", error);
            let errorMessage = "Ralat pendaftaran. Sila cuba lagi.";
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "Email sudah digunakan.";
                    break;
                case 'auth/weak-password':
                    errorMessage = "Kata laluan terlalu lemah.";
                    break;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    // Logout function
    async logout() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error("Logout error:", error);
            return { success: false, error: "Ralat logout." };
        }
    }

    // Reset password (admin only - will implement in admin module)
    async resetPassword(uid) {
        try {
            // Get user email
            const userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists) {
                return { success: false, error: "Pengguna tidak dijumpai." };
            }

            const email = userDoc.data().email;
            
            // Send reset password email
            await auth.sendPasswordResetEmail(email);
            
            return { success: true, message: "Email reset kata laluan telah dihantar." };
        } catch (error) {
            console.error("Reset password error:", error);
            return { success: false, error: "Ralat menghantar email reset." };
        }
    }

    // Get current user info
    getCurrentUser() {
        return {
            user: this.currentUser,
            role: this.userRole
        };
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Check user role
    hasRole(role) {
        return this.userRole === role;
    }
}

// Initialize auth system
const authSystem = new AuthSystem();