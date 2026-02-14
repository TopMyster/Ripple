import { useState, useEffect } from "react";
import { Groq } from "groq-sdk";
import "./App.css";
import lowBatteryIcon from "./assets/images/lowbattery.png";
import chargingIcon from "./assets/images/charging.png";

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

function openApp(app) {
  if (!app) return;
  try {
    window.location.href = `${app}://`;
  } catch (e) {
    window.alert("Failed to open app:", app, e);
  }
}

export default function Island() {
  const [time, setTime] = useState(null);
  const [mode, setMode] = useState("still");
  const [tab, setTab] = useState(Number(localStorage.getItem("default-tab") || 2));
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
  const [weather, setWeather] = useState("");
  const [weatherUnit, setweatherUnit] = useState(localStorage.getItem("weather-unit") || "f");
  const [theme, setTheme] = useState("default");
  const [browserSearch, setBrowserSearch] = useState("");
  const [clipboard, setClipboard] = useState([]);
  const [charging, setCharging] = useState(false);
  const [chargingAlert, setChargingAlert] = useState(false);
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [bluetooth, setBluetooth] = useState(false);
  const [bluetoothAlert, setBluetoothAlert] = useState(false);
  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem("tasks") || "[]"));
  const [taskText, setTaskText] = useState("");

  let isPlaying = spotifyTrack?.state === 'playing';
  let width = mode === "large" ? 400 : (mode === "quick" || isPlaying) ? 300 : 175;
  let height = mode === "large" ? tab === 7 ? 300 : 190 : mode === "quick" ? 43 : 43;

  const [qa1, setQa1] = useState(localStorage.getItem("qa1") || "discord");
  const [qa2, setQa2] = useState(localStorage.getItem("qa2") || "spotify");
  const [qa3, setQa3] = useState(localStorage.getItem("qa3") || "sms");
  const [qa4, setQa4] = useState(localStorage.getItem("qa4") || "tel");

  //User age
  useEffect(() => {
    if (!localStorage.getItem('newuser')) {
      localStorage.setItem('newuser', 'true');
    }

    if (localStorage.getItem('newuser') === 'true') {
      const timer = setTimeout(() => {
        window.open("https://github.com/TopMyster/Ripple/blob/main/instructions.md", '_blank');
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

  if (!localStorage.getItem("bg-color")) {
    localStorage.setItem("bg-color", "#000000");
  }

  if (!localStorage.getItem("text-color")) {
    localStorage.setItem("text-color", "#FAFAFA");
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

  // AI feature 
  async function askAI() {
    try {
      const apiKey = (localStorage.getItem("api-key") || "").trim();

      if (!apiKey) {
        setAIAnswer("Enter your API key in settings");
        return;
      }

      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

      setAIAnswer("");

      const stream = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "user",
            content: ` Users question: ${userText}. Answer the users question in a short paragraph, 3-4 sentences. If the question is straight forward answer the question in a short 2 sentences.`
          }
        ],
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
        stream: true,
        stop: null
      });

      let fullText = "";

      for await (const chunk of stream) {
        const delta = chunk?.choices?.[0]?.delta?.content || "";
        if (delta) {
          fullText += delta;
          setAIAnswer((prev) => (prev ? prev + delta : delta));
        }
      }

      if (!fullText) {
        setAIAnswer("No response streamed. Try again or check your model/params.");
      }
    } catch (err) {
      const message =
        err?.message ||
        (typeof err === "string" ? err : "Unexpected error occurred.");
      setAIAnswer(`Error: ${message}`);
      alert("askAI error:", err);
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
      }, 3000);
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
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=0b18c67c443543e0a6045401250911&q=${localStorage.getItem(
          "location"
        )}&aqi=no`
      );
      const data = await response.json();
      const unit = localStorage.getItem("weather-unit");
      const key = unit === "f" ? "temp_f" : "temp_c";
      setWeather(Math.round(data?.current?.[key]));
    };
    getWeather();
  });

  // Set theme
  useEffect(() => {
    if (theme === "sleek-black") {
      localStorage.setItem("bg-color", "rgba(0, 0, 0, 0.64)");
      localStorage.setItem("text-color", "rgba(255, 255, 255)");
    } else if (theme === "win95") {
      localStorage.setItem("bg-color", "rgba(195, 195, 195)");
      localStorage.setItem("text-color", "rgba(0, 0, 0)");
    } else if (theme === "invisible") {
      localStorage.setItem("bg-image", "none");
      localStorage.setItem("bg-color", "rgba(255, 255, 255, 0)");
    } else if (theme === "none") {
    }
  });

  // Browser Search Feature
  function searchBrowser() {
    const trimmedSearch = browserSearch.trim();
    if (!trimmedSearch) return;
    if (trimmedSearch.includes(".")) {
      const hasProtocol = /^https?:\/\//i.test(trimmedSearch);
      const urlToOpen = hasProtocol ? trimmedSearch : `https://${trimmedSearch}`;
      window.open(urlToOpen, "_blank");
    } else {
      const encodedQuery = encodeURIComponent(trimmedSearch);
      window.open(`https://www.google.com/search?q=${encodedQuery}`, "_blank");
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

  // Keyboard Shortcuts and Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        setTab((prev) => Math.min(7, prev + 1));
      } else if (e.key === "ArrowLeft") {
        setTab((prev) => Math.max(0, prev - 1));
      } else if (e.ctrlKey && e.key >= "1" && e.key <= "8") {
        const tabNum = parseInt(e.key) - 1;
        setMode("large");
        setTab(tabNum);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      id="Island"
      onMouseEnter={() => {
        if (mode !== "large") setMode("quick");
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(false, false);
        }
      }}
      onMouseLeave={() => {
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
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: "flex",
        alignItems: "center",
        backgroundImage: `url('${localStorage.getItem("bg-image")}')`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: theme === "win95" ? "w95" : "OpenRunde",
        border: theme === "win95" ? "2px solid rgb(254, 254, 254)" : islandBorderEnabled ? alert ? `1px solid rgba(255, 38, 0, 0.34)` : bluetoothAlert ? `1px solid rgba(0, 150, 255, 0.34)` : chargingAlert ? `1px solid rgba(3, 196, 3, 0.301)` : hideNotActiveIslandEnabled ? "none" : `1px solid color-mix(in srgb, ${localStorage.getItem("text-color")}, transparent 70%)` : "none",
        borderColor:
          theme === "win95"
            ? "#FFFFFF #808080 #808080 #FFFFFF"
            : "none",
        borderRadius:
          mode === "large" && theme === "win95"
            ? 0
            : mode === "large"
              ? 32
              : theme === "win95"
                ? 0
                : 16,
        boxShadow: hideNotActiveIslandEnabled && mode === 'still' ? "none" : '2px 2px 30px rgba(0, 0, 0, 0.07)',
        backgroundColor: hideNotActiveIslandEnabled && mode === 'still' ? "rgba(0,0,0,0)" : localStorage.getItem("bg-color"),
        color: hideNotActiveIslandEnabled && mode === 'still' ? "rgba(0,0,0,0)" : localStorage.getItem("text-color")
      }}
    >
      {/*Quickview*/}
      {(mode === "quick" || (mode === "still" && isPlaying)) ? (
        <>
          {isPlaying && !alert && !chargingAlert && !bluetoothAlert ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              opacity: hideNotActiveIslandEnabled ? .6 : 1,
              padding: '0 10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', flex: 1, userSelect: 'none', }}>
                {spotifyTrack?.artwork_url ? (
                  <img src={spotifyTrack.artwork_url} style={{ width: 24, height: 24, borderRadius: 4, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                    🎵
                  </div>
                )}
                <div style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  fontSize: 13,
                  fontWeight: 600,
                  color: localStorage.getItem("text-color"),
                  maxWidth: '250px'
                }}>
                  {spotifyTrack?.name} <span style={{ opacity: 0.7, fontWeight: 400 }}> • {spotifyTrack?.artist}</span>
                </div>
              </div>
              <div style={{ marginLeft: 8, opacity: 0.5, userSelect: 'none' }}>

              </div>
            </div>
          ) : (
            <>
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
                  animation: 'appear .3s ease-out',
                  color: chargingAlert === true && !alert ? "#6fff7bff" : localStorage.getItem("text-color")
                }}
              >
                {alert === true ? <img src={lowBatteryIcon} alt="low battery" style={{ width: 40, height: 40, objectFit: 'contain', position: 'absolute', transform: 'translate(0%, -50%)' }} /> : chargingAlert ? <img src={chargingIcon} alt="charging" style={{ width: 40, height: 40, objectFit: 'contain', position: 'absolute', transform: 'translate(0%, -50%)' }} /> : bluetoothAlert ? "🎧" : time}
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
                  animation: 'appear .3s ease-out',
                  color: alert === true
                    ? "#ff3f3fff"
                    : `${localStorage.getItem("text-color")}`

                }}
              >
                {alert === true ? `${percent}%` : chargingAlert === true ? `${percent}%` : standbyBorderEnabled ? `${percent}%` : bluetoothAlert ? "Connected" : weather ? `${weather}º` : `${percent}%`}
              </h1>
            </>
          )}
        </>
      ) : null}

      {/*Browser Search*/}
      {mode === "large" && tab === 0 ? (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', animation: 'appear 0.5s ease-out' }}>
          <input
            id="browser-searchbar"
            placeholder="Search google or enter URL"
            value={browserSearch}
            onChange={(e) => setBrowserSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchBrowser();
            }}
            style={{ color: localStorage.getItem("text-color") }}
          />
        </div>
      ) : null}

      {/* Quick Apps */}
      {mode === "large" && tab === 1 ? (
        <>
          <div id="quick-apps">
            <button
              className="qa-app"
              onClick={() => {
                openApp(qa1);
              }}
              style={{
                color: localStorage.getItem("bg-color"),
                backgroundColor: localStorage.getItem("text-color"),
                fontFamily: theme === "win95" ? "w95" : "OpenRunde"
              }}
            >
              {qa1}
            </button>
            <button
              className="qa-app"
              onClick={() => {
                openApp(qa2);
              }}
              style={{
                color: localStorage.getItem("bg-color"),
                backgroundColor: localStorage.getItem("text-color"),
                fontFamily: theme === "win95" ? "w95" : "OpenRunde"
              }}
            >
              {qa2}
            </button>
            <button
              className="qa-app"
              onClick={() => {
                openApp(qa3);
              }}
              style={{
                color: localStorage.getItem("bg-color"),
                backgroundColor: localStorage.getItem("text-color"),
                fontFamily: theme === "win95" ? "w95" : "OpenRunde"
              }}
            >
              {qa3}
            </button>
            <button
              className="qa-app"
              onClick={() => {
                openApp(qa4);
              }}
              style={{
                color: localStorage.getItem("bg-color"),
                backgroundColor: localStorage.getItem("text-color"),
                fontFamily: theme === "win95" ? "w95" : "OpenRunde"
              }}
            >
              {qa4}
            </button>
          </div>
        </>
      ) : null}

      {/*Overview tab*/}
      {mode === "large" && tab === 2 ? (
        <>
          <div id="battery">
            <div
              id="battery-bar"
              style={{
                backgroundColor: localStorage.getItem('text-color'),
                color: localStorage.getItem("bg-color")
              }}
            >
              <h1 className="text">{charging ? "⚡︎" : null}{`${percent}%`}</h1>
            </div>
          </div>
          <h1
            className="text"
            style={{
              fontSize: 15,
              left: 25,
              top: 14,
              position: "absolute"
            }}
          >{`${weather ? weather : "??"}º`}</h1>
          <div id="date">
            <h1 className="text" style={{ fontSize: 50 }}>
              {time}
            </h1>
            <h2 className="text" style={{ fontSize: 15 }}>
              {formatDateShort()}
            </h2>
          </div>
        </>
      ) : null}

      {/* Now Playing*/}
      {mode === "large" && tab === 3 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '90%',
          height: '100%',
          gap: '15px',
          userSelect: 'none',
          animation: 'cubic-bezier(0.165, 0.84, 0.44, 1) appear .7s forwards'
        }}>
          {spotifyTrack ? (
            <>
              {spotifyTrack.artwork_url ? (
                <img src={spotifyTrack.artwork_url} style={{
                  width: 110, height: 110, minWidth: 110,
                  borderRadius: 13, objectFit: 'cover',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }} />
              ) : (
                <div style={{
                  width: 110, height: 110, minWidth: 110,
                  borderRadius: 12, background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24
                }}>
                  🎵
                </div>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                maxWidth: '220px',
                justifyContent: 'center',
                textAlign: 'left'
              }}>
                <h2 style={{
                  margin: '0 30px 0 13px',
                  fontSize: 18,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: localStorage.getItem("text-color"),
                  fontFamily: theme === "win95" ? "w95" : "OpenRunde"
                }}>
                  {spotifyTrack.name || "Unknown Title"}
                </h2>
                <p style={{
                  margin: '4px 0 0 13px',
                  fontSize: 13,
                  opacity: 0.8,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: localStorage.getItem("text-color"),
                  fontFamily: theme === "win95" ? "w95" : "OpenRunde"
                }}>
                  {spotifyTrack.artist || "Unknown Artist"}
                </p>
                {/* Controls */}
                <div style={{ display: 'flex', gap: 15, marginTop: 15, alignItems: 'center', marginLeft: 15 }}>
                  <button
                    onClick={() => window.electronAPI.controlSystemMedia('previous')}
                    style={{ background: 'none', border: 'none', color: localStorage.getItem("text-color"), cursor: 'pointer', fontSize: 23, padding: 0, opacity: 0.8 }}
                  >⏮</button>
                  <button
                    onClick={() => window.electronAPI.controlSystemMedia('playpause')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: localStorage.getItem("text-color"),
                      cursor: 'pointer',
                      fontSize: 24,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: spotifyTrack.state === 'playing'
                        ? 'scale(1.5)'
                        : 'scale(1)',
                      transition: 'transform 0.15s ease-out'
                    }}
                  >
                    {spotifyTrack.state === 'playing' ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={() => window.electronAPI.controlSystemMedia('next')}
                    style={{ background: 'none', border: 'none', color: localStorage.getItem("text-color"), cursor: 'pointer', fontSize: 23, padding: 0, opacity: 0.8 }}
                  >⏭</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              width: '100%',
              textAlign: 'center',
              color: localStorage.getItem("text-color"),
              fontFamily: theme === "win95" ? "w95" : "OpenRunde"
            }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Nothing Playing</h3>
              <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: 13 }}>Play music on Spotify or Apple Music</p>
            </div>
          )}
        </div>
      ) : null}

      {/*AI ask*/}
      {mode === "large" && tab === 4 && asked === false ? (
        <>
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              justifyContent: "flex-start",
              width: "100%",
              height: "100%",
              padding: "10px",
              boxSizing: "border-box"
            }}
          >
            <textarea
              id="userinput"
              type="text"
              placeholder="Ask Anything"
              onChange={(e) => {
                setUserText(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === "Enter") {
                  setAsked(true);
                  askAI();
                }
              }}
              style={{
                color: `${localStorage.getItem("text-color")}`,
                fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                pointerEvents: "auto"
              }}
            />
            <button
              id="chatsubmit"
              onClick={() => {
                setAsked(true);
                askAI();
              }}
              style={{
                backgroundColor: localStorage.getItem("text-color"),
                color: localStorage.getItem("bg-color"),
                fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                pointerEvents: "auto"
              }}
            >
              Ask
            </button>
          </div>
        </>
      ) : null}

      {/*AI result*/}
      {mode === "large" && tab === 4 && asked === true ? (
        <>
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              width: "90%",
              height: "130%",
              padding: "10px",
              boxSizing: "border-box"
            }}
          >
            <h4
              id="result"
              style={{
                fontWeight: 400,
                fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                pointerEvents: "auto"
              }}
            >
              {aiAnswer}
            </h4>
            <button
              onClick={() => {
                setAsked(false);
                setAIAnswer(null);
              }}
              id="Askanotherbtn"
              style={{
                backgroundColor: localStorage.getItem("text-color"),
                color: localStorage.getItem("bg-color"),
                fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                pointerEvents: "auto"
              }}
            >
              Ask another
            </button>
          </div>
        </>
      ) : null}

      {/*Clipboard*/}
      {mode === "large" && tab === 5 ? (
        <div id="clipboard">
          {clipboard.length === 0 ? (
            <p style={{ opacity: 0.5, textAlign: 'center', marginTop: 30 }}>Clipboard is empty</p>
          ) : (
            clipboard.map((item, index) => (
              <div className="clipboard-row" key={index}>
                <p className="clipboard-content">{item}</p>
                <div className="clipboard-footer">
                  <button
                    onClick={() => copyToClipboard(item)}
                    className="copy-btn"
                    style={{
                      backgroundColor: localStorage.getItem("text-color"),
                      color: localStorage.getItem("bg-color"),
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/*Tasks*/}
      {mode === "large" && tab === 6 ? (
        <>
          <div id="tasks-container">
            <div id="task-list">
              {tasks.length === 0 ? (
                <p style={{ opacity: 0.5, textAlign: 'center', marginTop: 30 }}>No tasks yet. Add one below!</p>
              ) : (
                tasks.map((task, index) => (
                  <div className="task-row" key={index}>
                    <input
                      type="checkbox"
                      onChange={() => removeTask(index)}
                      className="task-checkbox"
                    />
                    <h3 className="task-item" style={{ flex: 1, margin: 0 }}>{task}</h3>
                  </div>
                ))
              )}
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
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: localStorage.getItem("text-color"),
                  border: '1px solid rgba(255,255,255,0.1)',
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
                  backgroundColor: localStorage.getItem("text-color"),
                  color: localStorage.getItem("bg-color"),
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
        </>
      ) : null}

      {/*Settings Overhaul*/}
      {mode === "large" && tab === 7 ? (
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
                onChange={(e) => localStorage.setItem("bg-color", e.target.value)}
              />
            </div>
            <div className="settings-row">
              <span className="settings-label">Text Color</span>
              <input
                className="select-input"
                style={{ width: '100px' }}
                placeholder="#FAFAFA"
                onChange={(e) => localStorage.setItem("text-color", e.target.value)}
              />
            </div>
            <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="settings-label">Background Image URL</span>
              <input
                className="select-input"
                placeholder="https://..."
                onChange={(e) => localStorage.setItem("bg-image", e.target.value)}
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
                onChange={(e) => localStorage.setItem("location", e.target.value)}
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

          <div className="settings-section" style={{ marginBottom: 30 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Integrations</h3>
            <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="settings-label">Groq API Key (for AI)</span>
              <input
                className="select-input"
                type="password"
                placeholder="gsk_..."
                onChange={(e) => localStorage.setItem("api-key", e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
