// Main application controller
class MusicApp {
    constructor() {
        this.components = {
            loginScreen: null,
            auth: null,
            metronome: null,
            tuner: null,
            recorder: null,
            chat: null
        };
        
        this.currentTab = 'dashboard';
        this.isGuestMode = false;
        this.init();
    }

    init() {
        this.initializeComponents();
        this.setupTabNavigation();
        this.bindGlobalEvents();
        APP_STATE.isInitialized = true;
    }

    initializeComponents() {
        // Initialize login screen first
        this.components.loginScreen = new LoginScreen();
        
        // Initialize authentication system
        this.components.auth = new AuthManager();
        window.authManager = this.components.auth;
        
        // Initialize other components
        this.components.metronome = new Metronome();
        this.components.tuner = new GuitarTuner();
        this.components.recorder = new MusicRecorder();
        this.components.chat = new AIAssistant();
    }

    handleAuthSuccess() {
        // Called when user successfully logs in
        this.isGuestMode = false;
        this.showWelcomeMessage();
        this.updateUIForAuthenticatedUser();
    }

    handleGuestMode() {
        // Called when user enters as guest
        this.isGuestMode = true;
        this.showGuestMessage();
        this.updateUIForGuestUser();
    }

    showWelcomeMessage() {
        // Show a welcome message for authenticated users
        setTimeout(() => {
            if (window.authManager && APP_STATE.user) {
                const email = APP_STATE.user.email;
                this.showNotification(`Welcome back, ${email}!`, 'success');
            }
        }, 500);
    }

    showGuestMessage() {
        // Show a message for guest users
        setTimeout(() => {
            this.showNotification('Welcome! You\'re using guest mode with limited features.', 'info');
        }, 500);
    }

    updateUIForAuthenticatedUser() {
        // Show all features for authenticated users
        const restrictedElements = document.querySelectorAll('[data-auth-required]');
        restrictedElements.forEach(el => el.classList.remove('opacity-50', 'pointer-events-none'));
        
        // Update profile tab to show as available
        const profileTab = document.querySelector('[data-tab="profile"]');
        if (profileTab) {
            profileTab.classList.remove('opacity-50');
            profileTab.querySelector('i').classList.remove('text-gray-500');
            profileTab.querySelector('i').classList.add('text-purple-400');
        }
    }

    updateUIForGuestUser() {
        // Limit features for guest users
        const restrictedFeatures = [
            'Profile', 'Save recordings', 'Practice history', 'AI chat history'
        ];
        
        // Disable profile tab
        const profileTab = document.querySelector('[data-tab="profile"]');
        if (profileTab) {
            profileTab.classList.add('opacity-50');
            profileTab.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Please login to access your profile', 'warning');
            });
        }
        
        // Add guest mode indicators
        this.addGuestModeIndicators();
    }

    addGuestModeIndicators() {
        // Add "Login Required" badges to restricted features
        const recordingSection = document.querySelector('#recorder .bg-gray-800');
        if (recordingSection && this.isGuestMode) {
            const badge = document.createElement('div');
            badge.className = 'bg-yellow-600 text-yellow-100 text-xs px-2 py-1 rounded-full inline-block mb-2';
            badge.textContent = 'Login to save recordings';
            recordingSection.insertBefore(badge, recordingSection.firstChild);
        }
    }

    showNotification(message, type = 'info') {
        // Create and show a notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
        
        switch (type) {
            case 'success':
                notification.classList.add('bg-green-600', 'text-white');
                break;
            case 'error':
                notification.classList.add('bg-red-600', 'text-white');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-600', 'text-black');
                break;
            default:
                notification.classList.add('bg-blue-600', 'text-white');
        }
        
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="flex-1">${message}</span>
                <button class="ml-2 text-current opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    setupTabNavigation() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetTabId = tab.dataset.tab;
                this.switchTab(targetTabId, tabs, tabContents);
            });
        });
    }

    switchTab(targetTabId, tabs, tabContents) {
        // Deactivate all tabs and content
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Activate the clicked tab and its content
        const targetTab = document.querySelector(`[data-tab="${targetTabId}"]`);
        const targetContent = document.getElementById(targetTabId);
        
        if (targetTab) {
            targetTab.classList.add('active');
        }
        if (targetContent) {
            targetContent.classList.add('active');
        }

        // Handle component cleanup when switching tabs
        this.handleTabSwitch(targetTabId);
        
        // Update app state
        this.currentTab = targetTabId;
        APP_STATE.currentTab = targetTabId;
    }

    handleTabSwitch(targetTabId) {
        // Stop audio resources when switching away from audio tabs
        if (targetTabId !== 'tuner' && this.components.tuner?.isListening) {
            this.components.tuner.stop();
        }
        if (targetTabId !== 'metronome' && this.components.metronome?.isRunning) {
            this.components.metronome.stop();
        }
        if (targetTabId !== 'recorder' && this.components.recorder?.isRecording) {
            this.components.recorder.stopRecording();
        }

        // Tab-specific initialization or cleanup
        switch (targetTabId) {
            case 'dashboard':
                this.handleDashboardTab();
                break;
            case 'metronome':
                this.handleMetronomeTab();
                break;
            case 'tuner':
                this.handleTunerTab();
                break;
            case 'recorder':
                this.handleRecorderTab();
                break;
            case 'ai-assistant':
                this.handleChatTab();
                break;
            case 'documents':
                this.handleDocumentsTab();
                break;
            case 'profile':
                this.handleProfileTab();
                break;
        }
    }

    handleDashboardTab() {
        // Dashboard-specific logic
        console.log('Dashboard tab activated');
    }

    handleMetronomeTab() {
        // Metronome-specific logic
        console.log('Metronome tab activated');
    }

    handleTunerTab() {
        // Tuner-specific logic
        console.log('Tuner tab activated');
    }

    handleRecorderTab() {
        // Recorder-specific logic
        console.log('Recorder tab activated');
    }

    handleChatTab() {
        // Chat-specific logic
        if (this.components.chat?.elements.chatInput) {
            this.components.chat.elements.chatInput.focus();
        }
        console.log('AI Assistant tab activated');
    }

    handleDocumentsTab() {
        // Documents-specific logic
        console.log('Documents tab activated');
    }

    handleProfileTab() {
        // Profile-specific logic
        if (this.components.auth) {
            this.components.auth.updateProfilePage(APP_STATE.user);
            if (APP_STATE.isAuthenticated) {
                this.components.auth.loadUserStats();
            }
        }
        console.log('Profile tab activated');
    }

    bindGlobalEvents() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to stop all active processes
            if (e.key === 'Escape') {
                this.stopAllAudioProcesses();
            }
            
            // Spacebar to toggle metronome (when not typing)
            if (e.code === 'Space' && !this.isTyping() && this.currentTab === 'metronome') {
                e.preventDefault();
                if (this.components.metronome?.isRunning) {
                    this.components.metronome.stop();
                } else {
                    this.components.metronome.start();
                }
            }
        });

        // Handle browser tab visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleTabHidden();
            } else {
                this.handleTabVisible();
            }
        });

        // Handle browser beforeunload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    isTyping() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.contentEditable === 'true'
        );
    }

    stopAllAudioProcesses() {
        if (this.components.metronome?.isRunning) {
            this.components.metronome.stop();
        }
        if (this.components.tuner?.isListening) {
            this.components.tuner.stop();
        }
        if (this.components.recorder?.isRecording) {
            this.components.recorder.stopRecording();
        }
    }

    handleTabHidden() {
        // Pause audio processes when tab is hidden
        this.stopAllAudioProcesses();
    }

    handleTabVisible() {
        // Resume or reinitialize when tab becomes visible
        console.log('Tab became visible');
    }

    cleanup() {
        // Clean up resources before page unload
        this.stopAllAudioProcesses();
        
        // Close audio contexts
        if (this.components.metronome?.audioContext) {
            this.components.metronome.audioContext.close();
        }
        if (this.components.tuner?.audioContext) {
            this.components.tuner.audioContext.close();
        }
    }

    // Public API methods
    getCurrentTab() {
        return this.currentTab;
    }

    getComponent(name) {
        return this.components[name];
    }

    isInitialized() {
        return APP_STATE.isInitialized;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for browser compatibility
    if (!window.AudioContext && !window.webkitAudioContext) {
        console.error('Web Audio API is not supported in this browser');
        alert('Your browser does not support the Web Audio API. Some features may not work properly.');
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('MediaDevices API is not supported in this browser');
        alert('Your browser does not support microphone access. Tuner and Recorder features will not work.');
    }

    // Initialize the main application
    window.musicApp = new MusicApp();
    console.log('Music App initialized successfully');
});

// Export for debugging/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicApp;
}