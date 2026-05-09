import { useState, useEffect, useRef } from "react";
import { Groq } from "groq-sdk";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Camera, Mic, SkipBackIcon, Play, Pause, SkipForwardIcon, Music, Headphones, Zap, Settings, Sun, Cloud, Droplets, Trash2, ChevronRight, ChevronLeft, Plus, Check, X, CloudRain, CloudSnow, CloudLightning, CloudSun, Moon, Eye, EyeOff, GripVertical, List, Search, Star } from "lucide-react";
import "./App.css";

//Get Date
function formatDateShort(input) {
  const date = input ? new Date(input) : new Date();
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date provided to formatDateShort");
  }
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const day = date.getDate();
  return `${weekday}, ${month} ${day}`;
}

const textMeasureCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
function measureTextWidth(text, font = "600 13px OpenRunde, Arial, sans-serif") {
  if (!textMeasureCanvas || !textMeasureCanvas.getContext) return null;
  const ctx = textMeasureCanvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = font;
  return ctx.measureText(text).width;
}

const WeatherIcon = ({ status, size = 16, color = "currentColor" }) => {
  const s = status?.toLowerCase() || "";
  if (s.includes("sunny") || s.includes("clear")) return <Sun size={size} color={color} />;
  if (s.includes("partly cloudy")) return <CloudSun size={size} color={color} />;
  if (s.includes("cloudy") || s.includes("overcast") || s.includes("mist") || s.includes("fog")) return <Cloud size={size} color={color} />;
  if (s.includes("rain") || s.includes("drizzle") || s.includes("showers")) return <CloudRain size={size} color={color} />;
  if (s.includes("snow") || s.includes("sleet") || s.includes("ice") || s.includes("blizzard")) return <CloudSnow size={size} color={color} />;
  if (s.includes("thunder") || s.includes("storm")) return <CloudLightning size={size} color={color} />;
  return <Sun size={size} color={color} />;
};

function openApp(app) {
  if (!app) return;
  const trimmedApp = app.trim();

  // 1. Explicit protocol URLs — checked first so that file:// and https://
  //    aren't accidentally caught by the path-separator test below.
  if (/^(https?|file):\/\//i.test(trimmedApp)) {
    window.electronAPI?.openExternal(trimmedApp);
    return;
  }

  // 2. Launch targets — exe paths, UNC paths, shell: URIs.
  //    Checked before any dot-based heuristic so .exe and AppID dots never
  //    trip URL detection.
  const isLaunchTarget =
    /[\\\/]/.test(trimmedApp) ||   // path separator → exe path or UNC
    /\.exe$/i.test(trimmedApp) ||   // bare name ending in .exe
    trimmedApp.startsWith('shell:'); // UWP shell URI

  if (isLaunchTarget) {
    window.electronAPI?.launchApp(trimmedApp);
    return;
  }

  // 3. IPv4 address or localhost → open in browser via http://
  //    (dev servers rarely run https)
  if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/.test(trimmedApp) ||
    /^localhost(:\d+)?(\/.*)?$/i.test(trimmedApp)) {
    window.electronAPI?.openExternal(`http://${trimmedApp}`);
    return;
  }

  // 4. Bare domain — must end with 2+ alpha chars so python3.11 and
  //    192.168.1.1 are not misclassified. DO NOT use .includes('.').
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmedApp)) {
    window.electronAPI?.openExternal(`https://${trimmedApp}`);
    return;
  }

  // 5. Everything else — treat as a command or app name
  window.electronAPI?.launchApp(trimmedApp);
}

// Open music player based on source (Spotify, Music, etc.)
function openMusicPlayer(source) {
  if (!source) return;

  if (source === "Spotify") {
    openApp("Spotify");
  } else if (source === "Music") {
    openApp("Music");
  } else if (source === "music.apple.com" || source.includes("Apple")) {
    openApp("Music");
  } else {
    // Fallback: try to open by source name
    openApp(source);
  }
}

const TABS = [
  { id: 0, name: "Browser Search", icon: (color) => <Search size={16} color={color} /> },
  { id: 1, name: "Workflows & QA", icon: (color) => <Zap size={16} color={color} /> },
  { id: 2, name: "Overview", icon: (color) => <Sun size={16} color={color} /> },
  { id: 3, name: "Now Playing", icon: (color) => <Music size={16} color={color} /> },
  { id: 4, name: "AI Assistant", icon: (color) => <Mic size={16} color={color} /> },
  { id: 5, name: "Clipboard", icon: (color) => <List size={16} color={color} /> },
  { id: 6, name: "Tasks", icon: (color) => <Check size={16} color={color} /> },
  { id: 7, name: "Settings", icon: (color) => <Settings size={16} color={color} /> },
];

export default function Island() {
  const [time, setTime] = useState(null);
  const [mode, setMode] = useState("still");
  const [tabOrder, setTabOrder] = useState(() => JSON.parse(localStorage.getItem("tab-order") || "[0,1,2,3,4,5,6,7]"));
  const [hiddenTabs, setHiddenTabs] = useState(() => JSON.parse(localStorage.getItem("hidden-tabs") || "[]"));
  const [defaultTabId, setDefaultTabId] = useState(() => Number(localStorage.getItem("default-tab") || 0));


  const moveTabOrder = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= tabOrder.length) return;
    setTabOrder((prev) => {
      const newOrder = [...prev];
      const [moved] = newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, moved);
      localStorage.setItem("tab-order", JSON.stringify(newOrder));
      return newOrder;
    });
  };

  const toggleTabVisibility = (id) => {
    setHiddenTabs(prev => {
      const newHidden = prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id];

      // Don't allow hiding all tabs
      if (newHidden.length >= TABS.length) return prev;

      localStorage.setItem("hidden-tabs", JSON.stringify(newHidden));
      return newHidden;
    });
  };

  const [asked, setAsked] = useState(false);
  const [aiAnswer, setAIAnswer] = useState(null);
  const [percent, setPercent] = useState(null);
  const [alert, setAlert] = useState(null);
  const [userText, setUserText] = useState("");
  const [batteryAlertsEnabled, setBatteryAlertsEnabled] = useState(localStorage.getItem("battery-alerts") !== "false");
  const [islandBorderEnabled, setIslandBorderEnabled] = useState(localStorage.getItem("island-border") === "true");
  const [standbyBorderEnabled, setStandbyEnabled] = useState(localStorage.getItem("standby-mode") === "true");
  const [largeStandbyEnabled, setLargeStandbyEnabled] = useState(localStorage.getItem("large-standby-mode") === "true");
  const [hideNotActiveIslandEnabled, sethideNotActiveIslandEnabled] = useState(localStorage.getItem("hide-island-notactive") === "true");
  const [showInfoWhenIdleEnabled, setShowInfoWhenIdleEnabled] = useState(
    localStorage.getItem("show-info-when-idle") === "true"
  );
  const [hourFormat, setHourFormat] = useState((localStorage.getItem("hour-format") || "12-hr") === "12-hr");
  const [weather, setWeather] = useState({ temp: "", status: "" });
  const [weatherUnit, setweatherUnit] = useState(localStorage.getItem("weather-unit") || "f");
  const [theme, setTheme] = useState("default");
  const [bgColor, setBgColor] = useState(localStorage.getItem("bg-color") || "#000000");
  const [textColor, setTextColor] = useState(localStorage.getItem("text-color") || "#FFFFFF");
  const [bgImage, setBgImage] = useState(localStorage.getItem("bg-image") || "none");
  const [browserSearch, setBrowserSearch] = useState("");
  const [clipboard, setClipboard] = useState([]);
  const [charging, setCharging] = useState(false);
  const [chargingAlert, setChargingAlert] = useState(false);
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [bluetooth, setBluetooth] = useState(false);
  const [bluetoothAlert, setBluetoothAlert] = useState(false);
  const [cameraInUse, setCameraInUse] = useState(false);
  const [cameraAlert, setCameraAlert] = useState(false);
  const [microphoneInUse, setMicrophoneInUse] = useState(false);
  const [microphoneAlert, setMicrophoneAlert] = useState(false);
  const captureAlertQueue = useRef([]);
  const captureAlertTimer = useRef(null);
  const captureAlertDisplayed = useRef({ camera: false, microphone: false });
  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem("tasks") || "[]"));
  const [taskText, setTaskText] = useState("");
  const [workflows, setWorkflows] = useState(JSON.parse(localStorage.getItem("workflows") || "[]"));
  const [workflowName, setWorkflowName] = useState("");
  const [workflowUrls, setWorkflowUrls] = useState("");
  const [aiProvider, setAiProvider] = useState(localStorage.getItem("ai-provider") || "groq");
  const [aiModel, setAiModel] = useState(localStorage.getItem("ai-model") || "llama-3.3-70b-versatile");
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [albumHovered, setAlbumHovered] = useState(false);
  const [albumRotation, setAlbumRotation] = useState({ x: 0, y: 0 });

  // Tab calculations
  const isMusicActive = !!spotifyTrack;
  const visibleTabs = tabOrder.filter(id => {
    if (hiddenTabs.includes(id)) return false;
    if (id === 3 && !isMusicActive) return false;
    return true;
  });

  const [[currentTabId, direction], setTabState] = useState(() => {
    const id = visibleTabs.includes(defaultTabId) ? defaultTabId : (visibleTabs[0] ?? 0);
    return [id, 0];
  });

  const currentTab = currentTabId;
  const totalTabs = visibleTabs.length;

  const [showPausedQuickView, setShowPausedQuickView] = useState(false);
  const pausedTimeout = useRef(null);

  useEffect(() => {
    if (spotifyTrack?.state === 'paused') {
      setShowPausedQuickView(true);
      if (pausedTimeout.current) clearTimeout(pausedTimeout.current);
      pausedTimeout.current = setTimeout(() => {
        setShowPausedQuickView(false);
      }, 3000);
    } else {
      setShowPausedQuickView(false);
      if (pausedTimeout.current) clearTimeout(pausedTimeout.current);
    }
  }, [spotifyTrack?.state]);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(currentTabId)) {
      setTabState([visibleTabs[0], 0]);
    }
  }, [hiddenTabs, visibleTabs, currentTabId]);
  const albumRef = useRef(null);
  const isDraggingRef = useRef(false);

  const updateDragging = (val) => {
    isDraggingRef.current = val;
    setIsDragging(val);
  };
  const [displays, setDisplays] = useState([]);
  const [currentDisplayId, setCurrentDisplayId] = useState(localStorage.getItem("display-id") || "");
  const [weatherLocation, setWeatherLocation] = useState(localStorage.getItem("location") || "");
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(localStorage.getItem("auto-launch") === "true");
  const [positionMode, setPositionMode] = useState(localStorage.getItem("position-mode") || localStorage.getItem("side-mode") || "free");

  const [islandX, setIslandX] = useState(() => {
    const saved = localStorage.getItem("island-x");
    const num = Number(saved);
    return (saved !== null && !isNaN(num)) ? Math.max(0, Math.min(100, num)) : 50;
  });

  const [islandY, setIslandY] = useState(() => {
    const saved = localStorage.getItem("island-y");
    const num = Number(saved);
    return (saved !== null && !isNaN(num)) ? Math.max(0, Math.min(1000, num)) : 20;
  });

  const tabVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : direction < 0 ? -300 : 0,
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)"
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)"
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : direction > 0 ? -300 : 0,
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)"
    })
  };

  const wheelSwipeThreshold = 60;
  const wheelLockout = useRef(false);
  const wheelAccumulator = useRef(0);
  const wheelResetTimeout = useRef(null);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeMoved = useRef(false);
  const suppressClick = useRef(false);
  const swipeThreshold = 60;
  const moveTab = (direction) => {
    const currentIndex = visibleTabs.indexOf(currentTabId);
    if (direction > 0) {
      if (currentIndex < visibleTabs.length - 1) {
        setTabState([visibleTabs[currentIndex + 1], 1]);
      }
    } else if (direction < 0) {
      if (currentIndex > 0) {
        setTabState([visibleTabs[currentIndex - 1], -1]);
      }
    }
  };

  const handleWheelSwipe = (e) => {
    if (wheelLockout.current || mode !== "large" || isDragging) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
    let delta = e.deltaX;
    if (e.deltaMode === 1) delta *= 40;
    if (e.deltaMode === 2) delta *= 800;
    wheelAccumulator.current += delta;
    if (wheelResetTimeout.current) clearTimeout(wheelResetTimeout.current);
    wheelResetTimeout.current = setTimeout(() => {
      wheelAccumulator.current = 0;
    }, 150);

    if (Math.abs(wheelAccumulator.current) >= wheelSwipeThreshold) {
      const isNext = wheelAccumulator.current > 0;
      wheelLockout.current = true;
      wheelAccumulator.current = 0;

      moveTab(isNext ? 1 : -1);
      setTimeout(() => {
        wheelLockout.current = false;
      }, 800);
    }
  };

  const isInteractiveTarget = (target) => {
    const targetTag = target?.tagName;
    return (
      targetTag === "INPUT" ||
      targetTag === "TEXTAREA" ||
      targetTag === "SELECT" ||
      targetTag === "LABEL" ||
      target?.closest?.("button") ||
      target?.closest?.(".radio-label") ||
      target?.closest?.(".task-row") ||
      target?.closest?.(".clipboard-row")
    );
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target;
    if (mode !== "large" || isDragging || isInteractiveTarget(target) || target?.closest("#userinput") || target?.id === "userinput") {
      swipeStartX.current = null;
      return;
    }
    swipeStartX.current = e.clientX;
    swipeStartY.current = e.clientY;
    swipeMoved.current = false;
  };

  const handlePointerMove = (e) => {
    if (swipeStartX.current === null || mode !== "large") return;
    const dx = Math.abs(e.clientX - swipeStartX.current);
    const dy = Math.abs(e.clientY - swipeStartY.current);
    if (dx > 8 || dy > 8) {
      swipeMoved.current = true;
      suppressClick.current = true;
    }
  };

  const handlePointerUp = (e) => {
    setTimeout(() => {
      suppressClick.current = false;
    }, 100);

    if (swipeStartX.current === null) return;
    const startX = swipeStartX.current;
    const startY = swipeStartY.current;
    swipeStartX.current = null;

    if (mode !== "large" || isDragging || wheelLockout.current) return;
    if (!swipeMoved.current) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < swipeThreshold || Math.abs(dx) <= Math.abs(dy)) return;

    wheelLockout.current = true;
    moveTab(dx > 0 ? -1 : 1);
    setTimeout(() => {
      wheelLockout.current = false;
    }, 800);
  };

  let isPlaying = spotifyTrack?.state === 'playing';
  const nowPlayingText = spotifyTrack?.name ? `${spotifyTrack.name}${spotifyTrack.artist ? ` • ${spotifyTrack.artist}` : ''}` : '';
  const textWidth = measureTextWidth(nowPlayingText) || (nowPlayingText.length * 7);
  const hoverExtraWidth = 36;
  const nowPlayingWidth = Math.min(
    300,
    Math.max(
      122,
      Math.ceil(textWidth + 24 + 6 + 20)
    )
  );
  let width = mode === "large"
    ? (currentTab === 7 ? 495 : currentTab === 1 ? 480 : currentTab === 3 ? 330 : currentTab === 0 ? 405 : 380)
    : (mode === "quick" && isPlaying && !alert && !chargingAlert && !bluetoothAlert && !cameraAlert && !microphoneAlert)
      ? nowPlayingWidth
      : (mode === "quick" || alert || chargingAlert || bluetoothAlert || cameraAlert || microphoneAlert)
        ? 260
        : isPlaying
          ? nowPlayingWidth
          : 170;
  let height = mode === "large" ? (currentTab === 7 ? (positionMode === "free" ? 425 : 345) : currentTab === 6 ? 250 : currentTab === 3 ? 150 : currentTab === 0 ? 120 : currentTab === 1 ? 210 : 190) : 40;

  const normalizeApps = (arr) => arr.map(a => typeof a === 'string' ? { name: a, launch: a } : a);
  const [quickApps, setQuickApps] = useState(() =>
    normalizeApps(JSON.parse(localStorage.getItem("quick-apps") || '["Notes", "Spotify", "Calculator", "Terminal"]'))
  );
  const [newQuickApp, setNewQuickApp] = useState("");
  const [appSuggestions, setAppSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const selectedAppRef = useRef(null);
  const appSearchTimer = useRef(null);

  useEffect(() => {
    if (window.electronAPI?.platform === 'win32') {
      window.electronAPI?.buildAppCache?.();
    }
  }, []);

  useEffect(() => {
    const savedDisplayId = localStorage.getItem("display-id");
    if (savedDisplayId && window.electronAPI?.setDisplay) {
      window.electronAPI.setDisplay(savedDisplayId);
    }

    if (window.electronAPI?.updateWindowPosition) {
      window.electronAPI.updateWindowPosition(islandX, islandY);
    }

    if (window.electronAPI?.setAutoLaunch) {
      window.electronAPI.setAutoLaunch(autoLaunchEnabled);
    }

    if (!localStorage.getItem('newuser')) {
      localStorage.setItem('newuser', 'true');
    }

    if (localStorage.getItem('newuser') === 'true') {
      const timer = setTimeout(() => {
        window.electronAPI?.openExternal ? window.electronAPI.openExternal("https://github.com/TopMyster/Ripple/blob/main/instructions.md") : window.open("https://github.com/TopMyster/Ripple/blob/main/instructions.md", "_blank");
        localStorage.setItem('newuser', 'false');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // localStorage defaults
  if (!localStorage.getItem("battery-alerts")) {
    localStorage.setItem("battery-alerts", "true");
  }

  if (!localStorage.getItem("default-tab")) {
    localStorage.setItem("default-tab", "2");
  }

  if (!localStorage.getItem("island-border")) {
    localStorage.setItem("island-border", "false");
  }

  if (!localStorage.getItem("hide-island-notactive")) {
    localStorage.setItem("hide-island-notactive", "false");
  }

  if (!localStorage.getItem("standby-mode")) {
    localStorage.setItem("standby-mode", "false");
  }

  if (!localStorage.getItem("hour-format")) {
    localStorage.setItem("hour-format", "12-hr");
  }

  if (!localStorage.getItem("island-x")) {
    localStorage.setItem("island-x", "50");
  }

  if (!localStorage.getItem("island-y")) {
    localStorage.setItem("island-y", "20");
  }

  if (!localStorage.getItem("bg-color")) {
    localStorage.setItem("bg-color", "#000000");
  }

  if (!localStorage.getItem("text-color")) {
    localStorage.setItem("text-color", "#FFFFFF");
  }

  if (!localStorage.getItem("weather-unit")) {
    localStorage.setItem("weather-unit", "f");
  }

  if (!localStorage.getItem("auto-launch")) {
    localStorage.setItem("auto-launch", "false");
  }

  const handleBatteryAlertsChange = (e) => {
    const value = e.target.value === "true";
    setBatteryAlertsEnabled(value);
    localStorage.setItem("battery-alerts", value ? "true" : "false");
  };

  const handleIslandBorderChange = (e) => {
    const value = e.target.value === "true";
    setIslandBorderEnabled(value);
    localStorage.setItem("island-border", value ? "true" : "false");
  };

  const handleStandbyChange = (e) => {
    const value = e.target.value === "true";
    setStandbyEnabled(value);
    localStorage.setItem("standby-mode", value ? "true" : "false");
  };

  const handleLargeStandbyChange = (e) => {
    const value = e.target.value === "true";
    setLargeStandbyEnabled(value);
    localStorage.setItem("large-standby-mode", value ? "true" : "false");
  };

  const handleHourFormatChange = (e) => {
    const value = e.target.value;
    setHourFormat(value === "12-hr");
    localStorage.setItem("hour-format", value);
  };

  const handleAutoLaunchChange = (e) => {
    const value = e.target.value === "true";
    setAutoLaunchEnabled(value);
    localStorage.setItem("auto-launch", value ? "true" : "false");
    window.electronAPI?.setAutoLaunch(value);
  };

  const handlehideNotActiveIslandChange = (e) => {
    const value = e.target.value === "true";
    sethideNotActiveIslandEnabled(value);
    localStorage.setItem("hide-island-notactive", value ? "true" : "false");
  };

  const handleShowInfoWhenIdleChange = (e) => {
    const value = e.target.value === "true";
    setShowInfoWhenIdleEnabled(value);
    localStorage.setItem("show-info-when-idle", value ? "true" : "false");
  };

  const handleWeatherUnitChange = (e) => {
    const value = e.target.value === "c" ? "c" : "f";
    setweatherUnit(value);
    localStorage.setItem("weather-unit", value);
  };

  const handleBgColorChange = (e) => {
    const value = e.target.value;
    setBgColor(value);
    localStorage.setItem("bg-color", value);
  };

  const handleTextColorChange = (e) => {
    const value = e.target.value;
    setTextColor(value);
    localStorage.setItem("text-color", value);
  };

  const handleDisplayChange = (e) => {
    const displayId = e.target.value;
    setCurrentDisplayId(displayId);
    localStorage.setItem("display-id", displayId);
    if (window.electronAPI?.setDisplay) {
      window.electronAPI.setDisplay(displayId);
    }
  };

  const handleIslandXChange = (e) => {
    const value = Number(e.target.value);
    setIslandX(value);
    window.electronAPI?.updateWindowPosition?.(value, islandY);
  };

  const handleIslandYChange = (e) => {
    const value = Number(e.target.value);
    setIslandY(value);
    window.electronAPI?.updateWindowPosition?.(islandX, value);
  };

  const savePosition = () => {
    localStorage.setItem("island-x", islandX);
    localStorage.setItem("island-y", islandY);
  };

  useEffect(() => {
    if (currentTab === 7 && window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then(setDisplays);
    }
  }, [currentTab]);

  const handleBgImageChange = (e) => {
    const value = e.target.value;
    setBgImage(value);
    localStorage.setItem("bg-image", value);
  };

  const handleQaChange = (index, value) => {
    const updatedApps = [...quickApps];
    updatedApps[index] = { name: value, launch: value };
    setQuickApps(updatedApps);
    localStorage.setItem("quick-apps", JSON.stringify(updatedApps));
  };

  const addQuickApp = () => {
    if (newQuickApp.trim()) {
      const entry = selectedAppRef.current || { name: newQuickApp.trim(), launch: newQuickApp.trim() };
      const updatedApps = [...quickApps, entry];
      setQuickApps(updatedApps);
      localStorage.setItem("quick-apps", JSON.stringify(updatedApps));
      setNewQuickApp("");
      selectedAppRef.current = null;
      setShowSuggestions(false);
    }
  };

  const removeQuickApp = (index) => {
    const updatedApps = quickApps.filter((_, i) => i !== index);
    setQuickApps(updatedApps);
    localStorage.setItem("quick-apps", JSON.stringify(updatedApps));
  };

  // AI feature 
  async function askAI() {
    try {
      const apiKey = (localStorage.getItem("api-key") || "").trim();
      const provider = localStorage.getItem("ai-provider") || "groq";
      const model = localStorage.getItem("ai-model") || (provider === "groq" ? "llama-3.3-70b-versatile" : "meta-llama/llama-3.3-70b-instruct");

      if (!apiKey) {
        setAIAnswer("Enter your API key in settings");
        return;
      }

      setAIAnswer("");

      const baseUrl = provider === "groq" ? "https://api.groq.com/openai/v1" : "https://openrouter.ai/api/v1";

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          ...(provider === "openrouter" && {
            "HTTP-Referer": "https://github.com/TopMyster/Ripple",
            "X-Title": "Ripple"
          })
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are Ripple, a sleek and helpful desktop AI assistant. Your goal is to provide accurate, concise, and beautifully formatted answers that fit well in a compact desktop widget. \n- For general inquiries: Keep it to 2-4 sentences.\n- For complex or code-related questions: Provide detailed answers with Markdown code blocks, but stay as efficient as possible.\n- Use Markdown for bolding, lists, and headers to make information easy to scan."
            },
            {
              role: "user",
              content: userText
            }
          ],
          temperature: 1,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            if (line.includes("[DONE]")) break;
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices[0]?.delta?.content || "";
              if (delta) {
                fullText += delta;
                setAIAnswer((prev) => (prev ? prev + delta : delta));
              }
            } catch (e) {
              console.error("Error parsing AI response:", e);
            }
          }
        }
      }

      if (!fullText) {
        setAIAnswer("No response received. Check your settings.");
      }
    } catch (err) {
      setAIAnswer(`Error: ${err.message}`);
      console.error("askAI error:", err);
    }
  }

  // Get battery info
  useEffect(() => {
    let battery, handler;
    (async () => {
      if (!("getBattery" in navigator)) return setPercent("Battery not supported");
      try {
        battery = await navigator.getBattery();
        const update = () => {
          setPercent(Math.round(battery.level * 100));
          setCharging(battery.charging);
        };
        handler = update;
        update();
        battery.addEventListener("chargingchange", handler);
        battery.addEventListener("levelchange", handler);
      } catch {
        setPercent("Battery unavailable");
      }
    })();

    return () => {
      if (battery && handler) {
        battery.removeEventListener("levelchange", handler);
        battery.removeEventListener("chargingchange", handler);
      }
    };
  }, []);

  // Battery alerts
  useEffect(() => {
    if (
      (percent === 20 || percent === 15 || percent === 10 || percent === 5 || percent === 3) &&
      localStorage.getItem("battery-alerts") === "true"
    ) {
      setMode("quick");
      setAlert(true);
      const timerId = setTimeout(() => {
        setMode("still");
        setAlert(null);
      }, 3000);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [percent]);

  useEffect(() => {
    if (
      (charging === true) &&
      localStorage.getItem("battery-alerts") === "true"
    ) {
      setMode("quick");
      setChargingAlert(true);
      const timerId = setTimeout(() => {
        setMode("still");
        setChargingAlert(false);
      }, 1500);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [charging]);


  // Get time
  useEffect((date = new Date()) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    if (hourFormat) {
      hours = hours % 12;
      hours = hours ? hours : 12;
      setTime(`${hours}:${minutes}`);
    } else {
      setTime(`${hours}:${minutes}`);
    }
  });

  //Standby Mode 
  useEffect(() => {
    if (standbyBorderEnabled && mode === 'still') {
      setMode('quick')
    } else if (largeStandbyEnabled && mode === 'still') {
      setMode('large')
    }
  }, [mode, standbyBorderEnabled, largeStandbyEnabled])

  // Get Weather
  useEffect(() => {
    const getWeather = async () => {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=0b18c67c443543e0a6045401250911&q=${localStorage.getItem(
            "location"
          )}&aqi=no`
        );
        const data = await response.json();
        const unit = localStorage.getItem("weather-unit");
        const key = unit === "f" ? "temp_f" : "temp_c";
        setWeather({
          temp: Math.round(data?.current?.[key]),
          status: data?.current?.condition?.text || ""
        });
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };
    getWeather();
    const interval = setInterval(getWeather, 600000); // Update every 10 mins
    return () => clearInterval(interval);
  }, []);

  // Set theme
  useEffect(() => {
    if (theme === "sleek-black") {
      localStorage.setItem("bg-color", "rgba(0, 0, 0, 0.64)");
      localStorage.setItem("text-color", "rgba(255, 255, 255)");
      setBgColor("rgba(0, 0, 0, 0.64)");
      setTextColor("rgba(255, 255, 255)");
    } else if (theme === "win95") {
      localStorage.setItem("bg-color", "rgba(195, 195, 195)");
      localStorage.setItem("text-color", "rgba(0, 0, 0)");
      setBgColor("rgba(195, 195, 195)");
      setTextColor("rgba(0, 0, 0)");
    } else if (theme === "invisible") {
      localStorage.setItem("bg-image", "none");
      setBgImage("none");
      localStorage.setItem("bg-color", "rgba(255, 255, 255, 0)");
      localStorage.setItem("text-color", "rgba(0, 0, 0, 0)");
      setBgColor("rgba(255, 255, 255, 0)");
      setTextColor("rgba(0, 0, 0, 0)");
    } else if (theme === "none") {
      const defaultBg = "#000000";
      const defaultText = "#FFFFFF";
      localStorage.setItem("bg-color", defaultBg);
      localStorage.setItem("text-color", defaultText);
      setBgColor(defaultBg);
      setTextColor(defaultText);
    }
  }, [theme]);

  // Browser Search Feature
  function searchBrowser() {
    const trimmedSearch = browserSearch.trim();
    if (!trimmedSearch) return;
    if (trimmedSearch.includes(".")) {
      const hasProtocol = /^https?:\/\//i.test(trimmedSearch);
      const urlToOpen = hasProtocol ? trimmedSearch : `https://${trimmedSearch}`;
      window.electronAPI?.openExternal ? window.electronAPI.openExternal(urlToOpen) : window.open(urlToOpen, "_blank");
    } else {
      const encodedQuery = encodeURIComponent(trimmedSearch);
      window.electronAPI?.openExternal ? window.electronAPI.openExternal(`https://www.google.com/search?q=${encodedQuery}`) : window.open(`https://www.google.com/search?q=${encodedQuery}`, "_blank");
    }
  }

  // Clipboard 
  async function getClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setClipboard((prevClipboard) => {
        if (prevClipboard[0] === text) {
          return prevClipboard;
        }
        return [text, ...prevClipboard];
      });
    } catch (error) {
      console.log(
        `Error reading clipboard: ${error.toString()}`,
      );
    }
  }

  useEffect(() => {
    getClipboard();
  })

  // Get Bluetooth
  useEffect(() => {
    const fetchBluetooth = async () => {
      if (window.electronAPI?.getBluetoothStatus) {
        try {
          const isConnected = await window.electronAPI.getBluetoothStatus();
          setBluetooth(isConnected);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchBluetooth();
    const interval = setInterval(fetchBluetooth, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bluetooth === true) {
      setMode("quick");
      setBluetoothAlert(true);
      const timerId = setTimeout(() => {
        setMode("still");
        setBluetoothAlert(false);
      }, 3000);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [bluetooth]);

  // Get Camera Status
  useEffect(() => {
    const fetchCamera = async () => {
      if (window.electronAPI?.getCameraStatus) {
        try {
          const inUse = await window.electronAPI.getCameraStatus();
          setCameraInUse(inUse);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchCamera();
    const interval = setInterval(fetchCamera, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Get Microphone Status
  useEffect(() => {
    const fetchMicrophone = async () => {
      if (window.electronAPI?.getMicrophoneStatus) {
        try {
          const inUse = await window.electronAPI.getMicrophoneStatus();
          setMicrophoneInUse(inUse);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchMicrophone();
    const interval = setInterval(fetchMicrophone, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const processCaptureQueue = () => {
      if (captureAlertTimer.current || captureAlertQueue.current.length === 0) return;
      const nextAlert = captureAlertQueue.current.shift();
      if (!nextAlert) return;

      setMode("quick");
      if (nextAlert === "camera") {
        setCameraAlert(true);
      } else {
        setMicrophoneAlert(true);
      }

      captureAlertTimer.current = setTimeout(() => {
        if (nextAlert === "camera") {
          setCameraAlert(false);
        } else {
          setMicrophoneAlert(false);
        }
        captureAlertTimer.current = null;
        if (captureAlertQueue.current.length > 0) {
          processCaptureQueue();
        } else {
          setMode("still");
        }
      }, 3000);
    };

    if (cameraInUse && !captureAlertDisplayed.current.camera) {
      captureAlertQueue.current.push("camera");
      captureAlertDisplayed.current.camera = true;
    }
    if (!cameraInUse) {
      captureAlertDisplayed.current.camera = false;
    }

    if (microphoneInUse && !captureAlertDisplayed.current.microphone) {
      captureAlertQueue.current.push("microphone");
      captureAlertDisplayed.current.microphone = true;
    }
    if (!microphoneInUse) {
      captureAlertDisplayed.current.microphone = false;
    }

    captureAlertQueue.current = captureAlertQueue.current.filter((item) => {
      if (item === "camera" && !cameraInUse) return false;
      if (item === "microphone" && !microphoneInUse) return false;
      return true;
    });

    processCaptureQueue();

    return () => {
      if (!cameraInUse && !microphoneInUse) {
        if (captureAlertTimer.current) {
          clearTimeout(captureAlertTimer.current);
          captureAlertTimer.current = null;
        }
        captureAlertQueue.current = [];
      }
    };
  }, [cameraInUse, microphoneInUse]);

  // Now Playing
  useEffect(() => {
    const fetchMedia = async () => {
      if (window.electronAPI?.getSystemMedia) {
        try {
          const track = await window.electronAPI.getSystemMedia();
          setSpotifyTrack(track);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchMedia();
    const interval = setInterval(fetchMedia, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => localStorage.setItem("tasks", JSON.stringify(tasks)), [tasks]);

  function copyToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text);
    }
  }

  function addTask() {
    if (taskText.trim()) {
      setTasks((prev) => [...prev, taskText.trim()]);
      setTaskText("");
    }
  }

  function removeTask(index) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  async function openWorkflow(workflow) {
    if (!workflow || !workflow.urls) return;
    for (let i = 0; i < workflow.urls.length; i++) {
      openApp(workflow.urls[i]);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  function addWorkflow() {
    if (workflowName.trim() && workflowUrls.trim()) {
      const urls = workflowUrls.split(",").map(url => url.trim()).filter(url => url);
      const newWorkflow = { name: workflowName.trim(), urls: urls };
      const updatedWorkflows = [...workflows, newWorkflow];
      setWorkflows(updatedWorkflows);
      localStorage.setItem("workflows", JSON.stringify(updatedWorkflows));
      setWorkflowName("");
      setWorkflowUrls("");
    }
  }

  function removeWorkflow(index) {
    const updatedWorkflows = workflows.filter((_, i) => i !== index);
    setWorkflows(updatedWorkflows);
    localStorage.setItem("workflows", JSON.stringify(updatedWorkflows));
  }

  // Keyboard Shortcuts and Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        moveTab(1);
      } else if (e.key === "ArrowLeft") {
        moveTab(-1);
      } else if (e.ctrlKey && e.key >= "1" && e.key <= "8") {
        const idx = parseInt(e.key) - 1;
        if (visibleTabs[idx] !== undefined) {
          const targetId = visibleTabs[idx];
          setMode("large");
          setTabState([targetId, targetId > currentTabId ? 1 : -1]);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleFocusOut = () => {
      // Reset album hover state when window loses focus
      setAlbumHovered(false);
      setAlbumRotation({ x: 0, y: 0 });

      setTimeout(() => {
        if (!isHovered) {
          const activeTag = document.activeElement?.tagName;
          if (activeTag !== "INPUT" && activeTag !== "TEXTAREA" && activeTag !== "SELECT") {
            if (standbyBorderEnabled) {
              setMode("quick");
            } else if (largeStandbyEnabled) {
              setMode("large");
            } else {
              setMode("still");
            }
          }
        }
      }, 100);
    };

    window.addEventListener("focusout", handleFocusOut);
    return () => window.removeEventListener("focusout", handleFocusOut);
  }, [isHovered, standbyBorderEnabled, largeStandbyEnabled]);

  useEffect(() => {
    if (!isDragging && !isHovered) {
      const activeTag = document.activeElement?.tagName;
      if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
        if (standbyBorderEnabled) {
          setMode("quick");
        } else if (largeStandbyEnabled) {
          setMode("large");
        } else {
          setMode("still");
        }
      }
    }
  }, [isDragging, isHovered, standbyBorderEnabled, largeStandbyEnabled]);

  const handleDragEndChecks = (e) => {
    updateDragging(false);
    suppressClick.current = false;
  };

  const isFree = positionMode === "free";
  const getSideStyles = () => {
    switch (positionMode) {
      case 'top-left': return { left: '15px', top: '15px', x: '0%' };
      case 'top-right': return { left: 'calc(100% - 15px)', top: '15px', x: '-100%' };
      case 'bottom-left': return { left: '15px', top: 'auto', bottom: '45px', x: '0%' };
      case 'bottom-right': return { left: 'calc(100% - 15px)', top: 'auto', bottom: '45px', x: '-100%' };
      case 'top-center': return { left: '49.8%', top: '20px', x: '-50%' };
      case 'bottom-center': return { left: '49.8%', top: 'auto', bottom: '45px', x: '-50%' };
      default: return { left: `${islandX}%`, top: `${islandY}px`, x: '-50%' };
    }
  };
  const sideStyles = getSideStyles();

  return (
    <motion.div
      id="Island"
      onMouseEnter={() => {
        setIsHovered(true);
        if (mode === "still" && showInfoWhenIdleEnabled && !isPlaying) {
          setMode("large");
        } else if (mode !== "large") {
          setMode("quick");
        }
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(false, false);
        }
      }}
      onMouseLeave={() => {
        suppressClick.current = false;
        if (isDraggingRef.current) return;
        setIsHovered(false);
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(true, true);
        }

        const activeTag = document.activeElement?.tagName;
        if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

        if (standbyBorderEnabled) {
          setMode("quick");
        } else if (largeStandbyEnabled) {
          setMode("large");
        } else {
          setMode("still");
        }
      }}
      onClick={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        if (isInteractiveTarget(e.target)) return;

        const activeTag = document.activeElement?.tagName;
        if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
          document.activeElement.blur();
        }

        setMode(prev => prev === "large" ? "quick" : "large");
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(false, false);
        }
      }}
      onWheel={handleWheelSwipe}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      initial={{
        x: sideStyles.x,
        left: sideStyles.left,
        top: sideStyles.top || 'auto',
        bottom: sideStyles.bottom || 'auto',
      }}
      animate={{
        width: `${width}px`,
        height: `${height}px`,
        left: sideStyles.left,
        top: sideStyles.top || 'auto',
        bottom: sideStyles.bottom || 'auto',
        backgroundColor: hideNotActiveIslandEnabled && mode === 'still' ? "rgba(0,0,0,0)" : bgColor,
        color: hideNotActiveIslandEnabled && mode === 'still' ? "rgba(0,0,0,0)" : textColor,
        scale: isHovered ? 1.05 : 1,
        x: sideStyles.x,
        borderRadius:
          mode === "large" && theme === "win95"
            ? 0
            : mode === "large"
              ? (currentTab === 0 ? 28 : 30)
              : theme === "win95"
                ? 0
                : 14,
      }}
      onUpdate={(latest) => {
        if (latest.width || latest.height) {
          setIsTransitioning(true);
        }
      }}
      onAnimationComplete={() => {
        setIsTransitioning(false);
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 40,
        mass: 2.5,
        x: { duration: .15 }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        backgroundImage: `url('${bgImage}')`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        justifyContent: (mode === "large" && currentTab === 3) ? "flex-start" : "center",
        overflow: "hidden",
        fontFamily: theme === "win95" ? "w95" : "OpenRunde",
        border: theme === "win95" ? "2px solid rgb(254, 254, 254)" : islandBorderEnabled ? cameraInUse ? `1px solid rgba(255, 215, 0, 0.8)` : microphoneInUse ? `1px solid rgba(255, 154, 0, 0.8)` : (charging || chargingAlert) ? `1px solid rgba(111, 255, 123, 0.5)` : (percent <= 20 || alert) ? `1px solid rgba(255, 63, 63, 0.5)` : bluetoothAlert ? `1px solid rgba(0, 150, 255, 0.34)` : hideNotActiveIslandEnabled ? "none" : `1px solid color-mix(in srgb, ${textColor}, transparent 70%)` : "none",
        borderColor:
          theme === "win95"
            ? "#FFFFFF #808080 #808080 #FFFFFF"
            : "none",

        boxShadow: hideNotActiveIslandEnabled && mode === 'still' ? "none" : isHovered ? '0 0 32px rgba(0, 0, 0, 0.25)' : '0 0 24px rgba(0, 0, 0, 0.12)',
        '--island-text-color': textColor,
        '--island-bg-color': bgColor,
        position: 'fixed',
        margin: 0,
        transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isTransitioning ? 'auto' : (window.electronAPI?.platform === 'linux' && mode === 'still' && !isHovered) ? 'none' : 'auto'
      }}
    >
      {/*Quickview*/}
      {mode !== "large" && (mode === "quick" || (mode === "still" && showInfoWhenIdleEnabled) || (mode === "still" && (isPlaying || showPausedQuickView)) || alert || chargingAlert || bluetoothAlert || cameraAlert || microphoneAlert) ? (
        <AnimatePresence mode="wait">
          {(isPlaying || showPausedQuickView) && !alert && !chargingAlert && !bluetoothAlert && !cameraAlert && !microphoneAlert ? (
            <motion.div
              key={spotifyTrack?.name ? `playing-${spotifyTrack.name}-${spotifyTrack.artist}` : "playing"}
              initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1], filter: { duration: 0.05 } }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                opacity: showPausedQuickView ? 0.5 : (hideNotActiveIslandEnabled ? .6 : 1),
                filter: showPausedQuickView ? 'grayscale(1)' : 'none',
                padding: '0 9px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'visible', flex: 1, minWidth: 0, userSelect: 'none', perspective: '1200px' }}>
                {spotifyTrack?.artwork_url ? (
                  <div style={{ perspective: '1200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={spotifyTrack.artwork_url}
                      onClick={() => openMusicPlayer(spotifyTrack.source)}
                      onMouseEnter={() => setAlbumHovered(true)}
                      onMouseLeave={() => {
                        setAlbumHovered(false);
                        setAlbumRotation({ x: 0, y: 0 });
                      }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        const deltaX = e.clientX - centerX;
                        const deltaY = e.clientY - centerY;
                        const maxDistance = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
                        const angleX = (deltaY / maxDistance) * 35;
                        const angleY = (deltaX / maxDistance) * -35;
                        setAlbumRotation({ x: angleX, y: angleY });
                      }}
                      style={{
                        width: 24, height: 24, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease-out',
                        transform: `rotateX(${albumRotation.x}deg) rotateY(${albumRotation.y}deg) scale(${albumHovered ? 1.25 : 1}) translateZ(0)`,
                        transformStyle: 'preserve-3d',
                        filter: albumHovered ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        willChange: 'transform'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                    <Music size={14} color={textColor} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative', transform: 'translateZ(0)' }}>
                  <motion.div
                    animate={textWidth > (nowPlayingWidth - (isHovered ? 80 : 45)) ? { x: [0, -(textWidth + 30)] } : { x: 0 }}
                    transition={textWidth > (nowPlayingWidth - (isHovered ? 80 : 45))
                      ? { duration: 12, repeat: Infinity, ease: "linear" }
                      : { duration: 0.3, ease: "easeInOut" }
                    }
                    style={{
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      fontSize: 13,
                      fontWeight: 600,
                      color: textColor,
                      willChange: 'transform'
                    }}>
                    <span style={{ paddingRight: textWidth > (nowPlayingWidth - (isHovered ? 80 : 45)) ? 30 : 0 }}>
                      {spotifyTrack?.name} <span style={{ opacity: 0.7, fontWeight: 400 }}> • {spotifyTrack?.artist}</span>
                    </span>
                    {textWidth > (nowPlayingWidth - (isHovered ? 80 : 45)) && (
                      <span style={{ paddingRight: 30 }}>
                        {spotifyTrack?.name} <span style={{ opacity: 0.7, fontWeight: 400 }}> • {spotifyTrack?.artist}</span>
                      </span>
                    )}
                  </motion.div>
                </div>
                <AnimatePresence>
                  {isHovered && (
                    <motion.button
                      key="play-pause-hover"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 30 }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.electronAPI.controlSystemMedia('playpause');
                      }}
                      onMouseEnter={() => {
                        if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(false, false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        padding: 0,
                        marginLeft: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        zIndex: 100,
                        willChange: 'opacity, width',
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)'
                      }}
                    >
                      {spotifyTrack?.state === 'playing' ? <Pause size={15} color="#FFFFFF" fill="#FFFFFF" /> : <Play size={15} color="#FFFFFF" fill="#FFFFFF" />}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={chargingAlert ? "charging" : alert ? "battery" : bluetoothAlert ? "bluetooth" : cameraAlert ? "camera" : microphoneAlert ? "microphone" : "time"}
              initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1], filter: { duration: 0.05 } }}
              style={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <h1
                className="text"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "15px",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                  color: chargingAlert ? "#6fff7bff" : alert ? "#ff3f3fff" : cameraAlert ? "#ffff00ff" : microphoneAlert ? "#ff9a00ff" : textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  lineHeight: 1
                }}
              >
                {chargingAlert ? (
                  <Zap size={20} color="#6fff7b" />
                ) : alert ? (
                  <Zap size={20} color="#ff3f3f" />
                ) : cameraAlert ? (
                  <Camera size={20} color="#ffff00" />
                ) : microphoneAlert ? (
                  <Mic size={20} color="#ff9a00" />
                ) : bluetoothAlert ? <Headphones size={20} /> : time}
              </h1>
              <h1
                className="text"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "15px",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                  color: chargingAlert
                    ? "#6fff7bff"
                    : alert
                      ? "#ff3f3fff"
                      : cameraAlert
                        ? "#ffff00ff"
                        : microphoneAlert
                          ? "#ff9a00ff"
                          : `${textColor}`,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {alert === true ? `${percent}%` : chargingAlert === true ? `${percent}%` : standbyBorderEnabled ? `${percent}%` : cameraAlert ? "Camera" : microphoneAlert ? "Microphone" : bluetoothAlert ? "Connected" : weather.temp ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WeatherIcon status={weather.status} size={14} color={textColor} />
                    <span>{weather.temp}º</span>
                  </div>
                ) : `${percent}%`}
              </h1>
            </motion.div>
          )
          }
        </AnimatePresence >
      ) : null}

      <AnimatePresence custom={direction} mode="popLayout">
        {mode === "large" && (
          <motion.div
            key={currentTabId}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 400, damping: 40 },
              opacity: { duration: 0.15 }
            }}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute"
            }}
          >
            {/*Browser Search*/}
            {currentTab === 0 && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <input
                  id="browser-searchbar"
                  placeholder="Search google or enter URL"
                  value={browserSearch}
                  onChange={(e) => setBrowserSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchBrowser();
                    }
                  }}
                  style={{ color: textColor }}
                />
              </div>
            )}
            {/* Workflows & Quick Apps */}
            {currentTab === 1 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
              }}>
                <div id="workflows" style={{
                  animation: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '95%',
                  flex: 1,
                  overflowY: 'auto',
                  padding: '15px 0',
                  margin: '0 auto'
                }}>
                  <AnimatePresence>
                    {workflows.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: 'center', fontSize: 13, marginTop: 20 }}
                      >
                        No workflows yet. Add them in settings!
                      </motion.p>
                    ) : (
                      workflows.map((workflow, i) => (
                        <motion.button
                          key={`main-wf-${workflow.name}-${i}`}
                          className="workflow-item"
                          onClick={() => {
                            openWorkflow(workflow);
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, height: 0, padding: 0, marginBottom: 0 }}
                          style={{
                            width: '96%',
                            color: bgColor,
                            backgroundColor: textColor,
                            fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                            borderRadius: '12px',
                            fontSize: 14,
                            fontWeight: 600,
                            textAlign: 'left',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            alignSelf: 'center',
                            marginBottom: 2
                          }}
                        >
                          {workflow.name} <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 5 }}>({workflow.urls.length} sites)</span>
                        </motion.button>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                <div style={{
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  borderTop: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`,
                  width: '100%',
                  marginTop: 'auto',
                  background: `color-mix(in srgb, ${textColor}, transparent 98%)`,
                  overflowX: 'auto'
                }}>
                  <div id="quick-apps" style={{
                    animation: 'none',
                    margin: 0,
                    display: 'flex',
                    gap: '12px',
                    padding: '0 15px',
                    width: 'max-content'
                  }}>
                    <AnimatePresence>
                      {quickApps.map((app, i) => (
                        <motion.button
                          key={`main-qa-${app.name}-${i}`}
                          className="qa-app"
                          onClick={() => {
                            openApp(app.launch);
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, width: 0, padding: 0, margin: 0 }}
                          style={{
                            color: bgColor,
                            backgroundColor: textColor,
                            fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                            flexShrink: 0
                          }}
                        >
                          {app.name}
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {/*Overview tab*/}
            {currentTab === 2 && (
              <>
                <div id="battery" style={{ animation: 'none' }}>
                  <div
                    id="battery-bar"
                    style={{
                      backgroundColor: localStorage.getItem('text-color'),
                      color: bgColor
                    }}
                  >
                    <h1 className="text" style={{ animation: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                      {charging && <Zap size={16} />}
                      <span>{percent}%</span>
                    </h1>
                  </div>
                </div>
                <h1
                  className="text"
                  style={{
                    fontSize: 15,
                    left: 25,
                    top: 14,
                    position: "absolute",
                    animation: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <WeatherIcon status={weather.status} size={16} color={textColor} />
                    <span>{weather.temp ? weather.temp : "??"}º</span>
                  </div>
                </h1>
                <div id="date">
                  <h1 className="text" style={{ fontSize: 50, animation: 'none' }}>
                    {time}
                  </h1>
                  <h2 className="text" style={{ fontSize: 15, animation: 'none' }}>
                    {formatDateShort()}
                  </h2>
                </div>
              </>
            )}

            {/* Now Playing*/}
            {currentTab === 3 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                userSelect: 'none'
              }}>
                <AnimatePresence mode="wait">
                  {spotifyTrack ? (
                    <motion.div
                      key={spotifyTrack.name + spotifyTrack.artist}
                      initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                      exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        width: '100%',
                        height: '100%',
                        gap: '8px',
                        paddingLeft: '17px',
                        opacity: spotifyTrack.state === 'playing' ? 1 : 0.5,
                        filter: spotifyTrack.state === 'playing' ? 'none' : 'grayscale(1)',
                        transition: 'opacity 0.3s ease, filter 0.3s ease'
                      }}
                    >
                      {spotifyTrack.artwork_url ? (
                        <img
                          ref={albumRef}
                          src={spotifyTrack.artwork_url}
                          onClick={() => openMusicPlayer(spotifyTrack.source)}
                          onMouseEnter={() => setAlbumHovered(true)}
                          onMouseLeave={() => {
                            setAlbumHovered(false);
                            setAlbumRotation({ x: 0, y: 0 });
                          }}
                          onMouseMove={(e) => {
                            if (albumRef.current) {
                              const rect = albumRef.current.getBoundingClientRect();
                              const centerX = rect.left + rect.width / 2;
                              const centerY = rect.top + rect.height / 2;
                              const deltaX = e.clientX - centerX;
                              const deltaY = e.clientY - centerY;
                              const maxDistance = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
                              const angleX = (deltaY / maxDistance) * 15;
                              const angleY = (deltaX / maxDistance) * -15;
                              setAlbumRotation({ x: angleX, y: angleY });
                            }
                          }}
                          style={{
                            width: 110, height: 110, minWidth: 110,
                            flexShrink: 0,
                            borderRadius: 13, objectFit: 'cover',
                            boxShadow: albumHovered ? '0 8px 24px rgba(0,0,0,0.35)' : '0 4px 12px rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
                            transform: `perspective(600px) rotateX(${albumRotation.x}deg) rotateY(${albumRotation.y}deg) scale(${albumHovered ? 1.08 : 1})`,
                            transformStyle: 'preserve-3d'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 110, height: 110, minWidth: 110,
                          flexShrink: 0,
                          borderRadius: 12, background: 'rgba(255,255,255,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 24
                        }}>
                          <Music size={40} color={textColor} />
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        flex: 1,
                        justifyContent: 'center',
                        textAlign: 'left',
                        minWidth: 0,
                      }}>
                        <div style={{ width: '175px', overflow: 'hidden' }}>
                          <motion.h2
                            animate={measureTextWidth(spotifyTrack.name, 18) > 175 ? { x: [0, -(measureTextWidth(spotifyTrack.name, 18) + 30)] } : {}}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            style={{
                              margin: '0 0 0 5px',
                              fontSize: 18,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              color: textColor,
                              fontFamily: theme === "win95" ? "w95" : "OpenRunde"
                            }}>
                            <span style={{ paddingRight: measureTextWidth(spotifyTrack.name, 18) > 175 ? 30 : 0 }}>{spotifyTrack.name || "Unknown Title"}</span>
                            {measureTextWidth(spotifyTrack.name, 18) > 175 && (
                              <span style={{ paddingRight: 30 }}>{spotifyTrack.name || "Unknown Title"}</span>
                            )}
                          </motion.h2>
                        </div>
                        <div style={{ width: '175px', overflow: 'hidden' }}>
                          <motion.p
                            animate={measureTextWidth(spotifyTrack.artist, 13) > 175 ? { x: [0, -(measureTextWidth(spotifyTrack.artist, 13) + 30)] } : {}}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            style={{
                              margin: '4px 0 0 5px',
                              fontSize: 13,
                              opacity: 0.8,
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              color: textColor,
                              fontFamily: theme === "win95" ? "w95" : "OpenRunde"
                            }}>
                            <span style={{ paddingRight: measureTextWidth(spotifyTrack.artist, 13) > 175 ? 30 : 0 }}>{spotifyTrack.artist || "Unknown Artist"}</span>
                            {measureTextWidth(spotifyTrack.artist, 13) > 175 && (
                              <span style={{ paddingRight: 30 }}>{spotifyTrack.artist || "Unknown Artist"}</span>
                            )}
                          </motion.p>
                        </div>
                        <div style={{ display: 'flex', gap: 15, marginTop: 15, alignItems: 'center', marginLeft: 5 }}>
                          <button
                            className="media-btn"
                            onClick={() => {
                              window.electronAPI.controlSystemMedia('previous');
                            }}
                            style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', padding: 4, opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          ><SkipBackIcon size={20} color={textColor} fill={textColor} /></button>
                          <button
                            className="media-btn"
                            onClick={() => {
                              window.electronAPI.controlSystemMedia('playpause');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: textColor,
                              cursor: 'pointer',
                              padding: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {spotifyTrack.state === 'playing' ? <Pause size={24} color={textColor} fill={textColor} /> : <Play size={24} color={textColor} fill={textColor} />}
                          </button>
                          <button
                            className="media-btn"
                            onClick={() => {
                              window.electronAPI.controlSystemMedia('next');
                            }}
                            style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', padding: 4, opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          ><SkipForwardIcon size={20} color={textColor} fill={textColor} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="nothing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        color: textColor,
                        fontFamily: theme === "win95" ? "w95" : "OpenRunde"
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: 16 }}>Nothing Playing</h3>
                      <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: 13 }}>Play music on Spotify or Apple Music</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* AI tab container */}
            {currentTab === 4 && (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <AnimatePresence mode="wait">
                  {!asked ? (
                    <motion.div
                      key="ask"
                      initial={{ opacity: 0, filter: "blur(10px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(10px)" }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        justifyContent: "flex-start",
                        padding: "10px",
                        boxSizing: "border-box"
                      }}
                    >
                      <textarea
                        id="userinput"
                        placeholder="Ask Anything"
                        value={userText}
                        onChange={(e) => setUserText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            setAsked(true);
                            askAI();
                          }
                        }}
                        style={{
                          color: `${textColor}`,
                          fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                          pointerEvents: "auto",
                          animation: 'none'
                        }}
                      />
                      <button
                        id="chatsubmit"
                        onClick={() => {
                          setAsked(true);
                          askAI();
                        }}
                        style={{
                          backgroundColor: textColor,
                          color: bgColor,
                          fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                          pointerEvents: "auto",
                          animation: 'none'
                        }}
                      >
                        Ask
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, filter: "blur(10px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(10px)" }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        justifyContent: "flex-start",
                        padding: "0 10px",
                        boxSizing: "border-box",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        id="result"
                        style={{
                          fontWeight: 400,
                          fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                          pointerEvents: "auto",
                          animation: 'none',
                          margin: 0,
                          paddingTop: "40px",
                          paddingBottom: "50px",
                          maxHeight: "100%",
                          overflowY: "auto"
                        }}
                      >
                        {aiAnswer ? (
                          <ReactMarkdown
                            components={{
                              pre: ({ node, children, ...props }) => {
                                const codeContent = node.children[0]?.children[0]?.value || "";
                                return (
                                  <div style={{
                                    position: 'relative',
                                    margin: '10px 0',
                                    backgroundColor: `color-mix(in srgb, ${textColor}, transparent 92%)`,
                                    borderRadius: '8px',
                                    border: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`
                                  }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(codeContent);
                                        const btn = e.currentTarget;
                                        const originalText = btn.innerText;
                                        btn.innerText = "Copied!";
                                        btn.style.backgroundColor = 'rgba(52, 199, 89, 0.4)';
                                        setTimeout(() => {
                                          btn.innerText = originalText;
                                          btn.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                        }, 2000);
                                      }}
                                      style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '6px',
                                        zIndex: 10,
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        border: 'none',
                                        borderRadius: '5px',
                                        color: textColor,
                                        fontSize: '10px',
                                        padding: '3px 7px',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(4px)',
                                        fontWeight: 600,
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      Copy
                                    </button>
                                    <pre {...props} style={{ margin: 0, padding: '12px', background: 'none' }}>{children}</pre>
                                  </div>
                                );
                              },
                              code: ({ node, inline, ...props }) => (
                                <code
                                  {...props}
                                  style={{
                                    backgroundColor: inline ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    padding: inline ? '2px 5px' : '0',
                                    borderRadius: inline ? '4px' : '0',
                                    fontFamily: 'monospace',
                                    fontSize: inline ? '0.9em' : '1em'
                                  }}
                                />
                              )
                            }}
                          >
                            {aiAnswer}
                          </ReactMarkdown>
                        ) : (
                          <span style={{ opacity: 0.5, fontStyle: "italic" }}>
                            Thinking...
                          </span>
                        )}
                      </div>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          setAsked(false);
                          setAIAnswer(null);
                          setUserText("");
                        }}
                        id="Askanotherbtn"
                        style={{
                          position: "absolute",
                          bottom: 15,
                          right: 15,
                          backgroundColor: textColor,
                          color: bgColor,
                          fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                          pointerEvents: "auto",
                          animation: 'none',
                          zIndex: 999,
                          cursor: "pointer"
                        }}
                      >
                        Ask another
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/*Clipboard*/}
            {currentTab === 5 && (
              <div id="clipboard" style={{ animation: 'none' }}>
                {clipboard.length === 0 ? (
                  <p style={{ opacity: 0.5, textAlign: 'center', marginTop: 30 }}>Clipboard is empty</p>
                ) : (
                  clipboard.map((item, index) => (
                    <div className="clipboard-row" key={index}>
                      <p className="clipboard-content" style={{ paddingRight: '45px' }}>{item}</p>
                      <button
                        onClick={(e) => {
                          copyToClipboard(item);
                          const btn = e.currentTarget;
                          const originalText = btn.innerText;
                          btn.innerText = "Copied!";
                          btn.style.backgroundColor = 'rgba(52, 199, 89, 0.4)';
                          setTimeout(() => {
                            btn.innerText = originalText;
                            btn.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                          }, 2000);
                        }}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          zIndex: 10,
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          border: 'none',
                          borderRadius: '5px',
                          color: textColor,
                          fontSize: '10px',
                          padding: '3px 7px',
                          cursor: 'pointer',
                          backdropFilter: 'blur(4px)',
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/*Tasks*/}
            {currentTab === 6 && (
              <div id="tasks-container" style={{ animation: 'none' }}>
                <div id="task-list">
                  <AnimatePresence>
                    {tasks.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: 'center', marginTop: 30 }}
                      >
                        No tasks yet. Add one below!
                      </motion.p>
                    ) : (
                      tasks.map((task, index) => (
                        <motion.div
                          className="task-row"
                          key={`task-${task}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <input
                            type="checkbox"
                            onChange={() => {
                              removeTask(index);
                            }}
                            className="task-checkbox"
                          />
                          <h3 className="task-item" style={{ flex: 1, margin: 0 }}>{task}</h3>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
                <div id="task-input-container">
                  <input
                    type="text"
                    placeholder="New task..."
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask();
                    }}
                    className="task-input"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${textColor}, transparent 95%)`,
                      color: textColor,
                      border: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`,
                      borderRadius: '12px',
                      padding: '8px 12px',
                      outline: 'none',
                      flex: 1
                    }}
                  />
                  <button
                    onClick={() => {
                      addTask();
                    }}
                    className="task-add-btn"
                    style={{
                      backgroundColor: textColor,
                      color: bgColor,
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/*Settings Overhaul*/}
            {currentTab === 7 && (
              <div id="settings-container">
                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>General</h3>
                  <div className="settings-row">
                    <span className="settings-label">12/24 Hour Format</span>
                    <select value={hourFormat ? "12-hr" : "24-hr"} onChange={handleHourFormatChange}>
                      <option value="12-hr">12-hour</option>
                      <option value="24-hr">24-hour</option>
                    </select>
                  </div>
                  {window.electronAPI?.platform !== 'darwin' && (
                    <div className="settings-row">
                      <span className="settings-label">Auto Launch on Boot</span>
                      <select value={autoLaunchEnabled ? "true" : "false"} onChange={handleAutoLaunchChange}>
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </div>
                  )}
                  {displays.length > 0 && (
                    <div className="settings-row">
                      <span className="settings-label">Target Display</span>
                      <select value={currentDisplayId} onChange={handleDisplayChange}>
                        {displays.map(d => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em', marginBottom: '4px' }}>Tab Management</h3>
                  <p style={{ fontSize: 11, opacity: 0.4, marginTop: -8, marginBottom: 8 }}>Drag to reorder, click eye to hide.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {tabOrder.map((id, i) => {
                      const tabDef = TABS.find(t => t.id === id);
                      const isHidden = hiddenTabs.includes(id);
                      return (
                        <div
                          key={id}
                          className={`tab-order-item ${isHidden ? 'hidden' : ''}`}
                          style={{ cursor: 'grab' }}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", i);
                            e.currentTarget.style.opacity = '0.4';
                            e.currentTarget.style.borderStyle = 'dashed';
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = isHidden ? '0.45' : '1';
                            e.currentTarget.style.borderStyle = isHidden ? 'dashed' : 'solid';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.background = `color-mix(in srgb, ${textColor}, transparent 90%)`;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.style.background = '';
                            e.currentTarget.style.transform = '';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.background = '';
                            e.currentTarget.style.transform = '';
                            const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
                            moveTabOrder(fromIdx, i);
                          }}
                        >
                          <GripVertical size={16} style={{ opacity: 0.3, cursor: 'grab' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                            {tabDef.icon(textColor)}
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{tabDef.name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button
                              className="tab-order-btn"
                              onClick={() => {
                                setDefaultTabId(id);
                                localStorage.setItem("default-tab", id);
                              }}
                              title="Set as default"
                              style={{ opacity: defaultTabId === id ? 1 : 0.3, color: defaultTabId === id ? '#FFD700' : textColor }}
                            >
                              <Star size={16} fill={defaultTabId === id ? '#FFD700' : 'none'} />
                            </button>
                            <div style={{ width: 1, height: 16, background: textColor, opacity: 0.1, margin: '0 4px' }} />
                            <button
                              className="tab-order-btn"
                              onClick={() => toggleTabVisibility(id)}
                              title={isHidden ? "Show" : "Hide"}
                              style={{ opacity: isHidden ? 1 : 0.6 }}
                            >
                              {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <div style={{ width: 1, height: 16, background: textColor, opacity: 0.1, margin: '0 4px' }} />
                            <button
                              className="tab-order-btn"
                              disabled={i === 0}
                              onClick={() => moveTabOrder(i, i - 1)}
                            >
                              <ChevronLeft size={16} style={{ transform: 'rotate(90deg)' }} />
                            </button>
                            <button
                              className="tab-order-btn"
                              disabled={i === tabOrder.length - 1}
                              onClick={() => moveTabOrder(i, i + 1)}
                            >
                              <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Island Style</h3>
                  <div className="settings-row">
                    <span className="settings-label">Theme</span>
                    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                      <option value="none">Default</option>
                      <option value="sleek-black">Sleek Black</option>
                      <option value="win95">Windows 95</option>
                    </select>
                  </div>
                  <div className="settings-section" style={{ alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="settings-label" style={{ textAlign: 'center', marginBottom: '8px', opacity: 1, color: textColor }}>Position Mode</span>
                    <div className="radio-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%', gap: '15px 10px' }}>
                      {[
                        { val: "top-left", label: "Top L" },
                        { val: "top-center", label: "Top C" },
                        { val: "top-right", label: "Top R" },
                        { val: "bottom-left", label: "Bot L" },
                        { val: "bottom-center", label: "Bot C" },
                        { val: "bottom-right", label: "Bot R" }
                      ].map((mode) => (
                        <label key={mode.val} className="radio-label" style={{ justifyContent: 'center' }}>
                          <input
                            type="radio"
                            name="positionMode"
                            value={mode.val}
                            checked={positionMode === mode.val}
                            onChange={(e) => {
                              setPositionMode(e.target.value);
                              localStorage.setItem("position-mode", e.target.value);
                            }}
                          />
                          <span className="radio-custom"></span>
                          {mode.label}
                        </label>
                      ))}
                    </div>
                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }}></div>
                    <label className="radio-label" style={{ justifyContent: 'center' }}>
                      <input
                        type="radio"
                        name="positionMode"
                        value="free"
                        checked={positionMode === "free"}
                        onChange={(e) => {
                          setPositionMode(e.target.value);
                          localStorage.setItem("position-mode", e.target.value);
                        }}
                      />
                      <span className="radio-custom"></span>
                      FREE (MANUAL)
                    </label>
                  </div>
                  <AnimatePresence>
                    {isFree && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}
                      >
                        <div className="settings-row">
                          <span className="settings-label">Position X ({islandX.toFixed(1)}%)</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.1"
                            value={islandX}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              updateDragging(true);
                            }}
                            onChange={handleIslandXChange}
                            onPointerUp={(e) => {
                              e.stopPropagation();
                              savePosition();
                              handleDragEndChecks(e);
                              e.target.blur();
                            }}
                            list="tickmarks"
                            style={{ flex: 1, accentColor: textColor }}
                          />
                          <datalist id="tickmarks">
                            <option value="50" label="50%"></option>
                          </datalist>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Position Y ({islandY}px)</span>
                          <input
                            type="range"
                            min="0"
                            max="500"
                            value={islandY}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              updateDragging(true);
                            }}
                            onChange={handleIslandYChange}
                            onPointerUp={(e) => {
                              e.stopPropagation();
                              savePosition();
                              handleDragEndChecks(e);
                              e.target.blur();
                            }}
                            style={{ flex: 1, accentColor: textColor }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="settings-row">
                    <span className="settings-label">Island Border</span>
                    <select value={islandBorderEnabled ? "true" : "false"} onChange={handleIslandBorderChange}>
                      <option value="true">Show</option>
                      <option value="false">Hide</option>
                    </select>
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Hide When Inactive</span>
                    <select value={hideNotActiveIslandEnabled ? "true" : "false"} onChange={handlehideNotActiveIslandChange}>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Colors & Assets</h3>
                  <div className="settings-row">
                    <span className="settings-label">Island Color</span>
                    <input
                      className="select-input"
                      style={{ width: '100px' }}
                      placeholder="#000000"
                      value={bgColor}
                      onChange={handleBgColorChange}
                    />
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Text Color</span>
                    <input
                      className="select-input"
                      style={{ width: '100px' }}
                      placeholder="#FAFAFA"
                      value={textColor}
                      onChange={handleTextColorChange}
                    />
                  </div>
                  <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="settings-label">Background Image URL</span>
                    <input
                      className="select-input"
                      placeholder="https://..."
                      value={bgImage}
                      onChange={handleBgImageChange}
                    />
                  </div>
                </div>

                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Features</h3>
                  <div className="settings-row">
                    <span className="settings-label">Low Battery Alerts</span>
                    <select value={batteryAlertsEnabled ? "true" : "false"} onChange={handleBatteryAlertsChange}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Standby Mode</span>
                    <select value={standbyBorderEnabled ? "true" : "false"} onChange={handleStandbyChange}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Large Standby Mode</span>
                    <select value={largeStandbyEnabled ? "true" : "false"} onChange={handleLargeStandbyChange}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Show Info when idle</span>
                    <select value={showInfoWhenIdleEnabled ? "true" : "false"} onChange={handleShowInfoWhenIdleChange}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Weather</h3>
                  <div className="settings-row">
                    <span className="settings-label">Location</span>
                    <input
                      className="select-input"
                      placeholder="City, ST, Country"
                      value={weatherLocation}
                      onChange={(e) => {
                        setWeatherLocation(e.target.value);
                        localStorage.setItem("location", e.target.value);
                      }}
                    />
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Unit</span>
                    <select value={weatherUnit} onChange={handleWeatherUnitChange}>
                      <option value="f">Fahrenheit (°F)</option>
                      <option value="c">Celsius (°C)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Quick Apps</h3>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', position: 'relative', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className="select-input"
                        style={{ flex: 1 }}
                        value={newQuickApp}
                        placeholder="Add app (e.g. Apple Music)"
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewQuickApp(val);
                          selectedAppRef.current = null;
                          clearTimeout(appSearchTimer.current);
                          if (window.electronAPI?.platform === 'win32' && val.trim().length > 1) {
                            appSearchTimer.current = setTimeout(async () => {
                              const results = await window.electronAPI.searchApps(val.trim());
                              setAppSuggestions(results);
                              setShowSuggestions(results.length > 0);
                            }, 200);
                          } else {
                            setAppSuggestions([]);
                            setShowSuggestions(false);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addQuickApp();
                          if (e.key === 'Escape') setShowSuggestions(false);
                        }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      />
                      <button
                        onClick={addQuickApp}
                        style={{
                          backgroundColor: textColor,
                          color: bgColor,
                          border: 'none',
                          borderRadius: '12px',
                          padding: '8px 12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    {showSuggestions && appSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 999,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        backgroundColor: bgColor,
                        border: `1px solid ${textColor}22`,
                        marginTop: '4px'
                      }}>
                        {appSuggestions.map((s, i) => (
                          <div
                            key={i}
                            onMouseDown={() => {
                              selectedAppRef.current = s;
                              setNewQuickApp(s.name);
                              setShowSuggestions(false);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              color: textColor,
                              fontSize: 13,
                              borderBottom: i < appSuggestions.length - 1 ? `1px solid ${textColor}11` : 'none',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = `${textColor}11`}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                            <div style={{ opacity: 0.4, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.launch}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <AnimatePresence>
                      {quickApps.map((app, idx) => (
                        <motion.div
                          key={`qa-${idx}`}
                          className="settings-row"
                          style={{ justifyContent: 'space-between', padding: '5px 0' }}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, x: -20, height: 0, padding: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <input
                            className="select-input"
                            style={{ flex: 1, border: 'none', background: 'transparent', padding: 0 }}
                            value={app.name}
                            onChange={(e) => handleQaChange(idx, e.target.value)}
                          />
                          <button
                            onClick={() => removeQuickApp(idx)}
                            style={{ color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="settings-section" style={{ marginBottom: 30 }}>
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Integrations</h3>
                  <div className="settings-row">
                    <span className="settings-label">AI Provider</span>
                    <select
                      value={aiProvider}
                      onChange={(e) => {
                        setAiProvider(e.target.value);
                        localStorage.setItem("ai-provider", e.target.value);
                        const model = e.target.value === "groq" ? "llama-3.3-70b-versatile" : "meta-llama/llama-3.3-70b-instruct";
                        setAiModel(model);
                        localStorage.setItem("ai-model", model);
                      }}
                    >
                      <option value="groq">Groq</option>
                      <option value="openrouter">OpenRouter</option>
                    </select>
                  </div>
                  <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="settings-label">AI Model</span>
                    <input
                      className="select-input"
                      value={aiModel}
                      placeholder={aiProvider === "groq" ? "llama-3.3-70b-versatile" : "meta-llama/llama-3.3-70b-instruct"}
                      onChange={(e) => {
                        setAiModel(e.target.value);
                        localStorage.setItem("ai-model", e.target.value);
                      }}
                    />
                  </div>
                  <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="settings-label">API Key</span>
                    <input
                      className="select-input"
                      type="password"
                      placeholder={aiProvider === "groq" ? "gsk_..." : "sk-or-..."}
                      onChange={(e) => localStorage.setItem("api-key", e.target.value)}
                    />
                  </div>
                </div>

                <div className="settings-section" style={{ marginBottom: 30 }}>
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Manage Workflows</h3>

                  <div id="add-workflow-form" style={{
                    display: 'flex', flexDirection: 'column', gap: '6px', width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <span className="settings-label" style={{ opacity: 0.8 }}>Workflow Name</span>
                    <input
                      className="select-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="e.g. Work Tools"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                    />
                    <span className="settings-label" style={{ marginTop: 15, opacity: 0.8 }}>Apps or URLs (Comma Separated)</span>
                    <textarea
                      className="select-input"
                      style={{ width: '100%', minHeight: '50px', padding: '8px', boxSizing: 'border-box' }}
                      placeholder="e.g. Spotify, docs.google.com"
                      value={workflowUrls}
                      onChange={(e) => setWorkflowUrls(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        addWorkflow();
                      }}
                      style={{
                        backgroundColor: textColor,
                        color: bgColor,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: 2
                      }}
                    >
                      Save Workflow
                    </button>
                  </div>

                  <div id="workflows-list" style={{ marginTop: '15px' }}>
                    <AnimatePresence>
                      {workflows.map((wf, idx) => (
                        <motion.div
                          key={`wf-${wf.name}-${idx}`}
                          className="settings-row"
                          style={{ justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid color-mix(in srgb, ${textColor}, transparent 95%)` }}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, x: -20, height: 0, padding: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: '10px' }}>
                            <span style={{ fontWeight: 600 }}>{wf.name}</span>
                            <span style={{ fontSize: 11, opacity: 0.6 }}>
                              {wf.urls.length} items
                            </span>
                          </div>
                          <button
                            onClick={() => removeWorkflow(idx)}
                            style={{ color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                          >
                            <Trash2 size={14} />
                            <span style={{ fontSize: 12 }}>Remove</span>
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div >
  );
}
