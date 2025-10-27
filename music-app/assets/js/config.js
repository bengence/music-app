// Configuration for Music App
// Gemini API Configuration
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=";
const API_KEY = "AIzaSyC5s-9IVt_AH9C6riBN68kUtfQ8aJihwlc";

// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://vfaixgiojwxvnmpwoomi.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmYWl4Z2lvand4dm5tcHdvb21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MzUxMjAsImV4cCI6MjA3NzExMTEyMH0.wrMEb5O84L3jM9trH1v1BdCLvlJ80m88xJ0jNlhIGmM'
};

// Audio Configuration
const AUDIO_CONFIG = {
    TUNER: {
        A4: 440,
        NOTE_NAMES: ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"],
        STANDARD_TUNING: [
            { string: 6, name: 'E', freq: 82.41 }, 
            { string: 5, name: 'A', freq: 110.00 },
            { string: 4, name: 'D', freq: 146.83 }, 
            { string: 3, name: 'G', freq: 196.00 },
            { string: 2, name: 'B', freq: 246.94 }, 
            { string: 1, name: 'E', freq: 329.63 }
        ]
    },
    METRONOME: {
        PITCH: { ACCENT: 1200, NORMAL: 880, SUB: 660 },
        VOLUME: { ACCENT: 1.0, NORMAL: 0.7, SUB: 0.3 }
    }
};

// App State
const APP_STATE = {
    currentTab: 'dashboard',
    isInitialized: false,
    user: null,
    isAuthenticated: false
};