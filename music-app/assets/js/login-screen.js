// Main Login Screen Controller
class LoginScreen {
    constructor() {
        this.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        this.elements = {
            loginScreen: document.getElementById('login-screen'),
            loadingScreen: document.getElementById('loading-screen'),
            mainApp: document.getElementById('main-app'),
            
            // Title and form containers
            loginScreenTitle: document.getElementById('login-screen-title'),
            
            // Forms
            mainLoginForm: document.getElementById('main-login-form'),
            mainRegisterForm: document.getElementById('main-register-form'),
            mainResetForm: document.getElementById('main-reset-form'),
            
            // Login inputs
            mainLoginEmail: document.getElementById('main-login-email'),
            mainLoginPassword: document.getElementById('main-login-password'),
            mainLoginBtn: document.getElementById('main-login-btn'),
            
            // Register inputs
            mainRegisterEmail: document.getElementById('main-register-email'),
            mainRegisterPassword: document.getElementById('main-register-password'),
            mainRegisterConfirm: document.getElementById('main-register-confirm'),
            mainRegisterBtn: document.getElementById('main-register-btn'),
            
            // Reset inputs
            mainResetEmail: document.getElementById('main-reset-email'),
            mainResetBtn: document.getElementById('main-reset-btn'),
            
            // Switchers
            loginSwitchers: document.getElementById('login-switchers'),
            registerSwitchers: document.getElementById('register-switchers'),
            resetSwitchers: document.getElementById('reset-switchers'),
            
            switchToRegister: document.getElementById('switch-to-register'),
            switchToReset: document.getElementById('switch-to-reset'),
            switchToLoginFromRegister: document.getElementById('switch-to-login-from-register'),
            switchToLoginFromReset: document.getElementById('switch-to-login-from-reset'),
            
            // Message
            mainAuthMessage: document.getElementById('main-auth-message'),
            mainAuthMessageText: document.getElementById('main-auth-message-text'),
            
            // Guest access
            guestAccessBtn: document.getElementById('guest-access-btn')
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
        // Form submissions
        this.elements.mainLoginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        this.elements.mainRegisterForm?.addEventListener('submit', (e) => this.handleRegister(e));
        this.elements.mainResetForm?.addEventListener('submit', (e) => this.handleReset(e));

        // Form switchers
        this.elements.switchToRegister?.addEventListener('click', () => this.switchForm('register'));
        this.elements.switchToReset?.addEventListener('click', () => this.switchForm('reset'));
        this.elements.switchToLoginFromRegister?.addEventListener('click', () => this.switchForm('login'));
        this.elements.switchToLoginFromReset?.addEventListener('click', () => this.switchForm('login'));

        // Guest access
        this.elements.guestAccessBtn?.addEventListener('click', () => this.enterAsGuest());

        // Enter key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.elements.loginScreen?.classList.contains('hidden')) {
                const activeForm = document.querySelector('#login-screen form:not(.hidden)');
                if (activeForm) {
                    e.preventDefault();
                    activeForm.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    async checkAuthState() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.showApp();
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }

    handleAuthStateChanges() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.showApp();
            } else if (event === 'SIGNED_OUT') {
                this.showLoginScreen();
            }
        });
    }

    switchForm(formType) {
        this.currentForm = formType;
        
        // Hide all forms
        this.elements.mainLoginForm?.classList.add('hidden');
        this.elements.mainRegisterForm?.classList.add('hidden');
        this.elements.mainResetForm?.classList.add('hidden');
        
        // Hide all switchers
        this.elements.loginSwitchers?.classList.add('hidden');
        this.elements.registerSwitchers?.classList.add('hidden');
        this.elements.resetSwitchers?.classList.add('hidden');

        // Show selected form and switchers
        switch (formType) {
            case 'login':
                this.elements.mainLoginForm?.classList.remove('hidden');
                this.elements.loginSwitchers?.classList.remove('hidden');
                if (this.elements.loginScreenTitle) {
                    this.elements.loginScreenTitle.textContent = 'Welcome Back';
                }
                break;
            case 'register':
                this.elements.mainRegisterForm?.classList.remove('hidden');
                this.elements.registerSwitchers?.classList.remove('hidden');
                if (this.elements.loginScreenTitle) {
                    this.elements.loginScreenTitle.textContent = 'Create Account';
                }
                break;
            case 'reset':
                this.elements.mainResetForm?.classList.remove('hidden');
                this.elements.resetSwitchers?.classList.remove('hidden');
                if (this.elements.loginScreenTitle) {
                    this.elements.loginScreenTitle.textContent = 'Reset Password';
                }
                break;
        }
        
        this.clearMessage();
        this.clearForms();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = this.elements.mainLoginEmail?.value.trim();
        const password = this.elements.mainLoginPassword?.value;

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
            
            // Success is handled by auth state change
        } catch (error) {
            this.showMessage(error.message, 'error');
            this.hideLoading();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const email = this.elements.mainRegisterEmail?.value.trim();
        const password = this.elements.mainRegisterPassword?.value;
        const confirmPassword = this.elements.mainRegisterConfirm?.value;

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
            }
            // If session exists, success is handled by auth state change
            
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleReset(e) {
        e.preventDefault();
        
        const email = this.elements.mainResetEmail?.value.trim();

        if (!email) {
            this.showMessage('Please enter your email address', 'error');
            return;
        }

        try {
            this.showLoading('Sending reset email...');
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
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

    enterAsGuest() {
        this.showMessage('Entering as guest - limited features available', 'info');
        setTimeout(() => {
            this.showApp(false); // false = guest mode
        }, 1000);
    }

    showApp(isAuthenticated = true) {
        // Show loading first
        this.showLoadingScreen();
        
        // Hide login screen and show main app after a delay
        setTimeout(() => {
            this.elements.loginScreen?.classList.add('hidden');
            this.elements.loadingScreen?.classList.add('hidden');
            this.elements.mainApp?.classList.remove('hidden');
            
            // Update app state
            APP_STATE.isAuthenticated = isAuthenticated;
            if (isAuthenticated) {
                // Trigger app initialization for authenticated user
                if (window.musicApp) {
                    window.musicApp.handleAuthSuccess();
                }
            } else {
                // Guest mode - limited features
                if (window.musicApp) {
                    window.musicApp.handleGuestMode();
                }
            }
        }, 1500);
    }

    showLoginScreen() {
        this.elements.mainApp?.classList.add('hidden');
        this.elements.loadingScreen?.classList.add('hidden');
        this.elements.loginScreen?.classList.remove('hidden');
        
        // Reset to login form
        this.switchForm('login');
        
        // Update app state
        APP_STATE.isAuthenticated = false;
        APP_STATE.user = null;
    }

    showLoadingScreen() {
        this.elements.loginScreen?.classList.add('hidden');
        this.elements.mainApp?.classList.add('hidden');
        this.elements.loadingScreen?.classList.remove('hidden');
    }

    showMessage(message, type = 'info') {
        if (!this.elements.mainAuthMessage || !this.elements.mainAuthMessageText) return;

        this.elements.mainAuthMessageText.textContent = message;
        this.elements.mainAuthMessage.classList.remove('hidden', 'bg-red-600', 'bg-green-600', 'bg-blue-600', 'bg-yellow-600');
        
        switch (type) {
            case 'error':
                this.elements.mainAuthMessage.classList.add('bg-red-600');
                break;
            case 'success':
                this.elements.mainAuthMessage.classList.add('bg-green-600');
                break;
            case 'warning':
                this.elements.mainAuthMessage.classList.add('bg-yellow-600');
                break;
            default:
                this.elements.mainAuthMessage.classList.add('bg-blue-600');
        }

        // Auto-hide success and info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => this.clearMessage(), 3000);
        }
    }

    clearMessage() {
        if (this.elements.mainAuthMessage) {
            this.elements.mainAuthMessage.classList.add('hidden');
        }
    }

    showLoading(message) {
        this.showMessage(message + ' Please wait...', 'info');
        
        // Disable all buttons
        const buttons = document.querySelectorAll('#login-screen button');
        buttons.forEach(btn => btn.disabled = true);
    }

    hideLoading() {
        // Re-enable all buttons
        const buttons = document.querySelectorAll('#login-screen button');
        buttons.forEach(btn => btn.disabled = false);
    }

    clearForms() {
        this.elements.mainLoginForm?.reset();
        this.elements.mainRegisterForm?.reset();
        this.elements.mainResetForm?.reset();
    }
}