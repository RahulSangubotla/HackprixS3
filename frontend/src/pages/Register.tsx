import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, UserPlus, ArrowRight, ShieldCheck, Mail, Phone, School, ClipboardCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialCard from "@/components/SpatialCard";

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '', role: 'student', mobile_number: '', institution_code: '' });
  const [instId, setInstId] = useState<number | null>(null);
  const [instName, setInstName] = useState<string | null>(null);
  const [instError, setInstError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (form.institution_code.trim() === '') {
      setInstId(null);
      setInstName(null);
      setInstError(null);
      return;
    }
    if (form.institution_code.length <= 2) return;
    const t = setTimeout(async () => {
      setInstError(null);
      setInstName(null);
      setInstId(null);
      try {
        const res = await fetch(`/api/users/institutions/${form.institution_code}/`);
        if (res.ok) {
          const d = await res.json();
          setInstId(d.id);
          setInstName(d.name);
        } else setInstError('INSTITUTION NOT FOUND');
      } catch {
        setInstError('VERIFICATION FAILED');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form.institution_code]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (form.password !== form.password2) {
      setError('VALIDATION ERROR: PASSWORDS MISMATCH');
      setLoading(false);
      return;
    }
    if (form.institution_code.trim() && !instId) {
      setError('VALIDATION ERROR: INVALID CAMPUS CODE');
      setLoading(false);
      return;
    }
    try {
      const body: any = { username: form.username, email: form.email, password: form.password, password2: form.password2, role: form.role, mobile_number: form.mobile_number };
      if (instId) body.institution = instId;
      const res = await fetch('/api/auth/register/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) navigate('/login');
      else {
        const d = await res.json();
        setError(d.detail || 'ENROLMENT FAILED');
      }
    } catch {
      setError('SYSTEM ERROR: TRY AGAIN LATER');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative bg-[#0A0A0A]">   
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-emerald-600/20 rounded-full blur-[140px]" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 18, repeat: Infinity }} className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-600/20 rounded-full blur-[140px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-16">
           <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"><UserPlus size={32} className="text-white/40" /></motion.div>
           <h1 className="text-6xl font-black tracking-tighter text-gradient leading-none mb-4 uppercase italic">Enrolment Center</h1>
           <p className="text-white/30 text-sm font-bold tracking-[0.2em] uppercase text-center mx-auto max-w-md">Initialize your student profile to access the knowledge ecosystem.</p>
        </div>
        <SpatialCard className="bg-white/[0.03] border-white/10 p-12">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-8">
               <div className="flex items-center gap-4 mb-4 text-white/20 border-b border-white/5 pb-4"><ShieldCheck size={16} /><span className="text-[10px] font-black tracking-widest uppercase">Section 01: Identity</span></div>
               <div><label className="text-[10px] font-black text-white/30 mb-3 block uppercase tracking-widest">Student Username</label><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10"><ClipboardCheck size={18} /></div><input type="text" name="username" required placeholder="Choose Identifier" value={form.username} onChange={handleChange} className="w-full py-4 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-white transition-all placeholder:text-white/10" /></div></div>
               <div><label className="text-[10px] font-black text-white/30 mb-3 block uppercase tracking-widest">Official Email</label><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10"><Mail size={18} /></div><input type="email" name="email" required placeholder="name@campus.com" value={form.email} onChange={handleChange} className="w-full py-4 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-white transition-all placeholder:text-white/10" /></div></div>
               <div><label className="text-[10px] font-black text-white/30 mb-3 block uppercase tracking-widest">Mobile Number</label><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10"><Phone size={18} /></div><input type="text" name="mobile_number" placeholder="+1 (555) 000-0000" value={form.mobile_number} onChange={handleChange} className="w-full py-4 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-white transition-all placeholder:text-white/10" /></div></div>
            </div>
            <div className="space-y-8">
               <div className="flex items-center gap-4 mb-4 text-white/20 border-b border-white/5 pb-4"><School size={16} /><span className="text-[10px] font-black tracking-widest uppercase">Section 02: Verification</span></div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-1"><label className="text-[10px] font-black text-white/30 mb-3 block uppercase tracking-widest">Security Key</label><input type="password" name="password" required placeholder="••••••••" value={form.password} onChange={handleChange} className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-white transition-all placeholder:text-white/10" /></div>
                 <div className="col-span-1"><label className="text-[10px] font-black text-white/30 mb-3 block uppercase tracking-widest">Verify Key</label><input type="password" name="password2" required placeholder="••••••••" value={form.password2} onChange={handleChange} className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-white transition-all placeholder:text-white/10" /></div>
               </div>
               <div><label className="text-[10px] font-black text-white/30 mb-3 block uppercase tracking-widest">Primary Role</label><select name="role" value={form.role} onChange={handleChange} className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-white transition-all appearance-none cursor-pointer"><option value="student">STUDENT</option><option value="teacher">TEACHER</option></select></div>
               <div><label className="text-[10px] font-black text-white/30 mb-3 block uppercase tracking-widest">Campus Code (Optional)</label><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10"><School size={18} /></div><input type="text" name="institution_code" placeholder="E.G. MIT2026" value={form.institution_code} onChange={handleChange} className="w-full py-4 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-white transition-all placeholder:text-white/10" /></div>{instName && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] font-black text-emerald-400 mt-3 flex items-center gap-1 uppercase tracking-widest"><CheckCircle size={10} /> {instName}</motion.p>}{instError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] font-black text-red-500 mt-3 flex items-center gap-1 uppercase tracking-widest"><XCircle size={10} /> {instError}</motion.p>}</div>
            </div>
            <div className="md:col-span-2 mt-8">
              <AnimatePresence>{error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 mb-8"><XCircle className="text-red-500 shrink-0" size={18} /><p className="text-[10px] font-bold text-red-400 leading-tight uppercase tracking-widest">{error}</p></motion.div>}</AnimatePresence> 
              <button type="submit" disabled={loading} className="w-full py-6 rounded-2xl bg-white text-black font-black text-[12px] tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] uppercase italic">{loading ? <><Loader2 size={20} className="animate-spin" /> PROCESSING APPLICATION...</> : <>FINALIZE ENROLMENT <ArrowRight size={18} /></>}</button>
            </div>
          </form>
          <div className="mt-12 pt-10 border-t border-white/5 text-center"><p className="text-xs font-medium text-white/20 mb-4 tracking-wide italic">Already have an active student ID?</p><Link to="/login" className="text-[10px] font-black text-white hover:underline uppercase tracking-[0.2em]">BACK TO ADMISSION GATE</Link></div>
        </SpatialCard>
      </motion.div>
    </div>
  );
}
