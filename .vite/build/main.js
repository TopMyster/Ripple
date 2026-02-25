"use strict";const{app:l,BrowserWindow:A,screen:w,ipcMain:p,shell:T,Tray:R,Menu:D,nativeImage:N}=require("electron"),f=require("node:path"),m=require("fs");process.platform==="linux"&&(l.commandLine.appendSwitch("enable-transparent-visuals"),l.commandLine.appendSwitch("disable-gpu-compositing"),l.disableHardwareAcceleration());let h=null,i=null;const{exec:c}=require("child_process");p.handle("set-ignore-mouse-events",(e,t,s)=>{i&&i.setIgnoreMouseEvents(t,{forward:s||!1})});p.handle("open-external",async(e,t)=>{await T.openExternal(t)});p.handle("launch-app",async(e,t)=>{const s=process.platform;c(s==="darwin"?`open -a "${t}"`:s==="win32"?`start "" "${t}"`:t)});p.handle("get-displays",()=>w.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));p.handle("set-display",(e,t)=>{if(i){const n=w.getAllDisplays().find(d=>d.id.toString()===t.toString())||w.getPrimaryDisplay(),{x:o,y:a,width:r,height:u}=n.bounds,y=process.platform==="linux";i.setBounds({x:o,y:a,width:r,height:u}),y||i.setFullScreen(!0),i.show()}});p.handle("update-window-position",(e,t,s)=>{});p.handle("set-auto-launch",(e,t)=>{if(process.platform==="linux"){const s=f.join(l.getPath("home"),".config","autostart"),n=f.join(s,"ripple.desktop");try{if(t){m.existsSync(s)||m.mkdirSync(s,{recursive:!0});const o=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${l.getPath("exe")}"
Icon=${S()}
Terminal=false
`;m.writeFileSync(n,o)}else m.existsSync(n)&&m.unlinkSync(n)}catch(o){console.error("Failed to set auto-launch on Linux:",o)}}else l.setLoginItemSettings({openAtLogin:t,path:l.getPath("exe")})});const S=()=>{const e="png";if(l.isPackaged){const t=f.join(process.resourcesPath,`icon.${e}`),s=f.join(process.resourcesPath,`assets/icons/icon.${e}`);return m.existsSync(t)?t:m.existsSync(s)?s:t}return f.join(__dirname,`../../src/assets/icons/icon.${e}`)},k=()=>{const e=w.getPrimaryDisplay(),{x:t,y:s,width:n,height:o}=e.bounds,a=process.platform==="linux",r=process.platform==="win32",u=process.platform==="darwin",y=n,d=o,g=t,x=s,b=r?void 0:"toolbar";i=new A({width:y,height:d,x:g,y:x,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...r?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:S(),...u?{hiddenInMissionControl:!0}:{},...b?{type:b}:{},fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:f.join(__dirname,"preload.js"),devTools:!1},show:!1}),a||i.setFullScreen(!0),i.setIgnoreMouseEvents(!0,{forward:!0});const P=a?500:0;i.once("ready-to-show",()=>{setTimeout(()=>{i&&(i.show(),a&&i.setAlwaysOnTop(!0,"screen-saver"),i.focus())},P)}),setTimeout(()=>{i&&!i.isVisible()&&(i.show(),i.focus())},5e3),i.on("closed",()=>{i=null});try{i.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!l.isPackaged||process.env.NODE_ENV==="development")i.loadURL("http://localhost:5173");else{const $=f.join(__dirname,"../renderer/main_window/index.html");i.loadFile($)}};l.whenReady().then(()=>{process.platform==="darwin"&&l.dock.hide(),k(),l.on("activate",()=>{A.getAllWindows().length===0&&k()});try{const e=S(),s=N.createFromPath(e).resize({width:16,height:16});h=new R(s);const n=D.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{i&&(i.isVisible()?i.hide():i.show())}},{type:"separator"},{label:"Quit",click:()=>{l.quit()}}]);h.setToolTip("Ripple"),h.setContextMenu(n)}catch(e){console.error("Failed to create tray:",e)}});p.handle("get-system-media",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?c(`osascript -e '
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
            '`,(n,o)=>{if(n)return e(null);const a=o.trim();if(!a||a==="None"||a==="Error")return e(null);const r=a.split("||");r.length>=4?e({name:r[2],artist:r[3],album:r[4],artwork_url:r[5]||null,state:r[1]==="playing"?"playing":"paused",source:r[0]}):e(null)}):t==="win32"?c(`powershell -Command "${`
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
      `.replace(/"/g,'\\"')}"`,(n,o)=>{if(n||!o||o.trim()==="null"){c(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(a,r)=>{var y;if(a||!r)return e(null);const u=(y=r.split(`
`).find(d=>d.includes("-")))==null?void 0:y.trim();if(u){const[d,g]=u.split(" - ");e({name:g||u,artist:d||"Unknown",state:"playing",source:"Spotify"})}else e(null)});return}try{const a=JSON.parse(o);e({name:a.Title||"Unknown Title",artist:a.Artist||"Unknown Artist",album:a.Album||"",state:a.Status==="playing"?"playing":"paused",source:a.Source||"System"})}catch{e(null)}}):t==="linux"?c('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(s,n)=>{if(s||!n)return e(null);const o=n.trim().split("||");e({name:o[0],artist:o[1],album:o[2],state:o[3].toLowerCase(),source:"System"})}):e(null)}));p.handle("get-bluetooth-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?c("system_profiler SPBluetoothDataType -json",(s,n)=>{if(s)return e(!1);try{const a=JSON.parse(n).SPBluetoothDataType[0],r=a.device_connected&&a.device_connected.length>0;e(r)}catch{e(!1)}}):t==="win32"?c(`powershell -Command "${`
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $devices = [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType = WindowsRuntime]::FindAllAsync('(System.Devices.Aep.ProtocolId:="{e0cbf06c-5021-4943-9112-460f89956c33}") AND (System.Devices.Aep.IsConnected:=$true)').GetAwaiter().GetResult()
        return $devices.Count > 0
      `.replace(/"/g,'\\"')}"`,(n,o)=>{if(n)return e(!1);e(o.trim().toLowerCase()==="true")}):t==="linux"?c("bluetoothctl devices Connected",(s,n)=>{if(s)return e(!1);e(n.trim().length>0)}):e(!1)}));l.on("window-all-closed",()=>{process.platform==="linux"&&!h&&l.quit()});p.handle("control-system-media",async(e,t)=>{const s=process.platform;if(s==="darwin"){const n=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;c(`osascript -e '${n}'`)}else if(s==="linux"){let n=t;t==="playpause"&&(n="play-pause"),c(`playerctl ${n}`)}});
