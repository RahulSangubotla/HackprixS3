import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertTriangle, ShoppingCart, Sparkles, Box, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { fetchProducts, addToCart, fetchWalletInfo } from "@/lib/authClient";
import type { Product } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import SpatialCard from "@/components/SpatialCard";

type Wallet = { address: string | null; balance: number; symbol: string };

function catColor(name: string): string {
  const n = (name ?? "").toLowerCase();
  if (n.includes("bio") || n.includes("anatomy")) return "#F87171";
  if (n.includes("chem")) return "#34D399";
  if (n.includes("phys")) return "#A855F7";
  if (n.includes("math")) return "#60A5FA";
  return "#FFFFFF";
}

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [p, w] = await Promise.all([fetchProducts(), fetchWalletInfo()]);
        setProducts(p);
        setWallet(w);
      } catch {
        toast.error("Couldn't load the store.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async (id: string) => {
    setAddingId(id);
    try {
      await addToCart(id, 1);
      toast.success("Added to inventory! 🛒");
    } catch {
      toast.error("Couldn't add item.");
    } finally {
      setAddingId(null);
    }
  };

  const picks = products.filter((p) => (p as any).featured || (p as any).is_featured);
  const rest = products.filter((p) => !((p as any).featured || (p as any).is_featured));

  return (
    <div className="min-h-screen">
      <section className="pt-24 md:pt-32 pb-16 px-4 md:px-6 relative overflow-hidden">
        {/* DECORATIVE BACKGROUND */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div animate={{ opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-white/10 to-transparent blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center mb-16 md:mb-24">       
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[8px] md:text-[10px] tracking-[0.2em] font-bold mb-6 md:mb-8 uppercase">Campus Commerce</span>
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-gradient leading-[0.85] uppercase italic mb-12">Marketplace</h1>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-panel px-6 py-3 md:px-10 md:py-5 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center gap-6">
              <div className="text-left border-r border-white/10 pr-6">
                <p className="text-[8px] md:text-[9px] font-black text-white/20 tracking-widest uppercase mb-1">Available Credits</p>     
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-white">{wallet?.balance ?? 0}</span>
                  <span className="text-[10px] md:text-xs font-black text-white/30 uppercase">{wallet?.symbol ?? "EDU"}</span>
                </div>
              </div>
              <Link to="/cart">
                <button className="relative group/cart">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white flex items-center justify-center text-black group-hover/cart:scale-110 active:group-hover/cart:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <ShoppingCart size={20} className="md:w-6 md:h-6" />
                  </div>
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 border-2 border-[#0A0A0A] text-[10px] font-black text-white flex items-center justify-center shadow-lg">
                    !
                  </motion.span>
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-40 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 border-t-2 border-white/20 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Box size={24} className="text-white/10 animate-pulse" />
              </div>
            </div>
            <span className="text-[10px] font-black text-white/20 tracking-[0.5em] uppercase">Syncing Inventory...</span>  
          </div>
        ) : products.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-40 glass-panel rounded-[3rem] border-dashed">
            <p className="text-white/20 text-lg font-medium italic">The marketplace is currently offline.</p>
          </motion.div>
        ) : (
          <div className="space-y-24 md:space-y-40">
            {(picks.length > 0 || rest.length > 0) && (
              <>
              {picks.length > 0 && (
                <section>
                  <div className="flex items-center gap-4 md:gap-6 mb-10 md:mb-16">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                      <Sparkles size={20} />
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase italic">Premium Picks</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                    {picks.map((p, i) => (
                      <StoreCard key={p.id} item={p} adding={addingId === p.id} onAdd={handleAdd} index={i} />    
                    ))}
                  </div>
                </section>
              )}
              {rest.length > 0 && (
                <section>
                  <div className="flex items-center gap-4 md:gap-6 mb-10 md:mb-16">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                      <Box size={20} />
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase italic">Campus Catalog</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {rest.map((p, i) => (
                      <StoreCard key={p.id} item={p} adding={addingId === p.id} onAdd={handleAdd} index={i} />      
                    ))}
                  </div>
                </section>
              )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StoreCard({ item, adding, onAdd, index }: { item: Product; adding: boolean; onAdd: (id: string) => void; index: number }) {
  const accent = catColor(item.category_name);
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} viewport={{ once: true }}>
      <SpatialCard className="h-full flex flex-col group p-0 overflow-hidden bg-white/[0.01] border-white/5 hover:border-white/20 transition-all duration-700">
        {item.thumbnail ? (
          <div className="h-64 overflow-hidden relative">
            <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
            <div className="absolute top-5 left-5 flex flex-wrap gap-2">
              {(item as any).is_digital && <span className="bg-black/60 backdrop-blur-xl border border-white/10 text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-2xl">Digital</span>}
              {((item as any).featured || (item as any).is_featured) && <span className="bg-white text-black text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.4)]">Featured</span>}
            </div>
          </div>
        ) : (
          <div className="h-64 bg-white/5 flex items-center justify-center italic font-black text-white/5 text-2xl tracking-tighter">GURUKUL ITEM</div>
        )}
        <div className="p-8 flex-1 flex flex-col relative">
          <div className="mb-6">
            <p className="text-[10px] font-black tracking-[0.2em] mb-2 uppercase" style={{ color: accent }}>{item.category_name}</p>
            <h3 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase italic group-hover:text-gradient transition-all">{item.name}</h3>
          </div>
          {item.description && <p className="text-xs md:text-sm text-white/30 leading-relaxed line-clamp-2 mb-8 group-hover:text-white/50 transition-colors">{item.description}</p>}
          <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl md:text-4xl font-black text-white">{item.points_price}</span>
              <span className="text-[10px] font-black text-white/20 tracking-widest uppercase">EDU</span>
            </div>
            <button onClick={() => onAdd(item.id)} disabled={adding} className={`relative overflow-hidden w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center group/btn transition-all duration-500 ${adding ? 'opacity-50' : 'hover:w-36 hover:bg-white hover:text-black hover:border-white shadow-xl'}`}>
              <AnimatePresence mode="wait">
                {adding ? <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 size={18} className="animate-spin" /></motion.div> : <motion.div key="content" className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span className="hidden group-hover/btn:block text-[10px] font-black tracking-widest whitespace-nowrap">ADD TO BAG</span><ArrowRight size={20} /></motion.div>}
              </AnimatePresence>
            </button>
          </div>
          {(item as any).stock !== null && (item as any).stock <= 10 && <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-red-400 tracking-widest uppercase"><AlertTriangle size={12} className="animate-pulse" /> Final {(item as any).stock} units remaining</div>}
        </div>
      </SpatialCard>
    </motion.div>
  );
}

