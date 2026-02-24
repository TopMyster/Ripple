"use strict";const{app:c,BrowserWindow:k,screen:w,ipcMain:u,shell:x,Tray:R,Menu:N,nativeImage:D}=require("electron"),f=require("node:path"),b=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.commandLine.appendSwitch("disable-gpu-compositing"),c.disableHardwareAcceleration());let y=null,s=null;const{exec:l}=require("child_process");u.handle("set-ignore-mouse-events",(e,t,n)=>{s&&s.setIgnoreMouseEvents(t,{forward:n||!1})});u.handle("open-external",async(e,t)=>{await x.openExternal(t)});u.handle("launch-app",async(e,t)=>{const n=process.platform;l(n==="darwin"?`open -a "${t}"`:n==="win32"?`start "" "${t}"`:t)});u.handle("get-displays",()=>w.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));u.handle("set-display",(e,t)=>{if(s){const i=w.getAllDisplays().find(d=>d.id.toString()===t.toString())||w.getPrimaryDisplay(),{x:a,y:r,width:o,height:p}=i.bounds,m=process.platform==="linux";s.setBounds({x:a,y:r,width:o,height:p}),m||s.setFullScreen(!0),s.show()}});u.handle("update-window-position",(e,t,n)=>{});const A=()=>{const e="png";if(c.isPackaged){const t=f.join(process.resourcesPath,`icon.${e}`),n=f.join(process.resourcesPath,`assets/icons/icon.${e}`);return b.existsSync(t)?t:b.existsSync(n)?n:t}return f.join(__dirname,`../../src/assets/icons/icon.${e}`)},$=()=>{const e=w.getPrimaryDisplay(),{x:t,y:n,width:i,height:a}=e.bounds,r=process.platform==="linux",o=process.platform==="win32",p=process.platform==="darwin",m=i,d=a,h=t,T=n,g=o?void 0:"toolbar";s=new k({width:m,height:d,x:h,y:T,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...o?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:A(),...p?{hiddenInMissionControl:!0}:{},...g?{type:g}:{},fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:f.join(__dirname,"preload.js"),devTools:!1},show:!1}),r||s.setFullScreen(!0),s.setIgnoreMouseEvents(!0,{forward:!0});const P=r?500:0;s.once("ready-to-show",()=>{setTimeout(()=>{s&&(s.show(),r&&s.setAlwaysOnTop(!0,"screen-saver"),s.focus())},P)}),setTimeout(()=>{s&&!s.isVisible()&&(s.show(),s.focus())},5e3),s.on("closed",()=>{s=null});try{s.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")s.loadURL("http://localhost:5173");else{const S=f.join(__dirname,"../renderer/main_window/index.html");s.loadFile(S)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),$(),c.on("activate",()=>{k.getAllWindows().length===0&&$()});try{const e=A(),n=D.createFromPath(e).resize({width:16,height:16});y=new R(n);const i=N.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{s&&(s.isVisible()?s.hide():s.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);y.setToolTip("Ripple"),y.setContextMenu(i)}catch(e){console.error("Failed to create tray:",e)}});u.handle("get-system-media",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l(`osascript -e '
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
            '`,(i,a)=>{if(i)return e(null);const r=a.trim();if(!r||r==="None"||r==="Error")return e(null);const o=r.split("||");o.length>=4?e({name:o[2],artist:o[3],album:o[4],artwork_url:o[5]||null,state:o[1]==="playing"?"playing":"paused",source:o[0]}):e(null)}):t==="win32"?l(`powershell -Command "${`
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
      `.replace(/"/g,'\\"')}"`,(i,a)=>{if(i||!a||a.trim()==="null"){l(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(r,o)=>{var m;if(r||!o)return e(null);const p=(m=o.split(`
`).find(d=>d.includes("-")))==null?void 0:m.trim();if(p){const[d,h]=p.split(" - ");e({name:h||p,artist:d||"Unknown",state:"playing",source:"Spotify"})}else e(null)});return}try{const r=JSON.parse(a);e({name:r.Title||"Unknown Title",artist:r.Artist||"Unknown Artist",album:r.Album||"",state:r.Status==="playing"?"playing":"paused",source:r.Source||"System"})}catch{e(null)}}):t==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(n,i)=>{if(n||!i)return e(null);const a=i.trim().split("||");e({name:a[0],artist:a[1],album:a[2],state:a[3].toLowerCase(),source:"System"})}):e(null)}));u.handle("get-bluetooth-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l("system_profiler SPBluetoothDataType -json",(n,i)=>{if(n)return e(!1);try{const r=JSON.parse(i).SPBluetoothDataType[0],o=r.device_connected&&r.device_connected.length>0;e(o)}catch{e(!1)}}):t==="win32"?l(`powershell -Command "${`
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $devices = [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType = WindowsRuntime]::FindAllAsync('(System.Devices.Aep.ProtocolId:="{e0cbf06c-5021-4943-9112-460f89956c33}") AND (System.Devices.Aep.IsConnected:=$true)').GetAwaiter().GetResult()
        return $devices.Count > 0
      `.replace(/"/g,'\\"')}"`,(i,a)=>{if(i)return e(!1);e(a.trim().toLowerCase()==="true")}):t==="linux"?l("bluetoothctl devices Connected",(n,i)=>{if(n)return e(!1);e(i.trim().length>0)}):e(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!y&&c.quit()});u.handle("control-system-media",async(e,t)=>{const n=process.platform;if(n==="darwin"){const i=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;l(`osascript -e '${i}'`)}else if(n==="linux"){let i=t;t==="playpause"&&(i="play-pause"),l(`playerctl ${i}`)}});
