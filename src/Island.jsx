import { useState, useEffect, useRef } from "react";
import { Groq } from "groq-sdk";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SkipBackIcon, Play, Pause, SkipForwardIcon, Music, Headphones, Zap, Settings, Sun, Cloud, Droplets, Trash2, ChevronRight, ChevronLeft, Plus, Check, X, CloudRain, CloudSnow, CloudLightning, CloudSun, Moon } from "lucide-react";
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
  const hasProtocol = /^[a-z0-9-]+:\/\//i.test(trimmedApp);
  const isUrl = /^https?:\/\//i.test(trimmedApp) || trimmedApp.includes('.');

  if (hasProtocol || isUrl) {
    const target = (isUrl && !hasProtocol) ? `https://${trimmedApp}` : trimmedApp;
    window.electronAPI?.openExternal(target);
  } else {
    window.electronAPI?.launchApp(trimmedApp);
  }
}

export default function Island() {
  const [time, setTime] = useState(null);
  const [mode, setMode] = useState("still");
  const [[tab, direction], setTab] = useState([Number(localStorage.getItem("default-tab") || 2), 0]);
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
  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem("tasks") || "[]"));
  const [taskText, setTaskText] = useState("");
  const [workflows, setWorkflows] = useState(JSON.parse(localStorage.getItem("workflows") || "[]"));
  const [workflowName, setWorkflowName] = useState("");
  const [workflowUrls, setWorkflowUrls] = useState("");
  const [aiProvider, setAiProvider] = useState(localStorage.getItem("ai-provider") || "groq");
  const [aiModel, setAiModel] = useState(localStorage.getItem("ai-model") || "llama-3.3-70b-versatile");
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [displays, setDisplays] = useState([]);
  const [currentDisplayId, setCurrentDisplayId] = useState(localStorage.getItem("display-id") || "");
  const [weatherLocation, setWeatherLocation] = useState(localStorage.getItem("location") || "");

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

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const wheelSwipeThreshold = 60;
  const wheelLockout = useRef(false);
  const wheelAccumulator = useRef(0);
  const wheelResetTimeout = useRef(null);

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

      if (isNext) {
        setTab(([prev]) => [Math.min(7, prev + 1), 1]);
      } else {
        setTab(([prev]) => [Math.max(0, prev - 1), -1]);
      }
      setTimeout(() => {
        wheelLockout.current = false;
      }, 800);
    }
  };

  let isPlaying = spotifyTrack?.state === 'playing';
  let width = mode === "large" ? (tab === 7 ? 450 : tab === 3 ? 330 : tab === 0 ? 405 : 380) : (mode === "quick" && isPlaying) ? 300 : (mode === "quick" && !isPlaying) ? 300 : 265;
  let height = mode === "large" ? (tab === 7 ? 300 : tab === 6 ? 250 : tab === 3 ? 150 : tab === 0 ? 120 : 190) : 43;

  const [quickApps, setQuickApps] = useState(JSON.parse(localStorage.getItem("quick-apps") || '["Notes", "Spotify", "Calculator", "Terminal"]'));
  const [newQuickApp, setNewQuickApp] = useState("");

  useEffect(() => {
    const savedDisplayId = localStorage.getItem("display-id");
    if (savedDisplayId && window.electronAPI?.setDisplay) {
      window.electronAPI.setDisplay(savedDisplayId);
    }

    if (window.electronAPI?.updateWindowPosition) {
      window.electronAPI.updateWindowPosition(islandX, islandY);
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

  const handlehideNotActiveIslandChange = (e) => {
    const value = e.target.value === "true";
    sethideNotActiveIslandEnabled(value);
    localStorage.setItem("hide-island-notactive", value ? "true" : "false");
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
    if (tab === 7 && window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then(setDisplays);
    }
  }, [tab]);

  const handleBgImageChange = (e) => {
    const value = e.target.value;
    setBgImage(value);
    localStorage.setItem("bg-image", value);
  };

  const handleQaChange = (index, value) => {
    const updatedApps = [...quickApps];
    updatedApps[index] = value;
    setQuickApps(updatedApps);
    localStorage.setItem("quick-apps", JSON.stringify(updatedApps));
  };

  const addQuickApp = () => {
    if (newQuickApp.trim()) {
      const updatedApps = [...quickApps, newQuickApp.trim()];
      setQuickApps(updatedApps);
      localStorage.setItem("quick-apps", JSON.stringify(updatedApps));
      setNewQuickApp("");
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
        if (prevClipboard[prevClipboard.length - 1] === text) {
          return prevClipboard;
        }
        return [...prevClipboard, text];
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

  function openWorkflow(workflow) {
    if (!workflow || !workflow.urls) return;
    workflow.urls.forEach(url => {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) return;
      const hasProtocol = /^https?:\/\//i.test(trimmedUrl);
      const urlToOpen = hasProtocol ? trimmedUrl : `https://${trimmedUrl}`;
      window.electronAPI?.openExternal(urlToOpen);
    });
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
        setTab(([prev]) => [Math.min(7, prev + 1), 1]);
      } else if (e.key === "ArrowLeft") {
        setTab(([prev]) => [Math.max(0, prev - 1), -1]);
      } else if (e.ctrlKey && e.key >= "1" && e.key <= "8") {
        const tabNum = parseInt(e.key) - 1;
        setMode("large");
        setTab(([prev]) => [tabNum, tabNum > prev ? 1 : -1]);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <motion.div
      id="Island"
      onMouseEnter={() => {
        setIsHovered(true);
        if (mode !== "large") setMode("quick");
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(false, false);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (standbyBorderEnabled) {
          setMode("quick");
        } else if (largeStandbyEnabled) {
          setMode("large");
        } else {
          setMode("still");
        }
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(true, true);
        }
      }}
      onClick={() => {
        setMode("large");
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(false, false);
        }
      }}
      onWheel={handleWheelSwipe}
      initial={{
        x: "-50%",
        left: `${islandX}%`,
        top: `${islandY}px`,
      }}
      animate={{
        width: `${width}px`,
        height: `${height}px`,
        left: `${islandX}%`,
        top: `${islandY}px`,
        backgroundColor: hideNotActiveIslandEnabled && mode === 'still' ? "rgba(0,0,0,0)" : bgColor,
        color: hideNotActiveIslandEnabled && mode === 'still' ? "rgba(0,0,0,0)" : textColor,
        scale: isHovered ? 1.05 : 1,
        x: "-50%",
        borderRadius:
          mode === "large" && theme === "win95"
            ? 0
            : mode === "large"
              ? (tab === 0 ? 30 : 32)
              : theme === "win95"
                ? 0
                : 16,
      }}
      transition={{
        type: "spring",
        stiffness: 350,
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
        justifyContent: (mode === "large" && tab === 3) ? "flex-start" : "center",
        overflow: "hidden",
        fontFamily: theme === "win95" ? "w95" : "OpenRunde",
        border: theme === "win95" ? "2px solid rgb(254, 254, 254)" : islandBorderEnabled ? (charging || chargingAlert) ? `1px solid rgba(111, 255, 123, 0.5)` : (percent <= 20 || alert) ? `1px solid rgba(255, 63, 63, 0.5)` : bluetoothAlert ? `1px solid rgba(0, 150, 255, 0.34)` : hideNotActiveIslandEnabled ? "none" : `1px solid color-mix(in srgb, ${textColor}, transparent 70%)` : "none",
        borderColor:
          theme === "win95"
            ? "#FFFFFF #808080 #808080 #FFFFFF"
            : "none",

        boxShadow: hideNotActiveIslandEnabled && mode === 'still' ? "none" : isHovered ? '0 8px 32px rgba(0, 0, 0, 0.25)' : '0 4px 24px rgba(0, 0, 0, 0.12)',
        '--island-text-color': textColor,
        '--island-bg-color': bgColor,
        position: 'fixed',
        margin: 0,
        transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/*Quickview*/}
      {(mode === "quick" || (mode === "still" && isPlaying) || alert || chargingAlert || bluetoothAlert) ? (
        <AnimatePresence mode="wait">
          {isPlaying && !alert && !chargingAlert && !bluetoothAlert ? (
            <motion.div
              key={spotifyTrack?.name ? `playing-${spotifyTrack.name}-${spotifyTrack.artist}` : "playing"}
              initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                opacity: hideNotActiveIslandEnabled ? .6 : 1,
                padding: '0 10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', flex: 1, userSelect: 'none', }}>
                {spotifyTrack?.artwork_url ? (
                  <img src={spotifyTrack.artwork_url} style={{ width: 24, height: 24, borderRadius: 4, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                    <Music size={14} color={textColor} />
                  </div>
                )}
                <div style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  fontSize: 13,
                  fontWeight: 600,
                  color: textColor,
                  maxWidth: '250px'
                }}>
                  {spotifyTrack?.name} <span style={{ opacity: 0.7, fontWeight: 400 }}> • {spotifyTrack?.artist}</span>
                </div>
              </div>
              <div className="media-btn" style={{
                marginLeft: 6,
                marginRight: 6,
                opacity: isHovered ? 1 : 0,
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer'
              }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.electronAPI.controlSystemMedia('playpause');
                }}
              >
                {spotifyTrack.state === 'playing' ? <Pause size={16} color={textColor} fill={textColor} /> : <Play size={16} color={textColor} fill={textColor} />}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={chargingAlert ? "charging" : alert ? "battery" : bluetoothAlert ? "bluetooth" : "time"}
              initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
                  color: chargingAlert ? "#6fff7bff" : alert ? "#ff3f3fff" : textColor,
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
                      : `${textColor}`,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {alert === true ? `${percent}%` : chargingAlert === true ? `${percent}%` : standbyBorderEnabled ? `${percent}%` : bluetoothAlert ? "Connected" : weather.temp ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WeatherIcon status={weather.status} size={14} color={textColor} />
                    <span>{weather.temp}º</span>
                  </div>
                ) : `${percent}%`}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      ) : null}

      <AnimatePresence custom={direction} mode="popLayout">
        {mode === "large" && (
          <motion.div
            key={tab}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 400, damping: 40 },
              opacity: { duration: 0.15 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, { offset, velocity }) => {
              setIsDragging(false);
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                setTab(([prev]) => [Math.min(7, prev + 1), 1]);
              } else if (swipe > swipeConfidenceThreshold) {
                setTab(([prev]) => [Math.max(0, prev - 1), -1]);
              }
            }}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              cursor: "grab"
            }}
          >
            {/*Browser Search*/}
            {tab === 0 && (
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
            {tab === 1 && (
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
                          onClick={() => openWorkflow(workflow)}
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
                          key={`main-qa-${app}-${i}`}
                          className="qa-app"
                          onClick={() => openApp(app)}
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
                          {app}
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {/*Overview tab*/}
            {tab === 2 && (
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
            {tab === 3 && (
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
                        paddingLeft: '17px'
                      }}
                    >
                      {spotifyTrack.artwork_url ? (
                        <img src={spotifyTrack.artwork_url} style={{
                          width: 110, height: 110, minWidth: 110,
                          flexShrink: 0,
                          borderRadius: 13, objectFit: 'cover', pointerEvents: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }} />
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
                        maxWidth: '175px'
                      }}>
                        <h2 style={{
                          margin: '0 10px 0 5px',
                          fontSize: 18,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: textColor,
                          fontFamily: theme === "win95" ? "w95" : "OpenRunde"
                        }}>
                          {spotifyTrack.name || "Unknown Title"}
                        </h2>
                        <p style={{
                          margin: '4px 0 0 5px',
                          fontSize: 13,
                          opacity: 0.8,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: textColor,
                          fontFamily: theme === "win95" ? "w95" : "OpenRunde"
                        }}>
                          {spotifyTrack.artist || "Unknown Artist"}
                        </p>
                        <div style={{ display: 'flex', gap: 15, marginTop: 15, alignItems: 'center', marginLeft: 5 }}>
                          <button
                            className="media-btn"
                            onClick={() => window.electronAPI.controlSystemMedia('previous')}
                            style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', padding: 4, opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          ><SkipBackIcon size={20} color={textColor} fill={textColor} /></button>
                          <button
                            className="media-btn"
                            onClick={() => window.electronAPI.controlSystemMedia('playpause')}
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
                            onClick={() => window.electronAPI.controlSystemMedia('next')}
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
            {tab === 4 && (
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
            {tab === 5 && (
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
            {tab === 6 && (
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
                            onChange={() => removeTask(index)}
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
                    onClick={addTask}
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
            {tab === 7 && (
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
                  <div className="settings-row">
                    <span className="settings-label">Default Tab (1-8)</span>
                    <input
                      className="select-input"
                      style={{ width: '60px', padding: '6px' }}
                      placeholder="2"
                      onChange={(e) => localStorage.setItem("default-tab", e.target.value - 1)}
                    />
                  </div>
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
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Island Style</h3>
                  <div className="settings-row">
                    <span className="settings-label">Theme</span>
                    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                      <option value="none">Default</option>
                      <option value="invisible">Invisible</option>
                      <option value="sleek-black">Sleek Black</option>
                      <option value="win95">Windows 95</option>
                    </select>
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Position X ({islandX.toFixed(1)}%)</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={islandX}
                      onChange={handleIslandXChange}
                      onPointerUp={savePosition}
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
                      onChange={handleIslandYChange}
                      onPointerUp={savePosition}
                      style={{ flex: 1, accentColor: textColor }}
                    />
                  </div>
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
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      className="select-input"
                      style={{ flex: 1 }}
                      value={newQuickApp}
                      placeholder="Add app (e.g. Mail)"
                      onChange={(e) => setNewQuickApp(e.target.value)}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <AnimatePresence>
                      {quickApps.map((app, idx) => (
                        <motion.div
                          key={`qa-${app}-${idx}`}
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
                            value={app}
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

                  <div id="add-workflow-form" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    <input
                      className="select-input"
                      style={{ width: '100%' }}
                      placeholder="Workflow Name (e.g. Work Tools)"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                    />
                    <textarea
                      className="select-input"
                      style={{ width: '100%', minHeight: '60px', padding: '10px' }}
                      placeholder="URLs (comma separated): google.com, github.com"
                      value={workflowUrls}
                      onChange={(e) => setWorkflowUrls(e.target.value)}
                    />
                    <button
                      onClick={addWorkflow}
                      style={{
                        backgroundColor: textColor,
                        color: bgColor,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Add Workflow
                    </button>
                  </div>

                  <div id="workflows-list" style={{ marginTop: '15px' }}>
                    <AnimatePresence>
                      {workflows.map((wf, idx) => (
                        <motion.div
                          key={`wf-${wf.name}-${idx}`}
                          className="settings-row"
                          style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid color-mix(in srgb, ${textColor}, transparent 95%)` }}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, x: -20, height: 0, padding: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{wf.name}</span>
                            <span style={{ fontSize: 11, opacity: 0.5 }}>{wf.urls.length} URLs</span>
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

    </motion.div>
  );
}
