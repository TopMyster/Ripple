import { useState, useEffect, useRef, use } from "react";
import { Groq } from 'groq-sdk';
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

export default function Island() {
  const [time, setTime] = useState(null)
  const [mode, setMode] = useState("shrink")
  const [tab, setTab] = useState(1);
  const [asked, setAsked] = useState(false)
  const [aiAnswer, setAIAnswer] = useState(null)
  const [percent, setPercent] = useState(null)
  const [alert, setAlert] = useState(null)
  const [userText, setUserText] = useState("")
  const [batteryAlertsEnabled, setBatteryAlertsEnabled] = useState(true)
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

  //AI feature 
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
          setAIAnswer(prev => (prev ? prev + delta : delta));
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
      console.error("askAI error:", err);
    }
  }

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

  // // Get Weather
  // useEffect(async() => {
  //   const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=0b18c67c443543e0a6045401250911&q=${place}&aqi=no`)
  //   const data = await response.json()
  // })

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
        borderRadius: mode === "large" ? 25 : 15,
        backgroundColor: localStorage.getItem("bg-color"),
        color: localStorage.getItem("text-color")
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
            <textarea id="userinput" type="text" placeholder="Ask Anything" onChange={(e) => {setUserText(e.target.value)}} style={{color: `${localStorage.getItem("text-color")}`}}/>
            <button id="chatsubmit" onClick={() => {setAsked(true); askAI()}} >Ask</button>
        </div>
       </>: null}
       {/*AI result*/}
       {mode === "large" && tab === 2 && asked === true ? 
       <>
        <div>
            <h4 id="result" style={{fontWeight: 400}}>
                {aiAnswer}
            </h4>
            <button onClick={() => {setAsked(false); askAI()}} id="Askanotherbtn">Ask another</button>
        </div>
       </>: null}
       {/*Settings*/}
       {mode === "large" && tab === 3 ? 
        <>
          <div
            style={{
              lineHeight: 2.3,
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
            <label for="battery-alerts" className="text" >Low Battery Alerts: </label>
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
            {/*API key*/}
            <label for="api-key" className="text">API key: </label>
            <input
              id="api-key"
              className="select-input" 
              placeholder="Enter Groq API Key here"
              onChange={(e) => {localStorage.setItem("api-key", e.target.value)}}
            /><br/>
          </div>
        </>
       : null}
    </div>
  );
}