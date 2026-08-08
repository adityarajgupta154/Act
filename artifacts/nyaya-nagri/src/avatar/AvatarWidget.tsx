import React, { useState, useEffect, useRef } from 'react';
import { useAvatarChat } from '@workspace/api-client-react';
import { progressStore } from '@/data/progressStore';
import { useUIStore, triggerHelpPulse } from '@/ui/uiStore';
import { getZone } from '@/world/zones';
import { Mic, MicOff, Send, X, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Animated SVG Avatar ---
function AvatarFace({ speaking }: { speaking: boolean }) {
  return (
    <div className={cn(
      "w-12 h-12 md:w-16 md:h-16 rounded-full bg-sky-100 flex items-center justify-center border-4 border-white shadow-md relative overflow-hidden",
      speaking ? "animate-bounce" : ""
    )}>
      {/* Hair / Head top */}
      <div className="absolute top-0 w-full h-1/3 bg-orange-400" />
      
      {/* Eyes */}
      <div className="absolute top-1/2 left-1/4 w-1.5 h-2 md:w-2 md:h-3 bg-slate-800 rounded-full animate-pulse" />
      <div className="absolute top-1/2 right-1/4 w-1.5 h-2 md:w-2 md:h-3 bg-slate-800 rounded-full animate-pulse" />
      
      {/* Mouth */}
      <div className={cn(
        "absolute bottom-1/4 bg-slate-800 rounded-full transition-all duration-150",
        speaking ? "w-4 h-4 md:w-5 md:h-5" : "w-3 h-1 md:w-4 md:h-1"
      )} />
    </div>
  );
}

// --- Main Chat Widget ---
type Message = { role: 'user' | 'assistant'; content: string; escalated?: boolean };

// Hard-coded, age-band-specific zone greetings (PRD §9.8: never AI-generated).
// Tone per Task 2 rules: 8-11 playful/simple, 12-15 older-sibling, 16-18 practical.
const ZONE_GREETINGS: Record<string, Record<string, string>> = {
  zone1: {
    '8-11':
      "Welcome to the Safe Zone! Here we learn one BIG rule: your body belongs to YOU. Let's play a story about saying no, telling a trusted grown-up, and staying safe. I'm right here if you have questions!",
    '12-15':
      "Welcome to the Safe Zone. This quest covers real stuff: consent, personal boundaries, and how to spot manipulation online before it traps you or a friend. There's a law on your side here called POCSO. Ready when you are.",
    '16-18':
      "Welcome to the Safe Zone. This quest gets practical about the POCSO Act: what counts as an offence, why a minor's consent isn't legally valid, how child-friendly reporting, identity protection, and Special Courts actually work, and how to support a friend who confides in you. Knowledge worth having.",
  },
  zone2: {
    '8-11':
      "Welcome to the Right to Childhood zone! Every child has the right to learn, play, and rest, and there is a law in India that protects that. Let's follow Meera's story about noticing a child who needed a friend. I'm here if you have questions!",
    '12-15':
      "Welcome to the Right to Childhood zone. This quest is about child labour: where the law draws the line between helping your family and work that steals someone's schooling and safety, and exactly who to inform when you spot it. Ready?",
    '16-18':
      "Welcome to the Right to Childhood zone. You're close to working age, so this one is practical: what jobs the law lets you take at 14-18, why hazardous work stays off-limits until 18, the hour and night-work rules employers owe you, and how it all protects your education. Useful stuff.",
  },
  zone3: {
    '8-11':
      "Welcome to the School Rights zone! Did you know every child aged 6 to 14 in India has the right to free elementary education? Government schools charge no fees, and no child can be turned away because of money. Let's follow Tara's story and see how the law keeps the school gate open. I'm here if you have questions!",
    '12-15':
      "Welcome to the School Rights zone. The RTE Act gives you rights you can actually stand on: free elementary education, the 25 percent entry-level quota in private schools, no expulsion before Class 8, and a ban on physical punishment and humiliation. Let's see what they mean in real life.",
    '16-18':
      "Welcome to the School Rights zone. You're past the RTE guarantee age, so this quest is about what changes after 14 and what doesn't: how education stays open, the protections every under-18 student keeps, and where a serious school grievance actually goes. Practical territory.",
  },
  zone4: {
    '8-11':
      "Welcome to the Justice System zone! Did you know India has special helpers whose whole job is keeping children safe? Let's follow Golu's story and meet Childline 1098 and the kind Child Welfare Committee. A child who needs help is never in trouble for asking. I'm here if you have questions!",
    '12-15':
      "Welcome to the Justice System zone. This quest walks you step by step down the protection path: who to call when a child needs protection, what the Child Welfare Committee actually does, where a child stays in the meantime, and why the plan always aims at family, never punishment. Let's walk it.",
    '16-18':
      "Welcome to the Justice System zone. This simulation covers both pathways of the Juvenile Justice Act: care and protection through the CWC, and what really happens when someone under 18 is accused of an offence — SJPU, the Juvenile Justice Board, and why the law is built for rehabilitation, not punishment. Worth knowing precisely.",
  },
  zone5: {
    '8-11':
      "Welcome to the Digital Safety zone! Screens are fun, but here is a secret: online, people are not always who they say they are. Let's follow Anu's story and learn the Rules of the Screen — what stays private, and who to tell if something feels wrong. I'm here if you have questions!",
    '12-15':
      "Welcome to the Digital Safety zone. This quest covers the real stuff: spotting cyberbullying and what actually helps, the grooming red flags that show up in DMs and games, and the tools on your side — block, report, trusted adults, the Cyber Crime Helpline 155260, and Childline 1098. Ready?",
    '16-18':
      "Welcome to the Digital Safety zone. This one is about digital consent and the law: why forwarding someone's private image can be an offence, how the rules protect everyone under 18, and the practical playbook for harassment and sextortion — records, platform grievance tools, the National Cyber Crime Reporting Portal, and 155260. Knowledge worth having.",
  },
};

export function AvatarWidget() {
  const { activeZoneId } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your guide here in Nyaya Nagri. I'm a computer friend, not a real person, but I'm here to help you learn about your rights. How can I help today?" }
  ]);
  const [input, setInput] = useState('');
  
  const [recording, setRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  
  const chatMutation = useAvatarChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Track previous zone to trigger greetings
  const prevZoneRef = useRef<string | null>(null);

  // Keep the active SpeechRecognition instance so we can actually stop it
  const recognitionRef = useRef<any>(null);

  // Privacy cleanup: hard-stop mic and speech when the panel closes or the
  // widget unmounts — recognition must never keep listening in the background.
  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
      setRecording(false);
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    }
    return () => {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
      window.speechSynthesis?.cancel();
    };
  }, [isOpen]);

  useEffect(() => {
    if (activeZoneId && activeZoneId !== prevZoneRef.current) {
      const zone = getZone(activeZoneId);
      if (zone) {
        setIsOpen(true);
        const greeting =
          ZONE_GREETINGS[activeZoneId]?.[progressStore.getState().ageBand] ??
          `Welcome to ${zone.name}! Here we'll learn about: ${zone.theme}.`;
        appendAssistantMessage(greeting);
      }
    }
    prevZoneRef.current = activeZoneId;
  }, [activeZoneId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // TTS Effect
  useEffect(() => {
    if (!ttsEnabled) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [ttsEnabled]);

  const speakText = (text: string) => {
    if (!ttsEnabled) return;
    window.speechSynthesis.cancel();
    
    // Strip out Markdown bold markers for speech
    const cleanText = text.replace(/\*\*/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const appendAssistantMessage = (content: string, escalated?: boolean) => {
    setMessages(prev => {
      const newMsgs = [...prev, { role: 'assistant', content, escalated } as Message];
      return newMsgs.slice(-8);
    });
    if (ttsEnabled) {
      speakText(content);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;
    
    const userText = input.trim();
    setInput('');
    
    setMessages(prev => {
      const newMsgs = [...prev, { role: 'user', content: userText } as Message];
      return newMsgs.slice(-8);
    });
    
    const history = messages
      .filter(m => !m.escalated) // Don't feed back system greeting/escalations usually, but we can pass all
      .map(m => ({ role: m.role, content: m.content }));
      
    try {
      const res = await chatMutation.mutateAsync({
        data: {
          message: userText.substring(0, 500),
          ageBand: progressStore.getState().ageBand,
          zoneId: activeZoneId || undefined,
          history: history.slice(-12)
        }
      });
      
      appendAssistantMessage(res.reply, res.escalated);
      
      if (res.escalated) {
        triggerHelpPulse();
      }
    } catch (error) {
      appendAssistantMessage("Your guide is taking a rest — try again in a moment.");
    }
  };

  const toggleRecording = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return; // Button is hidden when unsupported

    if (recording) {
      // Actually stop the engine, not just the UI state
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
      setRecording(false);
      return;
    }
    
    const recognition = new SpeechRec();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setRecording(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => {
      setRecording(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setRecording(false);
      recognitionRef.current = null;
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  // Keyboard safety: Stop WASD/E propagation to game controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); 
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Check if browser supports STT
  const SpeechRec = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className="pointer-events-auto flex flex-col items-end">
      {isOpen && (
        <div className="w-[90vw] md:w-96 max-w-sm bg-white rounded-3xl shadow-2xl mb-4 border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="bg-sky-50 px-4 py-3 border-b border-sky-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AvatarFace speaking={speaking} />
              <div>
                <h3 className="font-display font-bold text-slate-800 leading-tight">Your Guide</h3>
                <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">AI Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  ttsEnabled ? "bg-sky-200 text-sky-700" : "bg-white text-slate-400 hover:bg-slate-100"
                )}
                aria-label="Toggle voice"
              >
                {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white hover:bg-slate-100 text-slate-400 rounded-full transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 min-h-[250px] max-h-[40vh] overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex w-full",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "px-4 py-3 rounded-2xl max-w-[85%] text-[15px] font-medium leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-orange-500 text-white rounded-tr-sm" 
                    : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm"
                )}>
                  {msg.escalated ? (
                    <EscalatedMessage text={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex w-full justify-start">
                <div className="px-4 py-3 rounded-2xl bg-white border border-slate-100 text-slate-400 rounded-tl-sm shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-bold">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
              {!!SpeechRec && (
                <button
                  onClick={toggleRecording}
                  className={cn(
                    "p-2.5 rounded-full transition-colors shrink-0",
                    recording ? "bg-red-100 text-red-500 animate-pulse" : "bg-white text-slate-400 hover:text-sky-500 shadow-sm"
                  )}
                >
                  {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
              
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-2 text-[15px] font-medium text-slate-700 placeholder:text-slate-400 min-w-0"
                maxLength={500}
              />
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
                className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full transition-colors shrink-0 shadow-sm"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bubble Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white p-1 rounded-full shadow-xl border-[3px] border-orange-100 hover:border-orange-300 transition-all active:scale-95 animate-in zoom-in duration-300 touch-manipulation"
          aria-label="Open Guide"
        >
          <AvatarFace speaking={false} />
        </button>
      )}
    </div>
  );
}

// Special component to highlight emergency numbers
function EscalatedMessage({ text }: { text: string }) {
  // Simple regex to bold and highlight the specific numbers
  const parts = text.split(/(1098|155260)/g);
  
  return (
    <span>
      {parts.map((part, i) => {
        if (part === '1098' || part === '155260') {
          return <strong key={i} className="text-red-600 bg-red-50 px-1 rounded-md text-lg">{part}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
