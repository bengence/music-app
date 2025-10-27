// Metronome functionality
class Metronome {
    constructor() {
        this.elements = {
            tempoKnob: document.getElementById('tempo-knob'),
            bpmDisplay: document.getElementById('bpm-display'),
            startStopBtn: document.getElementById('metronome-start-stop-btn'),
            beatLightContainer: document.getElementById('beat-light-container'),
            timeSignatureSelect: document.getElementById('time-signature'),
            subdivisionSelect: document.getElementById('subdivision'),
            trainerEnabledCheckbox: document.getElementById('trainer-enabled'),
            trainerControls: document.getElementById('trainer-controls'),
            trainerIncrementInput: document.getElementById('trainer-increment'),
            trainerIntervalInput: document.getElementById('trainer-interval'),
            trainerModeSelect: document.getElementById('trainer-mode'),
            routineSuggestBtn: document.getElementById('routine-suggest-btn'),
            routineOutput: document.getElementById('routine-output'),
            routineContent: document.getElementById('routine-content'),
            routineLoading: document.getElementById('routine-loading')
        };

        this.audioContext = null;
        this.isRunning = false;
        this.tempo = 120;
        this.timeSignature = { beats: 4, per: 4 };
        this.subdivision = 1;
        this.beatNumber = 0;
        this.nextNoteTime = 0.0;
        this.schedulerTimerID = null;
        this.trainer = { 
            enabled: false, 
            increment: 5, 
            interval: 8, 
            mode: 'bars', 
            barCount: 0, 
            lastTickTime: 0 
        };

        // Practice session tracking
        this.sessionStartTime = null;
        this.sessionSettings = {};

        this.init();
    }

    init() {
        this.updateBeatLights();
        this.bindEvents();
    }

    bindEvents() {
        this.elements.tempoKnob?.addEventListener('input', (e) => {
            this.updateTempo(parseInt(e.target.value, 10));
        });

        this.elements.startStopBtn?.addEventListener('click', () => {
            this.isRunning ? this.stop() : this.start();
        });

        this.elements.timeSignatureSelect?.addEventListener('change', (e) => {
            const [beats, per] = e.target.value.split('/').map(Number);
            this.timeSignature = { beats, per };
            this.beatNumber = 0;
            this.updateBeatLights();
        });

        this.elements.subdivisionSelect?.addEventListener('change', (e) => {
            this.subdivision = parseInt(e.target.value, 10);
        });

        this.elements.trainerEnabledCheckbox?.addEventListener('change', (e) => {
            this.trainer.enabled = e.target.checked;
            this.elements.trainerControls?.classList.toggle('hidden', !this.trainer.enabled);
        });

        this.elements.trainerIncrementInput?.addEventListener('input', (e) => {
            this.trainer.increment = parseInt(e.target.value, 10);
        });

        this.elements.trainerIntervalInput?.addEventListener('input', (e) => {
            this.trainer.interval = parseInt(e.target.value, 10);
        });

        this.elements.trainerModeSelect?.addEventListener('change', (e) => {
            this.trainer.mode = e.target.value;
        });

        this.elements.routineSuggestBtn?.addEventListener('click', () => {
            this.generateRoutine();
        });
    }

    updateTempo(newTempo) {
        this.tempo = newTempo;
        if (this.elements.bpmDisplay) {
            this.elements.bpmDisplay.textContent = this.tempo;
        }
        if (this.elements.tempoKnob) {
            this.elements.tempoKnob.value = this.tempo;
        }
    }

    start() {
        if (this.isRunning) return;
        
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        this.isRunning = true;
        this.nextNoteTime = this.audioContext.currentTime + 0.1;
        this.trainer.barCount = 0;
        this.trainer.lastTickTime = this.audioContext.currentTime;
        
        // Start practice session tracking
        this.sessionStartTime = Date.now();
        this.sessionSettings = {
            tempo: this.tempo,
            timeSignature: this.timeSignature,
            subdivision: this.subdivision,
            trainerEnabled: this.trainer.enabled
        };
        
        this.scheduler();
        
        if (this.elements.startStopBtn) {
            this.elements.startStopBtn.textContent = 'Stop';
            this.elements.startStopBtn.classList.replace('bg-purple-600', 'bg-red-600');
            this.elements.startStopBtn.classList.replace('hover:bg-purple-700', 'hover:bg-red-700');
        }
    }

    stop() {
        if (!this.isRunning) return;
        
        if (this.schedulerTimerID) {
            window.clearTimeout(this.schedulerTimerID);
        }
        
        this.isRunning = false;
        this.beatNumber = 0;
        
        // Log practice session
        if (this.sessionStartTime && window.dbManager) {
            const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            if (duration > 5) { // Only log sessions longer than 5 seconds
                window.dbManager.logPracticeSession('metronome', duration, this.sessionSettings);
            }
        }
        this.sessionStartTime = null;
        
        if (this.elements.startStopBtn) {
            this.elements.startStopBtn.textContent = 'Start';
            this.elements.startStopBtn.classList.replace('bg-red-600', 'bg-purple-600');
            this.elements.startStopBtn.classList.replace('hover:bg-red-700', 'hover:bg-purple-700');
        }
        
        const lights = document.querySelectorAll('.beat-light');
        lights.forEach(light => light.classList.remove('active', 'accent'));
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNote();
        }
        this.schedulerTimerID = window.setTimeout(() => this.scheduler(), 25.0);
    }

    scheduleNote(time) {
        const isAccent = this.beatNumber % this.timeSignature.beats === 0;
        const pitch = isAccent ? AUDIO_CONFIG.METRONOME.PITCH.ACCENT : AUDIO_CONFIG.METRONOME.PITCH.NORMAL;
        const volume = isAccent ? AUDIO_CONFIG.METRONOME.VOLUME.ACCENT : AUDIO_CONFIG.METRONOME.VOLUME.NORMAL;
        
        this.playClick(pitch, volume, time);
        this.visualFeedback(this.beatNumber % this.timeSignature.beats, isAccent);
        
        if (isAccent && this.beatNumber > 0) {
            this.trainer.barCount++;
            this.handleTempoTrainer();
        }
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        const noteLength = secondsPerBeat / this.subdivision;
        this.nextNoteTime += noteLength;
        this.beatNumber++;
    }

    playClick(pitch, volume, time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, time);
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        
        osc.start(time);
        osc.stop(time + 0.05);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
    }

    visualFeedback(beatIndex, isAccent) {
        const lights = document.querySelectorAll('.beat-light');
        requestAnimationFrame(() => {
            lights.forEach(light => light.classList.remove('active', 'accent'));
            if (lights[beatIndex]) {
                lights[beatIndex].classList.add('active');
                if (isAccent) {
                    lights[beatIndex].classList.add('accent');
                }
            }
        });
    }

    handleTempoTrainer() {
        if (!this.trainer.enabled || this.tempo >= parseInt(this.elements.tempoKnob?.max || 200, 10)) {
            return;
        }
        
        let shouldIncrement = false;
        if (this.trainer.mode === 'bars') {
            if (this.trainer.barCount > 0 && this.trainer.barCount % this.trainer.interval === 0) {
                shouldIncrement = true;
            }
        } else {
            const currentTime = this.audioContext.currentTime;
            if (currentTime - this.trainer.lastTickTime >= this.trainer.interval) {
                shouldIncrement = true;
                this.trainer.lastTickTime = currentTime;
            }
        }
        
        if (shouldIncrement) {
            this.updateTempo(Math.min(this.tempo + this.trainer.increment, parseInt(this.elements.tempoKnob?.max || 200, 10)));
        }
    }

    updateBeatLights() {
        if (!this.elements.beatLightContainer) return;
        
        this.elements.beatLightContainer.innerHTML = '';
        for (let i = 0; i < this.timeSignature.beats; i++) {
            const light = document.createElement('div');
            light.classList.add('beat-light');
            this.elements.beatLightContainer.appendChild(light);
        }
    }

    async generateRoutine() {
        if (!this.elements.bpmDisplay || !this.elements.timeSignatureSelect || !this.elements.subdivisionSelect) {
            return;
        }

        const currentBPM = this.elements.bpmDisplay.textContent;
        const timeSigValue = this.elements.timeSignatureSelect.value;
        const subdivisionText = this.elements.subdivisionSelect.options[this.elements.subdivisionSelect.selectedIndex].text.split(' ')[0];
        const currentSubdivision = this.elements.subdivisionSelect.value;
        
        const userPrompt = `I am practicing with a metronome set to ${currentBPM} BPM in a ${timeSigValue} time signature, subdivided into ${subdivisionText} notes (e.g., ${currentSubdivision} clicks per beat). Suggest a concise, effective, and challenging rhythm or scale practice exercise for me. Focus on the subdivision and give the instruction in bullet points or a short numbered list.`;

        if (this.elements.routineSuggestBtn) {
            this.elements.routineSuggestBtn.disabled = true;
        }
        if (this.elements.routineLoading) {
            this.elements.routineLoading.classList.remove('hidden');
        }
        if (this.elements.routineOutput) {
            this.elements.routineOutput.classList.remove('hidden');
        }
        if (this.elements.routineContent) {
            this.elements.routineContent.innerHTML = '';
        }

        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
        };

        try {
            const result = await callGeminiApi(payload);
            const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate routine. Please try again.";
            if (this.elements.routineContent) {
                this.elements.routineContent.innerHTML = generatedText.replace(/\n/g, '<br>');
            }
        } catch (error) {
            if (this.elements.routineContent) {
                this.elements.routineContent.innerHTML = "Error generating routine. Please check your connection and try again.";
            }
            console.error("Gemini Routine Error:", error);
        } finally {
            if (this.elements.routineSuggestBtn) {
                this.elements.routineSuggestBtn.disabled = false;
            }
            if (this.elements.routineLoading) {
                this.elements.routineLoading.classList.add('hidden');
            }
        }
    }
}