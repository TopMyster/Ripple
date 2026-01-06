"use strict";const{app:o,BrowserWindow:d,screen:h,ipcMain:f,shell:k,Tray:w,Menu:g,nativeImage:b}=require("electron"),p=require("node:path");require("fs");process.platform==="linux"&&(o.commandLine.appendSwitch("enable-transparent-visuals"),o.disableHardwareAcceleration());let c=null,e=null;const{exec:u}=require("child_process");f.handle("set-ignore-mouse-events",(s,t,r)=>{e&&e.setIgnoreMouseEvents(t,{forward:r||!1})});const m=()=>{const s=h.getPrimaryDisplay(),{width:t,height:r}=s.size;e=new d({width:t,height:r,x:0,y:0,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,hiddenInMissionControl:!0,type:"toolbar",fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:p.join(__dirname,"preload.js"),devTools:!1},show:!1}),process.platform!=="linux"&&e.setFullScreen(!0),e.setIgnoreMouseEvents(!0,{forward:!0});const n=process.platform==="linux"?300:0;e.once("ready-to-show",()=>{setTimeout(()=>{e&&(e.show(),e.focus())},n)}),setTimeout(()=>{e&&!e.isVisible()&&(e.show(),e.focus())},5e3),e.on("closed",()=>{e=null});try{e.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!o.isPackaged||process.env.NODE_ENV==="development")e.loadURL("http://localhost:5173");else{const i=p.join(__dirname,"../renderer/main_window/index.html");e.loadFile(i)}};o.whenReady().then(()=>{process.platform==="darwin"&&o.dock.hide(),m(),o.on("activate",()=>{d.getAllWindows().length===0&&m()});const s=()=>{const t=process.platform==="win32"?"ico":"png";return o.isPackaged?p.join(process.resourcesPath,`assets/icons/icon.${t}`):p.join(__dirname,`../../src/assets/icons/icon.${t}`)};try{const t=b.createFromPath(s()),r=process.platform==="win32"?t:t.resize({width:16,height:16});c=new w(r);const n=g.buildFromTemplate([{label:"Show Ripple",click:()=>{e&&e.show()}},{label:"Hide Ripple",click:()=>{e&&e.hide()}},{type:"separator"},{label:"Quit",click:()=>{o.quit()}}]);c.setToolTip("Ripple"),c.setContextMenu(n),c.on("click",()=>{e&&(e.isVisible()?e.hide():e.show())})}catch(t){console.error("Failed to create tray:",t)}});f.handle("get-system-media",async()=>new Promise(s=>{const t=process.platform;t==="darwin"?u(`osascript -e '
            tell application "System Events"
                set spotifyRunning to (name of every process) contains "Spotify"
                set musicRunning to (name of every process) contains "Music"
            end tell
            if spotifyRunning then
                try
                    tell application "Spotify"
                        set mediaState to player state as string
                        set songName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                        try
                            set artUrl to artwork url of current track
                        on error
                            set artUrl to ""
                        end try
                    end tell
                    return "Spotify" & "||" & mediaState & "||" & songName & "||" & artistName & "||" & albumName & "||" & artUrl
                on error
                    return "Error"
                end try
            else if musicRunning then
                try
                    tell application "Music" 
                        set mediaState to player state as string
                        set songName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                    end tell
                    return "Music" & "||" & mediaState & "||" & songName & "||" & artistName & "||" & albumName & "||" & "" 
                on error
                    return "Error"
                end try
            else
                return "None"
            end if
            '`,(n,i)=>{if(n)return s(null);const l=i.trim();if(!l||l==="None"||l==="Error")return s(null);const a=l.split("||");a.length>=4?s({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):s(null)}):t==="win32"?u(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(r,n)=>{var l;if(r||!n)return s(null);const i=(l=n.split(`
`).find(a=>a.includes("-")))==null?void 0:l.trim();if(i){const[a,y]=i.split(" - ");s({name:y||i,artist:a||"Unknown",state:"playing",source:"Spotify"})}else s(null)}):t==="linux"?u('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(r,n)=>{if(r||!n)return s(null);const i=n.trim().split("||");s({name:i[0],artist:i[1],album:i[2],state:i[3].toLowerCase(),source:"System"})}):s(null)}));o.on("window-all-closed",()=>{process.platform==="linux"&&!c&&o.quit()});f.handle("control-system-media",async(s,t)=>{const r=process.platform;if(r==="darwin"){const n=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;u(`osascript -e '${n}'`)}else if(r==="linux"){let n=t;t==="playpause"&&(n="play-pause"),u(`playerctl ${n}`)}});
