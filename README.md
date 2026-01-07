# Zippy Product Assistant 

Zippy Assistant is a pure voice interface. The interaction is designed to mimic a natural human conversation. It uses high-fidelity audio processing to capture user intent and stream back helpful information about Zippy's Montessori-based product line.

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
- A Google Gemini API Key 

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
    

## 🧩 Key Features
-   **Barge-in Support**: The model stops speaking immediately if it detects the user has started talking.
-   **Gapless Audio**: Uses a custom scheduler to ensure smooth, human-like speech delivery.
-   **Montessori Personality**: Specifically tuned to be slow-paced and nurturing for families.



