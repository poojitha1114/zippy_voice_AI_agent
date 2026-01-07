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


## Conceptual Flow Diagram
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

## 🛠️ Tools and Technologies Used
- Frontend
  - React
  - TypeScript
  - Vite

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



# Zippy Product Assistant 🎙️

A world-class, voice-first AI agent designed to help families discover Zippy—the screen-free smart audio device for kids. This application leverages the **Gemini 2.5 Flash Live API** for real-time, low-latency natural language interaction.

## 🌟 Overview
Zippy Assistant is a pure voice interface. There are no text transcripts; the interaction is designed to mimic a natural human conversation. It uses high-fidelity audio processing to capture user intent and stream back helpful information about Zippy's Montessori-based product line.

## 🏗️ Architecture & Flow

1.  **Capture**: The app requests microphone access via `navigator.mediaDevices.getUserMedia`.
2.  **Processing**: The **Web Audio API** (`AudioContext`) captures raw audio. A `ScriptProcessorNode` converts the input into 16-bit PCM chunks at 16kHz.
3.  **Transport**: Chunks are Base64 encoded and streamed over a WebSocket via the `@google/genai` Live API.
4.  **Inference**: Google's **Gemini 2.5 Flash Native Audio** model processes the audio stream alongside a specialized system instruction that defines Zippy's warm, nurturing personality.
5.  **Playback**: The model returns raw PCM audio bytes. The app decodes these into an `AudioBuffer` and schedules them for gapless playback using a look-ahead timestamp queue.
6.  **Visual Feedback**: A real-time Canvas visualizer provides immediate feedback, showing the frequency data of either the user's input or the model's output.

## 🛠️ Tools & Services
-   **React 19**: Modern UI framework for state and lifecycle management.
-   **Tailwind CSS**: Utility-first styling for a warm, premium aesthetic.
-   **@google/genai**: The official SDK for interacting with the Gemini Live API.
-   **Web Audio API**: Low-level audio processing and decoding.
-   **Google AI Studio**: Platform for API key management and model configuration.

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key with **Billing Enabled** (required for the Live API modality).

### Setup
1.  **Clone & Install**:
    ```bash
    npm install
    ```
2.  **Environment Variables**:
    Create a `.env` file or set the variable in your shell:
    ```bash
    API_KEY=your_gemini_api_key_here
    ```
3.  **Start Development Server**:
    ```bash
    npm start
    ```
4.  **Access**:
    Open `http://localhost:3000` (or the provided port).
    *Note: Microphone access usually requires HTTPS or `localhost` context.*

## 🧩 Key Features
-   **Barge-in Support**: The model stops speaking immediately if it detects the user has started talking.
-   **Gapless Audio**: Uses a custom scheduler to ensure smooth, human-like speech delivery.
-   **Montessori Personality**: Specifically tuned to be slow-paced and nurturing for families.



