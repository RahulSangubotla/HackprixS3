import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Loader2, Mic, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage } from "@/lib/authClient";
import { toast } from "sonner";

interface Message {
  sender: "user" | "bot";
  text: string;
}

const AudioPulse = ({ active }: { active: boolean }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          animate={active ? {
            height: [8, 24, 8],
          } : { height: 8 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
          className="w-1.5 bg-primary rounded-full"
        />
      ))}
    </div>
  );
};

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Hi! I'm Helper Bot, your AI learning assistant. How can I help you today?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isVoiceMode]);

  useEffect(() => {
    if (isVoiceMode && isOpen) {
      setupSpeechRecognition();
    } else {
      stopSpeechRecognition();
      window.speechSynthesis.cancel();
    }
    return () => {
      stopSpeechRecognition();
      window.speechSynthesis.cancel();
    };
  }, [isVoiceMode, isOpen]);

  const setupSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in this browser.");
      setIsVoiceMode(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      // INTERRUPT: If user starts talking, stop the bot's current response
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsLoading(false);
      }

      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        const transcript = finalTranscript.trim();
        setMessages((prev) => [...prev, { sender: "user", text: transcript }]);
        handleSendMessage(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please enable it in browser settings.");
        setIsVoiceMode(false);
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      if (isVoiceMode && isOpen) {
        try { recognition.start(); } catch (e) {
          console.error("Failed to restart recognition:", e);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Initial recognition start failed:", e);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent restart loop
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    if (!textOverride) {
      setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
      setInputValue("");
    }
    setIsLoading(true);

    try {
      const history = messages.map((msg) => ({
        sender: msg.sender === "user" ? "user" : "bot",
        text: msg.text,
      }));

      const data = await sendChatMessage(userMessage, history);
      setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
      
      if (isVoiceMode) {
        speak(data.response);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(error.response?.data?.detail || "Failed to get response from AI");
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, I'm having trouble connecting right now. Please try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Pick a better voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      setIsLoading(true);
    };
    utterance.onend = () => {
      setIsLoading(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 origin-bottom-right"
          >
            <Card className="w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b bg-primary/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Helper Bot</h3>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[10px] text-muted-foreground">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsVoiceMode(!isVoiceMode)} 
                    className={`h-8 w-8 ${isVoiceMode ? "text-primary bg-primary/20" : ""}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isVoiceMode ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 bg-primary/5">
                   <div className="text-center space-y-2">
                     <h4 className="text-lg font-bold uppercase italic">Voice Mode</h4>
                     <p className="text-xs text-muted-foreground">
                       {isListening ? "Helper Bot is listening..." : "Connecting..."}
                     </p>
                     {isLoading && (
                       <p className="text-[10px] text-primary animate-pulse font-medium">Speaking... (Talk to interrupt)</p>
                     )}
                   </div>
                   
                   <div className="relative">
                      <div className={`absolute inset-0 bg-primary/20 rounded-full animate-ping ${isListening || isLoading ? "opacity-100" : "opacity-0"}`} />
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center relative z-10 transition-all shadow-glow ${isListening ? "bg-primary shadow-[0_0_50px_rgba(var(--primary),0.5)]" : "bg-muted"}`}>
                        {isLoading ? <Volume2 className="w-12 h-12 text-primary-foreground animate-bounce" /> : <Mic className="w-12 h-12 text-primary-foreground" />}
                      </div>
                   </div>

                   <AudioPulse active={isListening || isLoading} />

                   <div className="text-center max-w-[200px] py-4 bg-white/5 rounded-xl border border-white/10">
                     <p className="text-[10px] text-white/50 italic px-4">
                       "Explain photosynthesis in simple terms"
                     </p>
                   </div>

                   <Button variant="outline" onClick={() => setIsVoiceMode(false)} className="mt-4 border-primary/20 hover:bg-primary/10">
                     Switch to Text Mode
                   </Button>
                </div>
              ) : (
                <>
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/20"
                  >
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-muted text-foreground rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted p-3 rounded-2xl rounded-tl-none">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t bg-background">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button size="icon" onClick={() => handleSendMessage()} disabled={isLoading}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="chat-button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="origin-bottom-right"
          >
            <Button
              size="icon"
              className="w-16 h-16 rounded-full shadow-float gradient-neon animate-pulse-glow flex items-center justify-center p-0"
              onClick={() => setIsOpen(true)}
            >
              <Bot className="w-8 h-8 text-primary-foreground" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChatbot;