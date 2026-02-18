"use strict";const{app:c,BrowserWindow:S,screen:y,ipcMain:u,shell:k,Tray:A,Menu:T,nativeImage:P}=require("electron"),d=require("node:path"),w=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.disableHardwareAcceleration());let f=null,s=null;const{exec:l}=require("child_process");u.handle("set-ignore-mouse-events",(e,t,n)=>{s&&s.setIgnoreMouseEvents(t,{forward:n||!1})});u.handle("open-external",async(e,t)=>{await k.openExternal(t)});u.handle("launch-app",async(e,t)=>{const n=process.platform;l(n==="darwin"?`open -a "${t}"`:n==="win32"?`start "" "${t}"`:t)});u.handle("get-displays",()=>y.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));u.handle("set-display",(e,t)=>{if(s){const i=y.getAllDisplays().find(m=>m.id.toString()===t.toString())||y.getPrimaryDisplay(),{x:r,y:a,width:o,height:p}=i.bounds;s.setFullScreen(!1),s.setBounds({x:r,y:a,width:o,height:p}),process.platform!=="linux"&&s.setFullScreen(!0),s.show()}});const b=()=>{const e="png";if(c.isPackaged){const t=d.join(process.resourcesPath,`icon.${e}`),n=d.join(process.resourcesPath,`assets/icons/icon.${e}`);return w.existsSync(t)?t:w.existsSync(n)?n:t}return d.join(__dirname,`../../src/assets/icons/icon.${e}`)},g=()=>{const e=y.getPrimaryDisplay(),{width:t,height:n}=e.size;s=new S({width:t,height:n,x:0,y:0,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,icon:b(),hiddenInMissionControl:!0,type:"toolbar",fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:d.join(__dirname,"preload.js"),devTools:!1},show:!1}),process.platform!=="linux"&&s.setFullScreen(!0),s.setIgnoreMouseEvents(!0,{forward:!0});const i=process.platform==="linux"?300:0;s.once("ready-to-show",()=>{setTimeout(()=>{s&&(s.show(),s.focus())},i)}),setTimeout(()=>{s&&!s.isVisible()&&(s.show(),s.focus())},5e3),s.on("closed",()=>{s=null});try{s.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")s.loadURL("http://localhost:5173");else{const r=d.join(__dirname,"../renderer/main_window/index.html");s.loadFile(r)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),g(),c.on("activate",()=>{S.getAllWindows().length===0&&g()});try{const e=b(),n=P.createFromPath(e).resize({width:16,height:16});f=new A(n);const i=T.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{s&&(s.isVisible()?s.hide():s.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);f.setToolTip("Ripple"),f.setContextMenu(i)}catch(e){console.error("Failed to create tray:",e)}});u.handle("get-system-media",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l(`osascript -e '
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
            '`,(i,r)=>{if(i)return e(null);const a=r.trim();if(!a||a==="None"||a==="Error")return e(null);const o=a.split("||");o.length>=4?e({name:o[2],artist:o[3],album:o[4],artwork_url:o[5]||null,state:o[1]==="playing"?"playing":"paused",source:o[0]}):e(null)}):t==="win32"?l(`powershell -Command "${`
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
      `.replace(/"/g,'\\"')}"`,(i,r)=>{if(i||!r||r.trim()==="null"){l(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(a,o)=>{var m;if(a||!o)return e(null);const p=(m=o.split(`
`).find(h=>h.includes("-")))==null?void 0:m.trim();if(p){const[h,$]=p.split(" - ");e({name:$||p,artist:h||"Unknown",state:"playing",source:"Spotify"})}else e(null)});return}try{const a=JSON.parse(r);e({name:a.Title||"Unknown Title",artist:a.Artist||"Unknown Artist",album:a.Album||"",state:a.Status==="playing"?"playing":"paused",source:a.Source||"System"})}catch{e(null)}}):t==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(n,i)=>{if(n||!i)return e(null);const r=i.trim().split("||");e({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):e(null)}));u.handle("get-bluetooth-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l("system_profiler SPBluetoothDataType -json",(n,i)=>{if(n)return e(!1);try{const a=JSON.parse(i).SPBluetoothDataType[0],o=a.device_connected&&a.device_connected.length>0;e(o)}catch{e(!1)}}):t==="win32"?l(`powershell -Command "${`
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $devices = [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType = WindowsRuntime]::FindAllAsync('(System.Devices.Aep.ProtocolId:="{e0cbf06c-5021-4943-9112-460f89956c33}") AND (System.Devices.Aep.IsConnected:=$true)').GetAwaiter().GetResult()
        return $devices.Count > 0
      `.replace(/"/g,'\\"')}"`,(i,r)=>{if(i)return e(!1);e(r.trim().toLowerCase()==="true")}):t==="linux"?l("bluetoothctl devices Connected",(n,i)=>{if(n)return e(!1);e(i.trim().length>0)}):e(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!f&&c.quit()});u.handle("control-system-media",async(e,t)=>{const n=process.platform;if(n==="darwin"){const i=`
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
