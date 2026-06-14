import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ShoppingBag, Dumbbell, Library, User } from "lucide-react";

const NAV = [
  { path: "/", label: "Home", icon: Home },
  { path: "/marketplace", label: "Store", icon: ShoppingBag },
  { path: "/playground", label: "Playground", icon: Dumbbell },
  { path: "/lounge", label: "Lounge", icon: Library },
  { path: "/profile", label: "Locker", icon: User },
];

export default function FloatingNav() {
  const { pathname } = useLocation();
  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-[100] px-4 md:px-6">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel px-3 py-2 md:px-4 md:py-3 rounded-full flex items-center gap-1 md:gap-2 max-w-[95%] md:max-w-md w-full justify-between"  
      >
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="relative group p-2 md:p-3"
            >
              <div className="relative z-10 flex flex-col items-center">
                <Icon 
                  size={18}
                  className={`md:w-5 md:h-5 transition-colors duration-300 ${active ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`}
                />
                <span className={`text-[9px] md:text-[10px] mt-1 font-medium tracking-wide transition-all duration-300 ${active ? 'opacity-100 h-auto' : 'opacity-0 h-0 md:h-auto overflow-hidden md:overflow-visible md:group-hover:opacity-100'}`}>
                  {label}
                </span>
              </div>
              {active && (
                <motion.div
                  layoutId="nav-bg"
                  className="absolute inset-0 bg-white/10 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
