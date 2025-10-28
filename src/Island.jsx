import { useState, useEffect } from "react";
import "./App.css";


function getTime() {
  const date = new Date();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");


  const timeEl = document.getElementById("time");
  if (timeEl) {
    timeEl.textContent = `${hours}:${minutes}`;
  }
}
export default function Island() {
  useEffect(() => {
    const id = setInterval(getTime, 1000);
    getTime();
    return () => clearInterval(id);
  }, []);

  const [mode, setMode] = useState("shrink");
  const [tab, setTab] = useState(1);
  let width = mode === "large" ? 90 : mode === "wide" ? 55 : 35;
  let height = mode === "large" ? 90 : mode === "wide" ? 20 : 20;
  let switchTabs = 1;
  
document.addEventListener('keydown', (e) => {

  if (e.key === "ArrowRight") {
    switchTabs+=1
  } else if (e.key === "ArrowLeft") {
    switchTabs-=1
  }

  if (switchTabs > 2) {
    switchTabs = 2
  } else if(switchTabs < 1) {
    switchTabs = 1
  }

  setTab(switchTabs)
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
        overflow: "hidden"

      }}
    >
      {mode === "wide" ? <h1 id="time" className="text" style={{
        position: 'absolute',
        top: '20%',
        left: '12%',
        transform: 'translate(-50%, -50%)',
        fontSize: 18
      }}></h1> : null}
      {mode === "large" && tab === 1 ? 
      <>
      <div>
        <h1 id="time" className="text" style={{fontSize:50}}></h1>
      </div>
      </>
       : null}
    </div>
  );
}
