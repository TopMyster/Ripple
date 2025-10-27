import { useState } from "react";
import "./App.css";


function getTime() {
    let date = new Date()
    const hours = date.getHours();
    const minutes = date.getMinutes();
    let now = `${hours}:${minutes}`
    document.getElementById('time').textContent = now
}
export default function Island() {
  setInterval(getTime, 1000)
  const [mode, setMode] = useState("shrink");
  
  return (
    <div
      id="Island"
      onMouseEnter={() => mode !== "enlarge" && setMode("wide")}
      onMouseLeave={() => setMode("shrink")}
      onClick={() => setMode("enlarge")}
      className={`island-${mode}`}
    >
      {mode === "wide" ? <h1 id="time"></h1> : null}
    </div>
  );
}
