import { useEffect, useRef } from "react";
import { Zap, Users, Play, Info, ShieldCheck, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/authClient";
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import SpatialCard from "@/components/SpatialCard";

const VR_ROOMS = [
  { id: 2, name: "VR Classroom", subject: "GENERAL", desc: "Join a live virtual classroom session.", players: 7, max: 30, color: "#FBBF24" },
  { id: 3, name: "Cell City Siege", subject: "BIOLOGY", desc: "Battle viruses inside a 3D living cell.", players: 12, max: 20, color: "#34D399" },
  { id: 4, name: "Molecule Builder", subject: "CHEMISTRY", desc: "Construct 3D molecules in VR space.", players: 8, max: 15, color: "#60A5FA" },
  { id: 5, name: "Anatomy VR Lab", subject: "BIOLOGY", desc: "Explore the human body in immersive 3D.", players: 10, max: 20, color: "#F87171" },
];

const URLS: Record<string, string> = {
  "Cell City Siege": "https://blood-game-c44cb.web.app/",
  "Molecule Builder": "https://molecule-builder-911c7.web.app/",
  "Anatomy VR Lab": "https://my-anatomy-vr-2026.web.app/",
  "VR Classroom": "https://dclassroom-d128d.web.app/",
};

export default function Playground() {
  const { fetchUser } = useAuth();
  const listenerRef = useRef<PluginListenerHandle | null>(null);

  useEffect(() => {
    const processReward = async () => {
      const startStr = localStorage.getItem("vrGameStartTime");
      const roomName = localStorage.getItem("vrGameRoomName");
      if (!startStr || !roomName) return;
      const duration = Math.round((Date.now() - parseInt(startStr, 10)) / 1000);
      localStorage.removeItem("vrGameStartTime");
      localStorage.removeItem("vrGameRoomName");
      if (duration > 7200) {
        toast.error("VR session expired.");
        return;
      }
      if (duration <= 15) return;
      try {
        const { data } = await api.post("/lectures/reward-time/", { duration });
        const { xp_awarded, tokens_awarded } = data;
        if (xp_awarded > 0 && tokens_awarded > 0) toast.success(`+${xp_awarded} XP  +${tokens_awarded} EDU!`);  
        else if (xp_awarded > 0) toast.success(`+${xp_awarded} XP!`);
        else if (tokens_awarded > 0) toast.success(`+${tokens_awarded} EDU!`);
        await fetchUser();
      } catch {
        toast.error("Could not process reward.");
      }
    };
    (async () => {
      listenerRef.current = await App.addListener("appStateChange", ({ isActive }) => { if (isActive) processReward(); });
    })();
    window.addEventListener("focus", processReward);
    return () => {
      listenerRef.current?.remove();
      window.removeEventListener("focus", processReward);
    };
  }, [fetchUser]);

  const handleJoin = async (room: any) => {
    localStorage.setItem("vrGameStartTime", Date.now().toString());
    localStorage.setItem("vrGameRoomName", room.name);
    const url = URLS[room.name];
    if (url) {
      try { await Browser.open({ url }); } catch (e) { window.open(url, '_blank'); }
    }
  };

  const totalOnline = VR_ROOMS.reduce((s, r) => s + r.players, 0);

  return (
    <div className="min-h-screen">
      <section className="pt-24 md:pt-32 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">       
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[8px] md:text-[10px] tracking-[0.2em] font-bold mb-4 uppercase">Virtual Arena</span>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter text-gradient leading-[0.9] uppercase italic">Playground</h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 md:gap-6">
            <div className="glass-panel px-6 py-3 md:px-8 md:py-4 rounded-[1.5rem] md:rounded-[2rem] text-right">
              <p className="text-[8px] md:text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1">Active Players</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-3xl font-black text-white">{totalOnline}</span>
                <span className="text-[10px] md:text-xs font-bold text-white/30 uppercase">In-Game</span>
              </div>
            </div>
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
              <Gamepad2 size={20} className="md:w-6 md:h-6" />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-40">
        <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
          <ShieldCheck size={18} className="md:w-5 md:h-5 text-white/40" />
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase italic">Available VR Suites</h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {VR_ROOMS.map((room, i) => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <SpatialCard className="h-full flex flex-col group p-6 md:p-8">
                <div className="flex justify-between items-start mb-6 md:mb-8">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <Zap size={18} className="md:w-5 md:h-5" style={{ color: room.color }} />
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] md:text-[8px] font-black text-white/20 tracking-widest uppercase mb-1">Subject</p>
                    <p className="text-[10px] md:text-xs font-black uppercase" style={{ color: room.color }}>{room.subject}</p>
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight group-hover:translate-x-1 transition-transform uppercase italic">{room.name}</h3>
                <p className="text-xs md:text-sm text-white/40 leading-relaxed mb-8 md:mb-10">{room.desc}</p>
                <div className="mt-auto space-y-4 md:space-y-6">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={12} className="md:w-3.5 md:h-3.5 text-white/20" />
                      <span className="text-[8px] md:text-[10px] font-bold text-white/30 tracking-widest uppercase">CAPACITY</span>
                    </div>
                    <span className="text-[10px] md:text-sm font-black text-white">{room.players}/{room.max}</span>
                  </div>
                  <div className="h-1 md:h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${(room.players/room.max)*100}%` }} transition={{ duration: 1, ease: "circOut" }} style={{ backgroundColor: room.color }} className="h-full rounded-full" />
                  </div>
                  <button onClick={() => handleJoin(room)} className="w-full py-4 md:py-5 rounded-2xl bg-white text-black font-black text-[10px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 md:gap-3 mt-4 shadow-[0_0_30px_rgba(255,255,255,0.1)] uppercase italic">
                    <Play size={14} className="md:w-4 md:h-4" fill="black" /> ENTER ROOM
                  </button>
                </div>
              </SpatialCard>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="mt-16 md:mt-20 p-6 md:p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-start gap-4 md:gap-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Info size={18} className="md:w-5 md:h-5 text-white/20" />
          </div>
          <div>
            <h4 className="text-base md:text-lg font-black text-white/80 mb-2 uppercase italic">Arena Guidelines</h4>
            <p className="text-xs md:text-sm text-white/30 leading-relaxed max-w-3xl">Academic gaming sessions are limited to 2 hours of continuous simulation. Rewards are calculated based on active engagement. Ensure your neural link (VR Headset) is properly calibrated before entering the immersive suites.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
