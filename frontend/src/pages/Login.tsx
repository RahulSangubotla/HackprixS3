import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Eye, EyeOff, ShieldAlert, ArrowRight, User, Lock } from "lucide-react";
import { motion } from "framer-motion";
import SpatialCard from "@/components/SpatialCard";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch {
      setError("ADMISSION DENIED: INVALID CREDENTIALS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative bg-background">   
      {/* ── BACKGROUND DECOR ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-purple-600/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="text-center mb-12 md:mb-16">
           <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 md:w-20 md:h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-2xl backdrop-blur-xl"
           >
              <Lock size={32} className="text-white/40" />
           </motion.div>
           <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[8px] md:text-[10px] tracking-[0.2em] font-bold mb-4 md:mb-6 uppercase">
            Student Portal
          </span>
           <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gradient leading-none mb-4 uppercase italic">GURUKUL LOGIN</h1>
           <p className="text-white/30 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">Student Authorization Required</p>
        </div>

        <SpatialCard className="bg-white/[0.02] border-white/5 p-8 md:p-12 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-white/30 mb-3 block uppercase tracking-widest">Student Identifier</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                      <User size={18} />
                   </div>
                   <input
                    type="text"
                    required
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-white transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-white/30 mb-3 block uppercase tracking-widest">Security Key</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full py-4 pl-12 pr-12 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-white transition-all placeholder:text-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"      
              >
                <ShieldAlert className="text-red-500 shrink-0" size={18} />
                <p className="text-[10px] font-bold text-red-400 leading-tight uppercase tracking-widest">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-white text-black font-black text-[12px] tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 uppercase italic"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  ENTER CAMPUS
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center">
            <p className="text-xs font-medium text-white/20 mb-4 tracking-wide italic">New to the ecosystem?</p>       
            <Link to="/register" className="text-[10px] font-black text-white hover:underline uppercase tracking-[0.2em]">
              ENROL AS A NEW STUDENT
            </Link>
          </div>
        </SpatialCard>
      </motion.div>
    </div>
  );
}
