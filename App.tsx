
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SYSTEM_PROMPT, ZIPPY_COLORS } from './constants';
import { SessionState } from './types';
import { encode, decode, decodeAudioData, float32ToInt16 } from './utils/audio';
import Visualizer from './components/Visualizer';

// Access window.aistudio for API key management
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.DISCONNECTED);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  // Hardware Refs
  const audioContextIn = useRef<AudioContext | null>(null);
  const audioContextOut = useRef<AudioContext | null>(null);
  const analyserIn = useRef<AnalyserNode | null>(null);
  const analyserOut = useRef<AnalyserNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Session Lifecycle Refs
  const isSessionActive = useRef(false);
  const activeSources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTime = useRef<number>(0);

  // Check if API key selection is required on mount
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setNeedsKey(!hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
      // Proceeding after selection assumes success as per instructions
    }
  };

  const cleanupSession = useCallback(() => {
    isSessionActive.current = false;
    
    // Stop all active audio playback
    activeSources.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    activeSources.current.clear();

    // Disconnect and cleanup mic processor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    // Close Audio contexts
    if (audioContextIn.current) {
      try { audioContextIn.current.close(); } catch (e) {}
      audioContextIn.current = null;
    }
    if (audioContextOut.current) {
      try { audioContextOut.current.close(); } catch (e) {}
      audioContextOut.current = null;
    }
    
    setSessionState(SessionState.DISCONNECTED);
    setIsTyping(false);
    nextStartTime.current = 0;
  }, []);

  useEffect(() => () => cleanupSession(), [cleanupSession]);

  const startConversation = async () => {
    try {
      setErrorMessage(null);
      
      // Mandatory: Check for API Key first
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        setNeedsKey(true);
        return;
      }

      setSessionState(SessionState.CONNECTING);

      // 1. Initialize Audio Hardware
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctxIn = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const ctxOut = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await ctxIn.resume();
      await ctxOut.resume();

      audioContextIn.current = ctxIn;
      audioContextOut.current = ctxOut;
      analyserIn.current = ctxIn.createAnalyser();
      analyserOut.current = ctxOut.createAnalyser();
      
      const micSource = ctxIn.createMediaStreamSource(stream);
      micSource.connect(analyserIn.current);

      // 2. Setup Script Processor (larger buffer for network stability)
      const scriptProcessor = ctxIn.createScriptProcessor(8192, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      // 3. Connect to Gemini Live (Always create new instance)
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log("Zippy Connected");
            setSessionState(SessionState.CONNECTED);
            isSessionActive.current = true;
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isSessionActive.current) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = float32ToInt16(inputData);
              const pcmBlob = {
                data: encode(new Uint8Array(pcmData.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              // Rely on sessionPromise resolve to prevent race condition
              sessionPromise.then((session) => {
                if (isSessionActive.current) {
                  session.sendRealtimeInput({ media: pcmBlob });
                }
              }).catch(() => {});
            };
            
            micSource.connect(scriptProcessor);
            scriptProcessor.connect(ctxIn.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!isSessionActive.current) return;

            // Handle model's spoken audio
            const audioChunk = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioChunk && audioContextOut.current) {
              setIsTyping(true);
              const ctx = audioContextOut.current;
              nextStartTime.current = Math.max(nextStartTime.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(audioChunk), ctx, 24000, 1);
              const sourceNode = ctx.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(analyserOut.current!);
              analyserOut.current!.connect(ctx.destination);
              
              sourceNode.onended = () => {
                activeSources.current.delete(sourceNode);
                if (activeSources.current.size === 0) setIsTyping(false);
              };
              
              sourceNode.start(nextStartTime.current);
              nextStartTime.current += audioBuffer.duration;
              activeSources.current.add(sourceNode);
            }

            // Handle interruptions (barge-in)
            if (message.serverContent?.interrupted) {
              activeSources.current.forEach(s => { try { s.stop(); } catch {} });
              activeSources.current.clear();
              nextStartTime.current = 0;
              setIsTyping(false);
            }
          },
          onerror: (e) => {
            console.error("Live Session Error:", e);
            const errStr = String(e);
            if (errStr.includes("Requested entity was not found")) {
              setNeedsKey(true);
            }
            setErrorMessage('Network error. Please check your connection and try again.');
            cleanupSession();
          },
          onclose: () => cleanupSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_PROMPT.trim(),
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });

      await sessionPromise;

    } catch (err) {
      console.error("Initialization Error:", err);
      setErrorMessage('Could not start Zippy. Ensure microphone access is allowed.');
      setSessionState(SessionState.DISCONNECTED);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-2xl mx-auto justify-between">
      <header className="text-center space-y-2 pt-8">
        <div className="w-24 h-24 zippy-gradient rounded-full mx-auto flex items-center justify-center shadow-lg mb-4 ring-4 ring-orange-100 ring-offset-4">
          <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-orange-600 tracking-tight">Zippy Assistant</h1>
        <p className="text-orange-400 font-medium">Screen-free Product Companion</p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="w-full h-48 flex items-center justify-center">
          <Visualizer 
            analyser={isTyping ? analyserOut.current : analyserIn.current} 
            isActive={sessionState === SessionState.CONNECTED}
            color={isTyping ? ZIPPY_COLORS.secondary : ZIPPY_COLORS.primary}
          />
        </div>
        <div className="text-center h-12">
          {sessionState === SessionState.CONNECTED && (
            <p className="text-orange-500 font-bold text-lg animate-pulse">
              {isTyping ? "Zippy is speaking..." : "Listening to you..."}
            </p>
          )}
        </div>
      </main>
      
      <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-orange-50 space-y-6 mb-8">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${sessionState === SessionState.CONNECTED ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sessionState}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] text-center border border-red-100 font-black uppercase tracking-tight">
            {errorMessage}
          </div>
        )}

        {needsKey ? (
          <div className="space-y-4">
            <p className="text-center text-xs text-orange-400 font-medium">
              A paid API key is required for voice features. 
              <br/><a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">View billing docs</a>
            </p>
            <button
              onClick={handleSelectKey}
              className="w-full bg-blue-500 text-white font-bold py-6 px-6 rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center space-x-4 text-xl"
            >
              <span>Select Paid API Key</span>
            </button>
          </div>
        ) : (
          <button
            onClick={sessionState === SessionState.DISCONNECTED ? startConversation : cleanupSession}
            disabled={sessionState === SessionState.CONNECTING}
            className={`w-full zippy-gradient text-white font-bold py-6 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-4 text-xl active:scale-95 disabled:opacity-50 ${
              sessionState !== SessionState.DISCONNECTED ? 'grayscale-[0.2]' : ''
            }`}
          >
            {sessionState === SessionState.DISCONNECTED ? (
              <>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>Start Speaking</span>
              </>
            ) : (
              <>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{sessionState === SessionState.CONNECTING ? 'Connecting...' : 'End Session'}</span>
              </>
            )}
          </button>
        )}
      </div>

      <footer className="text-center text-orange-200 text-[9px] pb-4 uppercase tracking-[0.4em] font-black opacity-60">
        Pure Voice Interface • Montessori Based
      </footer>
    </div>
  );
};

export default App;
