import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Send, 
  Sparkles, 
  Waves, 
  Info
} from 'lucide-react';
import { WaterloggingIncident, WeatherData, RiverGateSystemData, EmergencyContact } from '../types';
import { rimeService } from '../utils/rimeService';
import { processVoiceQuery, AssistantResponse, detectQueryLanguage } from '../utils/voiceAssistantEngine';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn' | 'hi';
  incidents: WaterloggingIncident[];
  weather: WeatherData;
  riverGates: RiverGateSystemData | null;
  emergencyContacts: EmergencyContact[];
  userLocation?: {
    lat: number;
    lng: number;
    areaName?: string;
    areaNameBn?: string;
    areaNameHi?: string;
  };
  onNavigateTab: (tab: string) => void;
  onOpenSOS: () => void;
  onOpenHelplines: () => void;
  onOpenReport: () => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  spokenText?: string;
  timestamp: string;
  action?: 'open_map' | 'open_safe_route' | 'open_sos' | 'open_helplines' | 'open_weather' | 'open_report' | 'none';
  actionLabel?: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  lang: appLang,
  incidents,
  weather,
  riverGates,
  emergencyContacts,
  userLocation,
  onNavigateTab,
  onOpenSOS,
  onOpenHelplines,
  onOpenReport
}) => {
  // Assistant language state (user can toggle among Bengali, Hindi, and English)
  const [activeLang, setActiveLang] = useState<'en' | 'bn' | 'hi'>(appLang);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync with appLang on mount or change
  useEffect(() => {
    setActiveLang(appLang);
  }, [appLang]);

  // Auto-scroll chat messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isSpeaking, isListening]);

  // Initial welcome greeting when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialResponse = processVoiceQuery('hello', {
        lang: activeLang,
        incidents,
        weather,
        riverGates,
        emergencyContacts,
        userLocation
      });

      const welcomeMsg: MessageItem = {
        id: 'msg-welcome',
        sender: 'assistant',
        text: initialResponse.displayText,
        spokenText: initialResponse.spokenText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: initialResponse.suggestedAction,
        actionLabel: initialResponse.actionLabel
      };

      setMessages([welcomeMsg]);
      handleSpeak(initialResponse.spokenText, activeLang);
    }
  }, [isOpen]);

  // Stop speech playback on close
  useEffect(() => {
    if (!isOpen) {
      rimeService.stop();
      setIsSpeaking(false);
      stopListening();
    }
  }, [isOpen]);

  const handleSpeak = async (text: string, langToSpeak: 'en' | 'bn' | 'hi') => {
    rimeService.stop();
    setIsSpeaking(true);

    try {
      await rimeService.speak(text, langToSpeak, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    } catch {
      setIsSpeaking(false);
    }
  };

  const handleStopSpeaking = () => {
    rimeService.stop();
    setIsSpeaking(false);
  };

  const handleExecuteAction = (action?: string) => {
    if (!action || action === 'none') return;
    onClose();
    switch (action) {
      case 'open_map':
        onNavigateTab('map');
        break;
      case 'open_safe_route':
        onNavigateTab('safeRoute');
        break;
      case 'open_weather':
        onNavigateTab('weather');
        break;
      case 'open_sos':
        onOpenSOS();
        break;
      case 'open_helplines':
        onOpenHelplines();
        break;
      case 'open_report':
        onOpenReport();
        break;
      default:
        break;
    }
  };

  const handleSendQuery = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    // Detect language of query or fallback to activeLang
    const detectedLang = detectQueryLanguage(trimmed, activeLang);

    // 1. Add user message
    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 2. Generate assistant response
    const response: AssistantResponse = processVoiceQuery(trimmed, {
      lang: detectedLang,
      incidents,
      weather,
      riverGates,
      emergencyContacts,
      userLocation
    });

    const assistantMsg: MessageItem = {
      id: `assistant-${Date.now()}`,
      sender: 'assistant',
      text: response.displayText,
      spokenText: response.spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: response.suggestedAction,
      actionLabel: response.actionLabel
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInputText('');

    // 3. Synthesize and speak response
    handleSpeak(response.spokenText, response.lang);
  };

  // Speech Recognition (STT) setup supporting Bengali, Hindi, and English
  const startListening = useCallback(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert(
        activeLang === 'bn' 
          ? 'আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থিত নয়। দয়া করে টাইপ করুন।' 
          : activeLang === 'hi'
          ? 'आपके ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। कृपया टाइप करें।'
          : 'Speech recognition is not supported in this browser. Please type your query.'
      );
      return;
    }

    try {
      rimeService.stop();
      setIsSpeaking(false);

      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      // Bengali: bn-IN, Hindi: hi-IN, English: en-IN
      recognition.lang = activeLang === 'bn' ? 'bn-IN' : activeLang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendQuery(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setIsListening(false);
    }
  }, [activeLang, incidents, weather, riverGates, emergencyContacts, userLocation]);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isOpen) return null;

  // Preset quick prompt suggestions in Bengali, Hindi, and English
  const quickPrompts = activeLang === 'bn' ? [
    { label: '🌊 হুগলি নদীর গেট কি খোলা?', query: 'হুগলি নদীর লক গেট কি খোলা আছে?' },
    { label: '🚨 জলমগ্ন এলাকার তালিকা', query: 'কলকাতায় কোথায় জল জমেছে?' },
    { label: '📞 কেএমসি হেল্পলাইন নম্বর', query: 'কেএমসি হেল্পলাইন কন্ট্রোল রুম নম্বর কত?' },
    { label: '🌧️ আজকের বৃষ্টির সম্ভাবনা', query: 'আজকে কি ভারী বৃষ্টি হবে?' },
    { label: '🧭 নিরাপদ বিকল্প পথ', query: 'নিরাপদ পথ কীভাবে পাব?' },
    { label: '⚠️ জরুরি এসওএস সাহায্য', query: 'আমি জরুরি বিপদে পড়েছি সাহায্য চাই' }
  ] : activeLang === 'hi' ? [
    { label: '🌊 क्या हुगली नदी गेट खुले हैं?', query: 'क्या हुगली नदी के लॉक गेट खुले हैं?' },
    { label: '🚨 जलभराव वाली सड़कें', query: 'कोलकाता में कहाँ जलभराव है?' },
    { label: '📞 केएमसी हेल्पलाइन नंबर', query: 'केएमसी जल निकासी हेल्पलाइन नंबर क्या है?' },
    { label: '🌧️ आज बारिश का पूर्वानुमान', query: 'क्या आज कोलकाता में भारी बारिश होगी?' },
    { label: '🧭 सुरक्षित वैकल्पिक मार्ग', query: 'जलभराव से बचकर सुरक्षित रास्ता कैसे मिलेगा?' },
    { label: '⚠️ आपातकालीन एसओएस सहायता', query: 'मैं आपातकाल में फंसा हूँ मुझे मदद चाहिए' }
  ] : [
    { label: '🌊 Are Hooghly gates open?', query: 'Are the Hooghly river lock gates open or closed?' },
    { label: '🚨 Flooded roads list', query: 'Which roads in Kolkata are waterlogged?' },
    { label: '📞 KMC Helpline numbers', query: 'What is the KMC emergency flood helpline number?' },
    { label: '🌧️ Rain forecast today', query: 'Will it rain heavily in Kolkata today?' },
    { label: '🧭 Safe alternative route', query: 'How do I find a safe route avoiding floods?' },
    { label: '⚠️ Emergency SOS Help', query: 'I am trapped in flood water and need emergency help' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="voice-assistant-dialog"
        className="w-full max-w-xl bg-[#081226] border border-blue-900/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#050b17] border-b border-blue-900/30 p-3.5 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/35 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              {isSpeaking && (
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#050b17] animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {activeLang === 'bn' 
                    ? 'ভয়েস অ্যাসিস্ট্যান্ট' 
                    : activeLang === 'hi'
                    ? 'आवाज़ सहायक'
                    : 'Voice Assistant'}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 border bg-blue-950 text-blue-300 border-blue-700/40">
                  <Waves className="w-2.5 h-2.5" />
                  <span>
                    {activeLang === 'bn' 
                      ? 'ভয়েস অডিও' 
                      : activeLang === 'hi' 
                      ? 'आवाज़ ऑडियो' 
                      : 'Voice Audio'}
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeLang === 'bn' 
                  ? 'বাংলা, हिन्दी ও ইংরেজিতে কথা বলুন' 
                  : activeLang === 'hi'
                  ? 'हिंदी, বাংলা और English में बात करें'
                  : 'Voice assistance in Bengali, Hindi & English'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher in Voice Assistant */}
            <div className="flex rounded-lg bg-[#040813] p-0.5 border border-blue-900/35">
              <button
                id="voice-lang-bn"
                onClick={() => {
                  setActiveLang('bn');
                  rimeService.stop();
                  setIsSpeaking(false);
                }}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeLang === 'bn'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                বাংলা
              </button>
              <button
                id="voice-lang-hi"
                onClick={() => {
                  setActiveLang('hi');
                  rimeService.stop();
                  setIsSpeaking(false);
                }}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeLang === 'hi'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                id="voice-lang-en"
                onClick={() => {
                  setActiveLang('en');
                  rimeService.stop();
                  setIsSpeaking(false);
                }}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeLang === 'en'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Close Button */}
            <button
              id="voice-assistant-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#040813] hover:bg-slate-800 text-slate-400 hover:text-white border border-blue-900/35 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat / Transcript Area */}
        <div 
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[360px] bg-[#060c19]"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-[#0a162d] text-slate-200 border border-blue-900/35 rounded-tl-none'
                }`}
              >
                <p>{msg.text}</p>

                {/* Suggested Action Button inside response */}
                {msg.sender === 'assistant' && msg.action && msg.action !== 'none' && (
                  <div className="mt-2.5 pt-2 border-t border-blue-900/30">
                    <button
                      onClick={() => handleExecuteAction(msg.action)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/40 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>{msg.actionLabel || 'View Action'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message metadata & speech replay button */}
              <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-500">
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && msg.spokenText && (
                  <button
                    onClick={() => handleSpeak(msg.spokenText!, activeLang)}
                    title="Replay Voice"
                    className="hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>
                      {activeLang === 'bn' ? 'শুনুন' : activeLang === 'hi' ? 'सुनें' : 'Replay'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Real-time Listening indicator inside chat */}
          {isListening && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-950/60 border border-blue-700/40 text-xs text-blue-300">
              <Mic className="w-4 h-4 text-blue-400" />
              <span>
                {activeLang === 'bn' 
                  ? 'শুনছি... আপনার প্রশ্ন বা কথা বলুন...' 
                  : activeLang === 'hi'
                  ? 'सुन रहे हैं... कृपया अपना सवाल या आपातकाल बोलें...'
                  : 'Listening... Please speak your question...'}
              </span>
            </div>
          )}

          {isSpeaking && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a162d] border border-blue-900/40 text-xs text-blue-300">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-400" />
                <span className="font-medium">
                  {activeLang === 'bn' 
                    ? 'ভয়েস বলছে...' 
                    : activeLang === 'hi'
                    ? 'आवाज़ बोल रही है...'
                    : 'Speaking...'}
                </span>
              </div>
              <button
                onClick={handleStopSpeaking}
                className="px-2 py-0.5 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 text-[11px] font-semibold border border-blue-700/40 cursor-pointer"
              >
                {activeLang === 'bn' ? 'থামুন' : activeLang === 'hi' ? 'रोकें' : 'Stop'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3.5 py-2 bg-[#040813] border-t border-blue-900/30 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">
            {activeLang === 'bn' ? 'দ্রুত প্রশ্ন:' : activeLang === 'hi' ? 'त्वरित सवाल:' : 'Quick:'}
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(p.query)}
              className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-[#081226] hover:bg-blue-950 text-slate-300 hover:text-white border border-blue-900/35 whitespace-nowrap transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar with Large Mic Button */}
        <div className="p-3 sm:p-3.5 bg-[#050b17] border-t border-blue-900/30 flex items-center gap-2">
          {/* Main Voice Microphone Trigger Button */}
          <button
            id="voice-mic-main-btn"
            onClick={handleToggleListening}
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm ${
              isListening
                ? 'bg-rose-600 text-white ring-2 ring-rose-500/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
            title={
              isListening 
                ? 'Stop Listening' 
                : activeLang === 'bn'
                ? 'বাংলায় কথা বলতে ট্যাপ করুন'
                : activeLang === 'hi'
                ? 'हिंदी में बोलने के लिए टैप करें'
                : 'Tap to speak in English, Bengali or Hindi'
            }
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input for Typing */}
          <div className="flex-1 relative">
            <input
              id="voice-text-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendQuery(inputText);
                }
              }}
              placeholder={
                activeLang === 'bn'
                  ? 'মুখে বলুন বা বাংলায় প্রশ্ন লিখুন...'
                  : activeLang === 'hi'
                  ? 'बोलें या हिंदी में सवाल लिखें...'
                  : 'Speak or type your question in English, Bengali or Hindi...'
              }
              className="w-full bg-[#040813] border border-blue-900/35 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pr-10"
            />
            {inputText.trim() && (
              <button
                id="voice-send-btn"
                onClick={() => handleSendQuery(inputText)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Audio Mute/Stop Button */}
          {isSpeaking && (
            <button
              onClick={handleStopSpeaking}
              className="p-2.5 rounded-xl bg-[#040813] hover:bg-slate-800 text-rose-400 border border-blue-900/35 transition-colors"
              title="Stop Speaking"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-4 py-1.5 bg-[#03060c] border-t border-blue-950 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <Info className="w-3 h-3 text-blue-400 shrink-0" />
          <span>
            {activeLang === 'bn'
              ? 'হুগলি নদী গেট, জলমগ্ন রাস্তা ও জরুরি উদ্ধার নির্দেশিকার জন্য সহায়ক।'
              : activeLang === 'hi'
              ? 'हुगली नदी गेट, जलभराव वाली सड़कें एवं आपातकालीन बचाव मार्गदर्शन के लिए सहायक।'
              : 'Voice assistance for Hooghly river gates, road inundation, and emergency protocols.'}
          </span>
        </div>
      </div>
    </div>
  );
};
