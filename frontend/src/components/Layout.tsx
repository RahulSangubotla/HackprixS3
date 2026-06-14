import type { ReactNode } from "react";
import FloatingNav from "./FloatingNav";
import AIChatbot from "./AIChatbot";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative selection:bg-white/20">
      <main className="relative z-0 pb-32">
        {children}
      </main>
      <AIChatbot/>
      <FloatingNav />
    </div>
  );
};

export default Layout;
