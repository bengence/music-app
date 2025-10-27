# Music App Dashboard

A comprehensive web-based music practice application with integrated tools for musicians.

## Features

- **Metronome**: Advanced metronome with customizable tempo, time signatures, and practice trainer
- **Guitar Tuner**: Real-time chromatic tuner with visual feedback
- **Music Recorder**: Record practice sessions with playback and download capabilities
- **AI Assistant**: Chat with an AI music assistant for guidance and tips
- **Reference Documents**: Quick access to music theory references

## Getting Started

1. Open `index.html` in a modern web browser
2. Allow microphone permissions when prompted (required for tuner and recorder)
3. Start practicing with the various tools available

## Browser Requirements

- Modern web browser with Web Audio API support
- Microphone access for tuner and recorder features
- Internet connection for AI assistant functionality

## Project Structure

```
music-app/
├── index.html          # Main application file
├── assets/
│   ├── css/
│   │   └── styles.css  # Application styles
│   └── js/
│       ├── config.js   # Configuration and constants
│       ├── utils.js    # Utility functions
│       ├── metronome.js # Metronome functionality
│       ├── tuner.js    # Guitar tuner functionality
│       ├── recorder.js # Recording functionality
│       ├── chat.js     # AI assistant chat
│       └── app.js      # Main application controller
├── docs/
└── README.md           # This file
```

## Features Overview

### Metronome
- Variable tempo (60-200 BPM)
- Multiple time signatures (4/4, 3/4, 2/4, 6/8)
- Subdivision options (quarter, eighth, sixteenth notes)
- Practice trainer with auto tempo increase
- AI-powered practice routine suggestions

### Guitar Tuner
- Real-time pitch detection
- Standard tuning visualization (E A D G B E)
- Visual tuning meter with cents accuracy
- Color-coded feedback for tuning status

### Music Recorder
- High-quality audio recording
- Recording timer with duration tracking
- Playback controls for recorded sessions
- Download recordings as WAV files
- Recording management (play, download, delete)

### AI Assistant
- Music theory guidance
- Practice suggestions
- General music-related questions
- Powered by Google's Gemini AI

## Technical Details

- Built with vanilla JavaScript (ES6+)
- Styled with Tailwind CSS
- Uses Web Audio API for audio processing
- MediaRecorder API for recording functionality
- No external dependencies except Tailwind CSS

## Browser Compatibility

- Chrome 66+ (recommended)
- Firefox 60+
- Safari 11.1+
- Edge 79+

## License

This project is for educational and personal use.