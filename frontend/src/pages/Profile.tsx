import { useState, useEffect, useRef } from "react";
import { LogOut, Settings, X, User as UserIcon, ShieldCheck, Mail, Phone, School, Award, ChevronRight, Camera, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchWalletInfo } from "@/lib/authClient";
import { motion, AnimatePresence } from "framer-motion";
import SpatialCard from "@/components/SpatialCard";
import { uploadToCloudinary } from "@/lib/cloudinary";

type WalletInfo = { address: string | null; balance: number; symbol: string };

export default function Profile() {
  const { user, fetchUser, updateUserProfile, logout, loading } = useAuth();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ username: "", bio: "", mobile_number: "", wallet_address: "", private_key: "" });

  useEffect(() => {
    const init = async () => {
      if (!user) {
        await fetchUser();
      }
    };
    init();
  }, [fetchUser, user]);

  useEffect(() => {
    const getWallet = async () => {
      if (user) {
        try {
          const w = await fetchWalletInfo();
          setWallet(w);
        } catch (e) {
          console.error("Wallet fetch failed");
        }
      }
    };
    getWallet();
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
    <div className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12 text-gradient italic">        
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] tracking-[0.2em] font-bold mb-4 uppercase">STUDENT MANAGEMENT</span>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gradient leading-none uppercase italic">Student Locker</h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-5">
              <SpatialCard className="p-0 overflow-hidden">
                <div className="p-8 pb-12 bg-gradient-to-br from-white/[0.05] to-transparent">
                  <div className="flex justify-between items-start mb-12">
                    <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[8px] font-black text-white/50 tracking-widest uppercase">Class of 2026</div>
                    <ShieldCheck size={24} className="text-white/20" />
                  </div>
                  <div className="flex items-center gap-8 mb-12">
                    <div className="relative w-32 h-32 rounded-3xl overflow-hidden group cursor-pointer border border-white/10" onClick={() => fileRef.current?.click()}>
                      <img src={user?.profile_image || "/placeholder.svg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera size={24} className="text-white" /></div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white tracking-tight mb-2 uppercase italic">{user?.username || "Scholar"}</h2>
                      <p className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">{user?.role || "Scholar"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 mb-12">
                    <div><p className="text-[10px] font-bold text-white/20 tracking-widest uppercase mb-1">Current Level</p><p className="text-4xl font-black text-white">{level}</p></div>
                    <div><p className="text-[10px] font-bold text-white/20 tracking-widest uppercase mb-1">Edu Coins</p><p className="text-4xl font-black text-white">{wallet?.balance ?? 0}</p></div>       
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end"><span className="text-[10px] font-bold text-white/20 tracking-widest uppercase">Experience</span><span className="text-xs font-black text-white/50">{user?.xp ?? 0}/1000 XP</span></div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.5, ease: "circOut" }} className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]" />  
                    </div>
                  </div>
                </div>
                <div className="p-8 flex gap-4">
                  <button onClick={() => setEditOpen(true)} className="flex-1 py-4 rounded-2xl bg-white text-black font-black text-[10px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all uppercase">EDIT RECORDS</button>
                  <button onClick={logout} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 font-black text-[10px] tracking-widest hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/20 transition-all"><LogOut size={16} /></button>
                </div>
              </SpatialCard>
            </motion.div>

            <div className="lg:col-span-7 space-y-12">
              <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center gap-4 mb-8">
                  <Award size={20} className="text-white/40" />
                  <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Digital Locker</h2>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="glass-panel p-8 rounded-[2rem] space-y-8">
                  {wallet?.address ? (
                    <>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"><Award size={20} className="text-white/40" /></div>
                          <div><p className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Verified Assets</p><p className="text-2xl font-black text-white">{wallet?.balance} {wallet?.symbol}</p></div>
                        </div>
                        <ChevronRight className="text-white/10" />
                      </div>
                      <div className="pt-8 border-t border-white/5">
                        <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-4">Blockchain Address</p>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5"><p className="text-xs font-mono text-white/50 break-all leading-relaxed">{wallet?.address}</p></div>     
                      </div>
                    </>
                  ) : (
                    <p className="text-white/20 text-center py-4 italic">No secure chip detected in locker.</p> 
                  )}
                </div>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="flex items-center gap-4 mb-8">
                  <UserIcon size={20} className="text-white/40" />
                  <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Records</h2>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Email", value: user?.email || "N/A", icon: Mail },
                    { label: "Mobile", value: user?.mobile_number || "Not set", icon: Phone },
                    { label: "Institution", value: user?.institution_name || "GURUKUL Institute", icon: School }, 
                    { label: "Total Experience", value: `${user?.xp ?? 0} XP`, icon: Zap },
                  ].map((item, i) => (
                    <div key={i} className="glass-panel p-6 rounded-3xl flex items-center gap-4 border border-white/5 group hover:bg-white/5 transition-all">
                       <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/30 group-hover:text-white transition-colors"><item.icon size={18} /></div>
                       <div><p className="text-[10px] font-bold text-white/20 tracking-widest uppercase mb-1">{item.label}</p><p className="text-sm font-black text-white/70">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <div className="flex items-center gap-4 mb-8">
                  <Settings size={20} className="text-white/40" />
                  <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Observations</h2>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="glass-panel p-8 rounded-[2rem]"><p className="text-lg text-white/40 leading-relaxed font-medium italic">"{user?.bio || "No observations recorded in this locker yet."}"</p></div>
              </motion.section>
            </div>
          </div>
        </div>
      </section>

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
