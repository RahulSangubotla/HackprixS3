import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SpatialCard from "@/components/SpatialCard";
import { ArrowLeft, GraduationCap, ArrowRight, ExternalLink } from "lucide-react";

const subjectData: Record<string, any> = {
  maths: {
    name: "Mathematics",
    label: "Logic Arena",
    icon: "🔢",
    color: "#60A5FA",
    description: "Advanced calculus, algebra, and geometry.",
    topics: [
      { id: 1, title: "Calculus Fundamentals", slug: "calculus", progress: 75, lessons: 12 },
      { id: 2, title: "Linear Algebra", slug: "linear-algebra", progress: 100, lessons: 10 },
      { id: 3, title: "Probability & Statistics", slug: "probability", progress: 30, lessons: 15 },
      { id: 4, title: "Differential Equations", slug: "differential-equations", progress: 10, lessons: 14 },
    ],
  },
  physics: {
    name: "Physics",
    label: "Physical World",
    icon: "⚛️",
    color: "#A855F7",
    description: "Laws of motion, energy, and the universe.",
    topics: [
      { id: 1, title: "Classical Mechanics", slug: "mechanics", progress: 60, lessons: 14 },
      { id: 2, title: "Electromagnetism", slug: "electromagnetism", progress: 45, lessons: 12 },
      { id: 3, title: "Quantum Physics", slug: "quantum", progress: 20, lessons: 18 },
      { id: 4, title: "Thermodynamics", slug: "thermodynamics", progress: 80, lessons: 10 },
    ],
  },
  chemistry: {
    name: "Chemistry",
    label: "Atomic Lab",
    icon: "🧪",
    color: "#34D399",
    description: "Molecular structures and chemical reactions.",
    topics: [
      { id: 1, title: "Atomic Structure", slug: "atomic-structure", progress: 90, lessons: 8 },
      { id: 2, title: "Organic Chemistry", slug: "organic-chemistry", progress: 50, lessons: 20 },
      { id: 3, title: "Chemical Equilibrium", slug: "equilibrium", progress: 15, lessons: 12 },
      { id: 4, title: "Thermodynamics in Chem", slug: "chem-thermo", progress: 5, lessons: 10 },
    ],
  },
  anatomy: {
    name: "Anatomy",
    label: "Life Sciences",
    icon: "🦴",
    color: "#F87171",
    description: "Explore living organisms and biological systems.",
    topics: [
      { id: 1, title: "Human Anatomy", slug: "human-anatomy", progress: 55, lessons: 10 },
      { id: 2, title: "Genetics & DNA", slug: "genetics", progress: 0, lessons: 12 },
      { id: 3, title: "Nervous System", slug: "nervous-system", progress: 35, lessons: 14 },
      { id: 4, title: "Cardiovascular System", slug: "cardiovascular", progress: 70, lessons: 12 },
    ],
  },
};

const NOTES: Record<string, any> = {
  "calculus": {
    title: "Advanced Calculus: The Study of Change",
    content: [
      { type: "h2", text: "1. The Concept of Limits" },
      { type: "p", text: "Calculus is built on the concept of limits. A limit describes the value that a function approaches as the input approaches some value. This allows us to deal with infinitely small changes and values that might otherwise result in undefined expressions like 0/0." },
      { type: "p", text: "The formal definition of a limit, known as the epsilon-delta definition, was perfected in the 19th century to provide a rigorous foundation for all of mathematical analysis." },
      { type: "h2", text: "2. Differential Calculus" },
      { type: "p", text: "Differential calculus focuses on the concept of the derivative, which represents the instantaneous rate of change of a function. It is the core tool for understanding how physical quantities evolve over time." },
      { type: "list", items: [
        "Tangent Lines: The derivative at a point is the slope of the line that just touches the curve at that point.",
        "Optimization: By finding where the derivative is zero, we can identify the peaks and valleys of functions—essential for engineering and economic efficiency.",
        "Chain Rule: A fundamental rule for differentiating composite functions, allowing us to break down complex systems into simpler parts."
      ]},
      { type: "h2", text: "3. Integral Calculus" },
      { type: "p", text: "Integration is the study of accumulation. While derivatives break things down, integrals put them back together. It is used to find areas under curves, volumes of irregular solids, and total work done by variable forces." },
      { type: "h3", text: "The Fundamental Theorem of Calculus" },
      { type: "p", text: "This bridge between differentiation and integration states that the process of finding the accumulation of a rate of change is equivalent to finding the total change in the quantity itself." },
      { type: "h2", text: "4. Real-World Applications" },
      { type: "p", text: "Calculus is everywhere. It predicts planetary orbits, models the spread of diseases, enables the design of high-speed transit systems, and is the backbone of artificial intelligence." }
    ]
  },
  "linear-algebra": {
    title: "Linear Algebra: Structures of Dimension",
    content: [
      { type: "h2", text: "1. Vectors and Vector Spaces" },
      { type: "p", text: "A vector is more than just a list of numbers; it represents a point or a direction in a high-dimensional space. A vector space is a mathematical structure that allows us to combine vectors through addition and scaling." },
      { type: "h2", text: "2. Matrices and Linear Transformations" },
      { type: "p", text: "Matrices are the operators of linear algebra. They act on vectors to transform them—rotating them, stretching them, or projecting them onto different subspaces. This is the core engine behind 3D gaming and neural networks." },
      { type: "list", items: [
        "Basis: A set of linearly independent vectors that span the entire space.",
        "Determinants: A scalar value that describes the factor by which the matrix scales areas/volumes.",
        "Eigenvalues: Directions where the matrix only scales without rotating."
      ]},
      { type: "h2", text: "3. Systems of Equations" },
      { type: "p", text: "Linear algebra provides methods like Gaussian Elimination to solve large systems of equations with thousands of variables, which is vital for structural engineering and data science." }
    ]
  },
  "probability": {
    title: "Probability & Statistics: Quantifying Uncertainty",
    content: [
      { type: "h2", text: "1. The Laws of Probability" },
      { type: "p", text: "Probability is the measure of the likelihood that an event will occur. It ranges from 0 (impossible) to 1 (certain)." },
      { type: "list", items: [
        "Independence: When the outcome of one event doesn't affect another.",
        "Bayes' Theorem: A method for updating probabilities based on new evidence.",
        "Conditional Probability: The probability of A given that B has occurred."
      ]},
      { type: "h2", text: "2. Descriptive Statistics" },
      { type: "p", text: "Statistics is about interpreting data. Descriptive statistics summarize datasets using measures like mean, median, mode, and standard deviation." },
      { type: "h2", text: "3. Distributions" },
      { type: "p", text: "The Normal Distribution (Bell Curve) is the most famous, appearing everywhere from test scores to height distributions in biology." }
    ]
  },
  "differential-equations": {
    title: "Differential Equations: Modeling Reality",
    content: [
      { type: "h2", text: "1. What are DEs?" },
      { type: "p", text: "A differential equation relates a function to its derivatives. They are the primary language used to describe change in physics, biology, and engineering." },
      { type: "h2", text: "2. First-Order Equations" },
      { type: "p", text: "Simple models like population growth and radioactive decay use first-order equations, where the rate of change is proportional to the current value." },
      { type: "h2", text: "3. Second-Order & Oscillations" },
      { type: "p", text: "Second-order DEs describe systems that oscillate, such as a swinging pendulum or an alternating current circuit." }
    ]
  },
  "mechanics": {
    title: "Classical Mechanics: The Clockwork Universe",
    content: [
      { type: "h2", text: "1. Newton's Three Laws" },
      { type: "p", text: "Isaac Newton's laws of motion transformed our understanding of the physical world. They describe how force and mass interact to produce acceleration." },
      { type: "list", items: [
        "First Law (Inertia): An object will not change its motion unless acted on by an unbalanced force.",
        "Second Law (F=ma): Acceleration is proportional to force and inversely proportional to mass.",
        "Third Law (Action/Reaction): For every action, there is an equal and opposite reaction."
      ]},
      { type: "h2", text: "2. Energy and Work" },
      { type: "p", text: "The work-energy theorem states that the work done on an object is equal to its change in kinetic energy." },
      { type: "h2", text: "3. Universal Gravitation" },
      { type: "p", text: "Newton also realized that the same force that pulls an apple to the ground keeps the moon in its orbit, providing a single framework for earthly and celestial motion." }
    ]
  },
  "electromagnetism": {
    title: "Electromagnetism: Fields and Waves",
    content: [
      { type: "h2", text: "1. Electric Fields" },
      { type: "p", text: "Charged particles create invisible fields in space that exert forces on other charges. This is governed by Coulomb's Law." },
      { type: "h2", text: "2. Magnetic Induction" },
      { type: "p", text: "Michael Faraday discovered that moving a magnet near a coil of wire generates electricity. This principle powers every generator in the world today." },
      { type: "h2", text: "3. Maxwell's Synthesis" },
      { type: "p", text: "Maxwell unified electricity and magnetism into a single force, proving that light itself is an electromagnetic wave." }
    ]
  },
  "quantum": {
    title: "Quantum Physics: The Logic of the Invisible",
    content: [
      { type: "h2", text: "1. The End of Determinism" },
      { type: "p", text: "In classical physics, we predict the future exactly. In quantum mechanics, we can only predict probabilities. Particles don't have definite positions until measured." },
      { type: "h2", text: "2. Wave-Particle Duality" },
      { type: "p", text: "Matter, like light, can act as both a particle and a wave. The Double-Slit experiment proved that electrons interfere with themselves like waves do." },
      { type: "h2", text: "3. Superposition" },
      { type: "p", text: "A quantum system can exist in multiple states simultaneously—a concept famously illustrated by Schrödinger's Cat." }
    ]
  },
  "thermodynamics": {
    title: "Thermodynamics: Heat and Power",
    content: [
      { type: "h2", text: "1. The Zeroth Law" },
      { type: "p", text: "Defines the concept of temperature. If two systems are in thermal equilibrium with a third, they are in equilibrium with each other." },
      { type: "h2", text: "2. The First Law" },
      { type: "p", text: "Energy cannot be created or destroyed, only transferred. Heat added to a system equals the work done plus the change in internal energy." },
      { type: "h2", text: "3. Heat Engines" },
      { type: "p", text: "Devices like car engines and refrigerators use thermodynamic cycles to convert heat into useful work, though they can never be 100% efficient due to entropy." }
    ]
  },
  "atomic-structure": {
    title: "Atomic Structure: The Architecture of Matter",
    content: [
      { type: "h2", text: "1. The Subatomic Components" },
      { type: "p", text: "Everything we see is made of atoms. At the center is a dense nucleus of protons and neutrons, surrounded by a cloud of electrons." },
      { type: "list", items: [
        "Protons: Positively charged particles that determine the identity of the element.",
        "Neutrons: Neutral particles that act as 'glue' for the nucleus.",
        "Electrons: Negatively charged particles that reside in orbitals and drive bonding."
      ]},
      { type: "h2", text: "2. Orbitals" },
      { type: "p", text: "Electrons occupy 3D regions of space called orbitals (s, p, d, f), defined by their energy level, shape, and orientation." },
      { type: "h2", text: "3. Isotopes" },
      { type: "p", text: "Atoms of the same element can have different numbers of neutrons. Some are unstable and decay over time, releasing radiation." }
    ]
  },
  "organic-chemistry": {
    title: "Organic Chemistry: The Carbon Story",
    content: [
      { type: "h2", text: "1. The Versatility of Carbon" },
      { type: "p", text: "Carbon is the foundation of life. Its ability to form four stable covalent bonds allows it to build infinite varieties of long chains and complex rings." },
      { type: "h2", text: "2. Functional Groups" },
      { type: "p", text: "Specific clusters of atoms determine how an organic molecule reacts. Key groups include Hydroxyl (-OH), Carboxyl (-COOH), and Amino (-NH2)." },
      { type: "h2", text: "3. Hydrocarbons" },
      { type: "p", text: "Alkanes, alkenes, and alkynes form the simplest organic compounds, used globally as fuels and raw materials for plastics." }
    ]
  },
  "equilibrium": {
    title: "Chemical Equilibrium: The Balance of Forces",
    content: [
      { type: "h2", text: "1. Reversible Reactions" },
      { type: "p", text: "Many reactions don't just go one way. Products can react to reform reactants. Equilibrium is reached when forward and reverse rates are equal." },
      { type: "h2", text: "2. Le Chatelier's Principle" },
      { type: "p", text: "If a system at equilibrium is stressed (by changing temperature or pressure), it will shift to counteract that stress." },
      { type: "h2", text: "3. Equilibrium Constant" },
      { type: "p", text: "A mathematical ratio that tells us whether a reaction favors products or reactants at a given temperature." }
    ]
  },
  "chem-thermo": {
    title: "Thermodynamics in Chemistry",
    content: [
      { type: "h2", text: "1. Enthalpy (H)" },
      { type: "p", text: "The total heat content of a system. Exothermic reactions release heat, while endothermic reactions absorb it." },
      { type: "h2", text: "2. Entropy (S)" },
      { type: "p", text: "A measure of disorder. The universe naturally tends toward higher entropy." },
      { type: "h2", text: "3. Gibbs Free Energy (G)" },
      { type: "p", text: "Predicts reaction spontaneity. If ΔG is negative, the reaction will occur without external help." }
    ]
  },
  "human-anatomy": {
    title: "Human Anatomy: The Biological Machine",
    content: [
      { type: "h2", text: "1. Gross vs. Microscopic Anatomy" },
      { type: "p", text: "Gross anatomy deals with structures visible to the naked eye, while microscopic anatomy (histology) looks at tissues and cells." },
      { type: "h2", text: "2. The Skeletal Framework" },
      { type: "p", text: "The adult body has 206 bones. They provide support, protection for organs, and a reservoir for minerals." },
      { type: "h2", text: "3. Organ Systems" },
      { type: "p", text: "The body is organized into 11 major systems, all working in homeostasis to maintain a stable internal environment." }
    ]
  },
  "genetics": {
    title: "Genetics & DNA: The Code of Life",
    content: [
      { type: "h2", text: "1. The Molecule of Life" },
      { type: "p", text: "DNA (Deoxyribonucleic acid) is a long molecule that contains instructions for every biological function, composed of Adenine, Thymine, Cytosine, and Guanine." },
      { type: "h2", text: "2. Genes and Chromosomes" },
      { type: "p", text: "A gene is a specific segment of DNA that codes for a protein. Humans have 23 pairs of chromosomes, one set from each parent." },
      { type: "h2", text: "3. Mutation" },
      { type: "p", text: "Errors in DNA copying lead to mutations, which are the ultimate source of all genetic variation and evolution." }
    ]
  },
  "nervous-system": {
    title: "The Nervous System: The Bio-Electrical Network",
    content: [
      { type: "h2", text: "1. The Central Processing Unit" },
      { type: "p", text: "The brain and spinal cord form the Central Nervous System (CNS), processing every thought, movement, and sensation." },
      { type: "h2", text: "2. Neurons" },
      { type: "p", text: "Neurons transmit signals through electrical pulses. They communicate across synapses using neurotransmitters like dopamine." },
      { type: "h2", text: "3. Peripheral Nervous System" },
      { type: "p", text: "Connects the CNS to the rest of the body, including the autonomic system which handles background tasks like heart rate." }
    ]
  },
  "cardiovascular": {
    title: "Cardiovascular System: The Transport Highway",
    content: [
      { type: "h2", text: "1. The Heart" },
      { type: "p", text: "The heart is a four-chambered muscle that beats 100,000 times a day, using two separate circuits to oxygenate blood." },
      { type: "h2", text: "2. Vascular Network" },
      { type: "p", text: "Arteries carry oxygenated blood away from the heart, while veins return deoxygenated blood using one-way valves." },
      { type: "h2", text: "3. Blood Composition" },
      { type: "p", text: "Blood is a complex mix of plasma, red cells (oxygen), white cells (defense), and platelets (clotting)." }
    ]
  }
};

const DEFAULT_NOTE = {
  title: "Academic Module Records",
  content: [
    { type: "h2", text: "System Initializing..." },
    { type: "p", text: "Please select a learning module from the curriculum to view the comprehensive academic records. Our database contains detailed notes for every active topic." },
  ]
};

const SubjectDetail = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const subject = subjectId ? subjectData[subjectId] : null;

  const note = NOTES[activeTopicId || ""] || DEFAULT_NOTE;

  const handleOpenVR = () => {
    window.open("https://dclassroom-d128d.web.app/", "_blank");
  };

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white/20 uppercase tracking-[0.5em] font-black italic">
        Subject not found
      </div>
    );
  }

  // --- FULL PAGE NOTES VIEW ---
  if (activeTopicId) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] overflow-x-hidden relative selection:bg-white/10">
        <style>{` .floating-nav { display: none !important; } `}</style>

        <header className="fixed top-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 z-50 px-4 md:px-6 py-3 md:py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-6 min-w-0">
              <button 
                onClick={() => setActiveTopicId(null)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all group flex-shrink-0"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm md:text-xl font-black text-white leading-none mb-1 uppercase tracking-tight italic truncate">{subject.name} Notes</h1>
                <p className="text-[8px] md:text-[10px] font-bold text-white/20 uppercase tracking-widest truncate">Academic Hub • 2026</p>
              </div>
            </div>
            <button 
              onClick={handleOpenVR}
              className="px-4 py-2 md:px-6 md:py-2.5 rounded-xl bg-white text-black font-black text-[10px] md:text-[11px] tracking-[0.1em] md:tracking-[0.2em] transition-all flex items-center gap-2 md:gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 uppercase italic flex-shrink-0"
            >
              <ExternalLink size={12} className="md:w-3.5 md:h-3.5" />
              <span className="hidden sm:inline">OPEN VR ARENA</span>
              <span className="sm:hidden">VR ARENA</span>
            </button>
          </div>
        </header>

        <main className="pt-24 md:pt-32 pb-40 px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/[0.02] rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl p-8 md:p-24 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
              
              <div className="max-w-2xl mx-auto space-y-10 md:space-y-16 relative z-10">
                <div className="pb-8 md:pb-10 border-b border-white/5">
                   <span className="inline-block px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/30 text-[7px] md:text-[8px] font-black tracking-widest uppercase mb-4 md:mb-6">Subject Archives</span>
                   <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter mb-3 md:mb-4 italic uppercase leading-[1.1]">{note.title}</h2>
                   <p className="text-[10px] md:text-xs font-bold text-white/20 tracking-[0.2em] md:tracking-[0.3em] uppercase">Verified Academic Content • Hub Protocol</p>
                </div>

                <div className="space-y-10 md:space-y-12">
                  {note.content.map((block: any, i: number) => {
                    if (block.type === "h2") return (
                      <div key={i} className="pt-6 md:pt-8">
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic border-l-4 border-white/20 pl-4 md:pl-6 mb-4 md:mb-6">{block.text}</h2>
                      </div>
                    );
                    if (block.type === "h3") return <h3 key={i} className="text-lg md:text-xl font-bold text-white/70 tracking-tight pt-3 md:pt-4 uppercase italic">{block.text}</h3>;
                    if (block.type === "p") return <p key={i} className="text-base md:text-lg text-white/40 leading-relaxed font-medium">{block.text}</p>;
                    if (block.type === "list") return (
                      <ul key={i} className="space-y-4 md:space-y-6">
                        {block.items.map((item: string, j: number) => (
                          <li key={j} className="flex items-start gap-4 md:gap-5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2.5 md:mt-3 flex-shrink-0" />
                            <span className="text-base md:text-lg text-white/40 leading-relaxed font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                    return null;
                  })}
                </div>

                <div className="pt-20 mt-20 border-t border-white/5 text-center">
                   <p className="text-[10px] font-bold text-white/10 tracking-[0.5em] uppercase mb-8">END OF MODULE RECORDS</p>
                   <button 
                    onClick={() => setActiveTopicId(null)}
                    className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-black text-[10px] tracking-widest hover:bg-white hover:text-black transition-all uppercase italic"
                   >
                     RETURN TO CURRICULUM
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // --- TOPIC LIST VIEW ---
  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[140px]" />
         <div className="absolute bottom-[-20%] left-[-20%] w-[70vw] h-[70vw] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      <section className="pt-24 md:pt-32 pb-12 px-4 md:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-8 md:mb-12 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Return to Hub</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 md:gap-4 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl md:text-2xl shadow-lg">
                  {subject.icon}
                </div>
                <span className="text-white/50 text-[8px] md:text-[10px] tracking-[0.2em] font-bold uppercase">{subject.label}</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter text-gradient leading-[0.9] uppercase italic mb-2">{subject.name}</h1>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel px-6 py-4 md:px-8 md:py-4 rounded-[1.5rem] md:rounded-[2rem] text-left md:text-right w-fit">
              <p className="text-[8px] md:text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1">Curriculum</p>       
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-white">{subject.topics.length}</span>
                <span className="text-[10px] md:text-xs font-bold text-white/30 uppercase tracking-widest">Active Topics</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-40 relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">
           <section>
              <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
                <GraduationCap size={20} className="md:w-6 md:h-6 text-white/40" />
                <h2 className="text-xl md:text-3xl font-black tracking-tight text-white uppercase italic">Learning Modules</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {subject.topics.map((topic: any, i: number) => (
                  <motion.div 
                    key={topic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <SpatialCard 
                      className="group cursor-pointer border-white/5 hover:bg-white/5 transition-all p-8 md:p-10"
                      onClick={() => setActiveTopicId(topic.slug || topic.id)}
                    >
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h4 className="text-2xl font-black text-white group-hover:translate-x-1 transition-transform uppercase italic">{topic.title}</h4>
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">{topic.lessons} Knowledge Units</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-white/50">{topic.progress}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${topic.progress}%` }} 
                          className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                        />
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-8 mt-4">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                          {topic.progress === 100 ? 'Verified Complete' : topic.progress === 0 ? 'Not initialized' : 'In Progress'}
                        </p>
                        <div className="flex items-center gap-3 text-white/20 group-hover:text-white transition-colors">
                           <span className="text-[10px] font-black uppercase tracking-widest">OPEN ARCHIVES</span>
                           <ArrowRight size={18} />
                        </div>
                      </div>
                    </SpatialCard>
                  </motion.div>
                ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;
