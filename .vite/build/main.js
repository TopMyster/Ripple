"use strict";const{app:o,BrowserWindow:m,screen:d,ipcMain:u,shell:y}=require("electron"),p=require("node:path");require("fs");process.platform==="linux"&&(o.commandLine.appendSwitch("enable-transparent-visuals"),o.disableHardwareAcceleration());const f=()=>{const t=d.getPrimaryDisplay(),{width:a,height:i}=t.size,e=new m({width:a,height:i,x:0,y:0,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,hiddenInMissionControl:!0,type:"toolbar",fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:p.join(__dirname,"preload.js"),devTools:!1},show:!1});process.platform!=="linux"&&e.setFullScreen(!0),e.setIgnoreMouseEvents(!0,{forward:!0});const n=process.platform==="linux"?300:0;e.once("ready-to-show",()=>{setTimeout(()=>{e.show()},n)}),u.handle("set-ignore-mouse-events",(s,r,c)=>{e.setIgnoreMouseEvents(r,{forward:c||!1})});try{e.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!o.isPackaged||process.env.NODE_ENV==="development")e.loadURL("http://localhost:5173");else{const s=p.join(__dirname,"../renderer/main_window/index.html");e.loadFile(s)}};o.whenReady().then(()=>{process.platform==="darwin"&&o.dock.hide(),f(),o.on("activate",()=>{m.getAllWindows().length===0&&f()})});const{exec:l}=require("child_process");u.handle("get-system-media",async()=>new Promise(t=>{const a=process.platform;a==="darwin"?l(`osascript -e '
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
            '`,(e,n)=>{if(e)return t(null);const s=n.trim();if(!s||s==="None"||s==="Error")return t(null);const r=s.split("||");r.length>=4?t({name:r[2],artist:r[3],album:r[4],artwork_url:r[5]||null,state:r[1]==="playing"?"playing":"paused",source:r[0]}):t(null)}):a==="win32"?l(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(i,e)=>{var s;if(i||!e)return t(null);const n=(s=e.split(`
`).find(r=>r.includes("-")))==null?void 0:s.trim();if(n){const[r,c]=n.split(" - ");t({name:c||n,artist:r||"Unknown",state:"playing",source:"Spotify"})}else t(null)}):a==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(i,e)=>{if(i||!e)return t(null);const n=e.trim().split("||");t({name:n[0],artist:n[1],album:n[2],state:n[3].toLowerCase(),source:"System"})}):t(null)}));o.on("window-all-closed",()=>{process.platform!=="darwin"&&o.quit()});u.handle("control-system-media",async(t,a)=>{const i=process.platform;if(i==="darwin"){const e=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${a} track
        else if musicRunning then
            tell application "Music" to ${a} track
        end if
        `;l(`osascript -e '${e}'`)}else if(i==="linux"){let e=a;a==="playpause"&&(e="play-pause"),l(`playerctl ${e}`)}});
