"use strict";const{app:o,BrowserWindow:m,screen:d,ipcMain:u,shell:w}=require("electron"),c=require("node:path"),y=require("fs");process.platform==="linux"&&(o.commandLine.appendSwitch("enable-transparent-visuals"),o.disableHardwareAcceleration());const f=()=>{const r=d.getPrimaryDisplay(),{width:a,height:i}=r.size,e=new m({width:a,height:i,x:0,y:0,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,hiddenInMissionControl:!0,type:"toolbar",fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:c.join(__dirname,"preload.js"),devTools:!1},show:!1});process.platform!=="linux"&&e.setFullScreen(!0),e.setIgnoreMouseEvents(!0,{forward:!0});const n=process.platform==="linux"?300:0;e.once("ready-to-show",()=>{setTimeout(()=>{e.show()},n)}),u.handle("set-ignore-mouse-events",(s,t,l)=>{e.setIgnoreMouseEvents(t,{forward:l||!1})});try{e.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!o.isPackaged||process.env.NODE_ENV==="development")e.loadURL("http://localhost:5173");else{const s=[c.join(__dirname,"../renderer/main_window/index.html"),c.join(__dirname,"../.vite/renderer/main_window/index.html"),c.join(process.resourcesPath,"app/.vite/renderer/main_window/index.html"),c.join(process.resourcesPath,"app/renderer/main_window/index.html")];let t=!1;for(const l of s)try{if(y.existsSync(l)){e.loadFile(l),t=!0;break}}catch{}t||console.error("Could not find renderer HTML file. Tried paths:",s)}};o.whenReady().then(()=>{process.platform==="darwin"&&o.dock.hide(),f(),o.on("activate",()=>{m.getAllWindows().length===0&&f()})});const{exec:p}=require("child_process");u.handle("get-system-media",async()=>new Promise(r=>{const a=process.platform;a==="darwin"?p(`osascript -e '
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
            '`,(e,n)=>{if(e)return r(null);const s=n.trim();if(!s||s==="None"||s==="Error")return r(null);const t=s.split("||");t.length>=4?r({name:t[2],artist:t[3],album:t[4],artwork_url:t[5]||null,state:t[1]==="playing"?"playing":"paused",source:t[0]}):r(null)}):a==="win32"?p(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(i,e)=>{var s;if(i||!e)return r(null);const n=(s=e.split(`
`).find(t=>t.includes("-")))==null?void 0:s.trim();if(n){const[t,l]=n.split(" - ");r({name:l||n,artist:t||"Unknown",state:"playing",source:"Spotify"})}else r(null)}):a==="linux"?p('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(i,e)=>{if(i||!e)return r(null);const n=e.trim().split("||");r({name:n[0],artist:n[1],album:n[2],state:n[3].toLowerCase(),source:"System"})}):r(null)}));o.on("window-all-closed",()=>{process.platform!=="darwin"&&o.quit()});u.handle("control-system-media",async(r,a)=>{const i=process.platform;if(i==="darwin"){const e=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${a} track
        else if musicRunning then
            tell application "Music" to ${a} track
        end if
        `;p(`osascript -e '${e}'`)}else if(i==="linux"){let e=a;a==="playpause"&&(e="play-pause"),p(`playerctl ${e}`)}});
