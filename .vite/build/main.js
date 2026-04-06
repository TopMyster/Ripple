"use strict";const{app:l,BrowserWindow:A,screen:h,ipcMain:u,shell:P,Tray:R,Menu:C,nativeImage:N}=require("electron"),m=require("node:path"),d=require("fs");process.platform==="linux"&&(l.commandLine.appendSwitch("enable-transparent-visuals"),l.commandLine.appendSwitch("disable-gpu-compositing"),l.disableHardwareAcceleration());let w=null,n=null;const{exec:c}=require("child_process");u.handle("set-ignore-mouse-events",(e,t,s)=>{n&&(process.platform!=="linux"?n.setIgnoreMouseEvents(t,{forward:s||!1}):n.setIgnoreMouseEvents(t))});u.handle("focus-window",()=>{n&&n.focus()});u.handle("open-external",async(e,t)=>{await P.openExternal(t)});u.handle("launch-app",async(e,t)=>{const s=process.platform;c(s==="darwin"?`open -a "${t}"`:s==="win32"?`start "" "${t}"`:t)});u.handle("get-displays",()=>h.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));u.handle("set-display",(e,t)=>{if(n){const i=h.getAllDisplays().find(f=>f.id.toString()===t.toString())||h.getPrimaryDisplay(),{x:o,y:r,width:a,height:p}=i.bounds;process.platform,n.setBounds({x:o,y:r,width:a,height:p}),n.show()}});u.handle("update-window-position",(e,t,s)=>{});u.handle("set-auto-launch",(e,t)=>{if(process.platform==="linux"){const s=m.join(l.getPath("home"),".config","autostart"),i=m.join(s,"ripple.desktop");try{if(t){d.existsSync(s)||d.mkdirSync(s,{recursive:!0});const o=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${l.getPath("exe")}"
Icon=${b()}
Terminal=false
`;d.writeFileSync(i,o)}else d.existsSync(i)&&d.unlinkSync(i)}catch(o){console.error("Failed to set auto-launch on Linux:",o)}}else if(process.platform==="win32")try{l.setLoginItemSettings({openAtLogin:t,path:l.getPath("exe")})}catch(s){console.error("Failed to set login item settings on Windows:",s)}});const b=()=>{const e="png";if(l.isPackaged){const t=m.join(process.resourcesPath,`icon.${e}`),s=m.join(process.resourcesPath,`assets/icons/icon.${e}`);return d.existsSync(t)?t:d.existsSync(s)?s:t}return m.join(__dirname,`../../src/assets/icons/icon.${e}`)},k=()=>{const e=h.getPrimaryDisplay(),{x:t,y:s,width:i,height:o}=e.bounds,r=process.platform==="linux",a=process.platform==="win32",p=process.platform==="darwin",f=i,y=o,g=t,S=s,T=a?"toolbar":"panel";n=new A({width:f,height:y,x:g,y:S,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:b(),...p?{hiddenInMissionControl:!0}:{},type:T,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:m.join(__dirname,"preload.js"),devTools:!1},show:!0}),r?n.setIgnoreMouseEvents(!0):n.setIgnoreMouseEvents(!0,{forward:!0});const x=r?500:0;n.once("ready-to-show",()=>{setTimeout(()=>{n&&(n.show(),r?n.setAlwaysOnTop(!0,"screen-saver"):n.setAlwaysOnTop(!0,"pop-up-menu"),n.focus())},x)}),setTimeout(()=>{n&&!n.isVisible()&&(n.show(),n.focus())},5e3),n.on("closed",()=>{n=null});try{n.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!l.isPackaged||process.env.NODE_ENV==="development")n.loadURL("http://localhost:5173");else{const $=m.join(__dirname,"../renderer/main_window/index.html");n.loadFile($)}};l.whenReady().then(()=>{process.platform==="darwin"&&l.dock.hide(),k(),l.on("activate",()=>{A.getAllWindows().length===0&&k()});try{const e=b(),s=N.createFromPath(e).resize({width:16,height:16});w=new R(s);const i=C.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{n&&(n.isVisible()?n.hide():n.show())}},{type:"separator"},{label:"Quit",click:()=>{l.quit()}}]);w.setToolTip("Ripple"),w.setContextMenu(i)}catch(e){console.error("Failed to create tray:",e)}});u.handle("get-system-media",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?c(`osascript -e '
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
            '`,(i,o)=>{if(i)return e(null);const r=o.trim();if(!r||r==="None"||r==="Error")return e(null);const a=r.split("||");a.length>=4?e({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):e(null)}):t==="win32"?c(`powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Add-Type -AssemblyName System.Runtime.WindowsRuntime; $manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync().GetAwaiter().GetResult(); $session = $manager.GetCurrentSession(); if ($session) { $props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult(); $playback = $session.GetPlaybackInfo(); $status = $playback.PlaybackStatus; $thumbnail = $props.Thumbnail; $artwork = ''; if ($thumbnail) { try { $stream = $thumbnail.OpenReadAsync().GetAwaiter().GetResult(); $buffer = New-Object byte[] $stream.Size; $reader = New-Object Windows.Storage.Streams.DataReader $stream; $reader.LoadAsync($stream.Size).GetAwaiter().GetResult() | Out-Null; $reader.ReadBytes($buffer); $artwork = 'data:image/png;base64,' + [Convert]::ToBase64String($buffer); $reader.Close(); $stream.Close(); } catch { } } $info = @{ Title = $props.Title; Artist = $props.Artist; Album = $props.AlbumTitle; Status = $status.ToString().ToLower(); Source = $session.SourceAppUserModelId; Artwork = $artwork }; return $info | ConvertTo-Json -Compress; } return 'null';"`,{maxBuffer:5*1024*1024,encoding:"utf8"},(i,o)=>{if(i||!o||o.trim()==="null"||o.trim()==="'null'"){c(`powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,{encoding:"utf8"},(r,a)=>{var f;if(r||!a)return e(null);const p=(f=a.split(`
`).find(y=>y.includes("-")))==null?void 0:f.trim();if(p){const[y,...g]=p.split(" - "),S=g.join(" - ");e({name:S||p,artist:y||"Unknown",state:"playing",source:"Spotify"})}else e(null)});return}try{const r=JSON.parse(o);e({name:r.Title||"Unknown Title",artist:r.Artist||"Unknown Artist",album:r.Album||"",artwork_url:r.Artwork||null,state:r.Status==="playing"?"playing":"paused",source:r.Source||"System"})}catch{e(null)}}):t==="linux"?c('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(s,i)=>{if(s||!i)return e(null);const o=i.trim().split("||");e({name:o[0],artist:o[1],album:o[2],state:o[3].toLowerCase(),source:"System"})}):e(null)}));u.handle("get-bluetooth-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?c("system_profiler SPBluetoothDataType -json",(s,i)=>{if(s)return e(!1);try{const r=JSON.parse(i).SPBluetoothDataType[0],a=r.device_connected&&r.device_connected.length>0;e(a)}catch{e(!1)}}):t==="win32"?c(`powershell -Command "${`
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $devices = [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType = WindowsRuntime]::FindAllAsync('(System.Devices.Aep.ProtocolId:="{e0cbf06c-5021-4943-9112-460f89956c33}") AND (System.Devices.Aep.IsConnected:=$true)').GetAwaiter().GetResult()
        return $devices.Count > 0
      `.replace(/"/g,'\\"')}"`,(i,o)=>{if(i)return e(!1);e(o.trim().toLowerCase()==="true")}):t==="linux"?c("bluetoothctl devices Connected",(s,i)=>{if(s)return e(!1);e(i.trim().length>0)}):e(!1)}));l.on("window-all-closed",()=>{process.platform==="linux"&&!w&&l.quit()});u.handle("control-system-media",async(e,t)=>{const s=process.platform;if(s==="darwin"){const i=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;c(`osascript -e '${i}'`)}else if(s==="linux"){let i=t;t==="playpause"&&(i="play-pause"),c(`playerctl ${i}`)}});
