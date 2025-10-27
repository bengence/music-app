// Authentication management with Supabase
class AuthManager {
    constructor() {
        // Initialize Supabase client
        this.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        this.elements = {
            authBtn: document.getElementById('auth-btn'),
            authBtnText: document.getElementById('auth-btn-text'),
            authModal: document.getElementById('auth-modal'),
            authModalTitle: document.getElementById('auth-modal-title'),
            closeAuthModal: document.getElementById('close-auth-modal'),
            userInfo: document.getElementById('user-info'),
            userEmail: document.getElementById('user-email'),
            
            // Forms
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            resetForm: document.getElementById('reset-form'),
            
            // Form inputs
            loginEmail: document.getElementById('login-email'),
            loginPassword: document.getElementById('login-password'),
            registerEmail: document.getElementById('register-email'),
            registerPassword: document.getElementById('register-password'),
            registerConfirmPassword: document.getElementById('register-confirm-password'),
            resetEmail: document.getElementById('reset-email'),
            
            // Form switchers
            showRegister: document.getElementById('show-register'),
            showLogin: document.getElementById('show-login'),
            forgotPassword: document.getElementById('forgot-password'),
            backToLogin: document.getElementById('back-to-login'),
            
            // Messages
            authMessage: document.getElementById('auth-message'),
            authMessageText: document.getElementById('auth-message-text'),
            
            // Profile elements
            profileLoginBtn: document.getElementById('profile-login-btn'),
            profileAuthenticated: document.getElementById('profile-authenticated'),
            profileUnauthenticated: document.getElementById('profile-unauthenticated'),
            profileEmail: document.getElementById('profile-email'),
            profileCreated: document.getElementById('profile-created'),
            
            // Password change
            changePasswordForm: document.getElementById('change-password-form'),
            newPassword: document.getElementById('new-password'),
            confirmPassword: document.getElementById('confirm-password'),
            
            // Statistics
            totalSessions: document.getElementById('total-sessions'),
            totalRecordings: document.getElementById('total-recordings'),
            totalTime: document.getElementById('total-time'),
            
            // Danger zone
            deleteAccountBtn: document.getElementById('delete-account-btn')
        };

        this.currentForm = 'login';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthState();
        this.handleAuthStateChanges();
    }

    bindEvents() {
        // Auth button
        this.elements.authBtn?.addEventListener('click', () => {
            if (APP_STATE.isAuthenticated) {
                this.logout();
            } else {
                this.showAuthModal();
            }
        });

        // Modal controls
        this.elements.closeAuthModal?.addEventListener('click', () => this.hideAuthModal());
        this.elements.authModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.authModal) {
                this.hideAuthModal();
            }
        });

        // Form switchers
        this.elements.showRegister?.addEventListener('click', () => this.switchForm('register'));
        this.elements.showLogin?.addEventListener('click', () => this.switchForm('login'));
        this.elements.forgotPassword?.addEventListener('click', () => this.switchForm('reset'));
        this.elements.backToLogin?.addEventListener('click', () => this.switchForm('login'));

        // Form submissions
        this.elements.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        this.elements.registerForm?.addEventListener('submit', (e) => this.handleRegister(e));
        this.elements.resetForm?.addEventListener('submit', (e) => this.handleReset(e));

        // Profile interactions
        this.elements.profileLoginBtn?.addEventListener('click', () => this.showAuthModal());
        this.elements.changePasswordForm?.addEventListener('submit', (e) => this.handlePasswordChange(e));
        this.elements.deleteAccountBtn?.addEventListener('click', () => this.handleDeleteAccount());

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.authModal?.classList.contains('hidden')) {
                this.hideAuthModal();
            }
        });
    }

    async checkAuthState() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.handleAuthSuccess(session.user);
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }

    handleAuthStateChanges() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.handleAuthSuccess(session.user);
            } else if (event === 'SIGNED_OUT') {
                this.handleSignOut();
            } else if (event === 'PASSWORD_RECOVERY') {
                this.showMessage('Check your email for password reset instructions', 'success');
            }
        });
    }

    showAuthModal() {
        this.elements.authModal?.classList.remove('hidden');
        this.switchForm(this.currentForm);
        this.clearMessage();
    }

    hideAuthModal() {
        this.elements.authModal?.classList.add('hidden');
        this.clearForms();
        this.clearMessage();
    }

    switchForm(formType) {
        this.currentForm = formType;
        
        // Hide all forms
        this.elements.loginForm?.classList.add('hidden');
        this.elements.registerForm?.classList.add('hidden');
        this.elements.resetForm?.classList.add('hidden');

        // Show selected form and update title
        switch (formType) {
            case 'login':
                this.elements.loginForm?.classList.remove('hidden');
                if (this.elements.authModalTitle) {
                    this.elements.authModalTitle.textContent = 'Login';
                }
                break;
            case 'register':
                this.elements.registerForm?.classList.remove('hidden');
                if (this.elements.authModalTitle) {
                    this.elements.authModalTitle.textContent = 'Register';
                }
                break;
            case 'reset':
                this.elements.resetForm?.classList.remove('hidden');
                if (this.elements.authModalTitle) {
                    this.elements.authModalTitle.textContent = 'Reset Password';
                }
                break;
        }
        
        this.clearMessage();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = this.elements.loginEmail?.value.trim();
        const password = this.elements.loginPassword?.value;

        if (!email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            this.showLoading('Signing in...');
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.hideAuthModal();
            this.showMessage('Login successful!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const email = this.elements.registerEmail?.value.trim();
        const password = this.elements.registerPassword?.value;
        const confirmPassword = this.elements.registerConfirmPassword?.value;

        if (!email || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            this.showLoading('Creating account...');
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });

            if (error) throw error;

            if (data.user && !data.session) {
                this.showMessage('Registration successful! Please check your email to verify your account.', 'success');
                this.switchForm('login');
            } else {
                this.hideAuthModal();
                this.showMessage('Account created successfully!', 'success');
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleReset(e) {
        e.preventDefault();
        
        const email = this.elements.resetEmail?.value.trim();

        if (!email) {
            this.showMessage('Please enter your email address', 'error');
            return;
        }

        try {
            this.showLoading('Sending reset email...');
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password'
            });

            if (error) throw error;

            this.showMessage('Password reset email sent! Check your inbox.', 'success');
            this.switchForm('login');
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        const newPassword = this.elements.newPassword?.value;
        const confirmPassword = this.elements.confirmPassword?.value;

        if (!newPassword || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            this.showLoading('Updating password...');
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            this.showMessage('Password updated successfully!', 'success');
            this.elements.changePasswordForm?.reset();
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleDeleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
            return;
        }

        try {
            this.showLoading('Deleting account...');
            
            // Note: Supabase doesn't have a direct delete user method for security reasons
            // You would typically implement this on the server side
            // For now, we'll sign out the user and show a message to contact support
            
            await this.logout();
            this.showMessage('Please contact support to complete account deletion.', 'info');
        } catch (error) {
            this.showMessage('Error deleting account: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('Error logging out', 'error');
        }
    }

    handleAuthSuccess(user) {
        APP_STATE.user = user;
        APP_STATE.isAuthenticated = true;
        
        this.updateAuthUI(true, user);
        this.updateProfilePage(user);
        this.loadUserStats();
        
        // Initialize database for user
        if (window.dbManager) {
            window.dbManager.initializeUserData(user.id);
        }
    }

    handleSignOut() {
        APP_STATE.user = null;
        APP_STATE.isAuthenticated = false;
        
        this.updateAuthUI(false);
        this.updateProfilePage(null);
    }

    updateAuthUI(isAuthenticated, user = null) {
        if (isAuthenticated && user) {
            if (this.elements.authBtnText) {
                this.elements.authBtnText.textContent = 'Logout';
            }
            if (this.elements.authBtn) {
                this.elements.authBtn.querySelector('i').className = 'fas fa-sign-out-alt mr-3';
            }
            if (this.elements.userInfo) {
                this.elements.userInfo.classList.remove('hidden');
            }
            if (this.elements.userEmail) {
                this.elements.userEmail.textContent = user.email;
            }
        } else {
            if (this.elements.authBtnText) {
                this.elements.authBtnText.textContent = 'Login';
            }
            if (this.elements.authBtn) {
                this.elements.authBtn.querySelector('i').className = 'fas fa-sign-in-alt mr-3';
            }
            if (this.elements.userInfo) {
                this.elements.userInfo.classList.add('hidden');
            }
        }
    }

    updateProfilePage(user) {
        if (user) {
            if (this.elements.profileAuthenticated) {
                this.elements.profileAuthenticated.classList.remove('hidden');
            }
            if (this.elements.profileUnauthenticated) {
                this.elements.profileUnauthenticated.classList.add('hidden');
            }
            if (this.elements.profileEmail) {
                this.elements.profileEmail.value = user.email;
            }
            if (this.elements.profileCreated) {
                this.elements.profileCreated.value = new Date(user.created_at).toLocaleDateString();
            }
        } else {
            if (this.elements.profileAuthenticated) {
                this.elements.profileAuthenticated.classList.add('hidden');
            }
            if (this.elements.profileUnauthenticated) {
                this.elements.profileUnauthenticated.classList.remove('hidden');
            }
        }
    }

    async loadUserStats() {
        if (!APP_STATE.isAuthenticated || !window.dbManager) return;

        try {
            const stats = await window.dbManager.getUserStats();
            
            if (this.elements.totalSessions) {
                this.elements.totalSessions.textContent = stats.sessions || 0;
            }
            if (this.elements.totalRecordings) {
                this.elements.totalRecordings.textContent = stats.recordings || 0;
            }
            if (this.elements.totalTime) {
                this.elements.totalTime.textContent = `${Math.round((stats.totalTime || 0) / 3600)}h`;
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    showMessage(message, type = 'info') {
        if (!this.elements.authMessage || !this.elements.authMessageText) return;

        this.elements.authMessageText.textContent = message;
        this.elements.authMessage.classList.remove('hidden', 'bg-red-600', 'bg-green-600', 'bg-blue-600', 'bg-yellow-600');
        
        switch (type) {
            case 'error':
                this.elements.authMessage.classList.add('bg-red-600');
                break;
            case 'success':
                this.elements.authMessage.classList.add('bg-green-600');
                break;
            case 'warning':
                this.elements.authMessage.classList.add('bg-yellow-600');
                break;
            default:
                this.elements.authMessage.classList.add('bg-blue-600');
        }

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => this.clearMessage(), 3000);
        }
    }

    clearMessage() {
        if (this.elements.authMessage) {
            this.elements.authMessage.classList.add('hidden');
        }
    }

    showLoading(message) {
        this.showMessage(message + ' Please wait...', 'info');
    }

    hideLoading() {
        // Loading is handled by the message system
    }

    clearForms() {
        this.elements.loginForm?.reset();
        this.elements.registerForm?.reset();
        this.elements.resetForm?.reset();
    }

    getUser() {
        return APP_STATE.user;
    }

    isAuthenticated() {
        return APP_STATE.isAuthenticated;
    }
}