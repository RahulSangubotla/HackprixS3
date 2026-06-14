import { useEffect, useState } from "react";
import { Loader2, Trash2, XCircle, ShoppingBag, ArrowLeft, CreditCard, Sparkles, Box, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { fetchCart, removeFromCart, clearCart, redeemCart } from "@/lib/authClient";
import type { Cart } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SpatialCard from "@/components/SpatialCard";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const { fetchUser } = useAuth();

  const loadCart = async () => {
    try {
      setLoading(true);
      setCart(await fetchCart());
    } catch {
      toast.error("Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCart(); }, []);

  const handleRemove = async (id: string) => {
    try {
      setCart(await removeFromCart(id));
      toast.success("Removed from bag.");
    } catch {
      toast.error("Couldn't remove item.");
    }
  };

  const handleClear = async () => {
    try {
      setCart(await clearCart());
      toast.success("Bag cleared.");
    } catch {
      toast.error("Couldn't clear cart.");
    }
  };

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      await redeemCart();
      toast.success("Transaction Complete! 🎉");
      await loadCart();
      await fetchUser();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Redemption failed.");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-t-2 border-white/20 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-white/30 tracking-[0.4em]">SYNCING BAG...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <section className="pt-24 md:pt-32 pb-12 px-6 relative overflow-hidden">
        {/* DECORATIVE BACKGROUND */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div animate={{ opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-white/10 to-transparent blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <Link to="/marketplace" className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-12 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black tracking-widest uppercase">Back to Store</span>
          </Link>

          <div className="text-center mb-16 md:mb-24">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <ShoppingBag size={14} className="text-white/40" />
                </div>
                <span className="text-white/50 text-[10px] tracking-[0.3em] font-black uppercase">Ready for Commitment</span>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-gradient leading-[0.85] uppercase italic mb-12">Your Bag</h1>
            </motion.div>

            <div className="flex justify-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-panel px-10 py-5 rounded-[2.5rem] flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[9px] font-black text-white/20 tracking-widest uppercase mb-1">Selected Artifacts</p>       
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl font-black text-white">{cart?.items.length ?? 0}</span>
                    <span className="text-xs font-black text-white/30 uppercase">Modules</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-40 relative z-10">
        {!cart || cart.items.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-40 text-center glass-panel rounded-[3rem] border-dashed border-white/10 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl">
               <Box size={32} className="text-white/10" />
            </div>
            <h3 className="text-2xl font-black text-white/80 mb-3 uppercase italic">Bag is empty</h3>
            <p className="text-white/30 text-sm font-medium mb-12 max-w-sm mx-auto">Browse the marketplace to find high-performance knowledge modules to enhance your student profile.</p>
            <Link to="/marketplace">
              <button className="px-10 py-5 rounded-2xl bg-white text-black font-black text-[10px] tracking-[0.2em] hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] uppercase italic">BROWSE CATALOG</button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-4 mb-8 text-white/20">
                <Box size={18} />
                <span className="text-[10px] font-black tracking-widest uppercase italic">Commitment Summary</span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <AnimatePresence mode="popLayout">
                {cart.items.map((item, i) => (
                  <motion.div key={item.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, scale: 0.95 }} transition={{ duration: 0.5, delay: i * 0.05 }}>
                    <div className="glass-panel p-6 rounded-[2rem] flex items-center gap-6 border border-white/5 group hover:border-white/20 transition-all duration-500">
                      <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 relative">
                        {item.product.thumbnail ? (
                          <img src={item.product.thumbnail} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-110 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Box size={24} className="text-white/10" /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-white/20 tracking-widest uppercase mb-1.5">{item.product.category_name}</p>
                        <h4 className="text-xl md:text-2xl font-black text-white truncate mb-2 uppercase italic group-hover:text-gradient transition-all">{item.product.name}</h4>    
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase">{item.quantity} UNIT</span>
                          <span className="text-[10px] font-bold text-white/20">×</span>
                          <span className="text-[10px] font-black text-white/40">{item.product.points_price} EDU</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-4">
                        <div className="flex items-baseline gap-1.5">
                           <span className="text-2xl font-black text-white">{item.total_points}</span>
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">EDU</span>
                        </div>
                        <button onClick={() => handleRemove(item.id)} className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/40 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-red-500/20"><XCircle size={18} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <motion.div layout className="pt-8">
                <button onClick={handleClear} className="w-full py-5 rounded-2xl bg-white/5 border border-white/5 text-white/20 font-black text-[10px] tracking-[0.3em] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all duration-500 flex items-center justify-center gap-3 uppercase italic">
                  <Trash2 size={16} /> PURGE BAG RECORDS
                </button>
              </motion.div>
            </div>

            <div className="lg:col-span-4 sticky top-32">
              <SpatialCard className="p-10 bg-white/[0.02] border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-10 text-white/20 border-b border-white/5 pb-6">
                  <CreditCard size={20} />
                  <span className="text-[10px] font-black tracking-widest uppercase italic">Transaction Node</span>
                </div>
                <div className="space-y-6 mb-12">
                   <div className="flex justify-between items-center text-white/30"><span className="text-[10px] font-black uppercase tracking-widest">Base Value</span><span className="text-sm font-black text-white">{cart.total_cart_points} EDU</span></div>
                   <div className="flex justify-between items-center text-white/30"><span className="text-[10px] font-black uppercase tracking-widest">Network Fee</span><span className="text-sm font-black text-emerald-400">0.00 EDU</span></div>
                   <div className="h-px bg-white/10 my-4" />
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Total Commitment</span>
                      <div className="text-right">
                        <span className="text-4xl font-black text-white leading-none">{cart.total_cart_points}</span>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">EDU TOKENS</p>
                      </div>
                   </div>    
                </div>
                <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4 mb-10 group hover:bg-emerald-500/10 transition-colors">
                   <CheckCircle2 size={20} className="text-emerald-400 mt-1 shrink-0" />
                   <div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">Direct Provisioning</p>
                      <p className="text-[10px] font-medium text-white/30 leading-relaxed group-hover:text-white/50 transition-colors">Digital artifacts are instantly committed to your secure student locker upon authorization.</p>
                   </div>
                </div>
                <button onClick={handleRedeem} disabled={redeeming} className="w-full py-6 rounded-2xl bg-white text-black font-black text-[12px] tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center gap-4 uppercase italic">
                  {redeeming ? <Loader2 size={22} className="animate-spin" /> : <>AUTHORIZE ORDER <ArrowRight size={22} /></>}
                </button>
              </SpatialCard>
              <div className="mt-8 p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.01] flex items-center gap-6 group hover:bg-white/[0.03] transition-all">
                 <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"><Sparkles size={24} className="text-white/20" /></div>
                 <p className="text-[9px] font-black text-white/20 group-hover:text-white/40 tracking-widest uppercase leading-relaxed transition-colors">Order finalization grants +50 XP academic bonus to your global profile.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
