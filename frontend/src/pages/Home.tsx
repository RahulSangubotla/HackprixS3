import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchWalletInfo } from "@/lib/authClient";
import { motion } from "framer-motion";
import SpatialCard from "@/components/SpatialCard";
import { useNavigate } from "react-router-dom";
import { 
  GraduationCap, Microscope, Atom, 
  Calculator, ArrowRight, Zap, Trophy, Wallet
} from "lucide-react";

type WalletInfo = {
  address: string | null;
  balance: number;
  symbol: string;
};

const SUBJECTS = [
  {
    id: "maths",
    name: "Mathematics",
    label: "Logic Arena",
    color: "#60A5FA",
    icon: Calculator,
    description: "Advanced calculus, algebra, and geometry.",
    stats: "15 Topics • 60 Modules",
  },
  {
    id: "physics",
    name: "Physics",
    label: "Physical World",
    color: "#A855F7",
    icon: Zap,
    description: "Laws of motion, energy, and the universe.",
    stats: "12 Topics • 45 Modules",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    label: "Atomic Lab",
    color: "#34D399",
    icon: Atom,
    description: "Molecular structures and chemical reactions.",
    stats: "10 Topics • 35 Modules",
  },
  {
    id: "anatomy",
    name: "Anatomy",
    label: "Life Sciences",
    color: "#F87171",
    icon: Microscope,
    description: "Explore living organisms and biological systems.",
    stats: "14 Topics • 50 Modules",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await fetchUser();
      const walletData = await fetchWalletInfo();
      setWalletInfo(walletData);
    };
    loadData();
  }, [fetchUser]);

  const xpTotal = user?.xp || 0;
  const level = Math.floor(xpTotal / 1000) || 0;
  const xpInLvl = xpTotal % 1000;
  const xpPct = Math.min(100, Math.max(0, xpInLvl / 10)) || 0;
  const streak = (user as any)?.streak ?? 0;
  const eduCoins = walletInfo && walletInfo.address ? walletInfo.balance : 0;

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-40 px-4 md:px-6 overflow-hidden relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 md:mb-20">
          <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[8px] md:text-[10px] tracking-[0.2em] font-bold mb-4 md:mb-6 uppercase">
            Academic Dashboard
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-gradient leading-[0.9] mb-8 md:mb-12 uppercase italic">GURUKUL</h1>

          {/* QUICK STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-4xl mx-auto mb-12 md:mb-16 text-center">  
            {[
              { label: "STREAK", val: `${streak} DAYS`, icon: Trophy, color: "text-amber-400" },
              { label: "LEVEL", val: `LVL ${level}`, icon: Zap, color: "text-purple-400" },
              { label: "XP PROGRESS", val: `${xpInLvl}/1000`, icon: GraduationCap, color: "text-blue-400" },  
              { label: "COINS", val: `${eduCoins} EDU`, icon: Wallet, color: "text-emerald-400" },
            ].map((stat, i) => (
              <div key={i} className="glass-panel p-4 md:p-6 rounded-[1.5rem] md:rounded-3xl border-white/5 group hover:bg-white/5 transition-all flex flex-col items-center">
                  <stat.icon size={14} className="md:w-4 md:h-4 text-white/20 group-hover:text-white transition-colors mb-2" />
                  <p className="text-[7px] md:text-[8px] font-black text-white/20 tracking-widest uppercase">{stat.label}</p>
                  <p className={`text-sm md:text-xl font-black ${stat.color}`}>{stat.val}</p>
              </div>
            ))}
          </div>

          {/* LEVEL PROGRESS BAR */}
          <div className="max-w-xl mx-auto mb-16 md:mb-20 px-2">
            <div className="flex justify-between items-end mb-3 md:mb-4 text-left">
               <span className="text-[8px] md:text-[10px] font-black text-white/20 tracking-widest uppercase">Level {level} Progress</span>
               <span className="text-[10px] md:text-xs font-black text-white/50">{Math.round(xpPct)}%</span>
            </div>
            <div className="h-1.5 md:h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              />
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
          <GraduationCap size={20} className="md:w-6 md:h-6 text-white/40" />
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">Your Subjects</h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {SUBJECTS.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <SpatialCard className="h-full group cursor-pointer border-white/5 p-6 md:p-8">
                <div onClick={() => navigate(`/subject/${s.id}`)} className="h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6 md:mb-8">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-2xl">
                      <s.icon size={24} className="md:w-8 md:h-8" style={{ color: s.color }} />
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[7px] md:text-[8px] font-black text-white/30 tracking-widest uppercase">{s.label}</div>
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-white mb-2 leading-tight uppercase italic">{s.name}</h3>
                  <p className="text-xs md:text-sm text-white/30 leading-relaxed flex-1">{s.description}</p>
                  <div className="pt-6 md:pt-8 border-t border-white/5 flex items-center justify-between mt-auto text-white/20 group-hover:text-white transition-colors">
                    <span className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase">{s.stats}</span>        
                    <ArrowRight size={16} className="md:w-[18px] md:h-[18px]" />
                  </div>
                </div>
              </SpatialCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
