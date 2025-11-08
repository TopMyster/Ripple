import { useState, useEffect, useRef } from "react";
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

function askAI() {
    let API_KEY = localStorage.getItem('API_KEY')
}

export default function Island() {
  const [time, setTime] = useState(null);
  const [mode, setMode] = useState("shrink");
  const [tab, setTab] = useState(1);
  const [asked, setAsked] = useState(false);
  const [percent, setPercent] = useState(null)
  const [alert, setAlert] = useState(null)
  const [batteryAlertsEnabled, setBatteryAlertsEnabled] = useState(true);
  const hasAlerted = useRef(false)
  let width = mode === "large" ? 80 : mode === "wide" ? 61 : 35;
  let height = mode === "large" ? 90 : mode === "wide" ? 20 : 20;
  if (!localStorage.getItem("battery-alerts")) {
    localStorage.setItem("battery-alerts", "true")
  }

  if (!localStorage.getItem("bg-color")) {
    localStorage.setItem("bg-color", "#000000")
  }

  if (!localStorage.getItem("text-color")) {
    localStorage.setItem("text-color", "#FAFAFA")
  }

  const handleBatteryAlertsChange = (e) => {
    const value = e.target.value === "true";
    setBatteryAlertsEnabled(value);
    localStorage.setItem("battery-alerts", value ? "true" : "false")
  }


  // async function loadSettings() {
  //   let response = await fetch('settings.json')
  //   let data = await response.json()
  //   setTest(data)
  // }

  //Get battery percent
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

  //Battery alerts
  useEffect(() => {
    if ((percent === 20 || percent === 10 || percent === 5 || percent === 2) && localStorage.getItem("battery-alerts") === "true") {
      setMode("wide");
      setAlert(true);
      const timerId = setTimeout(() => {
        setMode("normal");
        setAlert(null);
      }, 2000);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [percent]);

  //Navigate tabs
  useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      setTab((prev) => Math.min(3, prev + 1));
    } else if (e.key === "ArrowLeft") {
        setTab((prev) => Math.max(1, prev - 1));
    }
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
  }, []);

  //Get time
  useEffect((date = new Date()) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    setTime(`${hours}:${minutes}`);

  })

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
        overflow: "hidden",
        backgroundColor: `${localStorage.getItem("bg-color")}`,
        color: `${localStorage.getItem("text-color")}`
      }}
    >
      {/*Quickview -time*/}
      {mode === "wide"? 
      <>
        <h1 className="text" style={{
          position: 'absolute',
          top: '20%',
          left: '12%',
          transform: 'translate(-50%, -50%)',
          fontSize: 17,
          fontWeight: 600,
          color: `${alert === true ? "#ff3f3fff" : `${localStorage.getItem("text-color")}`}`
        }}>{alert === true ? `${percent}%`:time}</h1>
      </>
      : null}
      {/*Overview tab*/}
      {mode === "large" && tab === 1 ? 
      <>
      <h1 className="text" style={{fontSize:15, right: 20, top: 10, position: "absolute"}}>{`${percent}%`}</h1>
        <div id="date">
            <h1 className="text" style={{fontSize:50}}>{time}</h1>
            <h2 className="text" style={{fontSize:15}}>{formatDateShort()}</h2>
        </div>
      </>
       : null}
       {/*AI ask*/}
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
       {/*AI result*/}
       {mode === "large" && tab === 2 && asked === true ? 
       <>
        <div>
            <div id="result">
                
            </div>
            <button onClick={() => {setAsked(false); askAI()}}>Ask another</button>
        </div>
       </>: null}
       {/*Settings*/}
       {mode === "large" && tab === 3 ? 
        <>
          <div
            style={{
              lineHeight: 2,
              textAlign: "center",
              width: "90%",
              maxHeight: "100%",   
              overflowX: "hidden",
              padding: 12,
              boxSizing: "border-box",
            }}
          >
          <h1 className="text">Settings</h1>
          {/*Battery alerts settings*/}
          <label for="battery-alerts" className="text" >Battery Alerts: </label>
          <select id="battery-alerts" 
            value={batteryAlertsEnabled ? "true" : "false"}
            onChange={handleBatteryAlertsChange}
          >
            <option value={"true"}>Yes</option>
            <option value={"false"}>No</option>
          </select><br/>
          {/*Background color settings*/}
          <label for="bg-color" className="text">Island Color: </label>
          <input
            id="bg-color"
            className="select-input" 
            placeholder="ex: #000000"
            onChange={(e) => {localStorage.setItem("bg-color", e.target.value)}}
          /><br/>
          {/*Text color settings*/}
          <label for="text-color" className="text">Text Color: </label>
          <input
            id="text-color"
            className="select-input" 
            placeholder="ex: #FAFAFA"
            onChange={(e) => {localStorage.setItem("text-color", e.target.value)}}
          /><br/>

          </div>
        </>
       : null}
    </div>
  );
}