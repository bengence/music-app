// Music Recorder functionality
class MusicRecorder {
    constructor() {
        this.elements = {
            startBtn: document.getElementById('recorder-start-btn'),
            stopBtn: document.getElementById('recorder-stop-btn'),
            statusEl: document.getElementById('recording-status'),
            timerEl: document.getElementById('timer-display'),
            errorEl: document.getElementById('recorder-error-message'),
            listEl: document.getElementById('recordings-list'),
            noRecordingsEl: document.getElementById('no-recordings')
        };

        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.timerInterval = null;
        this.startTime = null;

        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        this.elements.startBtn?.addEventListener('click', () => this.startRecording());
        this.elements.stopBtn?.addEventListener('click', () => this.stopRecording());
    }

    async startRecording() {
        if (this.isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const duration = this.elements.timerEl?.textContent || '00:00:00';
                const durationSeconds = this.parseDurationToSeconds(duration);
                
                this.addRecordingToList(audioBlob, duration, durationSeconds);
                this.stopTimer();
                this.updateUI(false);
                
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.startTimer();
            this.updateUI(true);
        } catch (err) {
            this.handleError("Could not access microphone. Please check permissions and try again.");
            console.error("Recording error:", err);
        }
    }

    stopRecording() {
        if (!this.isRecording || this.mediaRecorder.state === 'inactive') return;
        this.mediaRecorder.stop();
    }

    startTimer() {
        this.startTime = Date.now();
        if (this.elements.timerEl) {
            this.elements.timerEl.textContent = formatTime(0);
        }
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        if (!this.startTime || !this.elements.timerEl) return;
        
        const elapsed = Date.now() - this.startTime;
        this.elements.timerEl.textContent = formatTime(elapsed);
    }

    updateUI(isRecording) {
        this.isRecording = isRecording;
        
        if (this.elements.startBtn) {
            this.elements.startBtn.classList.toggle('hidden', isRecording);
        }
        if (this.elements.stopBtn) {
            this.elements.stopBtn.classList.toggle('hidden', !isRecording);
        }
        if (this.elements.statusEl) {
            this.elements.statusEl.classList.toggle('hidden', !isRecording);
        }
        
        this.clearError();
    }

    addRecordingToList(audioBlob, durationText, durationSeconds) {
        if (this.elements.noRecordingsEl) {
            this.elements.noRecordingsEl.style.display = 'none';
        }

        if (!this.elements.listEl) return;

        const date = new Date();
        const title = `Practice ${this.elements.listEl.children.length + 1} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        // Save to database if user is authenticated
        if (window.dbManager && APP_STATE.isAuthenticated) {
            window.dbManager.saveRecording(title, durationSeconds, {
                format: 'audio/wav',
                recordedAt: date.toISOString()
            });
        }
        
        const li = document.createElement('li');
        li.classList.add('flex', 'items-center', 'justify-between', 'bg-gray-700', 'p-3', 'rounded-lg', 'shadow-md');
        
        const audioUrl = URL.createObjectURL(audioBlob);
        
        li.innerHTML = `
            <div class="flex-1">
                <h4 class="font-medium text-white">${title}</h4>
                <p class="text-sm text-gray-400">Duration: ${durationText}</p>
                <audio controls class="mt-2 w-full h-8">
                    <source src="${audioUrl}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
            <div class="ml-3 flex space-x-2">
                <button class="download-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors" 
                        data-url="${audioUrl}" data-filename="${title}.wav">
                    <i class="fas fa-download mr-1"></i>Download
                </button>
                <button class="delete-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors">
                    <i class="fas fa-trash mr-1"></i>Delete
                </button>
            </div>
        `;

        // Add event listeners for download and delete buttons
        const downloadBtn = li.querySelector('.download-btn');
        const deleteBtn = li.querySelector('.delete-btn');

        downloadBtn?.addEventListener('click', (e) => {
            const url = e.target.closest('.download-btn').dataset.url;
            const filename = e.target.closest('.download-btn').dataset.filename;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        deleteBtn?.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this recording?')) {
                URL.revokeObjectURL(audioUrl);
                li.remove();
                
                if (this.elements.listEl && this.elements.listEl.children.length === 0 && this.elements.noRecordingsEl) {
                    this.elements.noRecordingsEl.style.display = 'block';
                }
            }
        });

        this.elements.listEl.prepend(li);
    }

    parseDurationToSeconds(duration) {
        const parts = duration.split(':');
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    }

    handleError(message) {
        if (this.elements.errorEl) {
            this.elements.errorEl.textContent = message;
        }
        this.updateUI(false);
    }

    clearError() {
        if (this.elements.errorEl) {
            this.elements.errorEl.textContent = '';
        }
    }
}