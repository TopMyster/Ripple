import { useState, useEffect } from "react";
import "./App.css";

function formatTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

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

function askAI() {
    let API_KEY = localStorage.getItem('API_KEY')
}

export default function Island() {
  const [time, setTime] = useState(formatTime());
  const [mode, setMode] = useState("shrink");
  const [tab, setTab] = useState(1);
  const [asked, setAsked] = useState(false);
  const [percent, setPercent] = useState(null)
  // const [test, setTest] = useState("")
  let width = mode === "large" ? 80 : mode === "wide" ? 61 : 35;
  let height = mode === "large" ? 90 : mode === "wide" ? 20 : 20;


  // async function loadSettings() {
  //   let response = await fetch('settings.json')
  //   let data = await response.json()
  //   setTest(data)
  // }
  useEffect(() => {
      let battery, handler;

      (async () => {
        if (!("getBattery" in navigator)) return setPercent("Battery not supported");
        try {
          battery = await navigator.getBattery();
          const update = () => setPercent(Math.round(battery.level * 100));
          handler = update;
          update();
          battery.addEventListener("levelchange", handler);
        } catch {
          setPercent("Battery unavailable");
        }
      })();

      return () => {
        if (battery && handler) battery.removeEventListener("levelchange", handler);
      };
  }, []);

  useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      setTab((prev) => Math.min(2, prev + 1));
    } else if (e.key === "ArrowLeft") {
        setTab((prev) => Math.max(1, prev - 1));
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
      onMouseEnter={() => mode !== "large" && setMode("wide")}
      onMouseLeave={() => setMode("shrink")}
      onClick={() => setMode("large")}
      style={{
        width: `${width}vw`,
        height: `${height}vh`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"

      }}
    >
      
      {mode === "wide" ? 
      <>
        <h1 className="text" style={{
          position: 'absolute',
          top: '20%',
          left: '12%',
          transform: 'translate(-50%, -50%)',
          fontSize: 17,
          fontWeight: 600
        }}>{time}</h1>
      </>
      : null}
      {mode === "large" && tab === 1 ? 
      <>
        <div id="date">
            <h1 className="text" style={{fontSize:50}}>{time}</h1>
            <h2 className="text" style={{fontSize:15}}>{formatDateShort()}</h2>
        </div>
      </>
       : null}

       {mode === "large" && tab === 2 && asked === false ? 
       <>
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap"

        }}>
            <textarea id="userinput" type="text" placeholder="Ask Anything"/>
            <button id="chatsubmit" onClick={() => {setAsked(true); askAI()}} >Ask</button>
        </div>
       </>: null}
        
       {mode === "large" && tab === 2 && asked === true ? 
       <>
        <div>
            <div id="result">
                
            </div>
            <button onClick={() => {setAsked(false); askAI()}}>Ask another</button>
        </div>
       </>: null}
    </div>
  );
}