"use strict";const{app:o,BrowserWindow:d,screen:h,ipcMain:f,shell:k,Tray:w,Menu:g,nativeImage:b}=require("electron"),u=require("node:path");require("fs");process.platform==="linux"&&(o.commandLine.appendSwitch("enable-transparent-visuals"),o.disableHardwareAcceleration());let c=null,t=null;const{exec:p}=require("child_process");f.handle("set-ignore-mouse-events",(r,e,s)=>{t&&t.setIgnoreMouseEvents(e,{forward:s||!1})});const m=()=>{const r=h.getPrimaryDisplay(),{width:e,height:s}=r.size;t=new d({width:e,height:s,x:0,y:0,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,hiddenInMissionControl:!0,type:"toolbar",fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:u.join(__dirname,"preload.js"),devTools:!1},show:!1}),process.platform!=="linux"&&t.setFullScreen(!0),t.setIgnoreMouseEvents(!0,{forward:!0});const n=process.platform==="linux"?300:0;t.once("ready-to-show",()=>{setTimeout(()=>{t.show()},n)}),t.on("closed",()=>{t=null});try{t.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!o.isPackaged||process.env.NODE_ENV==="development")t.loadURL("http://localhost:5173");else{const a=u.join(__dirname,"../renderer/main_window/index.html");t.loadFile(a)}};o.whenReady().then(()=>{process.platform==="darwin"&&o.dock.hide(),m(),o.on("activate",()=>{d.getAllWindows().length===0&&m()});const r=()=>{const e=process.platform==="win32"?"ico":"png";return o.isPackaged?u.join(process.resourcesPath,`assets/icons/icon.${e}`):u.join(__dirname,`../../src/assets/icons/icon.${e}`)};try{const e=b.createFromPath(r()),s=process.platform==="win32"?e:e.resize({width:16,height:16});c=new w(s);const n=g.buildFromTemplate([{label:"Show Ripple",click:()=>{t&&t.show()}},{label:"Hide Ripple",click:()=>{t&&t.hide()}},{type:"separator"},{label:"Quit",click:()=>{o.quit()}}]);c.setToolTip("Ripple"),c.setContextMenu(n),c.on("click",()=>{t&&(t.isVisible()?t.hide():t.show())})}catch(e){console.error("Failed to create tray:",e)}});f.handle("get-system-media",async()=>new Promise(r=>{const e=process.platform;e==="darwin"?p(`osascript -e '
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
            '`,(n,a)=>{if(n)return r(null);const l=a.trim();if(!l||l==="None"||l==="Error")return r(null);const i=l.split("||");i.length>=4?r({name:i[2],artist:i[3],album:i[4],artwork_url:i[5]||null,state:i[1]==="playing"?"playing":"paused",source:i[0]}):r(null)}):e==="win32"?p(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(s,n)=>{var l;if(s||!n)return r(null);const a=(l=n.split(`
`).find(i=>i.includes("-")))==null?void 0:l.trim();if(a){const[i,y]=a.split(" - ");r({name:y||a,artist:i||"Unknown",state:"playing",source:"Spotify"})}else r(null)}):e==="linux"?p('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(s,n)=>{if(s||!n)return r(null);const a=n.trim().split("||");r({name:a[0],artist:a[1],album:a[2],state:a[3].toLowerCase(),source:"System"})}):r(null)}));o.on("window-all-closed",()=>{process.platform!=="darwin"&&!c&&o.quit()});f.handle("control-system-media",async(r,e)=>{const s=process.platform;if(s==="darwin"){const n=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${e} track
        else if musicRunning then
            tell application "Music" to ${e} track
        end if
        `;p(`osascript -e '${n}'`)}else if(s==="linux"){let n=e;e==="playpause"&&(n="play-pause"),p(`playerctl ${n}`)}});
