"use strict";const{app:l,BrowserWindow:x,screen:w,ipcMain:p,shell:T,Tray:R,Menu:v,nativeImage:D}=require("electron"),m=require("node:path"),f=require("fs");process.platform==="linux"&&(l.commandLine.appendSwitch("enable-transparent-visuals"),l.commandLine.appendSwitch("disable-gpu-compositing"),l.disableHardwareAcceleration());let h=null,s=null;const{exec:c}=require("child_process");p.handle("set-ignore-mouse-events",(e,t,n)=>{s&&(s.setIgnoreMouseEvents(t,{forward:n||!1}),process.platform==="linux"&&s.setFocusable(!t))});p.handle("focus-window",()=>{s&&s.focus()});p.handle("open-external",async(e,t)=>{await T.openExternal(t)});p.handle("launch-app",async(e,t)=>{const n=process.platform;c(n==="darwin"?`open -a "${t}"`:n==="win32"?`start "" "${t}"`:t)});p.handle("get-displays",()=>w.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));p.handle("set-display",(e,t)=>{if(s){const i=w.getAllDisplays().find(d=>d.id.toString()===t.toString())||w.getPrimaryDisplay(),{x:a,y:o,width:r,height:u}=i.bounds,y=process.platform==="linux";s.setBounds({x:a,y:o,width:r,height:u}),y||s.setFullScreen(!0),s.show()}});p.handle("update-window-position",(e,t,n)=>{});p.handle("set-auto-launch",(e,t)=>{if(process.platform==="linux"){const n=m.join(l.getPath("home"),".config","autostart"),i=m.join(n,"ripple.desktop");try{if(t){f.existsSync(n)||f.mkdirSync(n,{recursive:!0});const a=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${l.getPath("exe")}"
Icon=${S()}
Terminal=false
`;f.writeFileSync(i,a)}else f.existsSync(i)&&f.unlinkSync(i)}catch(a){console.error("Failed to set auto-launch on Linux:",a)}}else if(process.platform==="win32")try{l.setLoginItemSettings({openAtLogin:t,path:l.getPath("exe")})}catch(n){console.error("Failed to set login item settings on Windows:",n)}});const S=()=>{const e="png";if(l.isPackaged){const t=m.join(process.resourcesPath,`icon.${e}`),n=m.join(process.resourcesPath,`assets/icons/icon.${e}`);return f.existsSync(t)?t:f.existsSync(n)?n:t}return m.join(__dirname,`../../src/assets/icons/icon.${e}`)},k=()=>{const e=w.getPrimaryDisplay(),{x:t,y:n,width:i,height:a}=e.bounds,o=process.platform==="linux",r=process.platform==="win32",u=process.platform==="darwin",y=i,d=a,g=t,A=n,b=r?void 0:"toolbar";s=new x({width:y,height:d,x:g,y:A,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...r?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:S(),...u?{hiddenInMissionControl:!0}:{},...b?{type:b}:{},fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:m.join(__dirname,"preload.js"),devTools:!1},show:!1}),o||s.setFullScreen(!0),o?(s.setIgnoreMouseEvents(!0,{forward:!0}),s.setFocusable(!1)):s.setIgnoreMouseEvents(!0,{forward:!0});const P=o?500:0;s.once("ready-to-show",()=>{setTimeout(()=>{s&&(s.show(),o&&s.setAlwaysOnTop(!0,"screen-saver"),s.focus())},P)}),setTimeout(()=>{s&&!s.isVisible()&&(s.show(),s.focus())},5e3),s.on("closed",()=>{s=null});try{s.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!l.isPackaged||process.env.NODE_ENV==="development")s.loadURL("http://localhost:5173");else{const $=m.join(__dirname,"../renderer/main_window/index.html");s.loadFile($)}};l.whenReady().then(()=>{process.platform==="darwin"&&l.dock.hide(),k(),l.on("activate",()=>{x.getAllWindows().length===0&&k()});try{const e=S(),n=D.createFromPath(e).resize({width:16,height:16});h=new R(n);const i=v.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{s&&(s.isVisible()?s.hide():s.show())}},{type:"separator"},{label:"Quit",click:()=>{l.quit()}}]);h.setToolTip("Ripple"),h.setContextMenu(i)}catch(e){console.error("Failed to create tray:",e)}});p.handle("get-system-media",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?c(`osascript -e '
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
            '`,(i,a)=>{if(i)return e(null);const o=a.trim();if(!o||o==="None"||o==="Error")return e(null);const r=o.split("||");r.length>=4?e({name:r[2],artist:r[3],album:r[4],artwork_url:r[5]||null,state:r[1]==="playing"?"playing":"paused",source:r[0]}):e(null)}):t==="win32"?c(`powershell -Command "${`
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync().GetAwaiter().GetResult()
        $session = $manager.GetCurrentSession()
        if ($session) {
            $props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
            $playback = $session.GetPlaybackInfo()
            $status = $playback.PlaybackStatus
            $info = @{
                Title = $props.Title
                Artist = $props.Artist
                Album = $props.AlbumTitle
                Status = $status.ToString().ToLower()
                Source = $session.SourceAppId
            }
            return $info | ConvertTo-Json
        }
        return "null"
      `.replace(/"/g,'\\"')}"`,(i,a)=>{if(i||!a||a.trim()==="null"){c(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(o,r)=>{var y;if(o||!r)return e(null);const u=(y=r.split(`
`).find(d=>d.includes("-")))==null?void 0:y.trim();if(u){const[d,g]=u.split(" - ");e({name:g||u,artist:d||"Unknown",state:"playing",source:"Spotify"})}else e(null)});return}try{const o=JSON.parse(a);e({name:o.Title||"Unknown Title",artist:o.Artist||"Unknown Artist",album:o.Album||"",state:o.Status==="playing"?"playing":"paused",source:o.Source||"System"})}catch{e(null)}}):t==="linux"?c('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(n,i)=>{if(n||!i)return e(null);const a=i.trim().split("||");e({name:a[0],artist:a[1],album:a[2],state:a[3].toLowerCase(),source:"System"})}):e(null)}));p.handle("get-bluetooth-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?c("system_profiler SPBluetoothDataType -json",(n,i)=>{if(n)return e(!1);try{const o=JSON.parse(i).SPBluetoothDataType[0],r=o.device_connected&&o.device_connected.length>0;e(r)}catch{e(!1)}}):t==="win32"?c(`powershell -Command "${`
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $devices = [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType = WindowsRuntime]::FindAllAsync('(System.Devices.Aep.ProtocolId:="{e0cbf06c-5021-4943-9112-460f89956c33}") AND (System.Devices.Aep.IsConnected:=$true)').GetAwaiter().GetResult()
        return $devices.Count > 0
      `.replace(/"/g,'\\"')}"`,(i,a)=>{if(i)return e(!1);e(a.trim().toLowerCase()==="true")}):t==="linux"?c("bluetoothctl devices Connected",(n,i)=>{if(n)return e(!1);e(i.trim().length>0)}):e(!1)}));l.on("window-all-closed",()=>{process.platform==="linux"&&!h&&l.quit()});p.handle("control-system-media",async(e,t)=>{const n=process.platform;if(n==="darwin"){const i=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;c(`osascript -e '${i}'`)}else if(n==="linux"){let i=t;t==="playpause"&&(i="play-pause"),c(`playerctl ${i}`)}});
