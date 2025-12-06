// Database helper functions
class DatabaseSystem {
    constructor() {
        this.db = db;
    }

    // ========== USERS MANAGEMENT ==========
    
    // Get all users
    async getAllUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            const users = [];
            snapshot.forEach(doc => {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return users;
        } catch (error) {
            console.error("Error getting users:", error);
            throw error;
        }
    }

    // Get user by ID
    async getUserById(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            return null;
        } catch (error) {
            console.error("Error getting user:", error);
            throw error;
        }
    }

    // Create new user
    async createUser(userData) {
        try {
            // Create user in Firebase Auth first
            const userCredential = await auth.createUserWithEmailAndPassword(
                userData.email, 
                userData.password || 'password123' // default password
            );
            
            const userId = userCredential.user.uid;
            
            // Create user document in Firestore
            await this.db.collection('users').doc(userId).set({
                email: userData.email,
                name: userData.name,
                role: userData.role || 'guru',
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: auth.currentUser.uid
            });
            
            return { success: true, userId: userId };
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    }

    // Update user
    async updateUser(userId, updates) {
        try {
            await this.db.collection('users').doc(userId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    }

    // Delete user
    async deleteUser(userId) {
        try {
            // Delete from Firestore
            await this.db.collection('users').doc(userId).delete();
            
            // Note: We don't delete from Auth here (admin might want to keep auth record)
            return { success: true };
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    }

    // Deactivate/activate user
    async toggleUserActive(userId, active) {
        try {
            await this.db.collection('users').doc(userId).update({
                active: active,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error("Error toggling user active:", error);
            throw error;
        }
    }

    // ========== SCHOOL CALENDAR ==========
    
    // Upload school calendar
    async uploadCalendar(calendarData, year) {
        try {
            const calendarId = `calendar_${year}`;
            await this.db.collection('school_calendar').doc(calendarId).set({
                year: year,
                data: calendarData,
                uploadedBy: auth.currentUser.uid,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                active: true
            });
            return { success: true, id: calendarId };
        } catch (error) {
            console.error("Error uploading calendar:", error);
            throw error;
        }
    }

    // Get current calendar
    async getCurrentCalendar() {
        try {
            const snapshot = await this.db.collection('school_calendar')
                .where('active', '==', true)
                .orderBy('uploadedAt', 'desc')
                .limit(1)
                .get();
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            return null;
        } catch (error) {
            console.error("Error getting calendar:", error);
            throw error;
        }
    }

    // ========== SCHOOL SESSIONS ==========
    
    // Save school session settings
    async saveSessionSettings(sessionData) {
        try {
            const sessionId = 'current_session';
            await this.db.collection('school_sessions').doc(sessionId).set({
                ...sessionData,
                updatedBy: auth.currentUser.uid,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                active: true
            }, { merge: true });
            
            return { success: true, id: sessionId };
        } catch (error) {
            console.error("Error saving session settings:", error);
            throw error;
        }
    }

    // Get current session settings
    async getSessionSettings() {
        try {
            const doc = await this.db.collection('school_sessions').doc('current_session').get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error("Error getting session settings:", error);
            throw error;
        }
    }

    // ========== RPH TEMPLATES ==========
    
    // Upload RPH templates
    async uploadRPHTemplates(templateData, subject, year) {
        try {
            const templateId = `${subject}_${year}`.replace(/\s+/g, '_').toLowerCase();
            await this.db.collection('rph_templates').doc(templateId).set({
                subject: subject,
                year: year,
                data: templateData,
                uploadedBy: auth.currentUser.uid,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: templateId };
        } catch (error) {
            console.error("Error uploading RPH templates:", error);
            throw error;
        }
    }

    // Get RPH template by subject and year
    async getRPHTemplate(subject, year) {
        try {
            const templateId = `${subject}_${year}`.replace(/\s+/g, '_').toLowerCase();
            const doc = await this.db.collection('rph_templates').doc(templateId).get();
            if (doc.exists) {
                return doc.data().data;
            }
            return null;
        } catch (error) {
            console.error("Error getting RPH template:", error);
            throw error;
        }
    }

    // ========== STATISTICS ==========
    
    // Get user count by role
    async getUserCountByRole() {
        try {
            const snapshot = await this.db.collection('users').get();
            const counts = {
                admin: 0,
                pentadbir: 0,
                guru: 0,
                total: 0
            };
            
            snapshot.forEach(doc => {
                const role = doc.data().role;
                if (counts[role] !== undefined) {
                    counts[role]++;
                }
                counts.total++;
            });
            
            return counts;
        } catch (error) {
            console.error("Error getting user counts:", error);
            throw error;
        }
    }
}

// Initialize database system
const database = new DatabaseSystem();