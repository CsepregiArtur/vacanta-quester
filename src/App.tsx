/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Shield, 
  User, 
  Sparkles, 
  RefreshCw, 
  BookOpen, 
  Flame, 
  Clock, 
  Gamepad2, 
  Tv, 
  Award,
  AlertTriangle,
  Lightbulb,
  Lock,
  Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import KidDashboard from "./components/KidDashboard";
import ParentDashboard from "./components/ParentDashboard";
import { AppState } from "./types";
import { useOfflineSync } from "./modules/sync/useOfflineSync";
import type { SyncActionType } from "./modules/sync/types";
import {
  storeTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isLoggedIn,
  ensureValidToken,
  installAuthInterceptor,
} from "./modules/auth";

export interface UserEntry {
  email: string;
  name: string;
}

// Install JWT-aware fetch interceptor
installAuthInterceptor();


const themeStyles = {
  nintendo: {
    root: "bg-slate-50 text-slate-800 font-sans",
    aside: "bg-white border-b-4 lg:border-b-0 lg:border-r-4 border-slate-900",
    asideHeader: "text-slate-900",
    asideSub: "text-[#58cc02]",
    sidebarButtonActive: "border-slate-900 shadow-[2px_2px_0_0_#1e293b]",
    sidebarButtonInactive: "border-slate-100 hover:border-slate-400 bg-white",
    main: "bg-neutral-55 bg-slate-50",
    headerHeading: "text-slate-900 font-sans",
    headerSubtitle: "text-slate-600",
    badgePoints: "bg-[#ffc000] border-slate-900 text-slate-900 shadow-[3px_3px_0_0_#1e293b]",
    badgeTime: "bg-white border-slate-900 text-slate-800 shadow-[3px_3px_0_0_#1e293b]",
    badgeTimeActive: "bg-[#ff4b4b] border-slate-900 text-white shadow-[3px_3px_0_0_#1e293b]",
    badgeTomorrow: "bg-[#1cb0f6] border-slate-900 text-white shadow-[3px_3px_0_0_#1e293b]"
  },
  duolingo: {
    root: "bg-[#fafafb] text-[#3c3c3c] font-sans",
    aside: "bg-white border-b-3 lg:border-b-0 lg:border-r-3 border-slate-200 shadow-[0_0_15px_rgba(0,0,0,0.02)]",
    asideHeader: "text-[#58cc02]",
    asideSub: "text-[#1cb0f6]",
    sidebarButtonActive: "bg-[#e0f7ff] border-slate-250 border-3 text-[#1cb0f6] shadow-[0_3px_0_0_#1cb0f6]",
    sidebarButtonInactive: "border-slate-100 hover:bg-[#f7f7f7] bg-white",
    main: "bg-[#fafafb]",
    headerHeading: "text-slate-850 font-display font-black",
    headerSubtitle: "text-slate-500 font-display",
    badgePoints: "bg-[#ffc000] border-slate-350 border-3 text-slate-900 shadow-[0_3px_0_0_#e0a200]",
    badgeTime: "bg-white border-slate-250 border-3 text-slate-800 shadow-[0_3px_0_0_#cbd5e1]",
    badgeTimeActive: "bg-[#ff4b4b] border-slate-250 border-3 text-white shadow-[0_3px_0_0_#ea2b2b]",
    badgeTomorrow: "bg-[#1cb0f6] border-slate-250 border-3 text-white shadow-[0_3px_0_0_#1899d6]"
  },
  pokemon: {
    root: "bg-[#f5f7fa] text-slate-800 font-sans",
    aside: "bg-[#dc0a2d] border-b-4 lg:border-b-0 lg:border-r-4 border-[#86071a] text-white",
    asideHeader: "text-white font-black drop-shadow-md",
    asideSub: "text-[#ffcb05] tracking-widest drop-shadow-sm",
    sidebarButtonActive: "bg-[#ffcb05] text-[#3b4cca] border-[#3b4cca] border-3 shadow-[3px_3px_0_0_#3b4cca]",
    sidebarButtonInactive: "bg-[#df213b] text-white border-[#f05a6f] border-3 hover:bg-[#c00620]",
    main: "bg-[#f5f7fa]",
    headerHeading: "text-slate-900 font-display font-black",
    headerSubtitle: "text-slate-600 font-bold",
    badgePoints: "bg-[#ffcb05] border-[#3b4cca] text-[#3b4cca] border-3 shadow-[2px_2px_0_0_#3b4cca]",
    badgeTime: "bg-white border-[#3d7dca] text-slate-800 border-3 shadow-[2px_2px_0_0_#3d7dca]",
    badgeTimeActive: "bg-[#ff2020] border-[#3b4cca] text-white border-3 shadow-[2px_2px_0_0_#ffcb05]",
    badgeTomorrow: "bg-[#1cb0f6] border-[#3b4cca] text-white border-3 shadow-[2px_2px_0_0_#3b4cca]"
  },
  minecraft: {
    root: "bg-[#141414] text-[#e0e0e0] font-mono selection:bg-[#55ff55]",
    aside: "bg-[#1c1c1c] border-b-4 lg:border-b-0 lg:border-r-4 border-[#3c3c3c]",
    asideHeader: "text-[#55ff55] font-mono font-bold",
    asideSub: "text-[#ffff55] tracking-wide",
    sidebarButtonActive: "bg-[#3c3c3c] border-[#55ff55] text-[#55ff55] border-2 shadow-[2px_2px_0_0_#000000]",
    sidebarButtonInactive: "bg-[#282828] text-stone-400 border-3 border-[#3c3c3c] hover:border-dashed hover:border-stone-500",
    main: "bg-[#121212]",
    headerHeading: "text-white font-mono font-bold",
    headerSubtitle: "text-[#aaaaaa] font-mono",
    badgePoints: "bg-[#333333] border-[#ffff55] text-[#ffff55] border-2 shadow-[2px_2px_0_0_#000000]",
    badgeTime: "bg-[#333333] border-[#aaaaaa] text-white border-2 shadow-[2px_2px_0_0_#000000]",
    badgeTimeActive: "bg-[#aa0000] border-[#ff5555] text-[#ff5555] border-2 shadow-[2px_2px_0_0_#000000]",
    badgeTomorrow: "bg-[#00aa00] border-[#55ff55] text-white border-2 shadow-[2px_2px_0_0_#000000]"
  }
};

export default function App() {
  const [theme, setTheme] = useState<"nintendo" | "duolingo" | "pokemon" | "minecraft">(() => {
    return (localStorage.getItem("arcadia_theme") as any) || "nintendo";
  });

  const [loggedUser, setLoggedUser] = useState<UserEntry | null>(() => {
    const saved = localStorage.getItem("arcadia_logged_parent");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [state, setState] = useState<AppState | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem("arcadia_active_tab") || "";
  });
  const [kidFullScreen, setKidFullScreen] = useState<boolean>(() => {
    return localStorage.getItem("arcadia_kid_fs") === "true";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialLoadDone = React.useRef(false);

  // ─── Offline-First Sync Engine ──────────────────────────────────
  const {
    isOnline: isOnlineSync,
    enqueue,
    enqueueBatch,
    saveSnapshot,
    retryFailed,
    clearCompleted,
    syncStatus,
  } = useOfflineSync();

  // Save snapshot whenever state changes (for offline resilience)
  useEffect(() => {
    if (state) {
      saveSnapshot(state as unknown as Record<string, unknown>);
    }
  }, [state, saveSnapshot]);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        /* best effort */
      }
    }
    clearTokens();
    setLoggedUser(null);
    setState(null);
    setIsParentAuthorized(false);
  };

  // Auto-fill active tab once states load, utilizing cache if valid
  useEffect(() => {
    if (state && !activeTab) {
      const cachedTab = localStorage.getItem("arcadia_active_tab");
      if (cachedTab && (cachedTab === "parent" || state.children.some(c => c.id === cachedTab))) {
        setActiveTab(cachedTab);
      } else if (state.children && state.children.length > 0) {
        setActiveTab(state.children[0].id);
      } else {
        setActiveTab("parent");
      }
    }
  }, [state, activeTab]);
  
  // Secure parent state with persistent session cache to avoid repeated pin challenge
  const [isParentAuthorized, setIsParentAuthorized] = useState(() => {
    return localStorage.getItem("arcadia_parent_authorized") === "true";
  });
  const [parentPinInput, setParentPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // In-app toast notifications system
  interface ToastNotification {
    id: string;
    type: "success" | "info" | "warning";
    title: string;
    message: string;
    childName: string;
  }
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const prevStateRef = React.useRef<AppState | null>(null);

  const addToast = (type: "success" | "info" | "warning", title: string, message: string, childName: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts(prev => [...prev, { id, type, title, message, childName }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  useEffect(() => {
    if (!state) return;
    const prevState = prevStateRef.current;
    if (prevState) {
      // 1. Compare activeTasks status for approval validations
      state.activeTasks.forEach((task) => {
        const prevTask = prevState.activeTasks.find((t) => t.id === task.id);
        const becameApproved = task.status === "approved" && (!prevTask || prevTask.status !== "approved");
        
        if (becameApproved) {
          const childValue = state.children.find(c => c.id === task.childId);
          const nameToUse = childValue ? childValue.name : "Copil";
          let explanation = `Sarcina casnică/lectura "${task.name}" a fost evaluată pozitiv!`;
          if (task.choreFeedback) {
            explanation += ` Mesaj: "${task.choreFeedback}"`;
          }
          addToast(
            "success",
            `🌟 Sarcina ta a fost aprobată! (+${task.points} Pct)`,
            explanation,
            nameToUse
          );
        }
      });

      // 2. Compare child suggestions / proposed cashouts / rewards
      state.suggestions.forEach((sug) => {
        const prevSug = prevState.suggestions.find(s => s.id === sug.id);
        if (prevSug && prevSug.status === "pending" && sug.status !== "pending") {
          const childName = sug.childName;
          if (sug.status === "approved") {
            if (sug.type === "cashout") {
              const ronVal = Math.round((sug.proposedPointsOrCost || 0) / 10);
              addToast(
                "success",
                `💶 Schimb în puncte Aprobat!`,
                `Părinții au aprobat transformarea a ${sug.proposedPointsOrCost} puncte în ${ronVal} RON! Îți vor da banii în mână fizic.`,
                childName
              );
            } else if (sug.type === "reward") {
              addToast(
                "success",
                `🎁 Recompensă Nouă în Catalog!`,
                `Sugerata ta "${sug.title}" a fost aprobată de părinți! Acum o poți cumpăra din magazin.`,
                childName
              );
            } else {
              addToast(
                "success",
                `🏃‍♂️ Propunere Aprobată!`,
                `Activitatea propusă "${sug.title}" a fost validată cu succes! S-a generat o nouă sarcină.`,
                childName
              );
            }
          } else if (sug.status === "rejected") {
            const whyText = sug.adminFeedback ? ` Motiv: "${sug.adminFeedback}"` : "";
            addToast(
              "warning",
              `💡 Notificare Propunere`,
              `Sugerata ta "${sug.title}" nu a fost aprobată acum.${whyText} Punctele au fost returnate în buzunarul tău!`,
              childName
            );
          }
        }
      });
    }
    prevStateRef.current = state;
  }, [state]);

  const fetchState = async (silent = false) => {
    if (!loggedUser) return;
    if (!silent) setIsLoading(true);

    // ── OFFLINE-FIRST: Try local snapshot first ──
    const localStateRaw = localStorage.getItem("arcadia_state");
    let localState: AppState | null = null;
    if (localStateRaw) {
      try {
        localState = JSON.parse(localStateRaw) as AppState;
      } catch {
        /* ignore corrupt cache */
      }
    }

    // If offline, use local snapshot immediately
    if (!navigator.onLine && localState) {
      console.log("[OFFLINE] Using local snapshot");
      setState(localState);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    // ── ONLINE: Fetch from server, then reconcile ──
    try {
      const localToday = new Date().toLocaleDateString("en-CA");
      const res = await fetch(`/api/state?today=${localToday}`);
      const serverData = await res.json();

      if (localState) {
        try {
          const localTime = new Date(localState.lastUpdated || "1970-01-01T00:00:00.000Z").getTime();
          const serverTime = new Date(serverData.lastUpdated || "1970-01-01T00:00:00.000Z").getTime();

          if (localTime > serverTime) {
            console.log("[SYNC] Client state is newer. Synchronizing...", localState.lastUpdated, "vs", serverData.lastUpdated);
            const syncRes = await fetch("/api/state/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(localState)
            });
            const syncData = await syncRes.json();
            if (syncData.success) {
              setState(syncData.db);
              localStorage.setItem("arcadia_state", JSON.stringify(syncData.db));
              return;
            }
          }
        } catch (e) {
          console.error("Error synchronizing local state with server:", e);
        }
      }

      setState(serverData);
      localStorage.setItem("arcadia_state", JSON.stringify(serverData));
    } catch (err) {
      console.error("Failed to load application state:", err);
      // Fallback to local state if server is unreachable
      if (localState) {
        console.log("[OFFLINE FALLBACK] Using cached state");
        setState(localState);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch state on initial mount and when loggedUser changes
  useEffect(() => {
    if (loggedUser) {
      fetchState();
      initialLoadDone.current = true;
    }
  }, [loggedUser]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchState(true);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("arcadia_active_tab", tab);
    setParentPinInput("");
    setPinError("");

    // Fetch fresh state only AFTER initial load (prevents duplicate API call on mount)
    if (loggedUser && initialLoadDone.current) {
      fetchState(true);
    }
  };

  const handleToggleKidFullScreen = () => {
    const newVal = !kidFullScreen;
    setKidFullScreen(newVal);
    localStorage.setItem("arcadia_kid_fs", newVal ? "true" : "false");
  };

  const handleVerifyPin = (pin: string) => {
    if (state && pin === state.parentPin) {
      setIsParentAuthorized(true);
      localStorage.setItem("arcadia_parent_authorized", "true");
      setPinError("");
    } else {
      setPinError("Codul de securitate PIN este incorect! Coordonate invalide.");
      setParentPinInput("");
    }
  };

  if (!loggedUser) {
    return (
      <LoginRegisterScreen
        onLoginSuccess={(user, initialDb) => {
          localStorage.setItem("arcadia_logged_parent", JSON.stringify(user));
          localStorage.setItem("arcadia_logged_parent_email", user.email);
          localStorage.setItem("arcadia_state", JSON.stringify(initialDb));
          setLoggedUser(user);
          setState(initialDb);
          if (initialDb.children && initialDb.children.length > 0) {
            const defaultId = initialDb.children[0].id;
            setActiveTab(defaultId);
            localStorage.setItem("arcadia_active_tab", defaultId);
          } else {
            setActiveTab("parent");
            localStorage.setItem("arcadia_active_tab", "parent");
          }
        }}
      />
    );
  }

  if (isLoading || !state) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <h2 className="font-display font-semibold text-lg text-neutral-800 mt-4">Vacanță Activă...</h2>
        <p className="text-sm text-neutral-400 mt-1 max-w-sm">Mijloacele didactice și regulile de control casnic se încarcă...</p>
      </div>
    );
  }

  // Get currently active kid
  const currentKid = activeTab === "parent" ? null : (state.children.find(c => c.id === activeTab) || state.children[0]);
  
  // Get active screen time for current child
  const hasActiveTimer = currentKid?.activeTimer?.isActive;
  const activeTimerMinutes = currentKid?.activeTimer?.minutesLeft || 0;

  // Check if reading is forced
  const isReadingForced = currentKid ? (currentKid.daysSinceLastReading !== undefined && currentKid.daysSinceLastReading >= 3) : false;

  // Format today's date nicely in Romanian
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    try {
      return new Date().toLocaleDateString('ro-RO', options);
    } catch (e) {
      return new Date().toLocaleDateString();
    }
  };

  const selectedTheme = themeStyles[theme] || themeStyles.nintendo;
  
  // ─── Full-Screen Kid Mode: hide sidebar, full-width content ───
  const isKidFullScreenMode = kidFullScreen && activeTab !== "parent" && currentKid != null;

  const handleQuickAdminAccess = () => {
    // Always force PIN challenge when coming from kid full-screen mode
    setIsParentAuthorized(false);
    localStorage.setItem("arcadia_parent_authorized", "false");
    setParentPinInput("");
    setPinError("");
    handleTabChange("parent");
  };

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen antialiased transition-all duration-300 ${selectedTheme.root}`} id="app-root-container">
      
      {/* SIDEBAR — ascuns în full-screen kid mode */}
      <aside className={`${
        isKidFullScreenMode ? 'hidden' : 'flex'
      } w-full lg:w-72 flex-col p-6 shrink-0 transition-all duration-300 ${selectedTheme.aside}`} id="aside-navbar">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8" id="brand-logo-container">
          <div className="w-12 h-12 bg-[#ff4b4b] border-2 border-slate-900 rounded-2xl flex items-center justify-center text-white font-display font-black text-xl rotate-[-4deg] shadow-[3px_3px_0_0_#1e293b]">
            🎮
          </div>
          <div>
            <h1 className={`text-xl font-display font-black tracking-tight rotate-[-1deg] ${selectedTheme.asideHeader}`}>VACANȚA ACTIVĂ</h1>
            <p className={`text-[9px] font-display font-black uppercase tracking-widest ${selectedTheme.asideSub}`}>⭐ QUEST BOOK v2 ⭐</p>
          </div>
        </div>

        {/* Profile Switcher Selector */}
        <div className="flex flex-col gap-3 mb-4 lg:mb-8" id="profile-switcher-section">
          <p className="text-[10px] font-display font-black text-slate-400 uppercase tracking-widest px-2">Alege contul tău</p>
          
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
            {state.children.map((child, idx) => {
              const bgColors = ["bg-[#e0f2fe]", "bg-[#fce7f3]", "bg-[#dcfce7]", "bg-[#fef9c3]"];
              const colorIdx = idx % bgColors.length;
              const isActive = activeTab === child.id;

              return (
                <div 
                  key={child.id}
                  onClick={() => handleTabChange(child.id)}
                  className={`p-2 lg:p-3 rounded-2xl flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 cursor-pointer transition-all duration-150 text-center lg:text-left border-3 ${
                    isActive 
                      ? `${bgColors[colorIdx]} ${selectedTheme.sidebarButtonActive} translate-y-[-2px]` 
                      : `${selectedTheme.sidebarButtonInactive} border-slate-100 hover:border-slate-400 hover:translate-y-[-1px] lg:bg-transparent`
                  }`}
                  id={`tab-btn-${child.id}`}
                >
                  <div className={`w-8 h-8 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center font-bold text-lg lg:text-xl border-2 border-slate-900 shrink-0 ${isActive ? 'rotate-[3deg]' : ''} shadow-[1px_1.5px_0_0_#1e293b] ${isActive ? 'bg-white' : bgColors[colorIdx]}`}>
                    {child.avatar || "🐶"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-display font-black text-slate-900 truncate">{child.name}</p>
                    <p className={`text-[10px] lg:text-xs truncate font-bold ${isActive ? "text-slate-800" : "text-slate-500"}`}>
                      {child.points} Puncte
                    </p>
                  </div>
                  {isActive && <span className="hidden lg:block text-base leading-none">✨</span>}
                </div>
              );
            })}

            {/* Parents */}
            <div 
              onClick={() => handleTabChange("parent")}
              className={`p-2 lg:p-3 rounded-2xl flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 cursor-pointer transition-all duration-150 text-center lg:text-left border-3 ${
                activeTab === "parent" 
                  ? `bg-[#ffedd5] ${selectedTheme.sidebarButtonActive} translate-y-[-2px]` 
                  : `${selectedTheme.sidebarButtonInactive} border-slate-100 hover:border-slate-400 hover:translate-y-[-1px] lg:bg-transparent`
              }`}
              id="tab-btn-parent"
            >
              <div className="w-8 h-8 lg:w-11 lg:h-11 bg-amber-100 border-2 border-slate-900 rounded-xl flex items-center justify-center font-bold text-sm lg:text-xl shrink-0 shadow-[1px_1.5px_0_0_#1e293b]">
                🔐
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-display font-black text-slate-900 truncate">Părinți</p>
                <p className={`text-[10px] lg:text-xs truncate font-bold ${activeTab === "parent" ? "text-amber-800" : "text-slate-500"}`}>
                  Administrare
                </p>
              </div>
              {activeTab === "parent" && <span className="hidden lg:block text-base leading-none">⚙️</span>}
            </div>
          </div>
        </div>

        {/* Navigation & Status - responsive layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 mt-4 lg:mt-auto" id="sidebar-widgets-row">
          {/* Navigation Sidebar Title bar */}
          <nav className="space-y-2 lg:space-y-4" id="sidebar-nav">
            <div className="text-[10px] font-display font-black text-slate-400 uppercase tracking-widest px-2">Meniu Rapid</div>
            <div className="space-y-1">
              <button
                onClick={() => handleManualRefresh()}
                className="w-full flex items-center gap-3 p-3 bg-white border-2 border-slate-950 hover:bg-[#fff9e6] rounded-2xl text-slate-800 text-xs font-display font-black shadow-[2px_2px_0_0_#1e293b] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                id="btn-sync-state"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-600 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="truncate">Sincronizare scor</span>
              </button>

              {/* ── Sync Queue Status Indicator ── */}
              <div className={`p-2 rounded-xl border-2 flex items-center gap-2 text-[10px] font-display font-black transition-colors ${
                !isOnlineSync
                  ? "bg-amber-50 border-amber-400 text-amber-800"
                  : syncStatus.pendingCount > 0
                    ? "bg-sky-50 border-sky-400 text-sky-800"
                    : "bg-emerald-50 border-emerald-400 text-emerald-800"
              }`} id="sync-status-indicator">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  !isOnlineSync
                    ? "bg-amber-500 animate-pulse"
                    : syncStatus.pendingCount > 0
                      ? "bg-sky-500 animate-pulse"
                      : "bg-emerald-500"
                }`} />
                <span className="truncate">
                  {!isOnlineSync
                    ? "Offline — modificări locale"
                    : syncStatus.pendingCount > 0
                      ? `${syncStatus.pendingCount} în așteptare`
                      : "Sincronizat ✅"}
                </span>
                {syncStatus.failedCount > 0 && (
                  <button
                    onClick={retryFailed}
                    className="ml-auto text-[9px] px-1.5 py-0.5 bg-red-100 border border-red-300 rounded-md text-red-700 hover:bg-red-200 cursor-pointer"
                    title="Reîncearcă acțiunile eșuate"
                  >
                    {syncStatus.failedCount} eșuate ↻
                  </button>
                )}
              </div>
            </div>
          </nav>

          {/* Home Assistant Status card */}
          <div className={`p-4 rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0_0_#1e293b] transition-colors duration-150 flex flex-col justify-center ${
            state.homeAssistant.enabled 
              ? "bg-[#dcfce7]" 
              : "bg-white"
          }`} id="ha-connectivity-info">
            <p className={`text-[10px] uppercase font-display font-black mb-1 ${
              state.homeAssistant.enabled ? "text-emerald-800" : "text-slate-400"
            }`}>Home Assistant</p>
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 shrink-0 ${
                state.homeAssistant.enabled ? "bg-[#58cc02]" : "bg-slate-300"
              }`}></div>
              <p className="text-xs font-black font-display text-slate-800 truncate">
                {state.homeAssistant.enabled ? "Conectat Smart Home" : "Neintegrat"}
              </p>
            </div>
            {state.homeAssistant.url && (
              <p className="text-[9px] text-[#46a302] font-mono mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {state.homeAssistant.url}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA - VIBRANT PALETTE DASHBOARD */}
      <main className={`${
        isKidFullScreenMode ? 'w-full max-w-full p-4 lg:p-6' : 'flex-1 p-4 lg:p-8'
      } flex flex-col overflow-y-auto transition-all duration-300 ${selectedTheme.main}`} id="main-content-layout">
        
        {/* Header containing name query, and point containers */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8" id="main-header">
          <div className="flex flex-col">
            <h2 className={`text-3xl lg:text-4xl font-black tracking-tight ${selectedTheme.headerHeading}`} id="main-heading">
              {activeTab === "parent" ? "Panou Control Părinți 🔐" : `Salutare, ${currentKid?.name}! 👋`}
            </h2>
            <p className={`font-bold text-sm mt-1 ${selectedTheme.headerSubtitle}`} id="current-date-subtitle">
              {formatDate()} &mdash; 🌟 Misiuni distractive de vară
            </p>
          </div>

          {/* Point Containers styled like VIBRANT PALETTE layout */}
          {currentKid ? (
            <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end" id="points-status-row">
              {/* Point Card */}
              <div className={`px-5 py-3 rounded-2xl border-3 flex flex-col items-center min-w-28 shadow-md transition-all ${selectedTheme.badgePoints}`}>
                <span className="text-[10px] font-display font-black uppercase tracking-wider">🌟 PUNCTE</span>
                <span className="text-2xl font-display font-black mt-0.5">{currentKid.points}</span>
              </div>

              {/* Time Card */}
              {(state?.homeAssistant?.enabled || hasActiveTimer) && (
                <div className={`px-5 py-3 rounded-2xl border-3 flex flex-col items-center min-w-28 transition-colors duration-150 ${
                  hasActiveTimer ? selectedTheme.badgeTimeActive : selectedTheme.badgeTime
                }`}>
                  <span className={`text-[10px] font-display font-black uppercase tracking-wider ${
                    hasActiveTimer ? "text-white" : ""
                  }`}>
                    ⏱️ TIMP ECRAN
                  </span>
                  <span className="text-2xl font-display font-black mt-0.5">
                    {hasActiveTimer ? `${activeTimerMinutes} min` : "0 min"}
                  </span>
                </div>
              )}

              {/* Tomorrow Schedule Card - Următoarea Zi */}
              {(() => {
                const tomorrowItem = state?.tomorrowSchedule?.[currentKid.id];
                const mins = tomorrowItem ? Number(tomorrowItem.durationMinutes) : 0;
                const appName = tomorrowItem?.app 
                  ? (tomorrowItem.app === 'tv' ? 'Smart TV' : tomorrowItem.app === 'xbox' ? 'Xbox' : tomorrowItem.app === 'tiktok' ? 'TikTok/IG' : tomorrowItem.app === 'youtube' ? 'YouTube' : tomorrowItem.app.toUpperCase()) 
                  : "";
                
                return (
                  <div className={`px-5 py-3 rounded-2xl border-3 flex flex-col items-center min-w-32 transition-all ${selectedTheme.badgeTomorrow}`}>
                    <span className="text-[10px] font-display font-black uppercase tracking-wider">📅 TIMP MINE</span>
                    <span className="text-2xl font-display font-black mt-0.5">
                      {mins > 0 ? `${mins} min` : "0 min"}
                    </span>
                    {mins > 0 && (
                      <span className="text-[9px] font-display font-black uppercase leading-none mt-0.5 text-inherit opacity-95">
                        pe {appName}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
              {/* Parent View - Total planned time tomorrow across all children */}
              {(() => {
                const totMins = Object.keys(state?.tomorrowSchedule || {}).reduce((acc, cId) => {
                  const item = state.tomorrowSchedule[cId];
                  return acc + (item ? Number(item.durationMinutes) : 0);
                }, 0);
                
                return (
                  <div className="bg-[#1cb0f6] text-white px-5 py-3 rounded-2xl border-3 border-slate-900 flex flex-col items-center min-w-40 shadow-[3px_3px_0_0_#1e293b]">
                    <span className="text-[10px] font-display font-black text-white uppercase tracking-wider font-sans">📅 PLANIFICAT MINE</span>
                    <span className="text-2xl font-display font-black mt-0.5">{totMins} min</span>
                  </div>
                );
              })()}

              {loggedUser && (
                <div className="bg-white px-4 py-2 rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0_0_#1e293b] flex items-center gap-3">
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-display font-black text-slate-400 uppercase tracking-wider">Părinte Logat</span>
                    <span className="text-xs font-display font-black text-slate-800 leading-tight">{loggedUser.name}</span>
                  </div>
                  <div className="w-[1.5px] h-6 bg-slate-200" />
                  <button 
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-[#ff4b4b] border-2 border-slate-900 hover:bg-[#ff5f5f] active:translate-y-[1px] text-white font-display font-extrabold rounded-xl text-xs cursor-pointer shadow-[1.5px_1.5px_0_0_#1e293b]"
                    title="Deconectare"
                  >
                    Ieși 🚪
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Dashboard Pages loaded dynamically with fade transitions */}
        <div className="flex-1" id="active-dashboard-container">
          <AnimatePresence mode="wait">
            {activeTab !== "parent" && currentKid && (
              <motion.div
                key={currentKid.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <KidDashboard childId={currentKid.id} state={state} onRefresh={() => fetchState(true)} theme={theme} onChangeTheme={setTheme} />
              </motion.div>
            )}

            {activeTab === "parent" && (
              <motion.div
                key="parent"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                {isParentAuthorized ? (
                  <ParentDashboard 
                    state={state} 
                    onRefresh={() => fetchState(true)} 
                    onLock={() => {
                      setIsParentAuthorized(false);
                      localStorage.setItem("arcadia_parent_authorized", "false");
                    }}
                    theme={theme}
                    onChangeTheme={setTheme}
                    kidFullScreen={kidFullScreen}
                    onToggleKidFullScreen={handleToggleKidFullScreen}
                  />
                ) : (
                  <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border-3 border-slate-900 shadow-[6px_6px_0_0_#1e293b] space-y-6 text-center mt-12" id="parent-pin-challenge">
                    <div className="w-16 h-16 bg-[#ffc000] border-3 border-slate-900 rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto rotate-[-4deg] shadow-[3px_3px_0_0_#1e293b]">
                      🕵️‍♂️
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-black text-slate-900">Acces Părinți securizat</h3>
                      <p className="text-xs text-slate-500 font-bold mt-1">Cere permisiunea părinților sau introdu codul PIN de 4 cifre pentru a intra!</p>
                    </div>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleVerifyPin(parentPinInput);
                      }} 
                      className="space-y-4"
                    >
                      <input
                        type="password"
                        maxLength={4}
                        value={parentPinInput}
                        onChange={(e) => setParentPinInput(e.target.value)}
                        placeholder="PIN securitate (ex: 1234)"
                        className="w-full text-center px-4 py-3 border-3 border-slate-900 rounded-2xl font-mono text-xl font-black focus:outline-none focus:border-indigo-650 tracking-widest"
                      />
                      {pinError && (
                        <p className="text-xs text-[#ff4b4b] font-black">{pinError}</p>
                      )}
                      <button
                        type="submit"
                        className="w-full py-3 bg-[#58cc02] hover:bg-[#46a302] text-white border-3 border-slate-900 rounded-2xl font-display font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_0_#1e293b] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                      >
                        Autorizează accesul 🚀
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Floating Admin Access Button (doar în full-screen kid mode) ─── */}
        {isKidFullScreenMode && (
          <div className="fixed bottom-6 left-6 z-40">
            <button
              onClick={handleQuickAdminAccess}
              className="w-12 h-12 bg-white/80 backdrop-blur-sm border-2 border-slate-300 hover:border-amber-400 hover:bg-amber-50 rounded-full flex items-center justify-center text-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
              title="Acces părinți (administrare)"
              id="btn-quick-admin"
            >
              <span className="group-hover:scale-110 transition-transform">🔐</span>
            </button>
            <p className="text-[8px] text-slate-400 text-center mt-1 font-semibold">Admin</p>
          </div>
        )}
      </main>

      {/* Floating In-App Toast Indicators */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none max-w-sm w-full" id="toasts-alert-portal">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-4 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0_0_#1e293b] pointer-events-auto flex items-start gap-3 ${
                toast.type === "success" ? "bg-[#dcfce7]" : toast.type === "warning" ? "bg-[#fce7f3]" : "bg-[#e0f2fe]"
              }`}
            >
              <div className="text-2xl mt-0.5">
                {toast.type === "success" ? "⭐" : toast.type === "warning" ? "⚠️" : "ℹ️"}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-display font-black uppercase text-slate-400 block tracking-wider">{toast.childName}</span>
                <h4 className="font-display font-black text-xs text-slate-950 mt-0.5">{toast.title}</h4>
                <p className="text-[11px] text-slate-700 font-bold leading-normal mt-1">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs font-bold font-sans self-start p-0.5"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}

// ==========================================
// LOGIN REGISTER SECURE SCREEN COMPONENT
// ==========================================
interface LoginRegisterProps {
  onLoginSuccess: (user: UserEntry, initialDb: AppState) => void;
}

export function LoginRegisterScreen({ onLoginSuccess }: LoginRegisterProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [activeTab, setActiveTab] = useState<"options" | "email">("options");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [children, setChildren] = useState<{ name: string; age: number }[]>([]);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Social Sign In Simulation Modal
  const [socialModal, setSocialModal] = useState<"google" | "microsoft" | null>(null);
  const [socialEmail, setSocialEmail] = useState("");
  const [socialName, setSocialName] = useState("");

  const handleLogin = async (e?: React.FormEvent, customCredentials?: { email: string; pass: string }) => {
    if (e) e.preventDefault();
    const loginEmail = customCredentials ? customCredentials.email : email;
    const loginPassword = customCredentials ? customCredentials.pass : password;

    if (!loginEmail || !loginPassword) {
      setError("Te rugăm să completezi toate câmpurile de logare!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        // Store JWT tokens
        storeTokens(data.accessToken, data.refreshToken, data.expiresIn);
        onLoginSuccess(data.user, data.db);
      } else {
        setError(data.error || "Acreditări de logare incorecte!");
      }
    } catch {
      setError("Imposibil de conectat la server. Încearcă din nou!");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !pin) {
      setError("Toate câmpurile sunt obligatorii pentru înregistrare corectă!");
      return;
    }
    if (pin.length !== 4 || isNaN(Number(pin))) {
      setError("PIN-ul de securitate al părinților trebuie să fie compus din exact 4 cifre!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password: pin,
          pin,
          customChildren: children.length > 0 ? children.map(c => ({ name: c.name, age: c.age })) : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        // Store JWT tokens
        storeTokens(data.accessToken, data.refreshToken, data.expiresIn);
        onLoginSuccess(data.user, data.db);
      } else {
        setError(data.error || "Adresa de email este deja înregistrată!");
      }
    } catch {
      setError("Eroare de conexiune cu gateway-ul. Încearcă din nou!");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialEmail) {
      setError("Te rugăm să adaugi o adresă de email validă!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: socialEmail, 
          name: socialName || (socialEmail.split("@")[0]) 
        })
      });
      const data = await res.json();
      if (data.success) {
        // Store JWT tokens
        storeTokens(data.accessToken, data.refreshToken, data.expiresIn);
        setSocialModal(null);
        onLoginSuccess(data.user, data.db);
      } else {
        setError(data.error || "Social authentication error.");
      }
    } catch {
      setError("Eroare de conexiune la social provider. Incearcă din nou!");
    } finally {
      setLoading(false);
    }
  };

  // Fast Login Trigger for default dev account test@cs-hu.xyz / test
  const triggerDevAutologin = () => {
    setError("");
    setEmail("test@cs-hu.xyz");
    setPassword("test");
    handleLogin(undefined, { email: "test@cs-hu.xyz", pass: "test" });
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]/45 flex items-center justify-center p-4 font-sans text-slate-800" id="login-register-page">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border-4 border-slate-900 shadow-[8px_8px_0_0_#1e293b] space-y-6 relative overflow-hidden">
        
        {/* Logo and header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#ff4b4b] border-4 border-slate-900 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto rotate-[-5deg] shadow-[4px_4px_0_0_#1e293b]">
            🎮
          </div>
          <div>
            <h2 className="text-2.5xl font-display font-black text-slate-900 tracking-tight">
              {isRegister ? "Cont Nou Părinți" : "Rezoluție Vacanță Activă"}
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">
              {isRegister ? "Configurează-ți contul de familie în câțiva pași!" : "Conectează-te pentru a deschide quest book-ul de vară!"}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border-3 border-[#ff4b4b] rounded-2xl text-red-950 font-black text-xs leading-normal animate-shake flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#ff4b4b]" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic flow selection tabs */}
        {!isRegister && activeTab === "options" ? (
          <div className="space-y-4" id="social-sign-options">
            <p className="text-[10px] text-slate-400 font-black uppercase text-center tracking-widest mb-2">Alege metoda de autentificare:</p>
            
            {/* GOOGLE BUTTON */}
            <button
              onClick={() => {
                setSocialModal("google");
                setSocialEmail("parinte.google@cs-hu.xyz");
                setSocialName("Google Parent");
              }}
              className="w-full py-3.5 px-5 bg-white border-3 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-wide shadow-[3px_3px_0_0_#1e293b] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_#1e293b] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-slate-800">Conectează-te cu Google</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">Rapid</span>
            </button>

            {/* MICROSOFT BUTTON */}
            <button
              onClick={() => {
                setSocialModal("microsoft");
                setSocialEmail("parinte.microsoft@cs-hu.xyz");
                setSocialName("Microsoft Parent");
              }}
              className="w-full py-3.5 px-5 bg-white border-3 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-wide shadow-[3px_3px_0_0_#1e293b] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_#1e293b] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                  <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022" />
                  <rect x="11.5" y="0" width="10.5" height="10.5" fill="#7FBA00" />
                  <rect x="0" y="11.5" width="10.5" height="10.5" fill="#00A1F1" />
                  <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#FFB900" />
                </svg>
                <span className="text-slate-800">Conectează-te cu Microsoft</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">Rapid</span>
            </button>

            {/* EMAIL BUTTON */}
            <button
              onClick={() => setActiveTab("email")}
              className="w-full py-3.5 px-5 bg-white border-3 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-wide shadow-[3px_3px_0_0_#1e293b] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_#1e293b] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-between gap-3 mb-2"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-slate-800">Autentificare prin Email</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase">Clasic</span>
            </button>

            {/* HIGH FIDELITY DEVELOPMENT ENVIRONMENT BANNER PLACEHOLDER */}
            <div className="border-3 border-dashed border-yellow-400 bg-yellow-50 rounded-2xl p-4 space-y-2.5 mt-6" id="dev-quicklogin-widget">
              <div className="flex items-center gap-1.5">
                <span className="text-base text-yellow-600">🧪</span>
                <span className="text-[10px] font-black text-yellow-800 uppercase tracking-widest">Mediu De Dezvoltare</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-600 leading-normal">
                Nu este nevoie să inventezi parole. Pentru logare rapidă cu acreditările prestabilite de test, apasă butonul de mai jos:
              </p>
              <button
                onClick={triggerDevAutologin}
                className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-black text-[10px] uppercase tracking-wider rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_0_#1e293b] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_#1e293b] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>⚡ Autentificare Instantanee</span>
                <span className="font-mono text-[9px] bg-yellow-100 px-1.5 py-0.5 rounded-md border border-yellow-500/30 text-yellow-905">test@cs-hu.xyz / test</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Show Classic Email/Password or register Screen */}
            {isRegister ? (
              <form onSubmit={handleRegister} className="space-y-4 font-semibold text-xs text-slate-700">
                <div>
                  <label className="block text-slate-500 font-black uppercase tracking-wider text-[9px] mb-1">Nume Părinte</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Arthur Csepregi"
                    className="w-full px-3 py-2.5 border-3 border-slate-900 rounded-xl focus:outline-none focus:border-indigo-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-black uppercase tracking-wider text-[9px] mb-1">Adresă Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: parinte@exemplu.com"
                    className="w-full px-3 py-2.5 border-3 border-slate-900 rounded-xl focus:outline-none focus:border-indigo-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#1cb0f6] font-display font-black uppercase tracking-wider text-[9.5px] mb-1">Creează Cod PIN de Logare & Securitate (4 cifre)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Ex: 1234"
                    className="w-full px-4 py-3 border-3 border-slate-900 rounded-2xl focus:outline-none focus:border-indigo-600 text-sm font-black font-mono text-center tracking-widest shadow-[2px_2px_0_0_#1e293b]"
                  />
                  <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wide mt-1.5 leading-tight">
                    💡 Fără parole complicate! Te loghezi și controlezi panoul folosind doar adresa de email și acest PIN sigur de 4 cifre.
                  </p>
                </div>

                {/* Copii - configurare multi-familie */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-3 space-y-2">
                  <label className="block text-slate-500 font-black uppercase tracking-wider text-[9px]">
                    👶 Adaugă Copii (opțional — poți adăuga oricând mai târziu)
                  </label>
                  
                  {children.map((child, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                      <span className="text-sm font-black text-slate-700 flex-1">{child.name} ({child.age} ani)</span>
                      <button
                        type="button"
                        onClick={() => setChildren(children.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 font-black text-xs cursor-pointer"
                      >
                        X
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Nume copil"
                      className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 text-xs"
                    />
                    <input
                      type="number"
                      min={2}
                      max={18}
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      placeholder="Vârstă"
                      className="w-20 px-3 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 text-xs text-center"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (childName.trim() && childAge) {
                          setChildren([...children, { name: childName.trim(), age: Number(childAge) }]);
                          setChildName("");
                          setChildAge("");
                        }
                      }}
                      className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-black text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#58cc02] hover:bg-[#46a302] text-white border-3 border-slate-900 rounded-2xl font-display font-black text-xs uppercase tracking-wider shadow-[4px_4px_0_0_#1e293b] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? "Se creează contul..." : "Înregistrează-te și Conectează-te 🚀"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4 font-semibold text-xs text-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab("options")}
                  className="px-3 py-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 mb-2 border border-slate-300"
                >
                  <span>&larr;</span> Înapoi la opțiuni
                </button>

                <div>
                  <label className="block text-slate-500 font-black uppercase tracking-wider text-[9px] mb-1">Adresă Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: parinte@exemplu.com"
                    className="w-full px-3 py-2.5 border-3 border-slate-900 rounded-xl focus:outline-none focus:border-indigo-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#1cb0f6] font-display font-black uppercase tracking-wider text-[9.5px] mb-1">Introdu Codul tău PIN (4 cifre)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ex: 1234"
                    className="w-full px-4 py-3 border-3 border-slate-900 rounded-2xl focus:outline-none focus:border-indigo-600 text-sm font-black font-mono text-center tracking-widest shadow-[2px_2px_0_0_#1e293b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#ffc000] hover:bg-[#e6ad00] text-slate-950 border-3 border-slate-900 rounded-2xl font-display font-black text-xs uppercase tracking-wider shadow-[4px_4px_0_0_#1e293b] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? "Se autentifică..." : "Conectează-te în Contul Meu 🎮"}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="text-center font-bold text-xs text-slate-400 font-sans border-t border-slate-100 pt-4">
          {isRegister ? "Ai deja un cont înregistrat?" : "Ești părinte și este prima vizită?"}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setActiveTab(isRegister ? "options" : "email");
              setError("");
            }}
            className="text-indigo-600 hover:text-indigo-805 ml-1 font-black cursor-pointer bg-transparent border-none uppercase text-[10px] tracking-wide animate-pulse"
          >
            {isRegister ? "Logează-te!" : "Înregistrează-te acum!"}
          </button>
        </div>
      </div>

      {/* SOCIAL OAUTH HIGH-FIDELITY SIMULATION POPUP DIALOG */}
      <AnimatePresence>
        {socialModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="social-oauth-modal">
            <motion.div 
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 border-4 border-slate-900 shadow-[6px_6px_0_0_#1e293b] space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center gap-2">
                  {socialModal === "google" ? (
                    <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 animate-bounce" viewBox="0 0 23 23">
                      <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022" />
                      <rect x="11.5" y="0" width="10.5" height="10.5" fill="#7FBA00" />
                      <rect x="0" y="11.5" width="10.5" height="10.5" fill="#00A1F1" />
                      <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#FFB900" />
                    </svg>
                  )}
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    {socialModal === "google" ? "Conectare securizată Google" : "Conectare securizată Microsoft"}
                  </span>
                </div>
                <button 
                  onClick={() => setSocialModal(null)}
                  className="text-slate-400 hover:text-slate-600 font-extrabold cursor-pointer border-none bg-transparent"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSocialSubmit} className="space-y-4">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Autentifică-te rapid cu contul tău {socialModal === "google" ? "Google G-Suite" : "Microsoft Azure Active Directory"}. Acest pas preia profilul garantat și configurează automat mediul securizat.
                </p>

                <div>
                  <label className="block text-slate-500 font-black uppercase tracking-wider text-[9px] mb-1">Adresă Email {socialModal === "google" ? "Google/Gmail" : "Microsoft/Outlook"}</label>
                  <input
                    type="email"
                    required
                    value={socialEmail}
                    onChange={(e) => setSocialEmail(e.target.value)}
                    placeholder="Ex: parinte.google@cs-hu.xyz"
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-xl focus:outline-none focus:border-indigo-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-black uppercase tracking-wider text-[9px] mb-1">Nume Profil</label>
                  <input
                    type="text"
                    value={socialName}
                    onChange={(e) => setSocialName(e.target.value)}
                    placeholder="Ex: Arthur Csepregi"
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-xl focus:outline-none focus:border-indigo-600 text-xs"
                  />
                  <p className="text-[9px] text-slate-400 font-medium mt-1">Numele care va apărea pe ecran.</p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSocialModal(null)}
                    className="flex-1 py-2 border-2 border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-[10px] uppercase text-slate-600 cursor-pointer transition-all"
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl font-black text-[10px] uppercase border-2 border-slate-900 shadow-[2px_2px_0_0_#1e293b] active:translate-y-[1px] cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    {loading ? "Se autorizează..." : "Continuă 🚀"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CountUp = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 600; 
    const stepTime = Math.abs(Math.floor(duration / (end - start || 1)));
    const actualStepTime = Math.max(stepTime, 20);

    const timer = setInterval(() => {
      if (start < end) {
        start += 1;
        setDisplayValue(start);
      } else if (start > end) {
        start -= 1;
        setDisplayValue(start);
      }
      if (start === end) {
        clearInterval(timer);
      }
    }, actualStepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{displayValue}</>;
};
