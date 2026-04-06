"use strict";const{app:l,BrowserWindow:T,screen:w,ipcMain:u,shell:A,Tray:C,Menu:N,nativeImage:R}=require("electron"),m=require("node:path"),d=require("fs");process.platform==="linux"&&(l.commandLine.appendSwitch("enable-transparent-visuals"),l.commandLine.appendSwitch("disable-gpu-compositing"),l.disableHardwareAcceleration());let h=null,n=null;const{exec:c}=require("child_process");u.handle("set-ignore-mouse-events",(e,t,s)=>{n&&(process.platform!=="linux"?n.setIgnoreMouseEvents(t,{forward:s||!1}):n.setIgnoreMouseEvents(t))});u.handle("focus-window",()=>{n&&n.focus()});u.handle("open-external",async(e,t)=>{await A.openExternal(t)});u.handle("launch-app",async(e,t)=>{const s=process.platform;c(s==="darwin"?`open -a "${t}"`:s==="win32"?`start "" "${t}"`:t)});u.handle("get-displays",()=>w.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));u.handle("set-display",(e,t)=>{if(n){const o=w.getAllDisplays().find(f=>f.id.toString()===t.toString())||w.getPrimaryDisplay(),{x:r,y:i,width:a,height:p}=o.bounds;process.platform,n.setBounds({x:r,y:i,width:a,height:p}),n.show()}});u.handle("update-window-position",(e,t,s)=>{});u.handle("set-auto-launch",(e,t)=>{if(process.platform==="linux"){const s=m.join(l.getPath("home"),".config","autostart"),o=m.join(s,"ripple.desktop");try{if(t){d.existsSync(s)||d.mkdirSync(s,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${l.getPath("exe")}"
Icon=${b()}
Terminal=false
`;d.writeFileSync(o,r)}else d.existsSync(o)&&d.unlinkSync(o)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{l.setLoginItemSettings({openAtLogin:t,path:l.getPath("exe")})}catch(s){console.error("Failed to set login item settings on Windows:",s)}});const b=()=>{const e="png";if(l.isPackaged){const t=m.join(process.resourcesPath,`icon.${e}`),s=m.join(process.resourcesPath,`assets/icons/icon.${e}`);return d.existsSync(t)?t:d.existsSync(s)?s:t}return m.join(__dirname,`../../src/assets/icons/icon.${e}`)},k=()=>{const e=w.getPrimaryDisplay(),{x:t,y:s,width:o,height:r}=e.bounds,i=process.platform==="linux",a=process.platform==="win32",p=process.platform==="darwin",f=o,y=r,g=t,S=s,P=a?"toolbar":"panel";n=new T({width:f,height:y,x:g,y:S,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:b(),...p?{hiddenInMissionControl:!0}:{},type:P,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:m.join(__dirname,"preload.js"),devTools:!1},show:!0}),i?n.setIgnoreMouseEvents(!0):n.setIgnoreMouseEvents(!0,{forward:!0});const x=i?500:0;n.once("ready-to-show",()=>{setTimeout(()=>{n&&(n.show(),i?n.setAlwaysOnTop(!0,"screen-saver"):n.setAlwaysOnTop(!0,"pop-up-menu"),n.focus())},x)}),setTimeout(()=>{n&&!n.isVisible()&&(n.show(),n.focus())},5e3),n.on("closed",()=>{n=null});try{n.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!l.isPackaged||process.env.NODE_ENV==="development")n.loadURL("http://localhost:5173");else{const $=m.join(__dirname,"../renderer/main_window/index.html");n.loadFile($)}};l.whenReady().then(()=>{process.platform==="darwin"&&l.dock.hide(),k(),l.on("activate",()=>{T.getAllWindows().length===0&&k()});try{const e=b(),s=R.createFromPath(e).resize({width:16,height:16});h=new C(s);const o=N.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{n&&(n.isVisible()?n.hide():n.show())}},{type:"separator"},{label:"Quit",click:()=>{l.quit()}}]);h.setToolTip("Ripple"),h.setContextMenu(o)}catch(e){console.error("Failed to create tray:",e)}});u.handle("get-system-media",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?c(`osascript -e '
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
            '`,(o,r)=>{if(o)return e(null);const i=r.trim();if(!i||i==="None"||i==="Error")return e(null);const a=i.split("||");a.length>=4?e({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):e(null)}):t==="win32"?c(`powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Add-Type -AssemblyName System.Runtime.WindowsRuntime; $manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync().GetAwaiter().GetResult(); $session = $manager.GetCurrentSession(); if ($session) { $props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult(); $playback = $session.GetPlaybackInfo(); $status = $playback.PlaybackStatus; $thumbnail = $props.Thumbnail; $artwork = ''; if ($thumbnail) { try { $stream = $thumbnail.OpenReadAsync().GetAwaiter().GetResult(); $buffer = New-Object byte[] $stream.Size; $reader = New-Object Windows.Storage.Streams.DataReader $stream; $reader.LoadAsync($stream.Size).GetAwaiter().GetResult() | Out-Null; $reader.ReadBytes($buffer); $artwork = 'data:image/png;base64,' + [Convert]::ToBase64String($buffer); $reader.Close(); $stream.Close(); } catch { } } $info = @{ Title = $props.Title; Artist = $props.Artist; Album = $props.AlbumTitle; Status = $status.ToString().ToLower(); Source = $session.SourceAppUserModelId; Artwork = $artwork }; return $info | ConvertTo-Json -Compress; } return 'null';"`,{maxBuffer:5*1024*1024,encoding:"utf8"},(o,r)=>{if(o||!r||r.trim()==="null"||r.trim()==="'null'"){c(`powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,{encoding:"utf8"},(i,a)=>{var f;if(i||!a)return e(null);const p=(f=a.split(`
`).find(y=>y.includes("-")))==null?void 0:f.trim();if(p){const[y,...g]=p.split(" - "),S=g.join(" - ");e({name:S||p,artist:y||"Unknown",state:"playing",source:"Spotify"})}else e(null)});return}try{const i=JSON.parse(r);e({name:i.Title||"Unknown Title",artist:i.Artist||"Unknown Artist",album:i.Album||"",artwork_url:i.Artwork||null,state:i.Status==="playing"?"playing":"paused",source:i.Source||"System"})}catch{e(null)}}):t==="linux"?c('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(s,o)=>{if(s||!o)return e(null);const r=o.trim().split("||");e({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):e(null)}));u.handle("get-bluetooth-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?c("system_profiler SPBluetoothDataType -json",(s,o)=>{if(s)return e(!1);try{const i=JSON.parse(o).SPBluetoothDataType[0],a=i.device_connected&&i.device_connected.length>0;e(a)}catch{e(!1)}}):t==="win32"?c(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(o,r)=>{if(o)return e(!1);e(r.trim().toLowerCase()==="true")}):t==="linux"?c("bluetoothctl devices Connected",(s,o)=>{if(s)return e(!1);e(o.trim().length>0)}):e(!1)}));l.on("window-all-closed",()=>{process.platform==="linux"&&!h&&l.quit()});u.handle("control-system-media",async(e,t)=>{const s=process.platform;if(s==="darwin"){const o=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;c(`osascript -e '${o}'`)}else if(s==="linux"){let o=t;t==="playpause"&&(o="play-pause"),c(`playerctl ${o}`)}});
