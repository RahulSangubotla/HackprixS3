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
  const [addingId, setAddingId] = useState<number | null>(null);

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

  const handleAdd = async (id: number) => {
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
      <section className="pt-24 md:pt-32 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">       
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[8px] md:text-[10px] tracking-[0.2em] font-bold mb-4 uppercase">Campus Commerce</span>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter text-gradient leading-[0.9] uppercase italic">Marketplace</h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 md:gap-6">
            <div className="glass-panel px-6 py-3 md:px-8 md:py-4 rounded-[1.5rem] md:rounded-[2rem] text-right">
              <p className="text-[8px] md:text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1">Balance</p>     
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-3xl font-black text-white">{wallet?.balance ?? 0}</span>
                <span className="text-[10px] md:text-xs font-bold text-white/30 uppercase">{wallet?.symbol ?? "EDU"}</span>
              </div>
            </div>
            <Link to="/cart">
              <button className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                <ShoppingCart size={20} className="md:w-6 md:h-6" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-40">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 size={32} className="md:w-12 md:h-12 animate-spin text-white/20" />
            <span className="text-[8px] md:text-[10px] font-bold text-white/30 tracking-[0.4em]">SYNCING INVENTORY...</span>  
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-40"><p className="text-white/20 text-base md:text-lg font-medium">The marketplace is currently offline.</p></div>
        ) : (
          <div className="space-y-24 md:space-y-32">
            {(picks.length > 0 || rest.length > 0) && (
              <>
              {picks.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
                    <Sparkles size={18} className="md:w-5 md:h-5 text-white/40" />
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase italic">Premium Picks</h2>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {picks.map((p, i) => (
                      <StoreCard key={p.id} item={p} adding={addingId === p.id} onAdd={handleAdd} index={i} />    
                    ))}
                  </div>
                </section>
              )}
              {rest.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
                    <Box size={18} className="md:w-5 md:h-5 text-white/40" />
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase italic">Campus Catalog</h2>
                    <div className="h-px flex-1 bg-white/10" />
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

function StoreCard({ item, adding, onAdd, index }: { item: Product; adding: boolean; onAdd: (id: number) => void; index: number }) {
  const accent = catColor(item.category_name);
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }}>
      <SpatialCard className="h-full flex flex-col group p-0 overflow-hidden">
        {item.thumbnail ? (
          <div className="h-56 overflow-hidden relative">
            <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {(item as any).is_digital && <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Digital</span>}
              {((item as any).featured || (item as any).is_featured) && <span className="bg-white text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">Featured</span>}
            </div>
          </div>
        ) : (
          <div className="h-56 bg-white/5 flex items-center justify-center italic font-black text-white/10 text-xl tracking-tighter">ITEM</div>
        )}
        <div className="p-8 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4"><div><p className="text-[10px] font-bold tracking-widest mb-1 uppercase" style={{ color: accent }}>{item.category_name}</p><h3 className="text-2xl font-black text-white leading-tight uppercase italic">{item.name}</h3></div></div>
          {item.description && <p className="text-sm text-white/40 leading-relaxed line-clamp-2 mb-8">{item.description}</p>}
          <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-baseline gap-1"><span className="text-3xl font-black text-white">{item.points_price}</span><span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">EDU</span></div>
            <button onClick={() => onAdd(item.id)} disabled={adding} className={`relative overflow-hidden w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group/btn transition-all ${adding ? 'opacity-50' : 'hover:w-32 hover:bg-white hover:text-black hover:border-white'}`}>
              <AnimatePresence mode="wait">
                {adding ? <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 size={16} className="animate-spin" /></motion.div> : <motion.div key="content" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span className="hidden group-hover/btn:block text-[10px] font-black tracking-widest">ADD TO BAG</span><ArrowRight size={18} /></motion.div>}
              </AnimatePresence>
            </button>
          </div>
          {(item as any).stock !== null && (item as any).stock <= 10 && <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-red-400 tracking-widest uppercase"><AlertTriangle size={12} /> Low Stock: {(item as any).stock} left</div>}
        </div>
      </SpatialCard>
    </motion.div>
  );
}
