import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Loader2, Radio, Gamepad2, Play, MessageSquare } from "lucide-react";
import { generateQuizQuestions, api } from "@/lib/authClient";
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import SpatialCard from "@/components/SpatialCard";

const Lounge = () => {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [loadingSubject, setLoadingSubject] = useState<string | null>(null);
  const appStateListenerRef = useRef<PluginListenerHandle | null>(null);

  useEffect(() => {
    const processReward = async () => {
      const startTimeStr = localStorage.getItem("vrGameStartTime");
      const roomName = localStorage.getItem("vrGameRoomName");

      if (startTimeStr && roomName) {
        const startTime = parseInt(startTimeStr, 10);
        const duration = Math.round((Date.now() - startTime) / 1000);

        const MAX_SESSION_TIME = 7200; 
        if (duration > MAX_SESSION_TIME) {
          localStorage.removeItem("vrGameStartTime");
          localStorage.removeItem("vrGameRoomName");
          toast.error("VR Session expired. Join again to earn tokens.");
          return;
        }

        localStorage.removeItem("vrGameStartTime");
        localStorage.removeItem("vrGameRoomName");

        if (duration > 15) {
          try {
            toast.info(`Calculating rewards for your time in ${roomName}...`);
            const response = await api.post("/lectures/reward-time/", { duration });
            const { xp_awarded, tokens_awarded } = response.data;
            
            let rewardMessage = "You've been rewarded!";
            if (xp_awarded > 0 && tokens_awarded > 0) rewardMessage = `You earned ${xp_awarded} XP and ${tokens_awarded} EDU!`;
            else if (xp_awarded > 0) rewardMessage = `You earned ${xp_awarded} XP!`;
            else if (tokens_awarded > 0) rewardMessage = `You earned ${tokens_awarded} EDU!`;

            toast.success(rewardMessage);
            await fetchUser(); 
          } catch (error) {
            console.error("Failed to award time:", error);
            toast.error("Could not process your reward.");
          }
        }
      }
    };

    const setupListeners = async () => {
      appStateListenerRef.current = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) processReward();
      });
    };
    setupListeners();

    window.addEventListener("focus", processReward);

    return () => {
      appStateListenerRef.current?.remove();
      window.removeEventListener("focus", processReward);
    };
  }, [fetchUser]);

  const subjects = [
    { id: "Biology", name: "Life Sciences", icon: "🧬", color: "#34D399", players: 4 },
    { id: "Chemistry", name: "Atomic Lab", icon: "🧪", color: "#A855F7", players: 2 },
    { id: "Math", name: "Logic Arena", icon: "🔢", color: "#60A5FA", players: 7 },
  ];

  const handleEnterRoom = async (subjectId: string) => {
    try {
      setLoadingSubject(subjectId);
      const data = await generateQuizQuestions(subjectId);
      navigate(`/quiz-room/${subjectId}`, { state: { questions: data.questions } });
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      toast.error("AI Lab is busy. Please try again in a moment.");
    } finally {
      setLoadingSubject(null);
    }
  };

  const handleOpenVRKahoot = () => {
    localStorage.setItem("vrGameStartTime", Date.now().toString());
    localStorage.setItem("vrGameRoomName", "VR Kahoot");
    window.open("https://18.60.212.203:8080/", "_blank");
  };

  return (
    <div className="min-h-screen pt-32 pb-40 px-6 overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] tracking-[0.2em] font-bold mb-6 uppercase">
            Social Hub
          </span>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-gradient leading-none mb-4 uppercase italic">Student Lounge</h1>
          <p className="text-white/30 text-lg max-w-2xl mx-auto leading-relaxed mt-8 font-medium italic">       
            Connect with other scholars and participate in interactive quiz battles.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SpatialCard className="p-12 md:p-16 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-white/10 relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-12">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                      <Gamepad2 size={40} className="text-white" />
                    </div>
                  </div>

                  <h2 className="text-5xl font-black text-white mb-6 tracking-tight uppercase italic">VR Kahoot Battle</h2>
                  <p className="text-lg text-white/50 leading-relaxed mb-12 max-w-xl">
                    Join an immersive virtual reality space where knowledge becomes a competition. Face off against classmates in real-time quiz challenges.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-6">
                    <button
                      onClick={handleOpenVRKahoot}
                      className="px-10 py-6 rounded-2xl bg-white text-black font-black text-[12px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-[0_0_50px_rgba(255,255,255,0.2)] uppercase italic"
                    >
                      <Play size={18} fill="black" />
                      ENTER BATTLE ARENA
                    </button>
                    <button className="px-10 py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[12px] tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 uppercase italic">    
                      <MessageSquare size={18} />
                      VIEW SCOREBOARD
                    </button>
                  </div>
               </div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/10 blur-[120px] -z-10 group-hover:bg-indigo-500/20 transition-colors" />
            </SpatialCard>
          </motion.div>
        </div>

        {/* AI Quiz Section */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <Radio size={24} className="text-white/40" />
            <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">AI Quiz Arena</h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subjects.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <SpatialCard className={`h-full group cursor-pointer border-white/5 ${loadingSubject === s.id ? "opacity-50" : ""}`}>
                  <div onClick={() => !loadingSubject && handleEnterRoom(s.id)} className="h-full flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-2xl text-3xl">
                        {loadingSubject === s.id ? <Loader2 className="animate-spin w-8 h-8 text-white" /> : s.icon}
                      </div>
                      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-white/30 tracking-widest uppercase">
                        {s.players} Active
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-2 leading-tight uppercase italic">{s.name}</h3>
                    <div className="flex items-center gap-2 mt-auto pt-8 border-t border-white/5 text-white/20 group-hover:text-white transition-colors">
                      <Zap size={14} className="text-accent" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">+100 XP REWARD</span>
                    </div>
                  </div>
                </SpatialCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-600/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[70vw] h-[70vw] bg-purple-600/20 rounded-full blur-[140px]" />
      </div>
    </div>
  );
};

export default Lounge;
