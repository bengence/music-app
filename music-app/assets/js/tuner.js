// Guitar Tuner functionality
class GuitarTuner {
    constructor() {
        this.elements = {
            startStopBtn: document.getElementById('tunerStartStopBtn'),
            noteNameEl: document.getElementById('noteName'),
            tuningStatusEl: document.getElementById('tuningStatus'),
            frequencyEl: document.getElementById('frequency'),
            targetFrequencyEl: document.getElementById('targetFrequency'),
            meterNeedle: document.getElementById('meterNeedle'),
            errorMessageEl: document.getElementById('tunerErrorMessage'),
            stringIndicatorsContainer: document.querySelector('.string-indicators')
        };

        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.animationFrameId = null;
        this.isListening = false;

        this.init();
    }

    init() {
        this.createStringIndicators();
        this.bindEvents();
    }

    createStringIndicators() {
        if (!this.elements.stringIndicatorsContainer) return;

        AUDIO_CONFIG.TUNER.STANDARD_TUNING.forEach(note => {
            const stringDiv = document.createElement('div');
            stringDiv.classList.add('string');
            stringDiv.id = `string-${note.name}${note.string}`;
            stringDiv.textContent = note.name;
            this.elements.stringIndicatorsContainer.appendChild(stringDiv);
        });
    }

    bindEvents() {
        this.elements.startStopBtn?.addEventListener('click', () => {
            this.isListening ? this.stop() : this.start();
        });
    }

    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                } 
            });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.source.connect(this.analyser);
            
            this.isListening = true;
            this.updateButtonUI();
            this.processAudio();
        } catch (err) {
            this.handleError(err);
        }
    }

    stop() {
        if (!this.isListening) return;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.isListening = false;
        this.updateButtonUI();
        this.resetUI();
    }

    processAudio() {
        const dataArray = new Float32Array(this.analyser.fftSize);
        this.analyser.getFloatTimeDomainData(dataArray);
        const fundamentalFrequency = autoCorrelate(dataArray, this.audioContext.sampleRate);
        
        if (fundamentalFrequency > 50 && fundamentalFrequency < 4000) {
            this.updateUI(getNoteData(fundamentalFrequency));
        } else {
            this.resetUI();
        }
        
        if (this.isListening) {
            this.animationFrameId = requestAnimationFrame(() => this.processAudio());
        }
    }

    updateUI(noteData) {
        if (this.elements.noteNameEl) {
            this.elements.noteNameEl.textContent = noteData.noteName;
        }
        if (this.elements.frequencyEl) {
            this.elements.frequencyEl.textContent = `Frequency: ${noteData.frequency.toFixed(2)} Hz`;
        }
        
        const rotation = (noteData.cents / 50) * 45;
        if (this.elements.meterNeedle) {
            this.elements.meterNeedle.style.transform = `rotate(${Math.max(-45, Math.min(45, rotation))}deg)`;
        }
        
        let statusColor;
        let statusText;
        if (Math.abs(noteData.cents) < 5) {
            statusText = 'In Tune!';
            statusColor = '#4ade80'; // green
        } else if (noteData.cents < 0) {
            statusText = 'Too Flat';
            statusColor = Math.abs(noteData.cents) > 10 ? '#f87171' : '#facc15'; // red or yellow
        } else {
            statusText = 'Too Sharp';
            statusColor = Math.abs(noteData.cents) > 10 ? '#f87171' : '#facc15'; // red or yellow
        }
        
        if (this.elements.tuningStatusEl) {
            this.elements.tuningStatusEl.textContent = statusText;
            this.elements.tuningStatusEl.style.color = statusColor;
        }
        if (this.elements.meterNeedle) {
            this.elements.meterNeedle.style.backgroundColor = statusColor;
        }
        
        const closestString = AUDIO_CONFIG.TUNER.STANDARD_TUNING.reduce((p, c) => 
            Math.abs(noteData.frequency - p.freq) < Math.abs(noteData.frequency - c.freq) ? p : c
        );
        
        if (this.elements.targetFrequencyEl) {
            this.elements.targetFrequencyEl.textContent = `Target: ${closestString.name} (${closestString.freq.toFixed(2)} Hz)`;
        }
        
        this.highlightString(closestString, Math.abs(noteData.cents) < 10);
    }

    resetUI() {
        if (this.elements.noteNameEl) {
            this.elements.noteNameEl.textContent = '--';
        }
        if (this.elements.tuningStatusEl) {
            this.elements.tuningStatusEl.innerHTML = '&nbsp;';
            this.elements.tuningStatusEl.style.color = 'white';
        }
        if (this.elements.frequencyEl) {
            this.elements.frequencyEl.textContent = 'Frequency: --';
        }
        if (this.elements.targetFrequencyEl) {
            this.elements.targetFrequencyEl.textContent = 'Target: --';
        }
        if (this.elements.meterNeedle) {
            this.elements.meterNeedle.style.transform = 'rotate(0deg)';
            this.elements.meterNeedle.style.backgroundColor = '#4b5563'; // gray
        }
        
        document.querySelectorAll('.string').forEach(el => el.classList.remove('active'));
    }

    updateButtonUI() {
        if (!this.elements.startStopBtn) return;

        this.elements.startStopBtn.textContent = this.isListening ? 'Stop' : 'Start Tuning';
        this.elements.startStopBtn.classList.toggle('bg-red-600', this.isListening);
        this.elements.startStopBtn.classList.toggle('hover:bg-red-500', this.isListening);
        this.elements.startStopBtn.classList.toggle('bg-purple-600', !this.isListening);
        this.elements.startStopBtn.classList.toggle('hover:bg-purple-500', !this.isListening);
    }

    highlightString(targetString, isInTune) {
        document.querySelectorAll('.string').forEach(el => el.classList.remove('active'));
        const stringEl = document.getElementById(`string-${targetString.name}${targetString.string}`);
        if (stringEl && isInTune) {
            stringEl.classList.add('active');
        }
    }

    handleError(err) {
        if (this.elements.errorMessageEl) {
            this.elements.errorMessageEl.textContent = "Microphone access denied. Please allow it in your browser settings.";
        }
        this.stop();
    }
}