// Database manager for storing user data and app activity
class DatabaseManager {
    constructor() {
        this.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.userId = null;
    }

    initializeUserData(userId) {
        this.userId = userId;
        this.createUserProfile();
    }

    async createUserProfile() {
        if (!this.userId) return;

        try {
            // Check if profile exists
            const { data: existingProfile } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', this.userId)
                .single();

            if (!existingProfile) {
                // Create new profile
                const { error } = await this.supabase
                    .from('profiles')
                    .insert([
                        {
                            id: this.userId,
                            total_practice_time: 0,
                            total_sessions: 0,
                            total_recordings: 0,
                            preferences: {
                                defaultTempo: 120,
                                defaultTimeSignature: '4/4',
                                defaultSubdivision: 1
                            }
                        }
                    ]);

                if (error) {
                    console.error('Error creating profile:', error);
                }
            }
        } catch (error) {
            console.error('Error initializing user data:', error);
        }
    }

    // Practice Sessions
    async logPracticeSession(type, duration, settings = {}) {
        if (!this.userId) return null;

        try {
            const { data, error } = await this.supabase
                .from('practice_sessions')
                .insert([
                    {
                        user_id: this.userId,
                        session_type: type,
                        duration_seconds: duration,
                        settings: settings,
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Update profile stats
            await this.updateProfileStats('session', duration);
            
            return data;
        } catch (error) {
            console.error('Error logging practice session:', error);
            return null;
        }
    }

    // Recordings
    async saveRecording(title, duration, metadata = {}) {
        if (!this.userId) return null;

        try {
            const { data, error } = await this.supabase
                .from('recordings')
                .insert([
                    {
                        user_id: this.userId,
                        title: title,
                        duration_seconds: duration,
                        metadata: metadata,
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Update profile stats
            await this.updateProfileStats('recording');
            
            return data;
        } catch (error) {
            console.error('Error saving recording:', error);
            return null;
        }
    }

    async getUserRecordings() {
        if (!this.userId) return [];

        try {
            const { data, error } = await this.supabase
                .from('recordings')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching recordings:', error);
            return [];
        }
    }

    async deleteRecording(recordingId) {
        if (!this.userId) return false;

        try {
            const { error } = await this.supabase
                .from('recordings')
                .delete()
                .eq('id', recordingId)
                .eq('user_id', this.userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting recording:', error);
            return false;
        }
    }

    // AI Chat History
    async saveChatMessage(message, isUser = true, response = null) {
        if (!this.userId) return null;

        try {
            const chatData = {
                user_id: this.userId,
                message: message,
                is_user_message: isUser,
                created_at: new Date().toISOString()
            };

            if (!isUser && response) {
                chatData.ai_response = response;
            }

            const { data, error } = await this.supabase
                .from('chat_history')
                .insert([chatData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving chat message:', error);
            return null;
        }
    }

    async getChatHistory(limit = 50) {
        if (!this.userId) return [];

        try {
            const { data, error } = await this.supabase
                .from('chat_history')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
    }

    // User Preferences
    async saveUserPreferences(preferences) {
        if (!this.userId) return false;

        try {
            const { error } = await this.supabase
                .from('profiles')
                .update({ preferences: preferences })
                .eq('id', this.userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving preferences:', error);
            return false;
        }
    }

    async getUserPreferences() {
        if (!this.userId) return null;

        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('preferences')
                .eq('id', this.userId)
                .single();

            if (error) throw error;
            return data?.preferences || {
                defaultTempo: 120,
                defaultTimeSignature: '4/4',
                defaultSubdivision: 1
            };
        } catch (error) {
            console.error('Error fetching preferences:', error);
            return null;
        }
    }

    // Statistics
    async getUserStats() {
        if (!this.userId) return { sessions: 0, recordings: 0, totalTime: 0 };

        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('total_practice_time, total_sessions, total_recordings')
                .eq('id', this.userId)
                .single();

            if (error) throw error;
            
            return {
                sessions: data?.total_sessions || 0,
                recordings: data?.total_recordings || 0,
                totalTime: data?.total_practice_time || 0
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return { sessions: 0, recordings: 0, totalTime: 0 };
        }
    }

    async getPracticeHistory(days = 30) {
        if (!this.userId) return [];

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data, error } = await this.supabase
                .from('practice_sessions')
                .select('*')
                .eq('user_id', this.userId)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching practice history:', error);
            return [];
        }
    }

    // Private helper methods
    async updateProfileStats(type, duration = 0) {
        if (!this.userId) return;

        try {
            const { data: profile } = await this.supabase
                .from('profiles')
                .select('total_practice_time, total_sessions, total_recordings')
                .eq('id', this.userId)
                .single();

            const updates = {};

            switch (type) {
                case 'session':
                    updates.total_sessions = (profile?.total_sessions || 0) + 1;
                    updates.total_practice_time = (profile?.total_practice_time || 0) + duration;
                    break;
                case 'recording':
                    updates.total_recordings = (profile?.total_recordings || 0) + 1;
                    break;
            }

            if (Object.keys(updates).length > 0) {
                await this.supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', this.userId);
            }
        } catch (error) {
            console.error('Error updating profile stats:', error);
        }
    }

    // Utility methods
    async syncData() {
        if (!this.userId) return false;

        try {
            // Refresh user stats
            const stats = await this.getUserStats();
            
            // Update UI if auth manager is available
            if (window.authManager) {
                window.authManager.loadUserStats();
            }
            
            return true;
        } catch (error) {
            console.error('Error syncing data:', error);
            return false;
        }
    }

    async exportUserData() {
        if (!this.userId) return null;

        try {
            const [profile, sessions, recordings, chatHistory] = await Promise.all([
                this.supabase.from('profiles').select('*').eq('id', this.userId).single(),
                this.supabase.from('practice_sessions').select('*').eq('user_id', this.userId),
                this.supabase.from('recordings').select('*').eq('user_id', this.userId),
                this.supabase.from('chat_history').select('*').eq('user_id', this.userId)
            ]);

            return {
                profile: profile.data,
                sessions: sessions.data || [],
                recordings: recordings.data || [],
                chatHistory: chatHistory.data || [],
                exportDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error exporting user data:', error);
            return null;
        }
    }

    // Clean up when user logs out
    cleanup() {
        this.userId = null;
    }
}

// Initialize database manager
window.dbManager = new DatabaseManager();