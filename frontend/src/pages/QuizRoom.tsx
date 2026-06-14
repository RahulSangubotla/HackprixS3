import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { submitQuizScore } from "@/lib/authClient";
import { BarChart, Check, X, Award, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import SpatialCard from "@/components/SpatialCard";

interface Question {
  q: string;
  options: string[];
  correct: number;
}

interface LocationState {
  questions: Question[];
}

const QuizRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const questions = (location.state as LocationState)?.questions || [];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate("/lounge");
    }
  }, [questions, navigate]);

  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
  };

  const handleAction = () => {
    if (isAnswered) {
      setSelectedOption(null);
      setIsAnswered(false);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (selectedOption === null) return;
      const correctOptionIndex = questions[currentQuestionIndex].correct;
      if (selectedOption === correctOptionIndex) {
        setScore(prev => prev + 20);
      }
      setIsAnswered(true);
    }
  };

  const handleSubmitScore = async () => {
    setSubmitting(true);
    try {
      if (subjectId) {
        await submitQuizScore(subjectId, score);
        navigate("/lounge");
      }
    } catch (error) {
      console.error("Failed to submit score:", error);
      alert("Error submitting score. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-t-2 border-white/20 rounded-full animate-spin" />
          <p className="text-[10px] font-bold text-white/30 tracking-[0.4em] uppercase">Initializing Neural Link...</p>
        </div>
      </div>
    );
  }

  // Quiz Results View
  if (currentQuestionIndex >= questions.length) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/10 blur-[120px]" />
        </div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg relative z-10 text-center">
          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <Award className="w-12 h-12 text-white/40" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase italic">Simulation Complete</h1>
          <p className="text-white/30 text-sm font-bold tracking-[0.2em] mb-12 uppercase">Performance assessment finalized</p>
          
          <SpatialCard className="p-12 mb-12 bg-white/[0.03] border-white/10">
            <p className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase mb-4">Total Experience Gained</p>
            <div className="text-7xl font-black text-white tracking-tighter italic mb-4">{score}</div>
            <p className="text-xs font-black text-accent tracking-[0.2em] uppercase">XP REWARDS</p>
          </SpatialCard>

          <button 
            onClick={handleSubmitScore} 
            disabled={submitting}
            className="w-full py-6 rounded-2xl bg-white text-black font-black text-[12px] tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 uppercase italic"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <>CLAIM REWARDS <ArrowRight size={18} /></>}
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-32 pb-40 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-end mb-12 px-2">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[8px] font-black tracking-widest mb-4 uppercase">
              {subjectId} Challenge
            </span>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Round {currentQuestionIndex + 1}</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-white/20 tracking-widest uppercase mb-2">Current Score</p>
            <span className="text-3xl font-black text-white tracking-tighter">{score}</span>
          </div>
        </div>

        <SpatialCard className="p-10 bg-white/[0.03] border-white/10">
          <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <BarChart className="w-3 h-3 text-white/20" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">20 XP</span>
            </div>
          </div>
          
          <p className="text-2xl font-black text-white leading-tight mb-12 uppercase italic">
            {currentQuestion.q}
          </p>

          <div className="grid grid-cols-1 gap-4 mb-12">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = index === currentQuestion.correct;
              const isSelected = selectedOption === index;
              
              let stateClass = "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20";

              if (isAnswered) {
                if (isCorrect) stateClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                else if (isSelected) stateClass = "bg-red-500/20 border-red-500 text-red-400";
                else stateClass = "opacity-20 border-white/5";
              } else if (isSelected) {
                stateClass = "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-[1.02]";
              }

              return (
                <button
                  key={index}
                  className={`w-full text-left p-6 rounded-2xl border font-black text-[12px] tracking-widest transition-all duration-300 relative group uppercase italic ${stateClass}`}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isAnswered}
                >
                  <span className="relative z-10">{option}</span>
                  {isAnswered && isCorrect && <Check className="absolute right-6 w-5 h-5 text-emerald-400" />}
                  {isAnswered && isSelected && !isCorrect && <X className="absolute right-6 w-5 h-5 text-red-400" />}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleAction}
            disabled={selectedOption === null}
            className={`w-full py-6 rounded-2xl font-black text-[12px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 uppercase italic ${
              selectedOption === null ? 'bg-white/5 text-white/20 border-white/5' : 
              isAnswered ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.2)]' : 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.2)]'
            }`}
          >
            {isAnswered ? <>PROCEED TO NEXT ROUND <ArrowRight size={18} /></> : <>FINALIZE SELECTION</>}
          </button>
        </SpatialCard>
      </div>
    </div>
  );
};

export default QuizRoom;
