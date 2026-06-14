import { useState, useEffect, useRef } from "react";
import { LogOut, Settings, X, User as UserIcon, ShieldCheck, Mail, Phone, School, Award, ChevronRight, Camera, Zap, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchWalletInfo, fetchRedemptionHistory, fetchScholarObservations } from "@/lib/authClient";
import type { Redemption } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import SpatialCard from "@/components/SpatialCard";
import { uploadToCloudinary } from "@/lib/cloudinary";

type WalletInfo = { address: string | null; balance: number; symbol: string };

export default function Profile() {
  const { user, fetchUser, updateUserProfile, logout, loading } = useAuth();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [orders, setOrders] = useState<Redemption[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ username: "", bio: "", mobile_number: "", wallet_address: "", private_key: "" });
  const [observations, setObservations] = useState<string[]>([]);
  const [obsLoading, setObsLoading] = useState(false);
  const [obsError, setObsError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        await fetchUser();
      }
    };
    init();
  }, [fetchUser, user]);

  useEffect(() => {
    const getWalletAndOrders = async () => {
      if (user) {
        try {
          const [w, o] = await Promise.all([
            fetchWalletInfo(),
            fetchRedemptionHistory().catch(() => []),
          ]);
          setWallet(w);
          setOrders(o || []);
        } catch (e) {
          console.error("Wallet fetch failed");
        }
      }
    };
    getWalletAndOrders();
  }, [user]);

  useEffect(() => {
    if (user) setForm({
      username: user.username || "",
      bio: user.bio || "",
      mobile_number: user.mobile_number || "",
      wallet_address: user.wallet_address || "",
      private_key: (user as any).private_key || ""
    });
  }, [user]);

  useEffect(() => {
    if (!user || observations.length > 0) return;
    setObsLoading(true);
    setObsError(null);
    fetchScholarObservations()
      .then((obs) => setObservations(obs))
      .catch(() => setObsError("Failed to generate observations. Check your Gemini API key."))
      .finally(() => setObsLoading(false));
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await uploadToCloudinary(file);
        await updateUserProfile({ profile_image: imageUrl });
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(form);
    setEditOpen(false);
  };

  if (!user && loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-t-2 border-white/20 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-white/30 tracking-[0.4em]">AUTHENTICATING...</p>
      </div>
    </div>
  );

  if (!user) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white/20 uppercase tracking-[0.5em] font-black italic">Access Denied</div>;

  const level = Math.floor((user?.xp || 0) / 1000) || 0;
  const xpPct = ((user?.xp || 0) % 1000) / 10;

  return (
    <div className="min-h-screen">
      <section className="pt-24 md:pt-32 pb-16 px-6 relative overflow-hidden">
        {/* DECORATIVE BACKGROUND */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div animate={{ opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-white/10 to-transparent blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center mb-16 md:mb-24">       
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[8px] md:text-[10px] tracking-[0.2em] font-black mb-6 md:mb-8 uppercase">Student Management</span>
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-gradient leading-[0.85] uppercase italic mb-8">Student Locker</h1>
            <p className="text-white/30 text-[10px] md:text-xs font-black tracking-[0.3em] uppercase">Secure Personal Records & Digital Assets</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-40 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-5">
            <SpatialCard className="p-0 overflow-hidden bg-white/[0.02] border-white/5">
              <div className="p-8 md:p-10 pb-12 bg-gradient-to-br from-white/[0.05] to-transparent">
                <div className="flex justify-between items-start mb-12">
                  <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-white/40 tracking-widest uppercase">CLASS OF 2026</div>
                  <ShieldCheck size={24} className="text-white/20" />
                </div>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 text-center md:text-left">
                  <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-2 border-white/5 group-hover:border-white/20 transition-all duration-700 shadow-2xl">
                      <img src={user?.profile_image || "/placeholder.svg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    </div>
                    <div className="absolute inset-0 bg-black/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 backdrop-blur-sm">
                      <Camera size={28} className="text-white scale-75 group-hover:scale-100 transition-transform" />
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                  <div className="flex-1 pt-4">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 uppercase italic group-hover:text-gradient transition-all">{user?.username || "Scholar"}</h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/30 tracking-widest uppercase italic">
                      <Zap size={10} className="text-amber-400" />
                      {user?.role || "Scholar"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-12">
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                    <p className="text-[9px] font-black text-white/20 tracking-widest uppercase mb-2">Current Level</p>
                    <p className="text-4xl md:text-5xl font-black text-white italic">{level}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-right">
                    <p className="text-[9px] font-black text-white/20 tracking-widest uppercase mb-2">Edu Coins</p>
                    <p className="text-4xl md:text-5xl font-black text-white italic">{wallet?.balance ?? 0}</p>
                  </div>       
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end px-2">
                    <span className="text-[9px] font-black text-white/30 tracking-widest uppercase">Academic Experience</span>
                    <span className="text-[10px] font-black text-white/60 tracking-widest">{user?.xp ?? 0} / 1000 XP</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 2, ease: "circOut" }} className="h-full bg-white rounded-full shadow-[0_0_25px_rgba(255,255,255,0.4)]" />  
                  </div>
                </div>
              </div>
              <div className="p-8 flex gap-4 bg-white/[0.01]">
                <button onClick={() => setEditOpen(true)} className="flex-1 py-5 rounded-2xl bg-white text-black font-black text-[10px] tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase italic shadow-xl">EDIT RECORDS</button>
                <button onClick={logout} className="px-6 py-5 rounded-2xl bg-white/5 border border-white/10 text-white/30 font-black text-[10px] tracking-widest hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/20 transition-all duration-500 shadow-lg"><LogOut size={20} /></button>
              </div>
            </SpatialCard>
          </motion.div>

          <div className="lg:col-span-7 space-y-16 pt-4">
            <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30"><Award size={20} /></div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">Verified Assets</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                {wallet?.address ? (
                  <div className="space-y-10">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500"><Award size={24} className="text-white/40" /></div>
                        <div>
                          <p className="text-[9px] font-black text-white/20 tracking-widest uppercase mb-1">Authenticated Balance</p>
                          <p className="text-3xl font-black text-white italic">{wallet?.balance} {wallet?.symbol}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/10 group-hover:text-white/40 transition-colors"><ChevronRight className="group-hover:translate-x-1 transition-transform" /></div>
                    </div>
                    <div className="pt-10 border-t border-white/5">
                      <p className="text-[9px] font-black text-white/20 tracking-widest uppercase mb-4">Blockchain Identifier (ERC-20)</p>
                      <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 group-hover:bg-white/[0.03] transition-colors">
                        <p className="text-xs font-mono text-white/40 break-all leading-relaxed tracking-wider">{wallet?.address}</p>
                      </div>     
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <ShieldCheck size={40} className="text-white/5 mx-auto mb-6" />
                    <p className="text-white/20 font-black text-[10px] tracking-[0.3em] uppercase italic">No secure chip detected in locker.</p> 
                  </div>
                )}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30"><UserIcon size={20} /></div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">Metadata Records</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Identity Email", value: user?.email || "N/A", icon: Mail },
                  { label: "Communication", value: user?.mobile_number || "Not assigned", icon: Phone },
                  { label: "Base Institution", value: user?.institution_name || "GURUKUL Central", icon: School }, 
                  { label: "Lifetime XP", value: `${user?.xp ?? 0} TOTAL EXPERIENCE`, icon: Zap },
                ].map((item, i) => (
                  <div key={i} className="glass-panel p-6 md:p-8 rounded-[2rem] flex items-center gap-6 border border-white/5 group hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500">
                     <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white/20 group-hover:text-white/60 flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg"><item.icon size={20} /></div>
                     <div className="flex-1 min-w-0">
                       <p className="text-[9px] font-black text-white/20 tracking-widest uppercase mb-2">{item.label}</p>
                       <p className="text-sm font-black text-white/60 truncate uppercase italic tracking-wide group-hover:text-white transition-colors">{item.value}</p>
                     </div>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30"><Settings size={20} /></div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">Scholar Observations</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <span className="text-[9px] font-black text-white/20 tracking-widest uppercase border border-white/10 px-2 py-1 rounded-lg">AI Generated</span>
              </div>
              <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] relative border-white/5">
                {obsLoading && (
                  <div className="space-y-5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start gap-5 animate-pulse">
                        <div className="w-7 h-7 rounded-full bg-white/5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-white/5 rounded-full w-full" />
                          <div className="h-3 bg-white/5 rounded-full w-4/5" />
                        </div>
                      </div>
                    ))}
                    <p className="text-[9px] font-black text-white/20 tracking-[0.3em] uppercase text-center pt-4">Analyzing academic profile...</p>
                  </div>
                )}
                {obsError && !obsLoading && observations.length === 0 && (
                  <p className="text-red-400/60 font-black text-[10px] tracking-widest uppercase text-center py-6">{obsError}</p>
                )}
                {!obsLoading && !obsError && observations.length === 0 && (
                  <p className="text-white/20 font-black text-[10px] tracking-[0.3em] uppercase italic text-center py-6">No observations available.</p>
                )}
                {!obsLoading && observations.length > 0 && (
                  <ol className="space-y-6">
                    {observations.map((obs, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-5 group/obs"
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-black text-white/30 group-hover/obs:bg-white group-hover/obs:text-black group-hover/obs:border-white transition-all duration-300 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed font-bold italic group-hover/obs:text-white/80 transition-colors duration-300">{obs}</p>
                      </motion.li>
                    ))}
                  </ol>
                )}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30"><ShoppingBag size={20} /></div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">Redemption History</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              {orders.length === 0 ? (
                <div className="glass-panel p-10 rounded-[2.5rem] text-center border-white/5">
                  <p className="text-white/20 font-black text-[10px] tracking-[0.3em] uppercase italic">No transactions recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="glass-panel p-6 rounded-[2rem] flex items-center gap-6 border border-white/5 group hover:border-white/20 transition-all duration-500">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white uppercase italic truncate group-hover:text-gradient transition-all">{order.product_name}</p>
                        <p className="text-[9px] font-black text-white/20 tracking-widest uppercase mt-1">Qty: {order.quantity} &middot; {order.points_spent} EDU</p>
                        {order.tx_hash && (
                          <p className="text-[9px] font-mono text-white/20 mt-1 truncate">tx: {order.tx_hash.slice(0, 20)}...</p>
                        )}
                        <p className="text-[9px] font-black text-white/10 uppercase tracking-widest mt-2">
                          {new Date(order.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex-shrink-0 ${
                        order.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : order.status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>{order.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </div>


      <AnimatePresence>
        {editOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[200] p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl glass-panel p-10 rounded-[3rem] border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-12">
                <div><h3 className="text-3xl font-black text-white tracking-tight uppercase italic">Edit Records</h3><p className="text-xs font-bold text-white/30 tracking-widest mt-1 uppercase">Student Authorization Required</p></div>      
                <button onClick={() => setEditOpen(false)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white hover:text-black transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[ { label: "Username", name: "username" }, { label: "Mobile Number", name: "mobile_number" } ].map((f) => (
                    <div key={f.name}>
                      <label className="text-[10px] font-bold text-white/30 mb-3 block uppercase tracking-widest">{f.label}</label>
                      <input type="text" name={f.name} value={(form as any)[f.name]} onChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-white transition-all placeholder:text-white/10" />
                    </div>
                  ))}
                </div>
                <div><label className="text-[10px] font-bold text-white/30 mb-3 block uppercase tracking-widest">Wallet Address</label><input type="text" name="wallet_address" value={form.wallet_address} onChange={e => setForm(p => ({ ...p, wallet_address: e.target.value }))} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-xs outline-none focus:border-white transition-all" /></div>
                <div><label className="text-[10px] font-bold text-white/30 mb-3 block uppercase tracking-widest">Private Key</label><input type="password" name="private_key" value={form.private_key} onChange={e => setForm(p => ({ ...p, private_key: e.target.value }))} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-xs outline-none focus:border-white transition-all" /></div>
                <div><label className="text-[10px] font-bold text-white/30 mb-3 block uppercase tracking-widest">Personal Bio</label><textarea name="bio" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={4} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium outline-none focus:border-white transition-all" /></div>
                <button type="submit" className="w-full py-5 rounded-2xl bg-white text-black font-black text-[12px] tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] uppercase italic">COMMIT CHANGES</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
