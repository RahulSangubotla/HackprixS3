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

  const handleRemove = async (id: number) => {
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
      <section className="pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Link to="/marketplace" className="flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-12 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Back to Store</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <ShoppingBag size={14} className="text-white/40" />
                </div>
                <span className="text-white/50 text-[10px] tracking-[0.2em] font-bold uppercase">Ready for Checkout</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gradient leading-none uppercase italic">Your Bag</h1>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel px-8 py-4 rounded-[2rem] text-right">
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1">Items</p>       
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{cart?.items.length ?? 0}</span>
                <span className="text-xs font-bold text-white/30 uppercase">Selected</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-32">
        {!cart || cart.items.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 text-center glass-panel rounded-[3rem] border-dashed border-white/10">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
               <Box size={32} className="text-white/10" />
            </div>
            <h3 className="text-2xl font-black text-white/80 mb-2">Bag is empty</h3>
            <p className="text-white/30 text-sm mb-12">Browse the marketplace to find high-performance knowledge modules.</p>
            <Link to="/marketplace">
              <button className="px-8 py-5 rounded-full bg-white text-black font-black text-[10px] tracking-widest hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">BROWSE CATALOG</button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-4 mb-8 text-white/20">
                <Box size={16} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Order Summary</span>
              </div>
              <AnimatePresence mode="popLayout">
                {cart.items.map((item, i) => (
                  <motion.div key={item.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}>
                    <div className="glass-panel p-6 rounded-3xl flex items-center gap-6 border border-white/5 group">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                        {item.product.thumbnail ? (
                          <img src={item.product.thumbnail} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Box size={24} className="text-white/10" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-white/20 tracking-widest uppercase mb-1">{item.product.category_name}</p>
                        <h4 className="text-lg font-black text-white truncate mb-2 uppercase italic">{item.product.name}</h4>    
                        <div className="flex items-center gap-4"><span className="text-xs font-bold text-white/40">{item.product.points_price} EDU × {item.quantity}</span></div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-3">
                        <div className="flex items-baseline gap-1">
                           <span className="text-xl font-black text-white">{item.total_points}</span>
                           <span className="text-[10px] font-bold text-white/20 uppercase">EDU</span>
                        </div>
                        <button onClick={() => handleRemove(item.id)} className="w-10 h-10 rounded-full bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/40 hover:bg-red-500 hover:text-white transition-all"><XCircle size={16} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <motion.button layout onClick={handleClear} className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-white/20 font-black text-[10px] tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-2">
                <Trash2 size={14} /> EMPTY BAG
              </motion.button>
            </div>

            <div className="lg:col-span-4">
              <SpatialCard className="p-10 bg-white/[0.03] border-white/10">
                <div className="flex items-center gap-4 mb-8 text-white/20"><CreditCard size={18} /><span className="text-[10px] font-bold tracking-widest uppercase">Payment</span></div>
                <div className="space-y-6 mb-12">
                   <div className="flex justify-between items-center text-white/40"><span className="text-sm font-medium">Subtotal</span><span className="text-sm font-black text-white">{cart.total_cart_points} EDU</span></div>
                   <div className="flex justify-between items-center text-white/40"><span className="text-sm font-medium">Processing Fee</span><span className="text-sm font-black text-white">0 EDU</span></div>
                   <div className="h-px bg-white/10" />
                   <div className="flex justify-between items-center"><span className="text-lg font-black text-white">Total</span><span className="text-2xl font-black text-white">{cart.total_cart_points} EDU</span></div>    
                </div>
                <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4 mb-10">
                   <CheckCircle2 size={18} className="text-emerald-400 mt-1" />
                   <div>
                      <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Instant Delivery</p>
                      <p className="text-[10px] font-medium text-white/30 leading-relaxed">Digital artifacts are instantly assigned to your student locker upon commitment.</p>
                   </div>
                </div>
                <button onClick={handleRedeem} disabled={redeeming} className="w-full py-5 rounded-2xl bg-white text-black font-black text-[12px] tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3">
                  {redeeming ? <Loader2 size={18} className="animate-spin" /> : <>COMMIT ORDER <ArrowRight size={18} /></>}
                </button>
              </SpatialCard>
              <div className="mt-8 p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] flex items-center gap-6">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0"><Sparkles size={20} className="text-white/20" /></div>
                 <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase leading-relaxed">Redeeming items awards +50 XP bonus to your profile records.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
