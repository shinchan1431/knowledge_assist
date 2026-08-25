import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { SupportedLanguage } from '../types';

interface VoiceVisualizerProps {
  onTranscript: (text: string) => void;
  currentLanguage: SupportedLanguage;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
}

const LANG_CODE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
  ja: 'ja-JP',
  hi: 'hi-IN',
  zh: 'zh-CN',
  pt: 'pt-BR',
};

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  onTranscript,
  currentLanguage,
  isListening,
  setIsListening,
}) => {
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API availability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANG_CODE_MAP[currentLanguage] || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage(null);
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          currentInterim += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript);
        setInterimText('');
      } else {
        setInterimText(currentInterim);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone access denied. Please allow microphone permissions.');
      } else if (event.error === 'no-speech') {
        // Ignorable idle
      } else {
        setErrorMessage(`Voice recognition: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [currentLanguage, onTranscript, setIsListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setErrorMessage(null);
      setInterimText('');
      try {
        recognitionRef.current.lang = LANG_CODE_MAP[currentLanguage] || 'en-US';
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        id="voice-query-mic-btn"
        onClick={toggleListening}
        className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
          isListening 
            ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/30 ring-2 ring-rose-400' 
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
        }`}
        title={isListening ? 'Stop listening' : 'Ask using voice / speech input'}
      >
        {isListening ? (
          <Mic className="w-4 h-4 text-white animate-bounce" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Real-time Voice Waveform Overlay when listening */}
      {isListening && (
        <div className="absolute bottom-full left-0 mb-3 bg-slate-900 border border-rose-500/40 rounded-xl p-3 shadow-2xl z-40 w-72 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Listening ({LANG_CODE_MAP[currentLanguage]})...</span>
            </div>
            <button
              onClick={() => setIsListening(false)}
              className="text-[10px] text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          {/* Sound waves animation bars */}
          <div className="flex items-center justify-center gap-1 h-6 my-1">
            <span className="w-1 bg-rose-500 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3" />
            <span className="w-1 bg-rose-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-5" />
            <span className="w-1 bg-rose-500 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-6" />
            <span className="w-1 bg-rose-300 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-4" />
            <span className="w-1 bg-rose-500 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-5" />
            <span className="w-1 bg-rose-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3" />
          </div>

          {interimText && (
            <p className="text-xs text-slate-300 italic truncate bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
              "{interimText}"
            </p>
          )}
          <p className="text-[10px] text-slate-400 text-center mt-1">Speak clearly into your microphone</p>
        </div>
      )}

      {errorMessage && (
        <div className="absolute bottom-full left-0 mb-3 bg-red-950/90 border border-red-500/50 rounded-xl p-2.5 shadow-xl text-red-200 text-xs w-64 z-40 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-[10px] underline text-red-300 hover:text-red-100 mt-1 block"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
