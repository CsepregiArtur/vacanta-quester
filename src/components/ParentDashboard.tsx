/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { 
  Shield, 
  Users, 
  Bell, 
  Settings, 
  Calendar, 
  RefreshCw, 
  Save, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Activity,
  AlertTriangle,
  Lightbulb,
  Check,
  Power,
  Trash2,
  Lock,
  Mail,
  Eye,
  Send,
  Server,
  Plus,
  Minus,
  X,
  Award
} from "lucide-react";
import { AppState, Child, NextDayTopicProposal, ParentNotification } from "../types";
import { dashboardThemes } from "../styles/themes";
import type { ThemeName } from "../styles/themes";

const MARKETPLACE_TEMPLATES = [
  {
    category: "lectură",
    name: "Aventură în Capitole 📖",
    points: 30,
    description: "Citește timp de 30 de minute dintr-o carte din biblioteca ta și notează ideea principală sau ce personaj ți-a plăcut."
  },
  {
    category: "lectură",
    name: "Lectură: Lectură audio sau cu voce tare 📚",
    points: 25,
    description: "Citește cu voce tare o poveste drăguță pentru părinți sau ascultă un fragment timp de 20 minute."
  },
  {
    category: "sport",
    name: "Sărituri și Flotări Active ⚽",
    points: 40,
    description: "Fă 20 de genuflexiuni amuzante, 15 sărituri jumping jacks și 10 flotări, sau aleargă afară în parc."
  },
  {
    category: "sport",
    name: "Sport: Drumeție sau Plimbare pe Bicicletă 🚲",
    points: 50,
    description: "Mergi pe bicicletă, trotinete sau fă o plimbare lungă cu rolele în aer liber timp de cel puțin 20 minute."
  },
  {
    category: "STEM",
    name: "Experiment Științific Magic 🔬",
    points: 50,
    description: "Realizează un mic experiment practic acasă (de ex: plutește/se scufundă sau curcubeu cu apă caldă) împreună cu familia."
  },
  {
    category: "STEM",
    name: "STEM: Probleme de Logică Distractive 🧠",
    points: 40,
    description: "Rezolvă 3 exerciții sau provocări de matematică/logică dintr-o revistă educativă sau de pe internet."
  },
  {
    category: "robotică",
    name: "Robotică: Circuitul cu Senzori dotați 🔋",
    points: 55,
    description: "Construiește un circuit tehnic real sau simulează un montaj electronic cu mici baterii, motorașe sau luminițe."
  },
  {
    category: "robotică",
    name: "Robotică: Programare Animație în Scratch 🤖",
    points: 60,
    description: "Creează un mic cod programabil în Scratch sau pe o platformă vizuală să miște un mic personaj distractiv."
  },
  {
    category: "LEGO",
    name: "LEGO: Design Construcție Cosmică 🧱",
    points: 35,
    description: "Construiește o navă spațială, un castel original sau o bază secretă din propriile cuburi LEGO (fără ghid/instrucțiuni)."
  },
  {
    category: "LEGO",
    name: "LEGO: Proiect Podul Rezistent 🌉",
    points: 35,
    description: "Fă un pod din piese LEGO lung de minim 25 cm, care să poată susține o carte sau telefonul mobil."
  },
  {
    category: "natură",
    name: "Natură: Detectivul de Plante și Frunze 🌿",
    points: 35,
    description: "Ieși în curte sau în parc și adună/fotografiază 4 frunze diferite sau 3 specii de flori colorate."
  },
  {
    category: "natură",
    name: "Natură: Îngrijirea Florilor și a Păsărilor 🌻",
    points: 30,
    description: "Udă cu drag florile din ghivece sau de afară, și pune apă proaspătă pentru păsările din grădină."
  }
];

interface ParentDashboardProps {
  state: AppState;
  onRefresh: () => void;
  onLock?: () => void;
  theme?: ThemeName;
  onChangeTheme?: (theme: ThemeName) => void;
  kidFullScreen?: boolean;
  onToggleKidFullScreen?: () => void;
}

export default function ParentDashboard({ state, onRefresh, onLock, theme, onChangeTheme, kidFullScreen, onToggleKidFullScreen }: ParentDashboardProps) {
  const dashboardStyles = dashboardThemes[theme || "nintendo"];

  // Custom secure iframe-friendly modal confirmations
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Email Notification Outbox & Configuration setup
  const [parentEmailInput, setParentEmailInput] = useState("csepregi.arthur@gmail.com");
  const [emailsSentList, setEmailsSentList] = useState<any[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  // SMTP Settings States
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestStatus, setSmtpTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  // PIN change states
  const [oldPinInput, setOldPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Local Forms
  const [haUrl, setHaUrl] = useState(state.homeAssistant.url);
  const [haToken, setHaToken] = useState(state.homeAssistant.token);
  const [haEnabled, setHaEnabled] = useState(state.homeAssistant.enabled);
  const [tvEntity, setTvEntity] = useState(state.homeAssistant.tvEntityId || "input_boolean.tv_kids_time");
  const [xboxEntity, setXboxEntity] = useState(state.homeAssistant.xboxEntityId || "input_boolean.xbox_kids_time");

  // Child stats override/adjustment states
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState<number>(0);
  const [editStreak, setEditStreak] = useState<number>(0);
  const [editDaysSince, setEditDaysSince] = useState<number>(0);
  const [isAdjustingChild, setIsAdjustingChild] = useState(false);

  // Topics and customizations
  const [dominicTopic, setDominicTopic] = useState(state.topicProposals.find(p => p.childId === "dominic")?.topic || "Robotica și Viitorul");
  const [dominicCustomPrompt, setDominicCustomPrompt] = useState(state.topicProposals.find(p => p.childId === "dominic")?.customPrompt || "");
  const [dominicCustomQuestions, setDominicCustomQuestions] = useState(state.topicProposals.find(p => p.childId === "dominic")?.customQuestions || "");

  const [sofiaTopic, setSofiaTopic] = useState(state.topicProposals.find(p => p.childId === "sofia")?.topic || "Evoluția Universului");
  const [sofiaCustomPrompt, setSofiaCustomPrompt] = useState(state.topicProposals.find(p => p.childId === "sofia")?.customPrompt || "");
  const [sofiaCustomQuestions, setSofiaCustomQuestions] = useState(state.topicProposals.find(p => p.childId === "sofia")?.customQuestions || "");

  // Status variables
  const [suggestionFeedback, setSuggestionFeedback] = useState<Record<string, string>>({});
  const [screenTimeTab, setScreenTimeTab] = useState<"pending" | "history">("pending");
  const [fulfillingReqId, setFulfillingReqId] = useState<string | null>(null);
  const [isSavingHA, setIsSavingHA] = useState(false);
  const [isSavingTopic, setIsSavingTopic] = useState<Record<string, boolean>>({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [successBanner, setSuccessBanner] = useState("");
  const [errorBanner, setErrorBanner] = useState("");

  // Evening scheduler tomorrow allocations variables
  const [tomorrowApps, setTomorrowApps] = useState<Record<string, string>>({
    dominic: "tv",
    sofia: "xbox"
  });
  const [tomorrowMinutes, setTomorrowMinutes] = useState<Record<string, number>>({
    dominic: 0,
    sofia: 0
  });
  const [tomorrowReasons, setTomorrowReasons] = useState<Record<string, string>>({
    dominic: "Pentru purtare frumoasă și activități bune",
    sofia: "Pentru participarea excelentă la lecturi"
  });
  const [isSavingTomorrowSchedule, setIsSavingTomorrowSchedule] = useState(false);

  // Filters for activity time logging widget
  const [timeFilterChild, setTimeFilterChild] = useState<string>("all");
  const [timeFilterType, setTimeFilterType] = useState<"all" | "reading" | "quiz" | "dog_walk" | "chore">("all");

  // States for Activities Marketplace
  const [marketChild, setMarketChild] = useState<"dominic" | "sofia">("dominic");
  const [marketCategory, setMarketCategory] = useState<string>("lectură");
  const [marketCustomName, setMarketCustomName] = useState("");
  const [marketCustomDesc, setMarketCustomDesc] = useState("");
  const [marketCustomPoints, setMarketCustomPoints] = useState(30);
  const [isSubmitingMarket, setIsSubmitingMarket] = useState(false);
  const [marketFeedback, setMarketFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Admin Config Panel States
  const [adminTab, setAdminTab] = useState<'activities' | 'rewards'>('activities');
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editActPoints, setEditActPoints] = useState(0);
  const [editActName, setEditActName] = useState('');
  const [editRewardPoints, setEditRewardPoints] = useState<Record<string, number>>({});
  const [newActName, setNewActName] = useState('');
  const [newActDesc, setNewActDesc] = useState('');
  const [newActPoints, setNewActPoints] = useState(30);
  const [newActIcon, setNewActIcon] = useState('⭐');
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(50);
  const [newRewardDuration, setNewRewardDuration] = useState(30);
  const [newRewardIcon, setNewRewardIcon] = useState('🎁');

  // Selected children reports & logs states
  const [selectedReportChild, setSelectedReportChild] = useState<"dominic" | "sofia">("dominic");
  const [selectedReportTab, setSelectedReportTab] = useState<"reading" | "photos" | "screentime">("reading");
  const [viewerPhotoUrl, setViewerPhotoUrl] = useState<string | null>(null);

  const tomorrowScheduleLoadedRef = React.useRef(false);

  // Sync scheduled configurations when the database refreshes (only once on first load to avoid resetting parent input mid-typing)
  React.useEffect(() => {
    if (state && state.tomorrowSchedule && !tomorrowScheduleLoadedRef.current) {
      const apps = { ...tomorrowApps };
      const minutes = { ...tomorrowMinutes };
      const reasons = { ...tomorrowReasons };
      let hasData = false;
      Object.keys(state.tomorrowSchedule).forEach((childKey) => {
        const item = state.tomorrowSchedule[childKey];
        if (item) {
          hasData = true;
          if (item.app) apps[childKey] = item.app;
          if (item.durationMinutes !== undefined) minutes[childKey] = Number(item.durationMinutes);
          if (item.reason) reasons[childKey] = item.reason;
        }
      });
      if (hasData) {
        setTomorrowApps(apps);
        setTomorrowMinutes(minutes);
        setTomorrowReasons(reasons);
        tomorrowScheduleLoadedRef.current = true;
      }
    }
  }, [state]);

  const fetchEmailsData = async () => {
    setIsFetchingEmails(true);
    try {
      const res = await fetch("/api/parent/emails");
      if (res.ok) {
        const data = await res.json();
        setEmailsSentList(data.emails || []);
        if (data.parentEmail) {
          setParentEmailInput(data.parentEmail);
        }
        if (data.smtpConfig) {
          setSmtpEnabled(data.smtpConfig.enabled || false);
          setSmtpHost(data.smtpConfig.host || "smtp.gmail.com");
          setSmtpPort(data.smtpConfig.port || 587);
          setSmtpUser(data.smtpConfig.user || "");
          setSmtpPass(data.smtpConfig.pass || "");
          setSmtpSecure(data.smtpConfig.secure || false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch simulated parent emails:", err);
    } finally {
      setIsFetchingEmails(false);
    }
  };

  React.useEffect(() => {
    fetchEmailsData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setSuccessBanner("");
    setErrorBanner("");
    try {
      const res = await fetch("/api/parent/save-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentEmail: parentEmailInput,
          smtpConfig: {
            enabled: smtpEnabled,
            host: smtpHost,
            port: Number(smtpPort),
            user: smtpUser,
            pass: smtpPass,
            secure: smtpSecure
          }
        })
      });
      if (res.ok) {
        setSuccessBanner(`Configurația notificărilor prin e-mail și setările SMTP au fost înregistrate cu succes!`);
        fetchEmailsData();
        onRefresh();
      } else {
        setErrorBanner("Eroare la configurarea setărilor de e-mail.");
      }
    } catch {
      setErrorBanner("Eroare la comunicarea cu serverul.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestStatus(null);
    try {
      const res = await fetch("/api/parent/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost,
          port: Number(smtpPort),
          user: smtpUser,
          pass: smtpPass,
          secure: smtpSecure,
          testEmail: parentEmailInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setSmtpTestStatus({
          success: true,
          message: `Conexiune SMTP reușită! Un e-mail de test real a fost expediat către ${parentEmailInput} cu succes!`
        });
      } else {
        setSmtpTestStatus({
          success: false,
          message: `Test SMTP eșuat: ${data.error || "Eroare conexiune"}`
        });
      }
    } catch {
      setSmtpTestStatus({
        success: false,
        message: "Eroare de conexiune la serverul SMTP local."
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSaveHA = async () => {
    setIsSavingHA(true);
    setSuccessBanner("");
    setErrorBanner("");
    try {
      const res = await fetch("/api/parent/save-ha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: haUrl,
          token: haToken,
          enabled: haEnabled,
          tvEntityId: tvEntity,
          xboxEntityId: xboxEntity
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner("Configurația pentru Home Assistant a fost salvată și activată cu succes!");
        onRefresh();
      } else {
        setErrorBanner(data.error || "Nu s-a putut salva configurarea HA.");
      }
    } catch {
      setErrorBanner("Eroare la transmiterea datelor către server.");
    } finally {
      setIsSavingHA(false);
    }
  };

  const handleSaveTopic = async (childId: string) => {
    setIsSavingTopic(prev => ({ ...prev, [childId]: true }));
    setSuccessBanner("");
    setErrorBanner("");
    
    const topic = childId === "dominic" ? dominicTopic : sofiaTopic;
    const customPrompt = childId === "dominic" ? dominicCustomPrompt : sofiaCustomPrompt;
    const customQuestions = childId === "dominic" ? dominicCustomQuestions : sofiaCustomQuestions;

    try {
      const res = await fetch("/api/parent/approve-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          topic,
          customPrompt,
          customQuestions
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Subiectul pentru mâine pentru ${childId === "dominic" ? "Dominic" : "Sofia"} a fost aprobat și personalizat!`);
        onRefresh();
      } else {
        setErrorBanner("Eroare la definirea subiectului.");
      }
    } catch {
      setErrorBanner("Nu s-a putut conecta la server.");
    } finally {
      setIsSavingTopic(prev => ({ ...prev, [childId]: false }));
    }
  };

  const promptStopTimer = (childId: string) => {
    setConfirmModal({
      title: "Oprire Cronometru ⏱️",
      message: "Sigur dorești să oprești manual acest cronometru de timp pe ecran? Această acțiune va stinge televizorul/consola în Home Assistant.",
      onConfirm: () => executeStopTimer(childId)
    });
  };

  const executeStopTimer = async (childId: string) => {
    try {
      const res = await fetch("/api/parent/stop-timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner("Sesiunea de ecran a fost întreruptă, iar comanda off a fost trimisă la Home Assistant.");
        onRefresh();
      }
    } catch {
      setErrorBanner("Eroare la comunicarea opririi.");
    }
  };

  const promptSimulateNextDay = () => {
    setConfirmModal({
      title: "Simulare Ziua Următoare 🌅",
      message: "Atenție! Această opțiune va muta vacanța cu +1 zi înainte. Va reseta treburile casnice gata făcute, rutinele de igienă personală, turele de plimbat câinele, va șterge cronometrele active și va trimite raportul de vacanță. Dorești să continui?",
      onConfirm: () => executeSimulateNextDay()
    });
  };

  const executeSimulateNextDay = async () => {
    setIsSimulating(true);
    setSuccessBanner("");
    setErrorBanner("");
    try {
      const res = await fetch("/api/parent/simulate-next-day", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner("Succes! O nouă zi de vacanță a sosit. Toate activitățile zilnice au fost resetate cu succes!");
        onRefresh();
      } else {
        setErrorBanner(data.error || "Simularea de zi următoare a fost respinsă de server.");
      }
    } catch {
      setErrorBanner("Eroare în timpul simulării.");
    } finally {
      setIsSimulating(false);
    }
  };

  const promptResetSystem = () => {
    setConfirmModal({
      title: "Resetare Bază de Date 🚨",
      message: "ATENȚIE! Aceasta va reseta complet baza de date la starea inițială de fabrică. Toate punctele, timpii și setările vor fi pierdute permanent. Continui?",
      onConfirm: () => executeResetSystem()
    });
  };

  const executeResetSystem = async () => {
    setIsResetting(true);
    setSuccessBanner("");
    setErrorBanner("");
    try {
      const res = await fetch("/api/state/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner("Sistemul a fost resetat în întregime!");
        setHaUrl("");
        setHaToken("");
        setHaEnabled(false);
        onRefresh();
      }
    } catch {
      setErrorBanner("Probleme la resetare.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveChildAdjust = async (childId: string) => {
    setIsAdjustingChild(true);
    setSuccessBanner("");
    setErrorBanner("");
    try {
      const res = await fetch("/api/parent/adjust-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          points: editPoints,
          readingStreak: editStreak,
          daysSinceLastReading: editDaysSince
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Datele copilului au fost modificate direct de părinte!`);
        setEditingChildId(null);
        onRefresh();
      } else {
        setErrorBanner(data.error || "Eroare la ajustarea datelor copilului.");
      }
    } catch {
      setErrorBanner("Nu s-a putut conecta la server pentru ajustare.");
    } finally {
      setIsAdjustingChild(false);
    }
  };

  const handleQuickAdjustPoints = async (childId: string, currentPoints: number, delta: number) => {
    const targetPoints = Math.max(0, currentPoints + delta);
    setSuccessBanner("");
    setErrorBanner("");
    try {
      const res = await fetch("/api/parent/adjust-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          points: targetPoints
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Puncte ajustate cu succes pentru copil (${delta > 0 ? "+" : ""}${delta} pct).`);
        onRefresh();
      } else {
        setErrorBanner(data.error || "Eroare la ajustarea rapidă a punctelor.");
      }
    } catch {
      setErrorBanner("Eroare de rețea. Nu s-au putut modifica punctele.");
    }
  };

  const handleFulfillScreenTime = async (requestId: string, status: "fulfilled" | "pending") => {
    setFulfillingReqId(requestId);
    setSuccessBanner("");
    setErrorBanner("");
    try {
      const res = await fetch("/api/parent/fulfill-screen-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(status === "fulfilled" 
          ? "Solicitare marcată ca aprobată și salvată în istoric cu succes!" 
          : "Solicitare mutată înapoi în lista în așteptare."
        );
        onRefresh();
      } else {
        setErrorBanner(data.error || "Eroare la modificarea statusului solicitării.");
      }
    } catch {
      setErrorBanner("Eroare de rețea. Nu s-a putut salva modificarea.");
    } finally {
      setFulfillingReqId(null);
    }
  };

  const handleRespondSuggestion = async (suggestionId: string, status: "approved" | "rejected", scheduleForNextDay?: boolean) => {
    const feedbackText = suggestionFeedback[suggestionId] || "";
    setSuccessBanner("");
    setErrorBanner("");
    try {
      const res = await fetch("/api/suggestions/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId,
          status,
          adminFeedback: feedbackText,
          scheduleForNextDay: !!scheduleForNextDay
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Sugestia a fost ${status === "approved" ? (scheduleForNextDay ? "aprobată și planificată pentru mâine" : "aprobată și setată activă pe loc") : "respinsă"}!`);
        setSuggestionFeedback(prev => {
          const updated = { ...prev };
          delete updated[suggestionId];
          return updated;
        });
        onRefresh();
      } else {
        setErrorBanner(data.error || "A apărut o problemă la actualizarea sugestiei.");
      }
    } catch {
      setErrorBanner("Eroare de rețea. Nu s-a putut răspunde la sugestie.");
    }
  };

  const handleSaveTomorrowSchedule = async () => {
    setIsSavingTomorrowSchedule(true);
    setSuccessBanner("");
    setErrorBanner("");
    try {
      const schedules = {
        dominic: {
          app: tomorrowApps.dominic || "tv",
          durationMinutes: Number(tomorrowMinutes.dominic) || 0,
          reason: tomorrowReasons.dominic || ""
        },
        sofia: {
          app: tomorrowApps.sofia || "xbox",
          durationMinutes: Number(tomorrowMinutes.sofia) || 0,
          reason: tomorrowReasons.sofia || ""
        }
      };

      const res = await fetch("/api/parent/save-tomorrow-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner("Planificarea de seară pentru timpul de ecran de mâine a fost salvată excelent! Se va activa automat la trecerea în noua zi.");
        onRefresh();
      } else {
        setErrorBanner("Eroare la înregistrarea planificării de mâine.");
      }
    } catch {
      setErrorBanner("Nu s-a putut comunica cu serverul pentru salvarea planificării.");
    } finally {
      setIsSavingTomorrowSchedule(false);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessBanner("");
    setErrorBanner("");

    if (!oldPinInput || !newPinInput) {
      setErrorBanner("Ambele câmpuri PIN sunt obligatorii!");
      return;
    }

    if (newPinInput.length !== 4 || isNaN(Number(newPinInput))) {
      setErrorBanner("Noul PIN trebuie să conțină exact 4 cifre!");
      return;
    }

    setIsChangingPin(true);
    try {
      const res = await fetch("/api/parent/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPin: oldPinInput, newPin: newPinInput })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessBanner("Codul de acces PIN de administrare a fost schimbat cu succes!");
        setOldPinInput("");
        setNewPinInput("");
        onRefresh();
      } else {
        setErrorBanner(data.error || "Nu s-a putut schimba codul PIN de acces.");
      }
    } catch {
      setErrorBanner("Eroare de conexiune la server.");
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleAddMarketplaceActivity = async (name: string, cat: string, desc: string, points: number) => {
    setIsSubmitingMarket(true);
    setMarketFeedback(null);
    try {
      const res = await fetch("/api/parent/add-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: marketChild,
          name,
          category: cat,
          description: desc,
          points
        })
      });
      const data = await res.json();
      if (data.success) {
        setMarketFeedback({
          success: true,
          message: `Succes! Activitatea „${name}” a fost adăugată cu succes pentru ${marketChild === "dominic" ? "Dominic" : "Sofia"} și este gata de îndeplinire!`
        });
        setMarketCustomName("");
        setMarketCustomDesc("");
        onRefresh();
      } else {
        setMarketFeedback({
          success: false,
          message: data.error || "Eroare la adăugarea activității."
        });
      }
    } catch {
      setMarketFeedback({
        success: false,
        message: "Eroare de conexiune la server."
      });
    } finally {
      setIsSubmitingMarket(false);
    }
  };

  return (
    <div className="space-y-8" id="parent-dashboard-root">
      
      {/* Theme Selector */}
      {onChangeTheme && (
        <div className="flex items-center gap-2 justify-end mb-2">
          <span className={`${dashboardStyles.label}`}>Temă:</span>
          <div className="flex gap-1">
            {(["nintendo", "duolingo", "pokemon", "minecraft"] as const).map((t) => (
              <button
                key={t}
                onClick={() => onChangeTheme(t)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border-2 transition-all cursor-pointer ${
                  theme === t
                    ? dashboardStyles.button.substring(0, dashboardStyles.button.indexOf(' px-4')) + ' bg-indigo-500 text-white border-indigo-600'
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                }`}
              >
                {t === "nintendo" ? "🎮" : t === "duolingo" ? "🦉" : t === "pokemon" ? "⚡" : "⛏️"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Banners */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-3xl text-emerald-950 text-sm flex items-center gap-2 font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-3xl text-rose-950 text-sm flex items-center gap-2 font-semibold shadow-xs animate-shake">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Titlu Secțiune */}
      <div className={dashboardStyles.header}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-black/20 rounded-2xl border border-white/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Panou Control Părinți 🛡️</h2>
            <p className="text-xs text-white/70 mt-0.5 font-bold uppercase tracking-wide">
              {state.parentEmail || "Părinți"} | Administrare copii, lecturi și configurare
            </p>
          </div>
        </div>

        {/* Buton simulare și Reset */}
        <div className="flex flex-wrap gap-2">
          {onLock && (
            <button
              onClick={onLock}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-650 text-white text-xs font-black rounded-2xl transition duration-150 flex items-center gap-1.5 border-2 border-amber-500 cursor-pointer uppercase tracking-wider shadow-xs"
              title="Securizează instantaneu panoul admin"
            >
              <Lock className="w-4 h-4 shadow-sm" />
              Blochează
            </button>
          )}
          <button
            onClick={promptSimulateNextDay}
            disabled={isSimulating}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-black rounded-2xl transition duration-150 flex items-center gap-1.5 border-2 border-slate-700 cursor-pointer uppercase tracking-wider shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? "animate-spin" : ""}`} />
            Simulează Mâine
          </button>
          <button
            onClick={promptResetSystem}
            disabled={isResetting}
            className="px-4 py-2.5 bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-black rounded-2xl transition duration-150 flex items-center gap-1.5 border-2 border-red-800 cursor-pointer uppercase tracking-wider shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            Reset General
          </button>
          {onToggleKidFullScreen && (
            <button
              onClick={onToggleKidFullScreen}
              className={`px-4 py-2.5 text-xs font-black rounded-2xl transition duration-150 flex items-center gap-1.5 border-2 cursor-pointer uppercase tracking-wider shadow-xs ${
                kidFullScreen 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Activează/dezactivează ecranul complet pentru copii (ascunde meniul lateral)"
            >
              {kidFullScreen ? <Check className="w-4 h-4" /> : <span className="text-base">🖥️</span>}
              {kidFullScreen ? 'Mod Copil 🌟' : 'Ecran Copil 👶'}
            </button>
          )}
        </div>
      </div>

      {/* Grid: Profil Copii și Cronometre active */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Statusul copiilor */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`${dashboardStyles.card}`}>
            <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Users className="w-5 h-5 text-indigo-650" />
              Panou Monitoare Copii și Streaks de vacanță
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.children.map((child) => {
                const isForced = child.daysSinceLastReading >= 3;
                return (
                  <div key={child.id} className={`${dashboardStyles.subCard}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 bg-white rounded-2xl border-2 border-slate-100 shadow-xs">{child.avatar}</span>
                        <div>
                          <h4 className="font-extrabold text-slate-950 text-sm">{child.name}</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{child.age} ani</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (editingChildId === child.id) {
                            setEditingChildId(null);
                          } else {
                            setEditingChildId(child.id);
                            setEditPoints(child.points);
                            setEditStreak(child.readingStreak);
                            setEditDaysSince(child.daysSinceLastReading);
                          }
                        }}
                        className="p-1.5 rounded-xl border-2 border-slate-150 hover:border-indigo-400 hover:bg-indigo-50/50 transition duration-155 text-slate-500 hover:text-indigo-600 cursor-pointer"
                        title="Ajustează manual punctele / streak-ul de lectură"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>

                    {editingChildId === child.id && (
                      <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-150 space-y-3 animate-fade-in text-xs">
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5 mb-1">
                          <span className="font-extrabold text-indigo-950 uppercase tracking-wider text-[10px]">Ajustare Manuală ({child.name})</span>
                          <button
                            onClick={() => setEditingChildId(null)}
                            className="text-slate-400 hover:text-slate-655 font-extrabold text-[10px]"
                          >
                            Închide
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-slate-500 font-bold uppercase tracking-wider text-[8px] mb-1">Puncte</label>
                            <input
                              type="number"
                              value={editPoints}
                              onChange={(e) => setEditPoints(Number(e.target.value))}
                              className="w-full p-2 bg-white rounded-lg border border-indigo-200 text-xs text-center font-bold text-slate-800 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold uppercase tracking-wider text-[8px] mb-1">Streak</label>
                            <input
                              type="number"
                              value={editStreak}
                              onChange={(e) => setEditStreak(Number(e.target.value))}
                              className="w-full p-2 bg-white rounded-lg border border-indigo-200 text-xs text-center font-bold text-slate-800 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold uppercase tracking-wider text-[8px] mb-1">Zile fără citit</label>
                            <input
                              type="number"
                              value={editDaysSince}
                              onChange={(e) => setEditDaysSince(Number(e.target.value))}
                              className="w-full p-2 bg-white rounded-lg border border-indigo-200 text-xs text-center font-bold text-slate-850 focus:outline-hidden"
                              title="Zile trecute de la ultima lectură. La 3 zile necitite consecutiv, copilul este blocat să citească obligatoriu înainte să-și poată alege altceva."
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1.5 border-t border-indigo-100">
                          <button
                            onClick={() => setEditingChildId(null)}
                            className="px-2.5 py-1 text-slate-600 font-bold text-[10px] bg-white border border-slate-200 rounded-lg"
                          >
                            Anulează
                          </button>
                          <button
                            onClick={() => handleSaveChildAdjust(child.id)}
                            disabled={isAdjustingChild}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            {isAdjustingChild ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Salvează
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`${dashboardStyles.subCard}`}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <span className={dashboardStyles.label}>Puncte strânse</span>
                          <div className="text-lg font-black mt-0.5 truncate">{child.points} Pcte</div>
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            <button onClick={() => handleQuickAdjustPoints(child.id, child.points, -10)} className={dashboardStyles.buttonRed + " text-[8px] py-1 px-2 leading-tight"} title="Scade 10 puncte">-10</button>
                            <button onClick={() => handleQuickAdjustPoints(child.id, child.points, -50)} className={dashboardStyles.buttonRed + " text-[8px] py-1 px-2 leading-tight"} title="Scade 50 puncte">-50</button>
                            <button onClick={() => handleQuickAdjustPoints(child.id, child.points, 10)} className={dashboardStyles.buttonGreen + " text-[8px] py-1 px-2 leading-tight"} title="Adaugă 10 puncte">+10</button>
                            <button onClick={() => handleQuickAdjustPoints(child.id, child.points, 50)} className={dashboardStyles.buttonGreen + " text-[8px] py-1 px-2 leading-tight"} title="Adaugă 50 puncte">+50</button>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={dashboardStyles.label}>Streak lectură</span>
                          <div className="text-lg font-black mt-0.5 whitespace-nowrap">{child.readingStreak} zile</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-semibold">
                      <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider block">Zile de la ultima citire</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={isForced ? "text-rose-600 font-extrabold" : "text-slate-800 font-bold"}>
                          {child.daysSinceLastReading} {child.daysSinceLastReading === 1 ? 'zi' : 'zile'}
                        </span>
                        {isForced ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black text-[9px] uppercase tracking-wider animate-pulse border border-rose-300">
                            Citit blocat
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">({3 - child.daysSinceLastReading} rămase)</span>
                        )}
                      </div>
                    </div>

                    {child.activeTimer && (
                      <div className="p-3.5 rounded-2xl bg-indigo-50/50 border-2 border-indigo-150 flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-[10px] font-black text-indigo-805 uppercase tracking-wider">Timp activ de ecran</span>
                          <p className="text-xs font-extrabold text-indigo-950 mt-0.5">{child.activeTimer.rewardName}</p>
                          <p className="text-[10px] text-indigo-600 mt-0.5 font-bold">{child.activeTimer.minutesLeft}m rămase din cronometru</p>
                        </div>
                        <button
                          onClick={() => promptStopTimer(child.id)}
                          className="p-1 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition duration-150 cursor-pointer shadow-xs"
                        >
                          <Power className="w-3 h-3" />
                          Stop
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Plimbat Câine Jurnal */}
        <div className="space-y-6">
          <div className={`${dashboardStyles.card}`}>
            <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Activity className="w-5 h-5 text-indigo-650" />
              Sarcina Câine: Jurnal Plimbări
            </h3>

            <p className="text-xs text-slate-500 mb-4 font-semibold leading-relaxed">
              Câinele trebuie plimbat de trei ori. Aici vezi cine s-a deplasat astăzi și orele confirmate.
            </p>

            <div className="space-y-4">
              {(["morning", "midday", "evening"] as const).map((slot) => {
                const status = state.dogWalkStatus[slot];
                const kid = state.children.find(c => c.id === status.childId);
                const slotLbl = slot === "morning" ? "🌞 Dimineață" : slot === "midday" ? "🕛 La Prânz (12:00)" : "🌛 Seară";
                
                return (
                  <div key={slot} className="p-4 bg-slate-50/35 rounded-2xl border-2 border-slate-100 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700">{slotLbl}</span>
                        {kid ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs text-indigo-650 font-extrabold">
                              Plimbat de {kid.name}
                            </span>
                            {status.approved && (
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 font-extrabold uppercase px-1.5 py-0.5 rounded-sm tracking-wide">
                                Confirmat AI
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 mt-0.5 italic font-medium">Neplimbat astăzi</p>
                        )}
                      </div>
                      {status.time ? (
                        <span className="text-[10px] font-mono font-black text-indigo-750 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">
                          {new Date(status.time).toLocaleTimeString("ro-RO", {hour: "2-digit", minute: "2-digit"})}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide bg-slate-100 px-2.5 py-1 rounded-full">Liber</span>
                      )}
                    </div>
                    {status.photoUrl && (
                      <div className="pt-2.5 border-t border-dashed border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-24 bg-slate-100">
                          <img src={status.photoUrl} alt="Dovadă foto plimbare" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="sm:col-span-2 text-xs bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 text-indigo-950">
                          <p className="font-extrabold text-[9px] text-indigo-700 uppercase tracking-wide mb-1">
                            🤖 Evaluare AI:
                          </p>
                          <p className="italic font-semibold leading-normal text-slate-600">"{status.feedback || 'Validat vizual de Gemini.'}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTIUNEA NOUĂ: GESTIONARE COPII — ADAUGĂ COPIL NOU ─── */}
      <div className={`${dashboardStyles.card}`} id="parent-add-child">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4 mb-4">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-150">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Gestionează Copiii 👶
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">
              Adaugă copii noi sau vezi lista existentă
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lista copiilor existenți */}
          <div>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Copii existenți ({state.children.length})</h4>
            <div className="space-y-2">
              {state.children.map((child) => (
                <div key={child.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-2xl">{child.avatar}</span>
                  <div className="flex-1">
                    <p className="font-bold text-xs text-slate-900">{child.name}</p>
                    <p className="text-[10px] text-slate-400">{child.age} ani • {child.points} puncte</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formular adăugare copil nou */}
          <div className="bg-indigo-50/30 rounded-2xl border-2 border-indigo-100 p-4">
            <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-3">Adaugă copil nou ➕</h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const name = formData.get('childName') as string;
              const age = Number(formData.get('childAge'));
              const avatar = formData.get('childAvatar') as string;
              if (!name || !age) return;
              try {
                const res = await fetch('/api/parent/add-child', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, age, avatar: avatar || '🐶' })
                });
                const data = await res.json();
                if (data.success) {
                  setSuccessBanner(`Copilul ${name} a fost adăugat cu succes! 🎉`);
                  onRefresh();
                  form.reset();
                } else {
                  setErrorBanner(data.error || 'Eroare la adăugare copil.');
                }
              } catch {
                setErrorBanner('Eroare de rețea.');
              }
            }} className="space-y-3">
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">Nume copil</label>
                <input name="childName" required className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-indigo-500" placeholder="Ex: Andrei" />
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">Vârstă</label>
                <input name="childAge" type="number" min={3} max={18} required className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-indigo-500" placeholder="Ex: 8" />
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">Avatar</label>
                <select name="childAvatar" className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-indigo-500">
                  <option value="🐶">🐶 Câine</option>
                  <option value="🐱">🐱 Pisică</option>
                  <option value="🦊">🦊 Vulpe</option>
                  <option value="🐼">🐼 Panda</option>
                  <option value="🐰">🐰 Iepure</option>
                  <option value="🦁">🦁 Leu</option>
                  <option value="🐸">🐸 Broscuță</option>
                  <option value="🐲">🐲 Dragon</option>
                  <option value="🦸">🦸 Supererou</option>
                  <option value="🧑‍🚀">🧑‍🚀 Astronaut</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer transition shadow-sm">
                <Plus className="w-4 h-4 inline mr-1" />
                Adaugă Copil
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── SECTIUNEA NOUĂ: ANIMALE DE COMPANIE ─── */}
      <div className={`${dashboardStyles.card}`} id="parent-pets">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4 mb-4">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-150">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Animale de Companie 🐾
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">
              Adaugă animale și configurează activitățile lor
            </p>
          </div>
        </div>

        {(() => {
          const pets: any[] = (state as any).pets || [];
          return (
            <div className="space-y-4">
              {pets.length === 0 && (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-400 font-semibold text-xs mb-4">Nu ai adăugat încă animale de companie.</p>
                </div>
              )}
              {pets.map((pet: any) => (
                <div key={pet.id} className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{pet.icon}</span>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{pet.name}</p>
                        <p className="text-[10px] text-slate-400">{pet.type}</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold">
                      <input type="checkbox" checked={pet.enabled} onChange={async () => {
                        await fetch('/api/parent/toggle-pet', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ petId: pet.id, enabled: !pet.enabled })
                        });
                        onRefresh();
                      }} className="rounded" />
                      Activ
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pet.activities?.map((act: any) => (
                      <div key={act.id} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100">
                        <span>{act.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{act.name}</p>
                          <p className="text-[9px] text-slate-400">{act.points} puncte</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Formular adăugare animal nou */}
              <details className="bg-amber-50/30 rounded-2xl border-2 border-amber-100 p-4">
                <summary className="text-xs font-black text-amber-700 uppercase tracking-wider cursor-pointer">
                  <Plus className="w-4 h-4 inline mr-1" /> Adaugă animal de companie
                </summary>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const petType = formData.get('petType') as string;
                  const petName = formData.get('petName') as string;
                  if (!petType || !petName) return;
                  try {
                    const res = await fetch('/api/parent/add-pet', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: petType, name: petName })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setSuccessBanner(`Animalul ${petName} a fost adăugat cu activitățile implicite! 🐾`);
                      onRefresh();
                      form.reset();
                    } else {
                      setErrorBanner(data.error || 'Eroare la adăugare animal.');
                    }
                  } catch {
                    setErrorBanner('Eroare de rețea.');
                  }
                }} className="space-y-3 mt-3">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">Tip animal</label>
                    <select name="petType" required className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-amber-500">
                      <option value="dog">🐕 Câine</option>
                      <option value="cat">🐈 Pisică</option>
                      <option value="hamster">🐹 Hamster</option>
                      <option value="rabbit">🐰 Iepure</option>
                      <option value="fish">🐟 Peștișor</option>
                      <option value="bird">🐦 Pasăre</option>
                      <option value="turtle">🐢 Broască țestoasă</option>
                      <option value="other">🐾 Alt animal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">Numele animalului</label>
                    <input name="petName" required className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-amber-500" placeholder="Ex: Rex, Kitty, etc." />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer transition shadow-sm">
                    <Plus className="w-4 h-4 inline mr-1" /> Adaugă Animal
                  </button>
                </form>
              </details>
            </div>
          );
        })()}
      </div>

      {/* ─── SECTIUNEA NOUĂ: PANOU ADMIN — CONFIGURARE ACTIVITĂȚI ȘI RECOMPENSE ─── */}
      <div className={`${dashboardStyles.card}`} id="parent-admin-config">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4 mb-4">
          <div className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-150">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Configurare Activități & Recompense ⚙️
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">
              Personalizează activitățile și recompensele din sistem
            </p>
          </div>
        </div>

        {/* Tabs: Activități | Recompense */}
        <div className="space-y-4">
              {/* Tab buttons */}
              <div className="flex gap-2">
                <button onClick={() => setAdminTab('activities')} className={`px-4 py-2 text-xs font-black rounded-xl uppercase tracking-wider transition cursor-pointer ${adminTab === 'activities' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <Activity className="w-4 h-4 inline mr-1" /> Activități
                </button>
                <button onClick={() => setAdminTab('rewards')} className={`px-4 py-2 text-xs font-black rounded-xl uppercase tracking-wider transition cursor-pointer ${adminTab === 'rewards' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <Award className="w-4 h-4 inline mr-1" /> Recompense
                </button>
              </div>

              {/* Tab: Activități */}
              {adminTab === 'activities' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                    {state.activeTasks
                      .filter(t => t.childId === (state.children[0]?.id || ''))
                      .slice(0, 30)
                      .concat((state as any).customActivities || [])
                      .map((task: any, idx: number) => {
                        const isEditing = editingActivity === (task.id || `idx_${idx}`);
                        return (
                          <div key={task.id || idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">{task.name}</span>
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{task.points} Pct</span>
                            </div>
                            {isEditing ? (
                              <div className="space-y-2">
                                <input value={editActName} onChange={e => setEditActName(e.target.value)} className="w-full px-2 py-1 text-[10px] border rounded-lg" placeholder="Nume" />
                                <div className="flex gap-2">
                                  <input type="number" value={editActPoints} onChange={e => setEditActPoints(Number(e.target.value))} className="w-20 px-2 py-1 text-[10px] border rounded-lg" />
                                  <button onClick={async () => {
                                    await fetch('/api/parent/update-activity', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ activityId: task.id, name: editActName, points: editActPoints })
                                    });
                                    setEditingActivity(null);
                                    onRefresh();
                                  }} className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-lg cursor-pointer">Salvează</button>
                                  <button onClick={() => setEditingActivity(null)} className="px-2 py-1 bg-slate-200 text-[9px] rounded-lg cursor-pointer">X</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <button onClick={() => { setEditingActivity(task.id); setEditActName(task.name); setEditActPoints(task.points); }} className="text-[9px] px-2 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer">✏️</button>
                                <button onClick={async () => {
                                  if (confirm(`Ștergi activitatea "${task.name}"?`)) {
                                    await fetch('/api/parent/delete-activity', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ activityId: task.id })
                                    });
                                    onRefresh();
                                  }
                                }} className="text-[9px] px-2 py-1 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 cursor-pointer">🗑️</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Add new activity form */}
                  <details className="bg-indigo-50/30 rounded-2xl border-2 border-indigo-100 p-4">
                    <summary className="text-xs font-black text-indigo-700 uppercase tracking-wider cursor-pointer">
                      <Plus className="w-4 h-4 inline mr-1" /> Adaugă activitate nouă
                    </summary>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const childId = state.children[0]?.id;
                      if (!childId) return;
                      await fetch('/api/parent/add-activity-custom', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          childId,
                          name: newActName,
                          description: newActDesc,
                          points: newActPoints,
                          icon: newActIcon,
                        })
                      });
                      setNewActName(''); setNewActDesc(''); setNewActPoints(30);
                      onRefresh();
                    }} className="space-y-3 mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newActName} onChange={e => setNewActName(e.target.value)} required placeholder="Nume activitate" className="px-3 py-2 border-2 border-slate-200 rounded-xl text-xs bg-white" />
                        <input value={newActDesc} onChange={e => setNewActDesc(e.target.value)} placeholder="Descriere" className="px-3 py-2 border-2 border-slate-200 rounded-xl text-xs bg-white" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Puncte</label>
                          <input type="number" value={newActPoints} onChange={e => setNewActPoints(Number(e.target.value))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Iconiță</label>
                          <input value={newActIcon} onChange={e => setNewActIcon(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs bg-white" />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer transition shadow-sm">
                        <Plus className="w-4 h-4 inline mr-1" /> Adaugă Activitate
                      </button>
                    </form>
                  </details>
                </div>
              )}

              {/* Tab: Recompense */}
              {adminTab === 'rewards' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                    {(state.customRewards || []).map((reward) => {
                      const currentPoints = editRewardPoints[reward.id] ?? reward.costPoints;
                      return (
                        <div key={reward.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-xs font-bold text-slate-800">
                              <span>{reward.icon}</span> {reward.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{currentPoints} Pct</span>
                            {reward.durationMinutes > 0 && <span className="text-[10px] text-slate-400">{reward.durationMinutes} min</span>}
                          </div>
                          <div className="flex gap-1">
                            <input type="number" value={currentPoints} onChange={e => {
                              setEditRewardPoints(prev => ({ ...prev, [reward.id]: Number(e.target.value) }));
                            }} className="w-16 px-2 py-1 text-[10px] border rounded-lg" />
                            <button onClick={async () => {
                              await fetch('/api/parent/update-reward', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ rewardId: reward.id, costPoints: currentPoints })
                              });
                              onRefresh();
                            }} className="px-2 py-1 bg-purple-600 text-white text-[9px] font-black rounded-lg cursor-pointer">Salvează</button>
                            <button onClick={async () => {
                              if (confirm(`Ștergi recompensa "${reward.name}"?`)) {
                                await fetch('/api/parent/delete-reward', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ rewardId: reward.id })
                                });
                                onRefresh();
                              }
                            }} className="px-2 py-1 bg-rose-50 text-rose-600 text-[9px] rounded-lg cursor-pointer">🗑️</button>
                          </div>
                        </div>
                      );
                    })}
                    {(state.customRewards || []).length === 0 && (
                      <p className="text-xs text-slate-400 col-span-full text-center p-4">Nu există recompense personalizate. Adaugă una mai jos!</p>
                    )}
                  </div>

                  {/* Add new reward form */}
                  <details className="bg-purple-50/30 rounded-2xl border-2 border-purple-100 p-4">
                    <summary className="text-xs font-black text-purple-700 uppercase tracking-wider cursor-pointer">
                      <Plus className="w-4 h-4 inline mr-1" /> Adaugă recompensă nouă
                    </summary>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      await fetch('/api/parent/add-reward', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: newRewardName,
                          costPoints: newRewardCost,
                          durationMinutes: newRewardDuration,
                          icon: newRewardIcon,
                        })
                      });
                      setNewRewardName(''); setNewRewardCost(50); setNewRewardDuration(30);
                      onRefresh();
                    }} className="space-y-3 mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newRewardName} onChange={e => setNewRewardName(e.target.value)} required placeholder="Nume recompensă" className="px-3 py-2 border-2 border-slate-200 rounded-xl text-xs bg-white" />
                        <input value={newRewardIcon} onChange={e => setNewRewardIcon(e.target.value)} placeholder="Iconiță" className="px-3 py-2 border-2 border-slate-200 rounded-xl text-xs bg-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Cost puncte</label>
                          <input type="number" value={newRewardCost} onChange={e => setNewRewardCost(Number(e.target.value))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Durată (min)</label>
                          <input type="number" value={newRewardDuration} onChange={e => setNewRewardDuration(Number(e.target.value))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs bg-white" />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer transition shadow-sm">
                        <Plus className="w-4 h-4 inline mr-1" /> Adaugă Recompensă
                      </button>
                    </form>
                  </details>
                </div>
              )}
            </div>
          </div>

      {/* SECTIUNEA PLANIFICATOR DE SEARĂ: TIMP ECRAN SPRE ALOCARE */}
      <div className={`${dashboardStyles.card}`} id="parent-evening-planner">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-150">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Planificator de Seară - Alocare Timp Ecran Mâine 🗓️
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">
              Administrare priorități de vacanță • Arthur & Lavinia
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-505 text-slate-600 mb-6 leading-relaxed font-semibold">
          Setează în fiecare seară timpul pe care copiii îl cer și îl merită pentru ziua de mâine! Timpul selectat și aplicațiile alocate vor deveni active de îndată ce apeși pe noul buton de mai jos sau pe <strong>„Simulează Mâine”</strong> pentru a deschide dimineața.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.children.map((child) => (
            <div key={child.id} className={`${dashboardStyles.subCard}`}>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-2xl">{child.avatar}</span>
                <span className="font-extrabold text-sm text-slate-950">Planificare Timp: {child.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">Aplicație / Consolă</label>
                  <select
                    value={tomorrowApps[child.id] || "tv"}
                    onChange={(e) => setTomorrowApps({ ...tomorrowApps, [child.id]: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-black focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="tv"> Smart TV 📺</option>
                    <option value="xbox"> Xbox Console 🎮</option>
                    <option value="youtube"> YouTube Kids 📹</option>
                    <option value="tiktok"> TikTok App 🎵</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">Durată Mâine</label>
                  <select
                    value={tomorrowMinutes[child.id] || 0}
                    onChange={(e) => setTomorrowMinutes({ ...tomorrowMinutes, [child.id]: Number(e.target.value) })}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-black focus:outline-none focus:border-indigo-500 bg-white font-mono"
                  >
                    <option value={0}>0 minute (Fără ecran)</option>
                    <option value={30}>30 minute</option>
                    <option value={45}>45 minute</option>
                    <option value={60}>60 minute (1 oră)</option>
                    <option value={90}>90 minute (1.5 ore)</option>
                    <option value={120}>120 minute (2 ore)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">Motivație / Detalii</label>
                <input
                  type="text"
                  value={tomorrowReasons[child.id] || ""}
                  onChange={(e) => setTomorrowReasons({ ...tomorrowReasons, [child.id]: e.target.value })}
                  placeholder="Ex: Pentru purtare exemplară și citit sârguincios"
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveTomorrowSchedule}
            disabled={isSavingTomorrowSchedule}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition duration-150 flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer shadow-sm w-full md:w-auto"
          >
            {isSavingTomorrowSchedule ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Înregistrează Alocările pentru Mâine
          </button>
        </div>
      </div>

      {/* 6. MARKETPLACE DE ACTIVITĂȚI */}
      <div className={`${dashboardStyles.card} mb-8`} id="parent-activity-marketplace-widget">
        <div className="flex items-center gap-3 border-b-3 border-slate-100 pb-4 mb-5">
          <div className="p-2.5 bg-[#e0f7ff] text-[#1cb0f6] rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0_0_#1e293b]">
            <Users className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight">
              Marketplace de activități 🚀
            </h3>
            <p className="text-xs text-slate-500 font-black uppercase tracking-wide mt-0.5">
              Adaugă simplu și rapid activități din catalogul special organizat pe categorii!
            </p>
          </div>
        </div>

        {marketFeedback && (
          <div className={`p-4 mb-5 border-3 rounded-2xl text-xs font-black flex items-center justify-between gap-3 ${
            marketFeedback.success ? "bg-emerald-50 border-emerald-400 text-emerald-950" : "bg-rose-50 border-rose-400 text-rose-950"
          }`}>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{marketFeedback.message}</span>
            </span>
            <button onClick={() => setMarketFeedback(null)} className="ml-auto text-slate-400 hover:text-slate-650 font-black hover:scale-110 transition cursor-pointer">X</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Partea Stângă: Selector copil și filtre categorii */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Control Copil Vizat */}
            <div className="bg-amber-50 p-4 rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0_0_#1e293b]">
              <span className="text-[10px] uppercase font-black text-slate-400 block mb-2.5 tracking-wider"> Pasul 1: Alege copilul vizat:</span>
              <div className="flex gap-2.5">
                {state.children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setMarketChild(c.id as any)}
                    className={`flex-1 py-3 px-4 rounded-xl border-3 flex items-center justify-center gap-2.5 text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      marketChild === c.id 
                        ? "bg-slate-900 border-slate-900 text-white shadow-none translate-y-[2px]" 
                        : "bg-white border-slate-900 text-slate-700 shadow-[2px_2px_0_0_#1e293b] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_#1e293b]"
                    }`}
                  >
                    <span className="text-xl">{c.avatar}</span>
                    <span>{c.name} ({c.points} Pct)</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Categorii Tabs */}
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400 block mb-2.5 tracking-wider"> Pasul 2: Filtrează catalogul pe categorii:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "Toate 📂", color: "bg-slate-100 text-slate-700 border-slate-900" },
                  { id: "lectură", label: "Lectură 📖", color: "bg-blue-100 text-blue-700 border-slate-900" },
                  { id: "sport", label: "Sport ⚽", color: "bg-rose-100 text-rose-700 border-slate-900" },
                  { id: "STEM", label: "STEM 🔬", color: "bg-violet-100 text-violet-750 border-slate-900" },
                  { id: "robotică", label: "Robotică 🤖", color: "bg-cyan-100 text-cyan-700 border-slate-900" },
                  { id: "LEGO", label: "LEGO 🧱", color: "bg-amber-100 text-amber-700 border-slate-900" },
                  { id: "natură", label: "Natură 🌿", color: "bg-emerald-100 text-emerald-850 border-slate-900" },
                ].map((cat) => {
                  const isSelected = marketCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setMarketCategory(cat.id)}
                      className={`px-3 py-2 text-xs font-black uppercase tracking-wide rounded-xl border-3 transition-all cursor-pointer ${
                        isSelected 
                          ? `${cat.color} scale-102 font-extrabold translate-y-[2px] shadow-none` 
                          : "bg-white border-slate-900 text-slate-655 hover:translate-y-[-1px] shadow-[2px_2px_0_0_#1e293b]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid-ul cu activități șablon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MARKETPLACE_TEMPLATES
                .filter(t => marketCategory === "all" || t.category === marketCategory)
                .map((tmpl, idx) => {
                  return (
                    <div 
                      key={idx} 
                      className="p-4 bg-slate-50/20 border-2 border-slate-150 rounded-2xl flex flex-col justify-between hover:border-indigo-300 transition duration-150 h-full shadow-2xs group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2.5">
                          <span className="font-extrabold text-xs text-slate-900 leading-snug group-hover:text-indigo-700 transition">
                            {tmpl.name}
                          </span>
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-mono shrink-0">
                            +{tmpl.points} pct
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                          {tmpl.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-150 flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-slate-400">
                          Gen: {tmpl.category}
                        </span>
                        <button
                          onClick={() => handleAddMarketplaceActivity(tmpl.name, tmpl.category, tmpl.description, tmpl.points)}
                          disabled={isSubmitingMarket}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition duration-150 cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adaugă activitate
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Partea Dreaptă: Formular activitate personalizată instant */}
          <div className={`lg:col-span-4 ${dashboardStyles.subCard} h-full justify-between flex flex-col`}>
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2 mb-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">Custom Creator 🪄</span>
                <p className="text-[10px] text-slate-400 font-semibold">Creează pe loc orice activitate rapidă, în afara catalogului prestabilit.</p>
              </div>

              <div>
                <label className="block text-slate-500 font-extrabold uppercase tracking-wider text-[9px] mb-1">Nume Activitate</label>
                <input
                  type="text"
                  value={marketCustomName}
                  onChange={(e) => setMarketCustomName(e.target.value)}
                  placeholder="Ex: Rezolvă exerciții de dicție sau dicționar"
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-extrabold uppercase tracking-wider text-[9px] mb-1">Categorie Custom</label>
                <select
                  value={marketCategory === "all" ? "lectură" : marketCategory}
                  onChange={(e) => setMarketCategory(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="lectură">📚 lectură</option>
                  <option value="sport">⚽ sport</option>
                  <option value="STEM">🔬 STEM</option>
                  <option value="robotică">🤖 robotică</option>
                  <option value="LEGO">🧱 LEGO</option>
                  <option value="natură">🌿 natură</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-extrabold uppercase tracking-wider text-[9px] mb-1">Valoare Recompensă (Puncte)</label>
                <input
                  type="number"
                  value={marketCustomPoints}
                  onChange={(e) => setMarketCustomPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-indigo-500 bg-white"
                  min="5"
                  max="500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-extrabold uppercase tracking-wider text-[9px] mb-1">Descriere detaliată / Misiune</label>
                <textarea
                  value={marketCustomDesc}
                  onChange={(e) => setMarketCustomDesc(e.target.value)}
                  placeholder="Instrucțiuni clare despre ce dovadă foto trebuie să încarce pentru a valida activitatea."
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 bg-white h-24 resize-none"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!marketCustomName.trim()) return;
                handleAddMarketplaceActivity(
                  marketCustomName,
                  marketCategory === "all" ? "lectură" : marketCategory,
                  marketCustomDesc,
                  marketCustomPoints
                );
              }}
              disabled={isSubmitingMarket || !marketCustomName.trim() || !marketCustomDesc.trim()}
              className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isSubmitingMarket ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adaugă Activitate Custom
            </button>
          </div>
        </div>
      </div>

      {/* SECTIUNEA EVOLUTIE PUNCTE COPII (7 ZILE) */}
      <div className={`${dashboardStyles.card} mb-8`} id="parent-points-chart-widget">
        <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-4 flex items-center gap-2 uppercase tracking-wide">
          <Activity className="w-5 h-5 text-indigo-650" />
          Evoluția Punctelor în Ultimele 7 Zile 📊
        </h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed font-semibold">
          Monitorizează progresul și eforturile depuse de Dominic și Sofia în vacanță. Graficul arată totalul punctelor acumulate în fiecare zi.
        </p>

        <div className="h-[280px] w-full min-h-[1px] font-sans text-xs">
          {state.pointsHistory && state.pointsHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={state.pointsHistory.slice(-7)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  style={{ fontWeight: "750" }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  style={{ fontWeight: "750" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#1e293b", 
                    borderRadius: "16px", 
                    color: "#fff",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: "bold",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#94a3b8", fontWeight: "900", marginBottom: "4px" }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ style: { fontWeight: "bold" } }}
                />
                {(state.children || []).map((child, index) => {
                  const BAR_COLORS = ["#4f46e5", "#e11d48", "#10b981", "#f59e0b", "#6366f1", "#8b5cf6", "#ec4899"];
                  const fillCol = BAR_COLORS[index % BAR_COLORS.length];
                  return (
                    <Bar 
                      key={child.id}
                      name={`${child.name} (${child.avatar || '👦'})`} 
                      dataKey={child.id} 
                      fill={fillCol} 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={32}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed-2">
              Nu s-au găsit date despre evoluția punctelor.
            </div>
          )}
        </div>
      </div>

      {/* SECTIUNEA TIMP PETRECUT PE ACTIVITATI (LOGURI EXACTE) */}
      <div className={dashboardStyles.card + " mb-8"} id="parent-activity-time-widget">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-slate-100 pb-4 mb-6 gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Timp Petrecut pe Activități de către Copii ⏱️
            </h3>
          </div>
          
          {/* Filters inside the header */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Child selector */}
            <select
              value={timeFilterChild}
              onChange={(e) => setTimeFilterChild(e.target.value as any)}
              className={dashboardStyles.select}
            >
              <option value="all">Toți copiii</option>
              {state.children.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} {c.avatar}</option>
              ))}
            </select>

            {/* Type selector */}
            <select
              value={timeFilterType}
              onChange={(e) => setTimeFilterType(e.target.value as any)}
              className={dashboardStyles.select}
            >
              <option value="all">Toate tipurile</option>
              <option value="reading">Lectură 📚</option>
              <option value="quiz">Chestionare 🧠</option>
              <option value="dog_walk">Plimbat câine 🐩</option>
              <option value="chore">Treburi / Igienă 🏠</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed font-semibold">
          Vezi exact câte minute și secunde a petrecut fiecare copil rezolvând activitățile din aplicație (lectură de vacanță, chestionare tip test grilă, plimbat câinele sau sarcini casnice verificate).
        </p>

        {(() => {
          const logs = state.activityTimeLogs || [];
          
          // Calculate filtered logs
          const filteredLogs = logs.filter(log => {
            const matchesChild = timeFilterChild === "all" || log.childId === timeFilterChild;
            const matchesType = timeFilterType === "all" || log.activityType === timeFilterType;
            return matchesChild && matchesType;
          });

          // Calculate summary stats
          const formatDurationMin = (sec: number) => {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${m} min ${s > 0 ? `${s} sec` : ''}`;
          };

          return (
            <div className="space-y-6">
              {/* Aggregation cards — generate dinamic din state.children */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.children
                  .filter((c: any) => timeFilterChild === "all" || timeFilterChild === c.id)
                  .map((child: any, idx: number) => {
                    const childLogs = logs.filter((l: any) => l.childId === child.id);
                    const readSec = childLogs.filter((l: any) => l.activityType === "reading").reduce((a: number, b: any) => a + (b.durationSeconds || 0), 0);
                    const quizSec = childLogs.filter((l: any) => l.activityType === "quiz").reduce((a: number, b: any) => a + (b.durationSeconds || 0), 0);
                    const otherSec = childLogs.filter((l: any) => !["reading","quiz"].includes(l.activityType)).reduce((a: number, b: any) => a + (b.durationSeconds || 0), 0);
                    const totalSec = readSec + quizSec + otherSec;
                    const colors = ["border-indigo-100","border-rose-100","border-emerald-100","border-amber-100"];
                    const tagColors = ["text-indigo-700 bg-indigo-100","text-rose-700 bg-rose-100","text-emerald-700 bg-emerald-100","text-amber-700 bg-amber-100"];

                    return (
                      <div key={child.id} className={`${dashboardStyles.subCard} flex flex-col justify-between`}>
                        <div className="flex items-center justify-between border-b pb-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{child.avatar || '👤'}</span>
                            <h4 className="font-black text-xs uppercase tracking-wide">{child.name}</h4>
                          </div>
                          <span className={`px-2.5 py-0.5 text-[11px] font-black uppercase rounded-full ${tagColors[idx % tagColors.length]}`}>
                            Total: {formatDurationMin(totalSec)}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs font-semibold">
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-emerald-500" /> Lectură:</span>
                            <span className="font-extrabold text-slate-900">{formatDurationMin(readSec)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-sky-500" /> Chestionare:</span>
                            <span className="font-extrabold text-slate-900">{formatDurationMin(quizSec)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-violet-500" /> Plimbări / Chores:</span>
                            <span className="font-extrabold text-slate-900">{formatDurationMin(otherSec)}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                            <div style={{ width: `${totalSec > 0 ? (readSec / totalSec) * 100 : 0}%` }} className="bg-emerald-500 h-full" />
                            <div style={{ width: `${totalSec > 0 ? (quizSec / totalSec) * 100 : 0}%` }} className="bg-sky-500 h-full" />
                            <div style={{ width: `${totalSec > 0 ? (otherSec / totalSec) * 100 : 0}%` }} className="bg-violet-500 h-full" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* TIMELINE LIST */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Jurnal Timp de Calitate ({filteredLogs.length} înregistrări filtrate)</span>
                  <span className="text-[10px] bg-white text-indigo-700 border-indigo-200 border px-2.5 py-0.5 rounded-full font-bold">Arcadia Analytics</span>
                </div>
                
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-bold bg-slate-50 text-xs uppercase tracking-wider">
                    Nu s-au găsit înregistrări de timp pentru filtrele selectate.
                  </div>
                ) : (
                  <div className="divide-y max-h-[350px] overflow-y-auto">
                    {filteredLogs.map((log) => {
                      const dateFormatted = new Date(log.timestamp).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                      const typeIcons: Record<string, React.ReactNode> = {
                        reading: <FileText className="w-4 h-4 text-emerald-605" />,
                        quiz: <Lightbulb className="w-4 h-4 text-sky-605" />,
                        dog_walk: <Activity className="w-4 h-4 text-amber-605" />,
                        chore: <CheckCircle2 className="w-4 h-4 text-violet-605" />
                      };

                      return (
                        <div key={log.id} className="p-4 bg-white hover:bg-slate-50 transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl mt-0.5 shrink-0">
                              {typeIcons[log.activityType] || <Clock className="w-4 h-4 text-slate-600" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  log.childId === "dominic" ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-700"
                                }`}>
                                  {log.childName}
                                </span>
                                <span className="text-slate-400 text-[11px] font-semibold">{dateFormatted}</span>
                              </div>
                              <p className="text-[12px] font-black text-slate-900 mt-1">{log.activityName}</p>
                              {log.details && <p className="text-[11px] text-slate-500 font-medium mt-0.5">{log.details}</p>}
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <div className="px-3 py-1 bg-slate-900 border-2 border-slate-950 text-white rounded-xl inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-xs font-black tracking-tight">{formatDurationMin(log.durationSeconds)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 📊 RAPOARTE DETALIATE ȘI LOGURI SEPARATE PE COPII */}
      <div className={`${dashboardStyles.card} mb-8 animate-fade-in`} id="parent-children-detailed-reports">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-4 mb-6 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 border border-rose-150 text-rose-755 rounded-2xl">
              <Users className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                Rapoarte & Jurnale Individuale Copii 📊
              </h3>
              <p className="text-[10px] text-slate-405 font-bold uppercase tracking-wider">
                Lectură completă, dovezi foto & amprente de timp confirmate separat
              </p>
            </div>
          </div>

          {/* Child Selector Pill Header */}
          <div className="flex bg-slate-105 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {state.children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedReportChild(child.id as any)}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                  selectedReportChild === child.id
                    ? "bg-white text-slate-950 shadow-2xs border border-slate-200/60"
                    : "text-slate-550 hover:text-slate-900 text-slate-500"
                }`}
              >
                <span className="text-sm">{child.avatar}</span>
                <span className="uppercase tracking-wider">{child.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Buttons bar inside the widget */}
        <div className="flex flex-wrap border-b border-slate-100 pb-px mb-5 gap-1">
          <button
            onClick={() => setSelectedReportTab("reading")}
            className={`px-4 py-2.5 border-b-2 text-xs font-black transition duration-150 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider ${
              selectedReportTab === "reading"
                ? "border-rose-500 text-rose-600"
                : "border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-300 text-slate-505"
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-505 text-emerald-500" />
            Ce s-a citit 📚
          </button>
          
          <button
            onClick={() => setSelectedReportTab("photos")}
            className={`px-4 py-2.5 border-b-2 text-xs font-black transition duration-150 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider ${
              selectedReportTab === "photos"
                ? "border-rose-500 text-rose-600"
                : "border-transparent text-slate-450 hover:text-slate-705 hover:border-slate-300 text-slate-505"
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-505 text-indigo-500" />
            Poze încărcate 📸
          </button>

          <button
            onClick={() => setSelectedReportTab("screentime")}
            className={`px-4 py-2.5 border-b-2 text-xs font-black transition duration-150 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider ${
              selectedReportTab === "screentime"
                ? "border-rose-500 text-rose-600"
                : "border-transparent text-slate-450 hover:text-slate-705 hover:border-slate-300 text-slate-505"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-505 text-amber-500" />
            Timp ecran setat ⏱️
          </button>
        </div>

        {/* Dynamic Inner Tab Content */}
        {(() => {
          const currentChildName = state.children.find(c => c.id === selectedReportChild)?.name || selectedReportChild;

          if (selectedReportTab === "reading") {
            const readingLogs = (state.readingHistory || []).filter(h => h.childId === selectedReportChild);
            
            if (readingLogs.length === 0) {
              return (
                <div className="p-8 text-center text-slate-400 font-bold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  📚 Nu s-a înregistrat nicio lectură finalizată pentru {currentChildName} până acum în această sesiune.
                </div>
              );
            }

            return (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {readingLogs.map((log: any) => {
                  const dateFormatted = new Date(log.completedAt).toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div key={log.id} className="p-4 bg-slate-50 border border-slate-150 hover:bg-slate-100/50 rounded-2xl transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-rose-600 bg-rose-55 rounded-full uppercase tracking-wider font-sans">
                            Lectură de Vacanță
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{dateFormatted}</span>
                        </div>
                        <h5 className="font-extrabold text-slate-900 text-xs mt-1 leading-snug">
                          {log.topic}
                        </h5>
                        <p className="text-[10px] text-slate-505 mt-0.5 font-medium">
                          Volum citit: <span className="font-bold text-slate-750">{log.wordCount} cuvinte</span>
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase rounded-lg tracking-wide inline-flex items-center gap-1">
                          🧠 Chestionar: {log.score} / 3 Corect
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          if (selectedReportTab === "photos") {
            const photoLogs = (state.uploadedPhotosHistory || []).filter(h => h.childId === selectedReportChild);

            if (photoLogs.length === 0) {
              return (
                <div className="p-8 text-center text-slate-400 font-bold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  📸 Nu s-a încărcat nicio dovadă foto de către {currentChildName} până acum în această sesiune.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                {photoLogs.map((log: any) => {
                  const dateFormatted = new Date(log.timestamp).toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div key={log.id} className="bg-slate-50/50 border-2 border-slate-150 rounded-2xl p-4 flex flex-col gap-3 hover:border-slate-300 transition duration-155">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] text-slate-400 font-bold">{dateFormatted}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md tracking-wider ${
                          log.status === "approved"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : log.status === "rejected"
                            ? "bg-rose-100 text-rose-750 border border-rose-22"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}>
                          {log.status === "approved" ? "Aprobat" : log.status === "rejected" ? "Respins" : "În așteptare"}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <div 
                          className="w-20 h-20 rounded-xl relative overflow-hidden bg-slate-900 border border-slate-200 shrink-0 cursor-pointer hover:opacity-90 transition group"
                          onClick={() => setViewerPhotoUrl(log.photoUrl ?? "")}
                          title="Click pentru a vizualiza imaginea mărită"
                        >
                          <img 
                            src={log.photoUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200"} 
                            alt={log.activityName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center text-white text-[9px] font-black uppercase">
                            Zoom 🔍
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-xs leading-snug truncate">
                              {log.activityName}
                            </h5>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal italic font-medium bg-white p-2 rounded-xl border border-slate-150/90 mt-1.5 max-h-[70px] overflow-y-auto">
                            &quot;{log.feedback}&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          if (selectedReportTab === "screentime") {
            const screenLogs = (state.screenTimeRequests || []).filter(
              h => h.childId === selectedReportChild && h.status === "fulfilled"
            );

            if (screenLogs.length === 0) {
              return (
                <div className="p-8 text-center text-slate-400 font-bold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  ⏱️ Nu s-a configurat nicio alocare de timp ecran/recompensă „Setat” pentru {currentChildName} până acum în această sesiune.
                </div>
              );
            }

            return (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {screenLogs.map((log: any) => {
                  const dateFormatted = log.confirmedAt 
                    ? new Date(log.confirmedAt).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : new Date(log.timestamp).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                  return (
                    <div key={log.id} className="p-4 bg-emerald-50/30 border border-emerald-150/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                            Setat de Părinte ☑️
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{dateFormatted}</span>
                        </div>
                        <h5 className="font-extrabold text-slate-900 text-xs mt-1 leading-snug">
                          {log.rewardName}
                        </h5>
                        <p className="text-[10px] mt-0.5 font-medium text-slate-500">
                          Decontat cu <span className="font-mono font-black text-amber-700">-{log.costPoints} puncte</span> din economii
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="px-2.5 py-1 bg-white text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase rounded-lg tracking-wide">
                          Status: Configurat pe router / device
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }
        })()}
      </div>

      {/* LIGHTBOX MODAL FOR DETAILED CONVENIENT PHOTO EXAMINING */}
      {viewerPhotoUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setViewerPhotoUrl(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-850 flex flex-col shadow-2xl">
            <button 
              className="absolute right-4 top-4 bg-black/60 hover:bg-slate-800/90 hover:scale-105 text-white p-2 rounded-full cursor-pointer transition z-10"
              onClick={() => setViewerPhotoUrl(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center p-6 flex-1 min-h-0">
              <img 
                src={viewerPhotoUrl} 
                alt="Zoom dovadă vizuală" 
                className="max-w-full max-h-[70vh] object-contain rounded-xl select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="bg-slate-950 p-4 border-t border-slate-850 text-center text-slate-400 text-xs font-bold leading-normal">
              Vizualizare detaliată dovadă foto activitate • Arcadia Smart Vacation
            </div>
          </div>
        </div>
      )}

      {/* SECTIUNEA TIMP ECRAN SOLICITAT & RECOMPENSE - VERIFICARE PARINTE */}
      <div className={`${dashboardStyles.card} mb-8 animate-fade-in`} id="parent-screen-time-approvals">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-150 text-indigo-750 rounded-2xl">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                Urmărire și Aprobări Timp Ecran Copii ⏱️
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Verificare cereri din magazin & sincronizare manuală
              </p>
            </div>
          </div>
          
          {/* Tabs switch */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-[11px] font-bold self-start sm:self-center">
            <button
              onClick={() => setScreenTimeTab("pending")}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition uppercase tracking-wider ${
                screenTimeTab === "pending"
                  ? "bg-white text-slate-950 shadow-2xs border border-slate-200/60 font-black text-[10px]"
                  : "text-slate-500 hover:text-slate-900 text-[10px]"
              }`}
            >
              În așteptare ({(state.screenTimeRequests || []).filter(r => r.status === "pending" || !r.status).length})
            </button>
            <button
              onClick={() => setScreenTimeTab("history")}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition uppercase tracking-wider ${
                screenTimeTab === "history"
                  ? "bg-white text-slate-950 shadow-2xs border border-slate-200/60 font-black text-[10px]"
                  : "text-slate-500 hover:text-slate-900 text-[10px]"
              }`}
            >
              Istoric Aprobări ({(state.screenTimeRequests || []).filter(r => r.status === "fulfilled").length})
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-508 mb-6 leading-relaxed font-semibold">
          Aceasta este zona de audit în care vezi exact ce timp de ecran sau recompense au solicitat copiii cheltuind puncte reale din magazinul lor digital. Dacă au achiziționat mai multe pachete (de ex. 30 min de mai multe ori), sistemul calculează volumul agregat necesar pentru router/Family Link, ca să nu greșești calculele!
        </p>

        {screenTimeTab === "pending" ? (
          <div className="space-y-6">
            {(() => {
              const pendingRequests = (state.screenTimeRequests || []).filter(
                (r: any) => r.status === "pending" || !r.status
              );

              if (pendingRequests.length === 0) {
                return (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-semibold text-xs bg-slate-50/50">
                    🎉 Toate solicitările de timp ecran și recompense sunt aprobate la zi! Nu există nicio cerere în așteptare.
                  </div>
                );
              }

              // Compute child totals (aggregate sums) as requested: "dacă s-a solicitat timp 30 min de 3 ori să știu că trebuie să aprob 1 oră și 30 minute"
              const childrenTotals: Record<string, { totalMinutes: number; items: Record<string, { name: string; count: number }> }> = {};
              pendingRequests.forEach((r: any) => {
                if (!childrenTotals[r.childId]) {
                  childrenTotals[r.childId] = { totalMinutes: 0, items: {} };
                }
                childrenTotals[r.childId].totalMinutes += r.durationMinutes || 0;
                
                const key = r.rewardId || r.rewardName;
                if (!childrenTotals[r.childId].items[key]) {
                  childrenTotals[r.childId].items[key] = { name: r.rewardName, count: 0 };
                }
                childrenTotals[r.childId].items[key].count += 1;
              });

              const formatMinutesRo = (m: number) => {
                const h = Math.floor(m / 60);
                const min = m % 60;
                if (h > 0) {
                  return `${h} ${h === 1 ? 'oră' : 'ore'}${min > 0 ? ` și ${min} minute` : ''}`;
                }
                return `${min} minute`;
              };

              return (
                <div className="space-y-6">
                  {/* SUMMARY CARDS / BENTO BLOCKS FOR TOTAL TIME BY CHILD */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(childrenTotals).map((cId) => {
                      const childData = state.children.find((c) => c.id === cId);
                      const aggregate = childrenTotals[cId];
                      if (aggregate.totalMinutes === 0) return null;
                      
                      return (
                        <div 
                          key={`agg-${cId}`} 
                          className="bg-indigo-600 text-white rounded-3xl p-5 border-2 border-indigo-700 shadow-xs relative overflow-hidden"
                        >
                          <div className="absolute right-3 bottom-0 text-[100px] opacity-10 select-none pointer-events-none">
                            ⏱️
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl p-1.5 bg-indigo-700/50 rounded-xl border border-indigo-500/30">
                              {childData?.avatar || "👦"}
                            </span>
                            <div>
                              <h4 className="font-extrabold text-sm">{childData?.name || cId}</h4>
                              <p className="text-[9px] text-indigo-200 font-extrabold uppercase tracking-widest leading-none mt-0.5">
                                de aprobat pe router/app:
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-lg font-black tracking-tight mb-2 font-sans flex items-baseline gap-1">
                            <span className="text-amber-300 drop-shadow-xs">
                              {formatMinutesRo(aggregate.totalMinutes)}
                            </span>
                          </div>
                          
                          <div className="border-t border-indigo-500/50 pt-2 text-[11px] text-indigo-150 leading-relaxed font-semibold">
                            <span className="font-extrabold block text-[8px] uppercase tracking-wider text-amber-200 mb-1">
                              Pachete Solicitate:
                            </span>
                            {Object.values(aggregate.items).map((item: any, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-indigo-750/30 px-2 py-0.5 rounded-lg mb-1 border border-indigo-550/10 text-[10px]">
                                <span className="truncate max-w-[180px]">{item.name}</span>
                                <span className="font-black bg-indigo-800 px-1.5 py-0.5 rounded text-white text-[9px] shrink-0 font-sans">
                                  de {item.count} ori
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* GRANULAR CHECKLIST OF INDIVIDUAL REQUESTS WITH PARENT APPROVAL CHECKBOX */}
                  <div>
                    <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3.5 flex items-center gap-1.5 font-sans">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                      Lista Solicitărilor Individuale (Verifică și bifează ce ai acordat):
                    </h4>
                    
                    <div className="space-y-3">
                      {pendingRequests.map((req: any) => {
                        const dateStr = (() => {
                          try {
                            return new Date(req.timestamp).toLocaleString("ro-RO", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short"
                            });
                          } catch {
                            return "";
                          }
                        })();

                        const childObj = state.children.find((c) => c.id === req.childId);

                        return (
                          <div 
                            key={req.id} 
                            className="bg-slate-50/50 border-2 border-slate-200 hover:border-indigo-250 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                            id={`screen-time-row-${req.id}`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox button triggers API status fulfill */}
                              <button
                                onClick={() => handleFulfillScreenTime(req.id, "fulfilled")}
                                disabled={fulfillingReqId !== null}
                                className={`mt-0.5 shrink-0 w-6 h-6 rounded-lg border-2 transition flex items-center justify-center cursor-pointer ${
                                  fulfillingReqId === req.id 
                                    ? "bg-indigo-100 border-indigo-300 animate-pulse"
                                    : "border-slate-350 hover:border-indigo-400 bg-white"
                                }`}
                                title="Bifează dacă ai aprobat și configurat acest timp"
                              >
                                {fulfillingReqId === req.id ? (
                                  <div className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded bg-transparent hover:bg-slate-100"></div>
                                )}
                              </button>
                              
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-600 bg-white border border-slate-200 rounded-md">
                                    {childObj?.avatar || "👦"} {req.childName}
                                  </span>
                                  {req.durationMinutes > 0 && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-800 bg-amber-50 border border-amber-200 rounded-md font-sans">
                                      ⏱️ {req.durationMinutes} min
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    {dateStr}
                                  </span>
                                </div>
                                <h5 className="font-extrabold text-slate-800 text-xs mt-1.5 flex items-center gap-1">
                                  {req.rewardName}
                                </h5>
                                <p className="text-[10px] text-slate-400 font-black mt-0.5 uppercase tracking-wide">
                                  Schimb de puncte: decontat cu <span className="text-amber-600 font-black">-{req.costPoints} puncte</span>
                                </p>
                              </div>
                            </div>
                            
                            <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                              <button
                                onClick={() => handleFulfillScreenTime(req.id, "fulfilled")}
                                disabled={fulfillingReqId !== null}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 font-extrabold uppercase tracking-wider text-[10px] cursor-pointer transition flex items-center gap-1 shadow-2xs"
                                title="Apasă pentru a confirma că ai setat acest timp oferit copilului"
                              >
                                <Check className="w-3" />
                                ☑️ SETAT (Sincronizat)
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const historicRequests = (state.screenTimeRequests || []).filter(
                (r: any) => r.status === "fulfilled"
              );

              if (historicRequests.length === 0) {
                return (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-semibold text-xs bg-slate-50/50">
                    📅 Istoricul de aprobări este gol. Când bifezi prima solicitare din listă, ea se salvează aici pentru monitorizare.
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3.5 flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                    Istoric Aprobări Realizate (Verificate):
                  </h4>
                  
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                    {historicRequests.map((req: any) => {
                      const reqDateObj = new Date(req.timestamp);
                      const confDateObj = req.confirmedAt ? new Date(req.confirmedAt) : null;
                      
                      const formattedReqDate = reqDateObj.toLocaleString("ro-RO", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short"
                      });
                      const formattedConfDate = confDateObj ? confDateObj.toLocaleString("ro-RO", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short"
                      }) : "";

                      const childObj = state.children.find((c) => c.id === req.childId);

                      return (
                        <div 
                          key={req.id} 
                          className="bg-emerald-50/10 border-2 border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            {/* Fulfilled checkbox can be toggled back if made in error */}
                            <button
                              onClick={() => handleFulfillScreenTime(req.id, "pending")}
                              disabled={fulfillingReqId !== null}
                              className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-emerald-500 border-2 border-emerald-500 text-white flex items-center justify-center cursor-pointer hover:bg-emerald-600"
                              title="Apasă pentru a trimite din nou în lista în așteptare"
                            >
                              {fulfillingReqId === req.id ? (
                                <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </button>
                            
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 rounded-md">
                                  {childObj?.avatar || "👦"} {req.childName}
                                </span>
                                {req.durationMinutes > 0 && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-700 bg-slate-100 border border-slate-200 rounded-md font-sans">
                                    ⏱️ {req.durationMinutes} min
                                  </span>
                                )}
                              </div>
                              <h5 className="font-extrabold text-slate-800 text-xs mt-1">
                                {req.rewardName}
                              </h5>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">
                                Solicitat la {formattedReqDate} • <span className="text-emerald-700 font-black">Bifat ca finalizat la {formattedConfDate}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => handleFulfillScreenTime(req.id, "pending")}
                              disabled={fulfillingReqId !== null}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                            >
                              Anulează bifa
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* SECȚIUNEA PROPUNERI & SUGESTII DE LA COPII */}
      <div className={`${dashboardStyles.card}`} id="parent-suggestions-widget">
        <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-4 flex items-center gap-2 uppercase tracking-wide">
          <Lightbulb className="w-5 h-5 text-indigo-650" />
          Propuneri și Cereri de la Copii 💡
        </h3>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed font-semibold">
          Analizează propunerile trimise de Dominic și Sofia pentru activități noi (pentru a primi puncte) sau recompense noi în magazin. Aprobarea lor le transformă automat în elemente active (sarcină de completat în panou sau recompensă gata de cumpărat în magazin)!
        </p>

        {!state.suggestions || state.suggestions.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-semibold text-xs">
            Nu există propuneri trimise de copii în acest moment. Când copiii propun ceva din panoul lor, vor apărea instantaneu aici!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.suggestions.map((sug) => {
              const dateStr = (s_date) => {
                try {
                  return new Date(s_date).toLocaleString('ro-RO', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
                } catch {
                  return "";
                }
              };
              return (
                <div 
                  key={sug.id} 
                  className={`p-5 rounded-3xl border-2 transition-all duration-150 ${
                    sug.status === 'approved' 
                      ? 'border-emerald-250 bg-emerald-50/10' 
                      : sug.status === 'rejected' 
                        ? 'border-rose-200 bg-rose-50/10' 
                        : 'border-slate-200 bg-slate-50/20'
                  } space-y-4 shadow-2xs`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1 bg-white rounded-xl border border-slate-100 shadow-2xs">
                        {sug.childId === 'dominic' ? '👦' : '🐈'}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">{sug.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Trimis de {sug.childName} • {dateStr(sug.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div>
                      {sug.status === 'approved' && (
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                          Aprobată
                        </span>
                      )}
                      {sug.status === 'rejected' && (
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 rounded-full">
                          Respinsă
                        </span>
                      )}
                      {sug.status === 'pending' && (
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 rounded-full animate-pulse">
                          În așteptare
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white p-3 rounded-2xl border border-slate-100">
                    <span className="font-extrabold block text-[9px] text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Descriere Propunere</span>
                    {sug.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-700 bg-slate-100/50 p-2.5 rounded-2xl border border-slate-150">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">Tip:</span>
                      <span className={`px-2 py-0.5 rounded-lg uppercase text-[9px] font-black ${
                        sug.type === 'cashout' ? 'bg-emerald-100 border border-emerald-300 text-emerald-800' : 'bg-indigo-50 border border-indigo-150 text-indigo-700'
                      }`}>
                        {sug.type === 'activity' ? '🏃‍♂️ Activitate' : sug.type === 'reward' ? '🎁 Recompensă' : sug.type === 'cashout' ? '💶 Schimb Bani' : '💡 Altele'}
                      </span>
                    </div>
                    {sug.proposedPointsOrCost !== undefined && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">
                          {sug.type === 'activity' ? 'Puncte propuse' : sug.type === 'reward' ? 'Preț propus' : 'Puncte retrase'}:
                        </span>
                        <span className={`font-black ${sug.type === 'cashout' ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {sug.proposedPointsOrCost} Pct {sug.type === 'cashout' && `(= ${Math.round(sug.proposedPointsOrCost / 10)} RON)`}
                        </span>
                      </div>
                    )}
                    {sug.proposedDurationMinutes !== undefined && sug.proposedDurationMinutes > 0 && (
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">Durată ecran:</span>
                        <span className="text-indigo-600 font-black">{sug.proposedDurationMinutes} min</span>
                      </div>
                    )}
                  </div>

                  {/* Feedback zone */}
                  {sug.status === 'pending' ? (
                    <div className="space-y-3 pt-2 text-xs font-semibold">
                      {sug.type === 'cashout' && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-250 rounded-xl text-emerald-900 text-[11px] leading-normal font-bold font-sans">
                          💡 <strong>Cum funcționează?</strong> Copilul a cerut să presimbe {sug.proposedPointsOrCost} puncte din pușculița lui în <strong>{Math.round(sug.proposedPointsOrCost / 10)} RON</strong> reali. Aprobând, confirmi că-i înmânezi fizic acești bani. Dacă respingi, cele {sug.proposedPointsOrCost} puncte îi sunt returnate automat copilului în sold!
                        </div>
                      )}
                      <div>
                        <label className="block text-slate-500 font-bold uppercase tracking-wider text-[8px] mb-1">
                          Observații / Feedback Părinte (opțional):
                        </label>
                        <input
                          type="text"
                          value={suggestionFeedback[sug.id] || ""}
                          onChange={(e) => setSuggestionFeedback(prev => ({ ...prev, [sug.id]: e.target.value }))}
                          placeholder="Ex: Sună grozav! Am aprobat-o."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleRespondSuggestion(sug.id, 'rejected')}
                          className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Respinge
                        </button>
                        
                        {sug.type === 'activity' ? (
                          <>
                            <button
                              onClick={() => handleRespondSuggestion(sug.id, 'approved', false)}
                              className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Aprobă pe loc
                            </button>
                            <button
                              onClick={() => handleRespondSuggestion(sug.id, 'approved', true)}
                              className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-650 text-white font-black uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1 shadow-sm border border-amber-500"
                              title="Salvează activitatea pentru a fi listată automat mâine excelent"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              Aprobă pt Mâine
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRespondSuggestion(sug.id, 'approved', false)}
                            className={`flex-1 py-2 px-3 rounded-xl text-white font-black uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1 shadow-sm ${
                              sug.type === 'cashout' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-250' : 'bg-indigo-650 hover:bg-indigo-700'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {sug.type === 'cashout' ? `Aprobă & Plătește ${Math.round(sug.proposedPointsOrCost / 10)} RON` : 'Aprobă / Adaugă în Magazin'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    sug.adminFeedback && (
                      <div className="p-3 rounded-2xl bg-slate-100/60 border border-slate-250 text-xs leading-relaxed text-slate-805">
                        <span className="font-extrabold block text-[8px] text-slate-400 uppercase tracking-widest mb-1">Feedback de la Părinți</span>
                        "{sug.adminFeedback}"
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      
      {/* SECTIUNEA CITIT: DEFINIRE ȘI APROBARE TEMĂ DE LECTURĂ PENTRU MÂINE */}
      <div className={`${dashboardStyles.card}`} id="parent-reading-proposals-widget">
        <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-2 uppercase tracking-wide">
          <Lightbulb className="w-5 h-5 text-indigo-650" />
          Aprobare & Personalizare Lecturi de Vacanță (Mâine)
        </h3>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed font-semibold">
          Stabilește din timp despre ce urmează să citească cei doi copii mâine! Poți indica tema dorită sau aproba propunerea lor, poți adăuga instrucțiuni speciale pe care Gemini să le integreze obligatoriu în text (de exemplu: "adaugă reguli de siguranță la computer"), sau poți insera întrebări speciale de verificare.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Dominic */}
          <div className={`${dashboardStyles.subCard}`}>
            <div className="flex items-center gap-2 border-b-2 border-slate-200/50 pb-3">
              <span className="text-2xl p-1 bg-white rounded-xl border border-slate-150">👦</span>
              <h4 className="font-extrabold text-indigo-950 text-sm">Lectură Mâine: Dominic (10 ani)</h4>
            </div>

            <div className="space-y-4 text-xs font-semibold font-sans">
              <div>
                <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Subiectul lecției:</label>
                <input
                  type="text"
                  value={dominicTopic}
                  onChange={(e) => setDominicTopic(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-600 font-medium text-slate-800 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Instrucțiuni speciale pentru text (AI va ține cont):</label>
                <textarea
                  value={dominicCustomPrompt}
                  onChange={(e) => setDominicCustomPrompt(e.target.value)}
                  placeholder="Ex: Scrie pe înțelesul lui și oferă 2 sfaturi despre cum să devenim exploratori mai buni."
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl bg-white h-16 resize-none focus:outline-none focus:border-indigo-600 font-medium text-slate-800 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Adaugă cerință chestionar / întrebare specială:</label>
                <input
                  type="text"
                  value={dominicCustomQuestions}
                  onChange={(e) => setDominicCustomQuestions(e.target.value)}
                  placeholder="Ex: Adaugă o întrebare despre mărimea celui mai mare crocodil maritim."
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-600 font-medium text-slate-800 transition-colors"
                />
              </div>

              <button
                onClick={() => handleSaveTopic("dominic")}
                disabled={isSavingTopic["dominic"]}
                className="w-full py-3 bg-indigo-600 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer uppercase tracking-wider shadow-xs"
              >
                {isSavingTopic["dominic"] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvează & Aprobă pentru Dominic
              </button>
            </div>
          </div>

          {/* Sofia */}
          <div className={`${dashboardStyles.subCard}`}>
            <div className="flex items-center gap-2 border-b-2 border-slate-200/50 pb-3">
              <span className="text-2xl p-1 bg-white rounded-xl border border-slate-150">🐈</span>
              <h4 className="font-extrabold text-slate-900 text-sm">Lectură Mâine: Sofia (14 ani)</h4>
            </div>

            <div className="space-y-4 text-xs font-semibold font-sans">
              <div>
                <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Subiectul lecției:</label>
                <input
                  type="text"
                  value={sofiaTopic}
                  onChange={(e) => setSofiaTopic(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-600 font-medium text-slate-800 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Instrucțiuni speciale pentru text (AI va ține cont):</label>
                <textarea
                  value={sofiaCustomPrompt}
                  onChange={(e) => setSofiaCustomPrompt(e.target.value)}
                  placeholder="Ex: Nivel mediu academic. Discută despre evoluția rețelelor neuronale artificiale recente."
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl bg-white h-16 resize-none focus:outline-none focus:border-indigo-600 font-medium text-slate-800 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Adaugă cerință chestionar / întrebare specială:</label>
                <input
                  type="text"
                  value={sofiaCustomQuestions}
                  onChange={(e) => setSofiaCustomQuestions(e.target.value)}
                  placeholder="Ex: Întreabă care e diferența fundamentală dintre inteligența generală și cea îngustă."
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-600 font-medium text-slate-800 transition-colors"
                />
              </div>

              <button
                onClick={() => handleSaveTopic("sofia")}
                disabled={isSavingTopic["sofia"]}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer uppercase tracking-wider shadow-xs"
              >
                {isSavingTopic["sofia"] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvează & Aprobă pentru Sofia
              </button>
            </div>
          </div>

        </div>
      </div>


      {/* SECTIUNEA STATISTICI & EVALUARE DIDACTICĂ LECTURĂ */}
      <div className={`${dashboardStyles.card}`} id="parent-reading-analytics-widget">
        <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-2 uppercase tracking-wide">
          <FileText className="w-5 h-5 text-indigo-650" />
          Raport Didactic și Evaluare Lectură 📊
        </h3>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed font-semibold">
          Analizează istoricul de lectură înregistrat pentru Sofia și Dominic. Sistemul asociază automat texte riguroase și lungi domnișoarei <strong>Sofia</strong> (stabilit la 480-650 cuvinte), iar pentru <strong>Dominic</strong> mărește treptat lungimea pe măsură ce își menține seria consecutivă de citit.
        </p>

        {/* Cărți copii mari */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Raport Sofia */}
          <div className={`${dashboardStyles.subCard}`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
              <div className="flex items-center gap-2">
                <span className="text-2xl p-1 bg-white rounded-xl border border-slate-150">🐈</span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Evaluare Sofia</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vârsta: 14 ani</p>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Nivel Academic Lung (450-650 cuv)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 text-center">
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Texte Citite</p>
                <p className="text-2xl font-black text-indigo-950">{state.readingHistory?.filter(h => h.childId === "sofia").length || 0}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 text-center">
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Medie Cuvinte</p>
                <p className="text-2xl font-black text-indigo-700">
                  {state.readingHistory?.filter(h => h.childId === "sofia").length ? Math.round(state.readingHistory.filter(h => h.childId === "sofia").reduce((acc, curr) => acc + curr.wordCount, 0) / state.readingHistory.filter(h => h.childId === "sofia").length) : 510} <span className="text-xs font-bold text-slate-500">cuv.</span>
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/25 rounded-2xl border border-indigo-100 text-xs font-semibold text-indigo-900 leading-relaxed">
              <strong>Obiectiv îndeplinit:</strong> Toate articolele didactice ale Sofiei sunt completate automat la lungimi academice ridicate. Discursul adaptat cuprinde fraze elaborate, nuanțe teoretice complexe și vocabular avansat menit să-i antreneze spiritul critic și atenția susținută de durată.
            </div>
          </div>

          {/* Raport Dominic */}
          <div className={`${dashboardStyles.subCard}`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
              <div className="flex items-center gap-2">
                <span className="text-2xl p-1 bg-white rounded-xl border border-slate-150">👦</span>
                <div>
                  <h4 className="font-extrabold text-indigo-950 text-sm">Evaluare Dominic</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vârsta: 10 ani</p>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                Lărgire Treptată (Dificultate Progresivă)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 text-center">
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Texte Citite</p>
                <p className="text-2xl font-black text-indigo-950">{state.readingHistory?.filter(h => h.childId === "dominic").length || 0}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 text-center">
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Medie Cuvinte</p>
                <p className="text-2xl font-black text-blue-700">
                  {state.readingHistory?.filter(h => h.childId === "dominic").length ? Math.round(state.readingHistory.filter(h => h.childId === "dominic").reduce((acc, curr) => acc + curr.wordCount, 0) / state.readingHistory.filter(h => h.childId === "dominic").length) : 190} <span className="text-xs font-bold text-slate-500">cuv.</span>
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/25 rounded-2xl border border-blue-100 text-xs font-semibold text-blue-900 leading-relaxed">
              <strong>Stadiu:</strong> Lungimea lecturilor lui Dominic crește direct proporțional cu streak-ul consecutiv de citire (actual: <strong>{state.children?.find(c => c.id === "dominic")?.readingStreak || 2} zile</strong>). Această metodă previne suprasolicitarea inițială, adăugând gradual ~30 de cuvinte cu fiecare zi.
            </div>
          </div>
        </div>

        {/* Distribuția Temelor Favorite */}
        <div className="p-5 border-2 border-slate-200 rounded-3xl mb-8 bg-slate-50/5">
          <h4 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider mb-4">Analiză de profil didacticitate: Ce s-a citit mai mult</h4>
          {!state.readingHistory || state.readingHistory.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nu există date suficiente în istoric în acest moment.</p>
          ) : (
            <div className="space-y-4 font-semibold text-xs text-slate-700">
              {Object.entries(
                state.readingHistory.reduce((acc: any, h: any) => {
                  const topicLC = h.topic.toLowerCase();
                  let cat = "Științe Generale & Altele";
                  if (topicLC.includes("robot") || topicLC.includes("motoare") || topicLC.includes("program")) cat = "Tehnologie & Programare Aplicată";
                  else if (topicLC.includes("univers") || topicLC.includes("gaur") || topicLC.includes("spatiu") || topicLC.includes("solar")) cat = "Cosmologie & Fizică Spațială";
                  else if (topicLC.includes("medicin") || topicLC.includes("dinoz") || topicLC.includes("animal")) cat = "Biologie & Paleontologie";
                  else if (topicLC.includes("roman") || topicLC.includes("istor")) cat = "Istorie & Civilizații";
                  acc[cat] = (acc[cat] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([cat, count]: any) => {
                  const percentage = Math.round((count / (state.readingHistory?.length || 1)) * 100);
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-extrabold">
                        <span className="text-slate-800">{cat}</span>
                        <span className="text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-mono">{count} {count === 1 ? "articol" : "articole"} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Jurnalul detaliat de articole parcurse */}
        <div className="border-2 border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
            <h4 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">Registrul Portofoliului de Lectură Activ</h4>
            <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full">
              Sesiuni finalizate: {state.readingHistory?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-450 uppercase tracking-wider font-extrabold text-[9px] font-sans">
                  <th className="px-5 py-3">Cititor</th>
                  <th className="px-5 py-3">Subiect parcurs</th>
                  <th className="px-5 py-3 text-center">Lungime text</th>
                  <th className="px-5 py-3 text-center">Răspunsuri</th>
                  <th className="px-5 py-3 text-right">Dată finalizare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-semibold text-slate-705">
                {state.readingHistory?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="px-5 py-3 flex items-center gap-1.5">
                      <span className="text-sm">{item.childId === "sofia" ? "🐈" : "👦"}</span>
                      <span className="font-bold text-slate-900">{item.childName}</span>
                    </td>
                    <td className="px-5 py-3 font-sans font-bold text-indigo-950">
                      {item.topic}
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-[11px] font-black">
                      <span className={`px-2.5 py-1 rounded-md border ${
                        item.wordCount >= 450 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>
                        {item.wordCount} cuvinte
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-extrabold border border-indigo-150">
                        {item.score}/3 Corecte
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400 font-mono text-[10px]">
                      {new Date(item.completedAt).toLocaleDateString("ro-RO")} {new Date(item.completedAt).toLocaleTimeString("ro-RO", {hour: "2-digit", minute: "2-digit"})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* SECTIUNEA INTEGRARE HOME ASSISTANT */}
      <div className={`${dashboardStyles.card}`} id="parent-homeassistant-integration-widget">
        <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-4 flex items-center gap-2 uppercase tracking-wide">
          <Settings className="w-5 h-5 text-indigo-650" />
          Configurare Integrare Locală Home Assistant 🏠
        </h3>
        
        <p className="text-sm text-slate-500 mb-4 leading-relaxed font-semibold">
          Când copiii cumpără recompense din magazin ("1 oră TV" sau "1 oră Xbox"), serverul trimite imediat o cerere securizată către panoul tău local Home Assistant prin serviciul <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-bold border border-slate-200">input_boolean.turn_on</code>. Când cronometrul de vacanță expiră, serverul trimite semnalul de stingere <code className="bg-slate-100 text-slate-805 px-1.5 py-0.5 rounded text-xs font-bold border border-slate-200">input_boolean.turn_off</code>.
        </p>

        <div className="bg-indigo-50 border-2 border-indigo-150 rounded-2xl p-4 mb-6 text-xs text-indigo-950 font-medium space-y-2">
          <p className="font-extrabold flex items-center gap-1.5 text-indigo-900">
            <span>🌐</span> Întrebare: Pot folosi Home Assistant dacă aplicația este găzduită în Cloud?
          </p>
          <p className="leading-relaxed">
            <strong>Da, absolut!</strong> Deoarece aplicația Arcadia rulează în cloud, aceasta poate comunica securizat cu instanța ta de Home Assistant prin una din următoarele metode standard:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 leading-relaxed font-semibold">
            <li><strong className="text-indigo-900">Home Assistant Cloud (Nabu Casa):</strong> Cea mai simplă și sigură metodă (ex: <code className="bg-white/60 px-1 rounded text-[11px]">https://[id-unic].ui.nabu.casa</code>). Nu necesită deschiderea de porturi în router.</li>
            <li><strong className="text-indigo-900">Cloudflare Tunnels:</strong> O metodă gratuită și excelentă prin care expui securizat doar API-ul local către un subdomeniu HTTPS personalizat.</li>
            <li><strong className="text-indigo-900">IP Public / DuckDNS direct:</strong> Configurarea unui DNS dinamic și redirecționarea securizată (port forwarding) a portului <code className="bg-white/60 px-1 rounded text-[11px]">8123</code> din routerul tău de acasă, protejat obligatoriu de un certificat SSL (HTTPS).</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
          <div className="space-y-4">
            <div>
              <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Home Assistant URL:</label>
              <input
                type="text"
                value={haUrl}
                onChange={(e) => setHaUrl(e.target.value)}
                placeholder="Ex: http://192.168.1.100:8123"
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-850"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Long-Lived Access Token (Token Securizat local):</label>
              <input
                type="password"
                value={haToken}
                onChange={(e) => setHaToken(e.target.value)}
                placeholder="Introdu codul token HA din profilul tău local"
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-850"
              />
            </div>

            <div className="flex items-center gap-2.5 py-2">
              <input
                type="checkbox"
                id="ha-enabled"
                checked={haEnabled}
                onChange={(e) => setHaEnabled(e.target.checked)}
                className="w-5 h-5 text-indigo-600 border-2 border-slate-300 rounded-lg focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="ha-enabled" className="text-xs font-extrabold text-slate-700 cursor-pointer select-none">
                Activează transferul real spre Home Assistant (Aplicație Conectată)
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Entitate TV în Home Assistant:</label>
              <input
                type="text"
                value={tvEntity}
                onChange={(e) => setTvEntity(e.target.value)}
                placeholder="input_boolean.tv_kids_time"
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-850"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Entitate Xbox în Home Assistant:</label>
              <input
                type="text"
                value={xboxEntity}
                onChange={(e) => setXboxEntity(e.target.value)}
                placeholder="input_boolean.xbox_kids_time"
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-850"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveHA}
                disabled={isSavingHA}
                className="w-full py-3 bg-slate-900 hover:bg-slate-855 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition duration-150 shadow-xs cursor-pointer uppercase tracking-wider animate-pulse"
              >
                {isSavingHA ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvează conexiunea Home Assistant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTIUNEA NOTIFICĂRI E-MAIL PĂRINTI */}
      <div className={`${dashboardStyles.card}`} id="parent-email-notifications-widget">
        <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-4 flex items-center gap-2 uppercase tracking-wide">
          <Mail className="w-5 h-5 text-indigo-650 animate-bounce" />
          Configurare Notificări & Rapoarte pe E-mail 📧
        </h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed font-semibold">
          Primești alerte automate și rapoarte de vacanță instantaneu pe e-mailul tău când copiii finalizează activități sau efectuează schimburi de puncte în recompense digitale sau extra timp pe ecran.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formular configurare e-mail */}
          <div className="lg:col-span-1 space-y-6">
            {/* Box 1: Adresă Destinație */}
            <div className={`${dashboardStyles.subCard}`}>
              <h4 className="font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100 text-[13px] uppercase tracking-wide flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-650" /> Adresă Destinație
              </h4>
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">E-mail principal părinte pentru notificări:</label>
                  <input
                    type="email"
                    value={parentEmailInput}
                    onChange={(e) => setParentEmailInput(e.target.value)}
                    placeholder="Ex: csepregi.arthur@gmail.com"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-850"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="w-full py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer uppercase tracking-wider shadow-xs"
                >
                  {isSavingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvează E-mail
                </button>
              </form>
            </div>

            {/* Box 2: Server SMTP Custom */}
            <div className={`${dashboardStyles.subCard} text-xs font-semibold space-y-4`}>
              <h4 className="font-extrabold text-slate-900 pb-2 border-b border-slate-100 text-[13px] uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Server className="w-4 h-4 text-indigo-650" /> Server SMTP Custom (Real)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smtpEnabled}
                    onChange={(e) => setSmtpEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </h4>

              {smtpEnabled ? (
                <div className="space-y-3">
                  <p className="text-[10px] text-indigo-900 bg-indigo-50/65 border border-indigo-150 p-3 rounded-2xl font-medium leading-relaxed">
                    Sistemul va trimite e-mailuri la finalizarea sarcinilor prin propriul tău server SMTP de încredere (cum ar fi Sendgrid, Mailgun sau Gmail App Password).
                  </p>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Server SMTP Host:</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-850"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Port Server:</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        placeholder="587"
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-850"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-5">
                      <input
                        type="checkbox"
                        id="smtpSecureChkBx"
                        checked={smtpSecure}
                        onChange={(e) => setSmtpSecure(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-505 w-4 h-4 border-slate-300 cursor-pointer"
                      />
                      <label htmlFor="smtpSecureChkBx" className="text-[9px] text-slate-500 font-extrabold uppercase select-none cursor-pointer">SSL-Secure (port 465)</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Utilizator (E-mail SMTP):</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="De ex: yourname@gmail.com"
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-850"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Parolă:</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-850"
                    />
                  </div>

                  {smtpTestStatus && (
                    <div className={`p-3 rounded-2xl border text-[10px] font-bold ${
                      smtpTestStatus.success 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}>
                      {smtpTestStatus.message}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1.5">
                    <button
                      onClick={handleSaveConfig}
                      disabled={isSavingConfig}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition duration-150 cursor-pointer uppercase tracking-wider shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" /> Salvează
                    </button>
                    <button
                      onClick={handleTestSmtp}
                      disabled={isTestingSmtp || !smtpHost || !smtpUser || !smtpPass}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition duration-150 cursor-pointer uppercase tracking-wider shadow-xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      {isTestingSmtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Test conexiune
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 font-semibold text-slate-500">
                  <p className="text-[11px] text-slate-400 italic font-semibold leading-relaxed">
                    Modulul de expediere reală SMTP nu este activat. În prezent, e-mailurile sunt notificate prin <strong className="text-slate-600 font-bold">Simularea Securizată Locală</strong>.
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Toate e-mailurile expediate sunt înregistrate în panoul din dreapta pentru diagnosticare și audit în timp real. Activează comutatorul de mai sus pentru a configura un releu SMTP real.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Istoric e-mailuri trimise */}
          <div className={`lg:col-span-2 ${dashboardStyles.subCard} text-xs font-semibold`}>
            <h4 className="font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100 text-[13px] uppercase tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-indigo-650" /> Jurnal E-mailuri Expediate</span>
              {isFetchingEmails ? (
                <span className="text-[10px] lowercase text-slate-400 font-medium animate-pulse">se actualizează...</span>
              ) : (
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-750 border border-indigo-100 px-2 py-0.5 rounded-full shrink-0">
                  {emailsSentList.length} trimise
                </span>
              )}
            </h4>

            {emailsSentList.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                Nu s-au expediat e-mailuri încă. Încearcă să finalizezi o activitate de pe profilul unui copil sau un schimb de puncte!
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {emailsSentList.map((email) => {
                  const isExpanded = expandedEmailId === email.id;
                  return (
                    <div key={email.id} className="border-2 border-slate-150 rounded-2xl overflow-hidden bg-white hover:border-slate-300 transition duration-150">
                      <div 
                        onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                        className="p-3.5 flex items-center justify-between gap-2 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-100/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-900 truncate text-[12px]">{email.subject}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Către: <strong className="text-slate-700 font-bold">{email.to}</strong> &bull; {new Date(email.timestamp).toLocaleString("ro-RO")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-black uppercase tracking-wider font-mono px-2.5 py-0.5 rounded-full border ${
                            email.status?.includes("Eșuat") 
                              ? "text-rose-700 bg-rose-50 border-rose-150" 
                              : email.status?.includes("SMTP") 
                                ? "text-indigo-750 bg-indigo-50 border-indigo-150"
                                : "text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-150"
                          }`}>
                            {email.status || "Trimis"}
                          </span>
                          <button className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-slate-200">
                            <Eye className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 border-t border-slate-150 bg-slate-950/5 text-xs">
                          {/* Render beautiful template mockup box */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-inner max-h-[255px] overflow-y-auto font-sans">
                            <div 
                              className="email-content"
                              dangerouslySetInnerHTML={{ __html: email.body }} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTIUNEA SECURITATE COD PIN ADMIN */}
      <div className={`${dashboardStyles.card}`} id="parent-security-pin-widget">
        <h3 className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-4 flex items-center gap-2 uppercase tracking-wide">
          <Lock className="w-5 h-5 text-indigo-650" />
          Securitate: Reconfigurare Cod PIN Acces Părinți 🔐
        </h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed font-semibold">
          Actualizează codul PIN de securitate format din 4 cifre pentru a te asigura că copiii nu pot intra accidental sau neautorizați în panoul administrativ de vacanță.
        </p>

        <form onSubmit={handleChangePinSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end text-xs font-semibold">
          <div>
            <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Cod PIN actual (implicit: 0000):</label>
            <input
              type="password"
              maxLength={4}
              value={oldPinInput}
              onChange={(e) => setOldPinInput(e.target.value.replace(/\D/g, ""))}
              placeholder="Ex: 0000"
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-mono font-bold text-center text-slate-850 tracking-widest text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-bold uppercase tracking-wider text-[9px]">Cod PIN nou (4 cifre):</label>
            <input
              type="password"
              maxLength={4}
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ""))}
              placeholder="Ex: 1234"
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-mono font-bold text-center text-slate-855 tracking-widest text-sm"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isChangingPin}
              className="w-full py-3 bg-slate-900 hover:bg-slate-855 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition duration-150 shadow-xs cursor-pointer uppercase tracking-wider"
            >
              {isChangingPin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Actualizează Cod PIN
            </button>
          </div>
        </form>
      </div>

      {/* JURNAL NOTIFICĂRI/TIMELINE EVENIMENTE */}
      <div className={`${dashboardStyles.card}`} id="parent-audit-logger-widget">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4 mb-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <Bell className="w-5 h-5 text-indigo-650" />
            Jurnal Notificări Evenimente de Vacanță 📋
          </h3>
          <span className="text-xs text-indigo-650 font-black font-mono bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">{state.notifications.length} înregistrări</span>
        </div>

        <div className="max-h-60 overflow-y-auto pr-2 space-y-3 font-semibold font-sans">
          {state.notifications.map((notif) => {
            const isSuccess = notif.type === "success";
            const isWarning = notif.type === "warning";
            
            return (
              <div 
                key={notif.id} 
                className={`p-3.5 rounded-2xl border-2 text-xs flex gap-3 shadow-2xs ${
                  isSuccess ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                  : isWarning ? "bg-amber-50/50 border-amber-200 text-amber-950"
                  : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <span className="font-black text-[10px] uppercase tracking-wider text-slate-400 shrink-0 font-mono">
                  {new Date(notif.timestamp).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <div>
                  <span className="font-extrabold text-slate-900">{notif.childName}:</span> {notif.message}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Secure confirmModal Portal/Overlay */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="custom-confirm-portal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-slate-200 shadow-xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-2 text-amber-600 font-extrabold pb-2 border-b border-slate-100">
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
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer shadow-md"
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
