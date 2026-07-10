/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import ReadingWidget from "../modules/reading/ReadingWidget";
import RewardsWidget from "../modules/rewards/RewardsWidget";
import HomeAssistantWidget from "../modules/homeassistant/HomeAssistantWidget";
import CameraWidget from "./CameraWidget";
import { 
  BookOpen, 
  Flame, 
  Award, 
  Clock, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Tv, 
  Gamepad2, 
  ArrowRight, 
  Sparkles, 
  Check, 
  X,
  PlusCircle,
  HelpCircle,
  Activity,
  Share2,
  Send,
  Lightbulb,
  Upload
} from "lucide-react";
import { motion, AnimatePresence, animate } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Child, ActiveTask, StoreReward, AppState } from "../types";

function CountUp({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startValue = prevValueRef.current;
    prevValueRef.current = value;
    
    if (startValue === value) return;

    const controls = animate(startValue, value, {
      duration: 1.0,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}</span>;
}

interface KidDashboardProps {
  childId: string;
  state: AppState;
  onRefresh: () => void;
  theme: "nintendo" | "duolingo" | "pokemon" | "minecraft";
  onChangeTheme: (theme: "nintendo" | "duolingo" | "pokemon" | "minecraft") => void;
}

export function getChildLevel(child: any, activeTasks: any[]) {
  const points = child.points || 0;
  
  // count how many educational/reading quizzes or tasks are completed
  const approvedTasks = activeTasks?.filter(t => t.childId === child.id && t.status === "approved") || [];
  const completedReading = approvedTasks.filter(t => t.type === "reading" || t.readingTopic).length;
  const totalCompleted = approvedTasks.length;
  const streak = child.readingStreak || 0;

  let levelName = "Explorator ⛺";
  let levelColor = "bg-sky-100 border-sky-300 text-sky-800";
  let desc = "Pornit pe calea provocărilor distractive de vară! Citește prima poveste sau rezolvă o sarcină pentru a crește.";
  let nextGoal = "Adună 40 de Puncte pentru a deveni Aventurier 🎒.";
  let progressPct = Math.min((points / 40) * 100, 100);

  if (points >= 400 || streak >= 10 || completedReading >= 10) {
    levelName = "Maestru 👑";
    levelColor = "bg-purple-150 border-purple-400 text-purple-950";
    desc = "Ești un geniu absolut al cunoașterii! Ai atins rangul suprem.";
    nextGoal = "Rang Maxim Atins! Continuă să fii legendar.";
    progressPct = 100;
  } else if (points >= 220 || streak >= 5 || completedReading >= 5) {
    levelName = "Cercetaș 🧭";
    levelColor = "bg-emerald-100 border-emerald-300 text-emerald-800";
    desc = "Un spirit dornic de explorare și învățare continuă. Nu e misiune care să-ți stea în cale!";
    nextGoal = "Atinge 400 de puncte sau un streak de 10 zile ca să fii Maestru.";
    progressPct = ((points - 220) / (400 - 220)) * 100;
  } else if (points >= 120 || totalCompleted >= 4) {
    levelName = "Inventator 🥽";
    levelColor = "bg-amber-100 border-amber-300 text-amber-800";
    desc = "Pui mereu cap la cap idei sclipitoare și rezolvi puzzle-uri grozave cu mult curaj!";
    nextGoal = "Atinge 220 de puncte sau streak de 5 zile pentru a deveni Cercetaș.";
    progressPct = ((points - 120) / (220 - 120)) * 100;
  } else if (points >= 40 || streak >= 1 || completedReading >= 1) {
    levelName = "Aventurier 🎒";
    levelColor = "bg-orange-100 border-orange-300 text-orange-950";
    desc = "Ai pornit pe calea provocărilor! Îți asumi fiecare misiune cu zâmbetul pe buze.";
    nextGoal = "Adună 120 de puncte sau finalizează 4 sarcini ca să fii Inventator.";
    progressPct = ((points - 40) / (120 - 40)) * 100;
  }

  progressPct = Math.max(0, Math.min(progressPct, 100));

  return { name: levelName, color: levelColor, desc, nextGoal, progressPct, approvedCount: totalCompleted, readingCount: completedReading };
}

const READING_TOPICS = [
  { id: "spatiu", name: "🛸 Spațiul și Sistemul Solar", desc: "Descopere secretele planetelor și ale găurilor negre." },
  { id: "animale", name: "🦁 Animale din Junglă", desc: "Află lucruri incredibile despre feline, elefanți și reptile." },
  { id: "gaming", name: "🎮 Istoria Jocurilor Video", desc: "Cum s-au dezvoltat primele console și recorduri istorice." },
  { id: "programare", name: "💻 Cum funcționează un Robot?", desc: "Învață bazele codului și cum gândesc mașinile inteligente." },
  { id: "ocean", name: "🐙 Creaturi din Adâncuri", desc: "Fă o scufundare în cel mai adânc loc de pe Pământ." },
  { id: "history", name: "🏛️ Imperiul Roman", desc: "Despre gladiatori, invenții și cel mai mare imperiu din antichitate." }
];

export default function KidDashboard({ childId, state, onRefresh, theme, onChangeTheme }: KidDashboardProps) {
  const child = state.children.find((c) => c.id === childId)!;

  const dashboardStyles = {
    nintendo: {
      card: "bg-white border-4 border-slate-900 rounded-3xl p-6 shadow-[4px_4px_0_0_#1e293b] hover:translate-y-[-2px] transition-all",
      subCard: "bg-amber-50 border-3 border-slate-900 rounded-2xl p-4 shadow-[2px_2px_0_0_#1e293b]",
      heading: "font-display font-black text-2xl text-slate-900",
      subheading: "font-display font-black text-xs text-[#ff4b4b] uppercase tracking-wider",
      button: "px-4 py-2 bg-[#ffc000] hover:bg-[#e6ad00] text-slate-950 border-3 border-slate-900 font-display font-black rounded-xl text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#1e293b] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer",
      buttonRed: "px-4 py-2 bg-[#ff4b4b] hover:bg-[#e62b2b] text-white border-3 border-slate-900 font-display font-black rounded-xl text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#1e293b] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer",
      buttonGreen: "px-4 py-2 bg-[#58cc02] hover:bg-[#46a302] text-white border-3 border-slate-900 font-display font-black rounded-xl text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#1e293b] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer",
      tag: "bg-slate-100 border-2 border-slate-900 text-slate-850 px-2.5 py-1 rounded-full text-xs font-black",
      label: "text-[10px] font-display font-black text-slate-400 uppercase tracking-widest",
      text: "text-slate-600 font-medium text-xs md:text-sm",
      milestoneBorder: "border-slate-900"
    },
    duolingo: {
      card: "bg-white border-3 border-slate-200 rounded-3xl p-6 shadow-[0_5px_0_0_#cbd5e1] hover:shadow-[0_2px_0_0_#cbd5e1] hover:translate-y-[1px] transition-all",
      subCard: "bg-emerald-50/50 border-3 border-emerald-100 rounded-2xl p-4 shadow-[0_3px_0_0_#dcfce7]",
      heading: "font-display font-black text-2.5xl text-[#3c3c3c]",
      subheading: "font-display font-black text-xs text-[#1cb0f6] uppercase tracking-wider",
      button: "px-4 py-2 bg-[#ffc000] hover:bg-[#ffa700] text-[#1e293b] border-2 border-[#e0a200] font-display font-black rounded-2xl text-xs uppercase tracking-wider shadow-[0_4px_0_0_#cbd5e1] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer",
      buttonRed: "px-4 py-2 bg-[#ff4b4b] hover:bg-[#ef3b3b] text-white border-2 border-[#ea2b2b] font-display font-black rounded-2xl text-xs uppercase tracking-wider shadow-[0_4px_0_0_#cb3535] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer",
      buttonGreen: "px-4 py-2 bg-[#58cc02] hover:bg-[#4ea602] text-white border-2 border-[#3e9e00] font-display font-black rounded-2xl text-xs uppercase tracking-wider shadow-[0_4px_0_0_#cbd5e1] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer",
      tag: "bg-sky-50 border-2 border-sky-100 text-sky-600 px-2.5 py-1 rounded-full text-xs font-black",
      label: "text-[10px] font-sans font-black text-slate-400 uppercase tracking-wider",
      text: "text-slate-600 font-sans text-xs md:text-sm",
      milestoneBorder: "border-slate-300"
    },
    pokemon: {
      card: "bg-white border-3 border-[#3b4cca] rounded-3xl p-6 shadow-[4px_4px_0_0_#3b4cca] hover:translate-y-[-2px] transition-all",
      subCard: "bg-gradient-to-br from-indigo-50 to-blue-50 border-3 border-blue-200 rounded-2xl p-4 shadow-[2px_2px_0_0_#ffcb05]",
      heading: "font-display font-black text-2.5xl text-slate-900 drop-shadow-xs",
      subheading: "font-display font-black text-xs text-[#3b4cca] uppercase tracking-wider",
      button: "px-4 py-2 bg-[#ffcb05] hover:bg-[#ffde59] text-[#2a3c5a] border-3 border-[#3b4cca] font-display font-black rounded-xl text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#3b4cca] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer",
      buttonRed: "px-4 py-2 bg-[#ee1515] hover:bg-[#f03b3b] text-white border-3 border-[#3b4cca] font-display font-black rounded-xl text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#3b4cca] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer",
      buttonGreen: "px-4 py-2 bg-[#4dad5b] hover:bg-[#5dbd6c] text-white border-3 border-[#3cb254] font-display font-black rounded-xl text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#4dad5b] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer",
      tag: "bg-yellow-50 border-2 border-[#ffcb05] text-amber-700 px-2.5 py-1 rounded-full text-xs font-black",
      label: "text-[10px] font-sans font-black text-[#3d7dca] uppercase tracking-widest",
      text: "text-slate-600 font-sans text-xs md:text-sm",
      milestoneBorder: "border-[#3b4cca]"
    },
    minecraft: {
      card: "bg-[#212121] border-3 border-[#3c3c3c] rounded-none p-6 shadow-[4px_4px_0_0_#000000] hover:translate-y-[-2px] transition-all text-stone-200",
      subCard: "bg-[#181818] border-2 border-dashed border-stone-700 rounded-none p-4",
      heading: "font-mono font-bold text-xl text-[#55ff55] tracking-wide",
      subheading: "font-mono font-bold text-xs text-[#ffff55] uppercase tracking-widest",
      button: "px-4 py-2 bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white border-2 border-[#8a8a8a] font-mono rounded-none text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000000] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer",
      buttonRed: "px-4 py-2 bg-[#aa0000] hover:bg-[#ff5555] text-white border-2 border-[#550000] font-mono rounded-none text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000000] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer",
      buttonGreen: "px-4 py-2 bg-[#00aa00] hover:bg-[#55ff55] text-white border-2 border-[#005500] font-mono rounded-none text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000000] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer",
      tag: "bg-stone-800 border border-stone-600 text-[#55ff55] px-2.5 py-1 rounded-none text-xs font-mono",
      label: "text-[10px] font-mono text-stone-500 uppercase tracking-widest",
      text: "text-stone-400 font-mono text-xs md:text-sm",
      milestoneBorder: "border-stone-600"
    }
  }[theme || "nintendo"];

  // Streak Claim States
  const [claimingMilestone, setClaimingMilestone] = useState<string | null>(null);
  const [streakClaimMessage, setStreakClaimMessage] = useState<{ success: boolean; text: string } | null>(null);

  const handleClaimStreakBonus = async (milestone: string) => {
    setClaimingMilestone(milestone);
    setStreakClaimMessage(null);
    try {
      const res = await fetch("/api/task/claim-streak-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, milestone })
      });
      const data = await res.json();
      if (data.success) {
        setStreakClaimMessage({
          success: true,
          text: `Felicitări clasa de elită! Ai revendicat bonusul de streak pentru ${milestone} zile consecutive de citit cu succes!`
        });
        onRefresh();
      } else {
        setStreakClaimMessage({
          success: false,
          text: data.error || "Eroare la revendicare."
        });
      }
    } catch {
      setStreakClaimMessage({
        success: false,
        text: "Eroare de rețea. Încearcă din nou!"
      });
    } finally {
      setClaimingMilestone(null);
    }
  };

  // States
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeReadingTask, setActiveReadingTask] = useState<ActiveTask | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizAllCorrect, setQuizAllCorrect] = useState<boolean | null>(null);

  // File upload state for chores
  const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);
  const [choreImageBase64, setChoreImageBase64] = useState<string | null>(null);
  const [isEvaluatingChore, setIsEvaluatingChore] = useState(false);
  const [choreResult, setChoreResult] = useState<{ success: boolean; feedback: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // File upload state for dog walks
  const [selectedDogWalkSlot, setSelectedDogWalkSlot] = useState<"morning" | "midday" | "evening" | null>(null);
  const [dogWalkImageBase64, setDogWalkImageBase64] = useState<string | null>(null);
  const [isEvaluatingDogWalk, setIsEvaluatingDogWalk] = useState(false);
  const [dogWalkResult, setDogWalkResult] = useState<{ success: boolean; feedback: string } | null>(null);
  const dogWalkFileInputRef = useRef<HTMLInputElement>(null);
  const [dogWalkDragOver, setDogWalkDragOver] = useState(false);

  // General state
  const [errorStatus, setErrorStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Children suggestions states
  const [sugType, setSugType] = useState<"activity" | "reward" | "other">("activity");
  const [sugTitle, setSugTitle] = useState("");
  const [sugPoints, setSugPoints] = useState<number | "">("");
  const [sugDuration, setSugDuration] = useState<number | "">("");
  const [sugDescription, setSugDescription] = useState("");
  const [isSubmittingSug, setIsSubmittingSug] = useState(false);
  const [sugMessage, setSugMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cashout money exchange states
  const [cashoutPoints, setCashoutPoints] = useState<number | "">("");
  const [isSubmittingCashout, setIsSubmittingCashout] = useState(false);
  const [cashoutMessage, setCashoutMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Secure modal confirmations
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Determine if reading is forced (consecutive days >= 3)
  const isReadingForced = child.daysSinceLastReading >= 3;

  // Sync active reading task if exists in the server state
  useEffect(() => {
    const task = state.activeTasks.find(
      (t) => t.childId === childId && t.type === "reading" && (t.status === "pending" || t.status === "rejected")
    );
    if (task) {
      setActiveReadingTask(task);
      // Pre-fill quiz answers if they exist in the task itself from a previous submission,
      // but do not wipe out active selections if the user is currently editing.
      const initialAnswers: Record<number, number> = {};
      task.readingQuestions?.forEach((q: any, i: number) => {
        if (q.selectedAnswerIndex !== undefined && q.selectedAnswerIndex !== null) {
          initialAnswers[i] = q.selectedAnswerIndex;
        }
      });
      setQuizAnswers((prev) => {
        if (Object.keys(prev).length > 0) {
          return prev; // keep user current interactive selection
        }
        return initialAnswers;
      });
    } else {
      setActiveReadingTask(null);
      setQuizAnswers({});
    }
  }, [state.activeTasks, childId]);

  // Clean success/error banners on delay
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Handle Reading Generation
  const handleGenerateReading = async (topicName: string) => {
    const finalTopic = topicName || customTopic;
    if (!finalTopic) {
      setErrorStatus("Te rog alege un subiect sau scrie unul personalizat!");
      return;
    }
    setErrorStatus("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/task/generate-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, topic: finalTopic })
      });
      const data = await res.json();
      if (data.success) {
        setActiveReadingTask(data.task);
        setSelectedTopic("");
        setCustomTopic("");
        onRefresh();
      } else {
        setErrorStatus(data.error || "A apărut o problemă la generarea lecturii.");
      }
    } catch (err) {
      setErrorStatus("Eroare de conexiune cu serverul.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Quiz Submission
  const handleSubmitQuiz = async () => {
    if (!activeReadingTask || !activeReadingTask.readingQuestions) return;
    
    // Check if answered all
    const questionsCount = activeReadingTask.readingQuestions.length;
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < questionsCount) {
      setQuizError("Răspunde la toate întrebările din test înainte de trimitere!");
      return;
    }

    setQuizError("");
    setIsSubmittingAnswers(true);

    try {
      const formattedAnswers = activeReadingTask.readingQuestions.map((_, i) => quizAnswers[i]);
      const res = await fetch("/api/task/submit-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          taskId: activeReadingTask.id,
          answers: formattedAnswers
        })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.isAllCorrect) {
          setQuizAllCorrect(true);
          setSuccessMsg("Felicitări! Ai răspuns corect și ai primit punctele!");
          setActiveReadingTask(null);
          setQuizAnswers({});
        } else {
          // Actualizează task-ul cu feedback-ul de la server (selectedAnswerIndex, feedback)
          setActiveReadingTask(data.task);
          setQuizAllCorrect(false);
          setQuizError("Ai făcut greșeli. Revizuiește textul și reîncearcă!");
        }
        onRefresh();
      } else {
        setQuizError(data.error || "Eroare la trimiterea răspunsurilor.");
      }
    } catch (err) {
      setQuizError("S-a produs o eroare de conexiune.");
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  // Dog Walk claiming with visual verification
  const handleClaimDogWalk = async () => {
    if (!selectedDogWalkSlot || !dogWalkImageBase64) return;
    setIsEvaluatingDogWalk(true);
    setDogWalkResult(null);
    setErrorStatus("");

    try {
      const res = await fetch("/api/task/claim-walk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          childId, 
          slot: selectedDogWalkSlot,
          photoBase64: dogWalkImageBase64
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.isApproved) {
          setDogWalkResult({
            success: true,
            feedback: data.feedback || "Plimbare aprobată și înregistrată cu succes!"
          });
          setSuccessMsg(`Minunat! Plimbarea de ${selectedDogWalkSlot === "morning" ? "dimineață" : selectedDogWalkSlot === "midday" ? "la prânz" : "seară"} a fost confirmată: +40 puncte!`);
          setTimeout(() => {
            setSelectedDogWalkSlot(null);
            setDogWalkImageBase64(null);
            setDogWalkResult(null);
          }, 6000);
        } else {
          setDogWalkResult({
            success: false,
            feedback: data.feedback || "Imaginea nu a fost aprobată. Te rugăm să trimiți o poză clară din exterior."
          });
        }
        onRefresh();
      } else {
        setErrorStatus(data.error || "Nu s-a putut trimite plimbarea.");
      }
    } catch (err) {
      setErrorStatus("Eroare tehnică de conexiune.");
    } finally {
      setIsEvaluatingDogWalk(false);
    }
  };

  // Drag and Drop & Image loading helpers for dog walks
  const handleDogWalkDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDogWalkDragOver(true);
    } else if (e.type === "dragleave") {
      setDogWalkDragOver(false);
    }
  };

  const handleDogWalkDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDogWalkDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processDogWalkFile(e.dataTransfer.files[0]);
    }
  };

  const handleDogWalkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processDogWalkFile(e.target.files[0]);
    }
  };

  const processDogWalkFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorStatus("Poți încărca doar imagini!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDogWalkImageBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop & Image loading helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragOver(true);
    } else if (e.type === "dragleave") {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorStatus("Poți încărca doar imagini!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setChoreImageBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit chore to server (Gemini analyzes image)
  const handleSubmitChore = async () => {
    if (!selectedChoreId || !choreImageBase64) return;
    setIsEvaluatingChore(true);
    setChoreResult(null);
    setErrorStatus("");

    try {
      const res = await fetch("/api/task/submit-chore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          taskId: selectedChoreId,
          photoBase64: choreImageBase64
        })
      });
      const data = await res.json();
      if (data.success) {
        const isApproved = data.task.status === "approved";
        setChoreResult({
          success: isApproved,
          feedback: data.task.choreFeedback || "Treabă evaluată!"
        });
        if (isApproved) {
          setSuccessMsg(`Sarcina "${data.task.name}" a fost aprobată!`);
          setTimeout(() => {
            setSelectedChoreId(null);
            setChoreImageBase64(null);
            setChoreResult(null);
          }, 6000);
        }
        onRefresh();
      } else {
        setErrorStatus(data.error || "Eroare la procesarea imaginii.");
      }
    } catch (err) {
      setErrorStatus("Eroare la conexiunea cu robotul de analizare AI.");
    } finally {
      setIsEvaluatingChore(false);
    }
  };

  // Purchase digital reward
  const handleBuyReward = async (rewardId: string, name: string, points: number) => {
    if (child.points < points) {
      setErrorStatus(`Ai doar ${child.points} puncte, iar recompensa costă ${points}! Continuă să rezolvi sarcini.`);
      return;
    }
    
    setConfirmModal({
      title: "Confirmare Recompensă 🎁",
      message: `Sigur dorești să schimbi ${points} puncte pentru recompensa "${name}"? Acest schimb va fi înregistrat și va porni cronometrul dedicat!`,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/store/buy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ childId, rewardId })
          });
          const data = await res.json();
          if (data.success) {
            setSuccessMsg(`Felicitări! Ai activat recompensa: "${name}".`);
            onRefresh();
          } else {
            setErrorStatus(data.error || "Nu s-a putut cumpăra recompensa.");
          }
        } catch (err) {
          setErrorStatus("Problemă la cumpărare.");
        }
      }
    });
  };

  // Submit children suggestions (activity / rewards) to parent
  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSugMessage(null);
    if (!sugTitle || !sugDescription) {
      setSugMessage({ type: "error", text: "Titlul și descrierea propunerii sunt obligatorii!" });
      return;
    }
    
    setIsSubmittingSug(true);
    try {
      const res = await fetch("/api/suggestions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          type: sugType,
          title: sugTitle,
          description: sugDescription,
          proposedPointsOrCost: sugPoints ? Number(sugPoints) : undefined,
          proposedDurationMinutes: sugDuration ? Number(sugDuration) : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setSugMessage({ type: "success", text: "Propunerea ta a fost trimisă cu succes la părinți! 🚀" });
        setSugTitle("");
        setSugDescription("");
        setSugPoints("");
        setSugDuration("");
        onRefresh();
      } else {
        setSugMessage({ type: "error", text: data.error || "Eroare la trimitere." });
      }
    } catch {
      setSugMessage({ type: "error", text: "Încercare eșuată. Probleme de conexiune cu serverul." });
    } finally {
      setIsSubmittingSug(false);
    }
  };

  // Convert points to real money
  const handleCashoutPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setCashoutMessage(null);
    const points = Number(cashoutPoints);
    if (!points || isNaN(points) || points <= 0) {
      setCashoutMessage({ type: "error", text: "Te rugăm să introduci un număr valid de puncte!" });
      return;
    }
    if (child.points < points) {
      setCashoutMessage({ type: "error", text: `Nu ai suficiente puncte! Soldul tău este de ${child.points} puncte.` });
      return;
    }

    setIsSubmittingCashout(true);
    try {
      const res = await fetch("/api/suggestions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          type: "cashout",
          proposedPointsOrCost: points,
          title: `Schimb în bani reali: ${points} Puncte`,
          description: `Conversie puncte în bani gheață: ${points} Puncte -> ${Math.round(points / 10)} RON`
        })
      });
      const data = await res.json();
      if (data.success) {
        setCashoutMessage({
          type: "success",
          text: `Cerere trimisă! Am retras ${points} puncte. Părinții îți pot înmâna cei ${Math.round(points / 10)} RON când aprobă diseară!`
        });
        setCashoutPoints("");
        onRefresh();
      } else {
        setCashoutMessage({ type: "error", text: data.error || "Eroare la procesare." });
      }
    } catch {
      setCashoutMessage({ type: "error", text: "Eroare de conexiune la server." });
    } finally {
      setIsSubmittingCashout(false);
    }
  };

  // Simple translations for slots
  const getSlotName = (slot: string) => {
    switch (slot) {
      case "morning": return "Plimbare Dimineață (până la 12:00)";
      case "midday": return "Plimbare Prânz (intervalul 12:00 - 15:00)";
      case "evening": return "Plimbare Seară (după-amiază/seară)";
      default: return slot;
    }
  };

  return (
    <div className="space-y-8" id="kid-dashboard-root">
      
      {/* Banner de avertisment sau succes */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md text-emerald-800 text-sm flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {errorStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-md text-rose-800 text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>{errorStatus}</span>
            </div>
            <button onClick={() => setErrorStatus("")} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Închide</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sistem Niveluri, Progres & Streak Copil */}
      {(() => {
        const lvl = getChildLevel(child, state.activeTasks);
        return (
          <div className={`${dashboardStyles.card} flex flex-col lg:flex-row items-center justify-between gap-6 transition-all duration-300`} id="kid-level-progress-banner">
            <div className="flex flex-col md:flex-row items-center gap-5 w-full lg:w-auto">
              {/* Avatar section */}
              <div className="relative shrink-0 flex items-center justify-center" id="kid-avatar-wrapper">
                <div className="text-5xl p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-200/40 select-none animate-pulse shrink-0" style={{ animationDuration: "3s" }}>
                  {child.avatar || "🎮"}
                </div>
                {/* Level badge */}
                <div className="absolute -bottom-2 bg-rose-600 text-white border-2 border-slate-900 font-display font-black text-[9px] px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                  Nivel
                </div>
              </div>

              {/* Level details */}
              <div className="text-center md:text-left flex-1" id="kid-level-detail-texts">
                <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 text-white font-extrabold uppercase">
                    {child.age} ani
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-black border-2 shadow-xs ${lvl.color}`} id="user-badge-level-name">
                    🥇 RANG: {lvl.name}
                  </span>
                </div>
                
                <p className="text-sm font-display font-bold text-slate-800 mt-2 leading-relaxed">
                  {lvl.desc}
                </p>

                {isReadingForced && (
                  <p className="text-xs text-rose-600 font-extrabold flex items-center gap-1 mt-1 animate-pulse">
                    ⚠️ POVESTEA ESTE OBLIGATORIE AZI! Lectură restantă de 3+ zile.
                  </p>
                )}

                <div className="mt-2.5 w-full max-w-sm bg-slate-100 rounded-full h-3.5 border border-slate-200 overflow-hidden" title={`${Math.round(lvl.progressPct)}% spre următorul rang`}>
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${lvl.progressPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                  Următorul rang: {lvl.nextGoal} ({Math.round(lvl.progressPct)}%)
                </p>
              </div>
            </div>

            {/* Streak & Core Activities Stats */}
            <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-center lg:justify-end" id="kid-stats-badges">
              {/* Reading Streak Card */}
              <div className={`${dashboardStyles.subCard} flex-1 sm:flex-initial flex flex-col items-center justify-center min-w-[130px] p-3 text-center`} id="metric-reading-streak">
                <span className={dashboardStyles.label}>Streak Lectură</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Flame className="w-5.5 h-5.5 text-rose-500 animate-bounce shrink-0" style={{ animationDuration: "2s" }} />
                  <span className="text-xl font-black">{child.readingStreak || 0} {child.readingStreak === 1 ? "zi" : "zile"}</span>
                </div>
              </div>

              {/* Total Approved Tasks Card */}
              <div className={`${dashboardStyles.subCard} flex-1 sm:flex-initial flex flex-col items-center justify-center min-w-[130px] p-3 text-center`} id="metric-approved-tasks">
                <span className={dashboardStyles.label}>Sarcini Aprobate</span>
                <div className="flex items-center gap-1.5 mt-1 justify-center">
                  <span className="text-xl">🌟</span>
                  <span className="text-xl font-black">{lvl.approvedCount} misiuni</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🏆 GOLDEN STREAK MILESTONES ROADMAP */}
      <div className={`${dashboardStyles.card} p-6 relative overflow-hidden`} id="kid-streak-milestones-widget">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border-2 border-rose-200">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-900 text-lg uppercase tracking-wide leading-tight">
                Drumul Streaku-lui de Aur 🔥
              </h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                Câștigă bonusuri de elită citind în fiecare zi! Streak curent: <span className="text-rose-600 font-black">{(child.readingStreak) || 0} {child.readingStreak === 1 ? "zi" : "zile"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-rose-500 bg-rose-50 border-2 border-rose-150 px-3 py-1.5 rounded-xl uppercase tracking-wider">
              ❤️ Retenție Activă
            </span>
          </div>
        </div>

        {streakClaimMessage && (
          <div className={`p-4 mb-5 border-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 ${
            streakClaimMessage.success ? "bg-emerald-50 border-emerald-400 text-emerald-900" : "bg-rose-50 border-rose-400 text-rose-900"
          }`}>
            <span className="flex items-center gap-2">
              {streakClaimMessage.success ? "🎉 " : "⚠️ "}{streakClaimMessage.text}
            </span>
            <button 
              onClick={() => setStreakClaimMessage(null)} 
              className="text-slate-400 hover:text-slate-700 font-black text-xs uppercase cursor-pointer"
            >
              Închide
            </button>
          </div>
        )}

        {/* 4 STREAK MILESTONES: 3 zile, 7 zile, 30 zile, 100 zile */}
        <style>{`
          @keyframes bronze-shimmer {
            0%, 100% { box-shadow: 0 0 8px rgba(180,83,9,0.3), 0 0 16px rgba(180,83,9,0.15); }
            50% { box-shadow: 0 0 16px rgba(180,83,9,0.6), 0 0 32px rgba(180,83,9,0.3), 0 0 48px rgba(180,83,9,0.1); }
          }
          @keyframes bronze-glow {
            0%, 100% { border-color: #b45309; }
            50% { border-color: #f59e0b; }
          }
        `}</style>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { tag: "3", title: "Pâlpâire de Bronz 🥉", streakReq: 3, reward: 15, color: "border-amber-700 bg-amber-50/40 text-amber-900", desc: "Zile consecutive de citit: 3", shimmer: true },
            { tag: "7", title: "Scânteie de Argint 🥈", streakReq: 7, reward: 40, color: "border-slate-400 bg-slate-50 text-slate-900", desc: "Săptămână completă de vară!", shimmer: false },
            { tag: "30", title: "Flacără de Aur 🥇", streakReq: 30, reward: 150, color: "border-yellow-500 bg-yellow-50/50 text-yellow-900", desc: "Super-cititorul lunii de vacanță!", shimmer: false },
            { tag: "100", title: "Legendă de Diamant 💎", streakReq: 100, reward: 500, color: "border-cyan-500 bg-cyan-50 text-cyan-900", desc: "Olimpic absolut la lectură!", shimmer: false }
          ].map((milestone) => {
            const hasStreak = (child.readingStreak || 0) >= milestone.streakReq;
            const claimed = child.claimedStreakMilestones?.includes(milestone.tag);
            const isBronzeUnclaimed = milestone.tag === "3" && hasStreak && !claimed;
            
            return (
              <div 
                key={milestone.tag}
                className={`p-4 rounded-2.5xl border-3 flex flex-col justify-between relative transition-all duration-200 ${
                  claimed 
                    ? "bg-slate-100/50 border-slate-300 opacity-70" 
                    : hasStreak
                      ? `${milestone.color} ${dashboardStyles.milestoneBorder} scale-102`
                      : "bg-white border-slate-200 text-slate-400"
                }`}
                style={isBronzeUnclaimed ? {
                  animation: 'bronze-shimmer 2s ease-in-out infinite, bronze-glow 3s ease-in-out infinite',
                } : {}}
              >
                {isBronzeUnclaimed && (
                  <div className="absolute -top-2.5 -right-2.5 bg-amber-600 text-white border-2 border-amber-800 font-black text-[7px] uppercase px-2 py-0.5 rounded-full animate-bounce z-10 shadow-lg">
                    Revendică!
                  </div>
                )}
                {claimed && (
                  <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white border-2 border-slate-950 font-black text-[8px] uppercase px-2 py-0.5 rounded-full rotate-[-4deg]">
                    Revendicat ✓
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold">
                      {milestone.tag === "3" ? "🥉" : milestone.tag === "7" ? "🥈" : milestone.tag === "30" ? "🥇" : "💎"}
                    </span>
                    <span className="font-display font-black text-[13px] tracking-tight truncate leading-none">
                      {milestone.title}
                    </span>
                  </div>
                  
                  <p className="text-[10px] uppercase font-mono font-black text-rose-600/90 tracking-wider">
                    TINTĂ: {milestone.streakReq} Zile consecutive
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1.5 leading-tight">
                    {milestone.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-amber-600">
                    +{milestone.reward} Puncte!
                  </span>

                  {claimed ? (
                    <span className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-0.5">
                      ✓ Deblocat
                    </span>
                  ) : hasStreak ? (
                    <button
                      onClick={() => handleClaimStreakBonus(milestone.tag)}
                      disabled={claimingMilestone !== null}
                      className={dashboardStyles.buttonGreen + " text-[9px] py-1.5 px-3"}
                    >
                      {claimingMilestone === milestone.tag ? "Procesare..." : "REVENDICĂ! 🎁"}
                    </button>
                  ) : (
                    <div className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 border border-slate-250 px-2 py-1 rounded-lg">
                      {milestone.streakReq - (child.readingStreak || 0)} zile rămase
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timer de Recompensă Activ (dacă este pornit de părinte sau achiziționat) */}
      <AnimatePresence>
        {child.activeTimer && child.activeTimer.isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`${dashboardStyles.card} bg-indigo-650 text-white border-indigo-700 flex flex-col md:flex-row items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                {child.activeTimer.rewardId === "xbox" ? <Gamepad2 className="w-8 h-8" /> : <Tv className="w-8 h-8" />}
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-indigo-200 uppercase">Recompensă Digitală Activată</span>
                <h3 className="text-2xl font-black mt-0.5">{child.activeTimer.rewardName}</h3>
                <p className="text-xs text-indigo-100/90 mt-1">
                  Start: {new Date(child.activeTimer.startedAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })} | 
                  Expiră la: {new Date(child.activeTimer.expiresAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            <div className="bg-black/20 px-6 py-4 rounded-2xl border border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-black uppercase text-indigo-200">Cronometru Rămas</span>
              <span className="text-3.5xl font-black text-white flex items-center gap-2 mt-0.5 font-mono">
                <Clock className="w-6 h-6 text-cyan-300 animate-spin" style={{ animationDuration: "12s" }} /> 
                {child.activeTimer.minutesLeft}m
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTIUNEA 1: MODUL CITIT / GENERARE LECTURĂ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panou de selecție temă sau citit activ */}
        <div className="lg:col-span-2 space-y-6">
          <ReadingWidget
            child={child}
            activeReadingTask={activeReadingTask}
            isGenerating={isGenerating}
            isReadingForced={isReadingForced}
            customTopic={customTopic}
            setCustomTopic={setCustomTopic}
            quizError={quizError}
            quizAnswers={quizAnswers}
            setQuizAnswers={setQuizAnswers}
            isSubmittingAnswers={isSubmittingAnswers}
            handleGenerateReading={handleGenerateReading}
            onAbandonConfirm={() => {
              setConfirmModal({
                title: "Abandonare Lectură 📚",
                message: "Sigur vrei să renunți la acest text de lectură? Întrebările de verificare vor fi pierdute.",
                onConfirm: async () => {
                  try {
                    const res = await fetch("/api/task/abandon-reading", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ childId, taskId: activeReadingTask.id })
                    });
                    if (res.ok) {
                      setActiveReadingTask(null);
                      onRefresh();
                    }
                  } catch (err) {
                    console.error("Failed to abandon reading task:", err);
                  }
                }
              });
            }}
            handleSubmitQuiz={handleSubmitQuiz}
          />
        </div>

        {/* Panou Lateral: PLIMBARE CÂINE & EXCLUSIVITATE */}
        {state.dogWalkEnabled && <div className="space-y-6">
          <div className={`${dashboardStyles.card}`} id="dog-walk-widget">
            <h3 className="text-lg font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Sarcina: Plimbat Câinele
            </h3>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">
              Câinele familiei trebuie plimbat de 3 ori pe zi. Atenție la regula de exclusivitate: dacă fratele tău a dus deja câinele afară într-un interval, tu nu mai poți merge din nou pentru acel slot. Primul sosit, primul servit!
            </p>

            <div className="space-y-4">
              {(["morning", "midday", "evening"] as const).map((slot) => {
                const status = state.dogWalkStatus[slot];
                const isClaimedByMe = status.childId === childId;
                const isClaimedByOther = status.childId !== null && status.childId !== childId;
                const otherName = isClaimedByOther ? (state.children.find(c => c.id === status.childId)?.name || 'Frate') : '';
                
                const currentHour = new Date().getHours();
                let slotLockReason = "";
                let isSlotLocked = false;
                
                if (slot === "morning") {
                  if (currentHour >= 12) {
                    isSlotLocked = true;
                    slotLockReason = "Expirat (După ora 12:00)";
                  }
                } else if (slot === "midday") {
                  if (currentHour < 11 || currentHour >= 17) {
                    isSlotLocked = true;
                    slotLockReason = "De la 11:00 la 17:00";
                  }
                } else if (slot === "evening") {
                  if (currentHour < 16) {
                    isSlotLocked = true;
                    slotLockReason = "Doar după ora 16:00";
                  }
                }
                
                return (
                  <div key={slot} className={`${dashboardStyles.subCard} flex flex-col justify-between gap-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {slot === "morning" ? "🌞 Dimineață" : slot === "midday" ? "La Prânz (12:00)" : "🌛 Seară"}
                      </span>
                      <span className="text-xs font-mono font-black text-amber-600">+40 Pcts</span>
                    </div>

                    {isClaimedByMe && (
                      <div className="space-y-2">
                        <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs rounded-xl flex items-start gap-2 font-medium leading-relaxed shadow-xs">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-1 w-full">
                            <span className="block font-bold">Ai completat această plimbare la {new Date(status.time!).toLocaleTimeString("ro-RO", {hour:"2-digit", minute:"2-digit"})}.</span>
                            {status.feedback && (
                              <p className="text-[11px] text-emerald-700 italic font-bold">Feedback AI: "{status.feedback}"</p>
                            )}
                          </div>
                        </div>
                        {status.photoUrl && (
                          <div className="relative rounded-2xl overflow-hidden border border-emerald-150 h-32 bg-slate-50 flex items-center justify-center">
                            <img src={status.photoUrl} alt="Dovadă Plimbare Câine" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    )}

                    {isClaimedByOther && (
                      <div className="space-y-2">
                        <div className="p-2 bg-slate-100 text-slate-500 border border-slate-200 text-xs rounded-xl flex items-start gap-2 font-medium leading-relaxed">
                          <X className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div className="space-y-1 w-full">
                            <span className="block font-bold">Plimbat deja de {otherName}.</span>
                            {status.feedback && (
                              <p className="text-[11px] text-slate-400 italic">Feedback AI: "{status.feedback}"</p>
                            )}
                          </div>
                        </div>
                        {status.photoUrl && (
                          <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-32 bg-slate-50 flex items-center justify-center grayscale opacity-85">
                            <img src={status.photoUrl} alt="Dovadă Plimbare" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    )}

                    {!status.childId && (
                      isSlotLocked ? (
                        <button
                          disabled
                          className="w-full py-2.5 text-xs font-black rounded-xl text-center bg-zinc-100 text-zinc-400 cursor-not-allowed border border-dashed border-zinc-200 flex items-center justify-center gap-1.5"
                        >
                          🔒 {slotLockReason}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedDogWalkSlot(slot);
                            setDogWalkImageBase64(null);
                            setDogWalkResult(null);
                            setDogWalkDragOver(false);
                          }}
                          disabled={isReadingForced}
                          className={`w-full py-2.5 text-xs font-black rounded-xl text-center transition duration-150 cursor-pointer shadow-xs ${
                            isReadingForced 
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed border-0"
                              : "bg-indigo-600 hover:bg-indigo-750 text-white"
                          }`}
                        >
                          {isReadingForced ? "Limitat: Citește întâi" : "Trimite Dovadă Poză 📸"}
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>}
      </div>

      
      {/* SECTIUNEA 2: SARCINI CASNICE (TREBURI ÎN CASĂ CU VALIDARE PRIN POZĂ) */}
      <div className={`${dashboardStyles.card}`} id="domestic-activities-widget">
        <h3 className="text-lg font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-650 animate-bounce" />
          Sarcini Casnice: Validare Automată cu Gemini Vision 👁️
        </h3>
        <p className="text-sm text-slate-500 mb-6 font-semibold">
          Încarcă o dovadă (o fotografie cu munca ta gata terminată: camera curățată, patul făcut sau vasele strălucitoare). Robotul AI Gemini va inspecta inteligent imaginea și îți oferă feedback-ul și punctele pe loc!
        </p>

        {/* Grid Sarcini Casnice */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.activeTasks
            .filter((t) => t.childId === childId && t.type === "chore")
            .map((task) => {
              const isCompleted = task.status === "approved";
              const isPendingApproval = task.status === "submitted";
              const isRejected = task.status === "rejected";
              
              return (
                <div key={task.id} className={`${dashboardStyles.subCard} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-extrabold text-slate-900 text-sm">{task.name}</h4>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wide shrink-0 ${
                        isCompleted ? "bg-emerald-100 text-emerald-800" 
                        : isPendingApproval ? "bg-amber-100 text-amber-800"
                        : isRejected ? "bg-rose-100 text-rose-800"
                        : "bg-indigo-50 text-indigo-800"
                      }`}>
                        {isCompleted ? "Aprobat" : isPendingApproval ? "Se verifică" : isRejected ? "Respins" : "În așteptare"}
                      </span>
                    </div>

                     {/* Task Category & Streak Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {(() => {
                        const colors: Record<string, string> = {
                          "Educational": "bg-blue-50 text-blue-700 border-blue-200",
                          "Physical Activity": "bg-rose-50 text-rose-700 border-rose-200",
                          "Household": "bg-emerald-400/10 text-emerald-800 border-emerald-300/30",
                          "Other": "bg-slate-50 text-slate-700 border-slate-200",
                          "lectură": "bg-blue-50 text-blue-700 border-blue-200",
                          "sport": "bg-rose-50 text-rose-700 border-rose-200",
                          "STEM": "bg-violet-50 text-violet-700 border-violet-200",
                          "robotică": "bg-cyan-50 text-cyan-700 border-cyan-200",
                          "LEGO": "bg-amber-50 text-amber-700 border-amber-200",
                          "natură": "bg-emerald-50 text-emerald-700 border-emerald-200"
                        };
                        const cat = task.category || "Household";
                        const cls = colors[cat] || colors["Other"];
                        const catName = cat === "lectură" ? "📚 Lectură"
                          : cat === "sport" ? "⚽ Sport"
                          : cat === "STEM" ? "🔬 STEM"
                          : cat === "robotică" ? "🤖 Robotică"
                          : cat === "LEGO" ? "🧱 LEGO"
                          : cat === "natură" ? "🌿 Natură"
                          : cat;
                        return (
                          <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider border ${cls}`}>
                            🏷️ {catName}
                          </span>
                        );
                      })()}
                      
                      <span className="text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-0.5">
                        🔥 Streak: {task.streak || 0} { (task.streak || 0) === 1 ? "zi" : "zile" }
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{task.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Recompensă</span>
                      <span className="font-mono font-black text-amber-600">+{task.points} Pcts</span>
                    </div>

                    {task.choreFeedback && (
                      <div className={`mt-4 p-3 rounded-2xl border-2 text-xs leading-normal font-medium ${
                        isCompleted ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-rose-50 border-rose-200 text-rose-950"
                      }`}>
                        <div className="font-bold flex items-center gap-1 mb-1">
                          {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                          Evaluare Gemini:
                        </div>
                        <p className="italic opacity-90">"{task.choreFeedback}"</p>
                      </div>
                    )}
                  </div>

                  {!isCompleted && !isPendingApproval && (
                    <div className="mt-5">
                      <button
                        onClick={() => {
                          setSelectedChoreId(task.id);
                          setChoreImageBase64(null);
                          setChoreResult(null);
                        }}
                        disabled={isReadingForced}
                        className={`w-full py-2.5 text-xs font-black rounded-xl text-center border-2 transition duration-155 cursor-pointer ${
                          isReadingForced 
                            ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                            : "border-indigo-650 text-indigo-750 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-750 font-extrabold"
                        }`}
                      >
                        {isReadingForced ? "Limitat: Citește mai întâi" : "Trimite Dovadă Poză 📸"}
                      </button>
                    </div>
                  )}

                  {isPendingApproval && (
                    <div className="mt-4 p-2 bg-amber-50 text-amber-800 text-center rounded-xl text-xs animate-pulse font-extrabold">
                      Se analizează poza ta cu Gemini...
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Modal de upload dovadă poză */}
        {selectedChoreId && (
          <CameraWidget
            title={`Dovadă poză pentru: ${state.activeTasks.find(t => t.id === selectedChoreId)?.name}`}
            imagePreview={choreImageBase64}
            dragOver={dragOver}
            isEvaluating={isEvaluatingChore}
            evalResult={choreResult}
            fileInputRef={fileInputRef}
            onClose={() => setSelectedChoreId(null)}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onFileChange={handleFileChange}
            onSubmit={handleSubmitChore}
          />
        )}

        {/* Modal de upload dovadă poză pentru Plimbare Câine */}
        {selectedDogWalkSlot && (
          <CameraWidget
            title={`Dovadă poză: Plimbare Câine (${
              selectedDogWalkSlot === "morning" ? "Dimineață" : selectedDogWalkSlot === "midday" ? "La prânz" : "Seară"
            })`}
            imagePreview={dogWalkImageBase64}
            dragOver={dogWalkDragOver}
            isEvaluating={isEvaluatingDogWalk}
            evalResult={dogWalkResult}
            fileInputRef={dogWalkFileInputRef}
            onClose={() => setSelectedDogWalkSlot(null)}
            onDragEnter={handleDogWalkDrag}
            onDragOver={handleDogWalkDrag}
            onDragLeave={handleDogWalkDrag}
            onDrop={handleDogWalkDrop}
            onFileChange={handleDogWalkFileChange}
            onSubmit={handleClaimDogWalk}
          />
        )}
      </div>

      {/* SECTIUNEA 3: MAGAZINUL DE TIMP ȘI SCHIMB RECOMPENSE */}
      <RewardsWidget
        state={state}
        isReadingForced={isReadingForced}
        cashoutPoints={cashoutPoints}
        setCashoutPoints={setCashoutPoints}
        cashoutMessage={cashoutMessage}
        isSubmittingCashout={isSubmittingCashout}
        handleBuyReward={handleBuyReward}
        handleCashoutPoints={handleCashoutPoints}
      />

      {/* SECTIUNEA 3.5: CERERILE MELE — vezi toate solicitările tale */}
      <div className={`${dashboardStyles.card}`}>
        <h3 className={`${dashboardStyles.heading} flex items-center gap-2 mb-4`}>
          <Send className="w-5 h-5 text-indigo-500" />
          Cererile Mele 📋
        </h3>
        <p className={`${dashboardStyles.text} mb-4`}>
          Aici vezi toate cererile tale trimise către părinți — activități, recompense sau schimb în bani.
        </p>
        {(() => {
          const mySuggestions = state.suggestions
            .filter(s => s.childId === childId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          if (mySuggestions.length === 0) {
            return (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-400 font-semibold text-xs">Nu ai trimis nicio cerere încă. Propune o activitate sau recompensă mai sus! 🚀</p>
              </div>
            );
          }
          return (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {mySuggestions.map((sug) => {
                const statusIcon = sug.status === 'approved' ? '✅' : sug.status === 'rejected' ? '❌' : '⏳';
                const statusBg = sug.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : sug.status === 'rejected' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200';
                return (
                  <div key={sug.id} className={`p-3 rounded-xl border-2 ${statusBg} flex items-start gap-3`}>
                    <span className="text-lg mt-0.5">{statusIcon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{sug.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          sug.type === 'activity' ? 'bg-blue-100 text-blue-700' :
                          sug.type === 'reward' ? 'bg-purple-100 text-purple-700' :
                          sug.type === 'cashout' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sug.type === 'activity' ? 'Activitate' : sug.type === 'reward' ? 'Recompensă' : sug.type === 'cashout' ? 'Bani' : 'Altul'}
                        </span>
                      </div>
                      {sug.description && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{sug.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-400 font-semibold">
                        <span>{new Date(sug.createdAt).toLocaleDateString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
                        {sug.proposedPointsOrCost !== undefined && (
                          <span>{sug.type === 'cashout' ? `${sug.proposedPointsOrCost} Pct → ${Math.round(sug.proposedPointsOrCost / 10)} RON` : `${sug.proposedPointsOrCost} Pct`}</span>
                        )}
                        {sug.status === 'approved' && <span className="text-emerald-600 font-bold">Aprobată ✅</span>}
                        {sug.status === 'rejected' && <span className="text-rose-500 font-bold">Respinsă</span>}
                        {sug.status === 'pending' && <span className="text-amber-600 font-bold animate-pulse">În așteptare</span>}
                      </div>
                      {sug.adminFeedback && (
                        <div className="mt-1.5 text-[10px] text-slate-600 bg-white/60 rounded-lg p-2 border border-slate-100">
                          <span className="font-bold">Răspuns părinte:</span> {sug.adminFeedback}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* SECTIUNEA 4: PROPUNE O ACTIVITATE/RECOMPENSĂ NOUĂ & ASISTENT COMPANION */}
      <HomeAssistantWidget
        child={child}
        state={state}
        sugType={sugType}
        setSugType={setSugType}
        sugTitle={sugTitle}
        setSugTitle={setSugTitle}
        sugPoints={sugPoints}
        setSugPoints={setSugPoints}
        sugDuration={sugDuration}
        setSugDuration={setSugDuration}
        sugDescription={sugDescription}
        setSugDescription={setSugDescription}
        sugMessage={sugMessage}
        isSubmittingSug={isSubmittingSug}
        handleSubmitSuggestion={handleSubmitSuggestion}
      />

      {/* Custom Secure confirmModal Portal/Overlay */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="custom-child-confirm-portal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-extrabold pb-2 border-b border-indigo-100">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <h4 className="text-xs uppercase tracking-wider font-sans font-black">{confirmModal.title}</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Anulează
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer shadow-md"
              >
                Confirmă
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
