"use strict";const{app:l,BrowserWindow:g,screen:$,ipcMain:m,shell:N,Tray:k,Menu:T,nativeImage:A}=require("electron"),u=require("node:path"),h=require("fs");process.platform==="linux"&&(l.commandLine.appendSwitch("enable-transparent-visuals"),l.disableHardwareAcceleration());let p=null,t=null;const{exec:c}=require("child_process");m.handle("set-ignore-mouse-events",(e,s,r)=>{t&&t.setIgnoreMouseEvents(s,{forward:r||!1})});const S=()=>{const e="png";if(l.isPackaged){const s=u.join(process.resourcesPath,`icon.${e}`),r=u.join(process.resourcesPath,`assets/icons/icon.${e}`);return h.existsSync(s)?s:h.existsSync(r)?r:s}return u.join(__dirname,`../../src/assets/icons/icon.${e}`)},w=()=>{const e=$.getPrimaryDisplay(),{width:s,height:r}=e.size;t=new g({width:s,height:r,x:0,y:0,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,icon:S(),hiddenInMissionControl:!0,type:"toolbar",fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:u.join(__dirname,"preload.js"),devTools:!1},show:!1}),process.platform!=="linux"&&t.setFullScreen(!0),t.setIgnoreMouseEvents(!0,{forward:!0});const n=process.platform==="linux"?300:0;t.once("ready-to-show",()=>{setTimeout(()=>{t&&(t.show(),t.focus())},n)}),setTimeout(()=>{t&&!t.isVisible()&&(t.show(),t.focus())},5e3),t.on("closed",()=>{t=null});try{t.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!l.isPackaged||process.env.NODE_ENV==="development")t.loadURL("http://localhost:5173");else{const i=u.join(__dirname,"../renderer/main_window/index.html");t.loadFile(i)}};l.whenReady().then(()=>{process.platform==="darwin"&&l.dock.hide(),w(),l.on("activate",()=>{g.getAllWindows().length===0&&w()});try{const e=S(),r=A.createFromPath(e).resize({width:16,height:16});p=new k(r);const n=T.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{t&&(t.isVisible()?t.hide():t.show())}},{type:"separator"},{label:"Quit",click:()=>{l.quit()}}]);p.setToolTip("Ripple"),p.setContextMenu(n)}catch(e){console.error("Failed to create tray:",e)}});m.handle("get-system-media",async()=>new Promise(e=>{const s=process.platform;s==="darwin"?c(`osascript -e '
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
            '`,(n,i)=>{if(n)return e(null);const a=i.trim();if(!a||a==="None"||a==="Error")return e(null);const o=a.split("||");o.length>=4?e({name:o[2],artist:o[3],album:o[4],artwork_url:o[5]||null,state:o[1]==="playing"?"playing":"paused",source:o[0]}):e(null)}):s==="win32"?c(`powershell -Command "${`
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
      `.replace(/"/g,'\\"')}"`,(n,i)=>{if(n||!i||i.trim()==="null"){c(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(a,o)=>{var y;if(a||!o)return e(null);const f=(y=o.split(`
`).find(d=>d.includes("-")))==null?void 0:y.trim();if(f){const[d,b]=f.split(" - ");e({name:b||f,artist:d||"Unknown",state:"playing",source:"Spotify"})}else e(null)});return}try{const a=JSON.parse(i);e({name:a.Title||"Unknown Title",artist:a.Artist||"Unknown Artist",album:a.Album||"",state:a.Status==="playing"?"playing":"paused",source:a.Source||"System"})}catch{e(null)}}):s==="linux"?c('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(r,n)=>{if(r||!n)return e(null);const i=n.trim().split("||");e({name:i[0],artist:i[1],album:i[2],state:i[3].toLowerCase(),source:"System"})}):e(null)}));m.handle("get-bluetooth-status",async()=>new Promise(e=>{const s=process.platform;s==="darwin"?c("system_profiler SPBluetoothDataType -json",(r,n)=>{if(r)return e(!1);try{const a=JSON.parse(n).SPBluetoothDataType[0],o=a.device_connected&&a.device_connected.length>0;e(o)}catch{e(!1)}}):s==="win32"?c(`powershell -Command "${`
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $devices = [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType = WindowsRuntime]::FindAllAsync('(System.Devices.Aep.ProtocolId:="{e0cbf06c-5021-4943-9112-460f89956c33}") AND (System.Devices.Aep.IsConnected:=$true)').GetAwaiter().GetResult()
        return $devices.Count > 0
      `.replace(/"/g,'\\"')}"`,(n,i)=>{if(n)return e(!1);e(i.trim().toLowerCase()==="true")}):s==="linux"?c("bluetoothctl devices Connected",(r,n)=>{if(r)return e(!1);e(n.trim().length>0)}):e(!1)}));l.on("window-all-closed",()=>{process.platform==="linux"&&!p&&l.quit()});m.handle("control-system-media",async(e,s)=>{const r=process.platform;if(r==="darwin"){const n=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${s} track
        else if musicRunning then
            tell application "Music" to ${s} track
        end if
        `;c(`osascript -e '${n}'`)}else if(r==="linux"){let n=s;s==="playpause"&&(n="play-pause"),c(`playerctl ${n}`)}});
