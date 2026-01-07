# 🎤 Zippy – Voice AI Product Assistant

Zippy is a browser-based Voice AI assistant built with React + TypeScript that demonstrates end-to-end integration of voice input, LLM processing, and voice output.
The project focuses on Voice AI integration and flow clarity, rather than UI polish or production hardening.

## 🧠 Architecture and Flow

The application follows a real-time Voice AI pipeline using browser audio capture and a live LLM connection.

#### High-level Flow

- Voice Input (Microphone)
  - The browser captures raw microphone audio using the Web Audio API.
  - Audio is processed as PCM data in the frontend.

- Audio Processing
  - Audio utilities (utils/audio.ts) handle:
    - Audio buffering
    - PCM conversion
    - Preparing audio frames for streaming

- LLM Interaction
  - Processed audio is streamed to a live LLM endpoint.
  - The LLM performs speech understanding and response generation.

- Response Handling
  - Model responses are received in real time.
  - Conversation messages are displayed in the UI.
  - Audio responses are played back to the user.


### Conceptual Flow Diagram
Microphone Input
   ↓
Web Audio API
   ↓
Audio Processing (PCM)
   ↓
Live LLM Session
   ↓
LLM Response (Text + Audio)
   ↓
Playback + UI Update

🛠️ Tools and Technologies Used
Frontend

React

TypeScript

Vite

Voice & Audio

Web Audio API – microphone capture and audio processing

Custom audio utilities (utils/audio.ts)

Audio visualization (components/Visualizer.tsx)

LLM Integration

Live LLM API (real-time voice interaction)

Streaming-based interaction rather than batch text requests

UI Components

ConversationLog.tsx – displays conversation history

Visualizer.tsx – audio activity visualization

▶️ How to Run the Project Locally
Prerequisites

Node.js (v18+ recommended)

A modern browser (Chrome recommended)

Microphone access enabled

Internet connection (for LLM API)

Steps

Clone the repository

git clone <repository-url>
cd zippy-product-assistant


Install dependencies

npm install


Set up environment variables

Create a .env.local file

Add the required API keys or configuration used by the LLM service

Example:VITE_API_KEY=your_api_key_here
Start the development server

bash
Copy code
npm run dev
Open the app

Navigate to the local URL shown in the terminal (usually http://localhost:5173)

Allow microphone access
Start speaking to interact with the assistant          






## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


