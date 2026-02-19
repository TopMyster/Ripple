"use strict";const{app:p,BrowserWindow:$,screen:w,ipcMain:d,shell:T,Tray:x,Menu:P,nativeImage:M}=require("electron"),h=require("node:path"),S=require("fs");process.platform==="linux"&&p.commandLine.appendSwitch("enable-transparent-visuals");let g=null,n=null;const{exec:l}=require("child_process");d.handle("set-ignore-mouse-events",(e,t,i)=>{n&&n.setIgnoreMouseEvents(t,{forward:i||!1})});d.handle("open-external",async(e,t)=>{await T.openExternal(t)});d.handle("launch-app",async(e,t)=>{const i=process.platform;l(i==="darwin"?`open -a "${t}"`:i==="win32"?`start "" "${t}"`:t)});d.handle("get-displays",()=>w.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));d.handle("set-display",(e,t)=>{if(n){const o=w.getAllDisplays().find(c=>c.id.toString()===t.toString())||w.getPrimaryDisplay(),{x:r,y:s,width:a,height:m}=o.bounds,u=process.platform==="linux";if(n.setFullScreen(!1),u){const y=r+Math.floor((a-500)/2),A=s;n.setBounds({x:y,y:A,width:500,height:400})}else n.setBounds({x:r,y:s,width:a,height:m}),n.setFullScreen(!0);n.show()}});d.handle("update-window-position",(e,t,i)=>{if(n&&process.platform==="linux"){const o=w.getDisplayMatching(n.getBounds()),{x:r,y:s,width:a,height:m}=o.bounds,u=500,c=400,f=r+Math.round(a*(t/100)-u/2),y=s+i;n.setBounds({x:f,y,width:u,height:c})}});const k=()=>{const e="png";if(p.isPackaged){const t=h.join(process.resourcesPath,`icon.${e}`),i=h.join(process.resourcesPath,`assets/icons/icon.${e}`);return S.existsSync(t)?t:S.existsSync(i)?i:t}return h.join(__dirname,`../../src/assets/icons/icon.${e}`)},b=()=>{const e=w.getPrimaryDisplay(),{x:t,y:i,width:o,height:r}=e.bounds,s=process.platform==="linux",a=s?500:o,m=s?400:r,u=s?t+Math.floor((o-a)/2):t,c=i;n=new $({width:a,height:m,x:u,y:c,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,icon:k(),hiddenInMissionControl:!0,type:s?"dock":"toolbar",fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:h.join(__dirname,"preload.js"),devTools:!1},show:!1}),s||n.setFullScreen(!0),n.setIgnoreMouseEvents(!0,{forward:!0});const f=s?500:0;n.once("ready-to-show",()=>{setTimeout(()=>{n&&(n.show(),n.focus())},f)}),setTimeout(()=>{n&&!n.isVisible()&&(n.show(),n.focus())},5e3),n.on("closed",()=>{n=null});try{n.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!p.isPackaged||process.env.NODE_ENV==="development")n.loadURL("http://localhost:5173");else{const y=h.join(__dirname,"../renderer/main_window/index.html");n.loadFile(y)}};p.whenReady().then(()=>{process.platform==="darwin"&&p.dock.hide(),b(),p.on("activate",()=>{$.getAllWindows().length===0&&b()});try{const e=k(),i=M.createFromPath(e).resize({width:16,height:16});g=new x(i);const o=P.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{n&&(n.isVisible()?n.hide():n.show())}},{type:"separator"},{label:"Quit",click:()=>{p.quit()}}]);g.setToolTip("Ripple"),g.setContextMenu(o)}catch(e){console.error("Failed to create tray:",e)}});d.handle("get-system-media",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l(`osascript -e '
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
            '`,(o,r)=>{if(o)return e(null);const s=r.trim();if(!s||s==="None"||s==="Error")return e(null);const a=s.split("||");a.length>=4?e({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):e(null)}):t==="win32"?l(`powershell -Command "${`
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
      `.replace(/"/g,'\\"')}"`,(o,r)=>{if(o||!r||r.trim()==="null"){l(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(s,a)=>{var u;if(s||!a)return e(null);const m=(u=a.split(`
`).find(c=>c.includes("-")))==null?void 0:u.trim();if(m){const[c,f]=m.split(" - ");e({name:f||m,artist:c||"Unknown",state:"playing",source:"Spotify"})}else e(null)});return}try{const s=JSON.parse(r);e({name:s.Title||"Unknown Title",artist:s.Artist||"Unknown Artist",album:s.Album||"",state:s.Status==="playing"?"playing":"paused",source:s.Source||"System"})}catch{e(null)}}):t==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(i,o)=>{if(i||!o)return e(null);const r=o.trim().split("||");e({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):e(null)}));d.handle("get-bluetooth-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l("system_profiler SPBluetoothDataType -json",(i,o)=>{if(i)return e(!1);try{const s=JSON.parse(o).SPBluetoothDataType[0],a=s.device_connected&&s.device_connected.length>0;e(a)}catch{e(!1)}}):t==="win32"?l(`powershell -Command "${`
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $devices = [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType = WindowsRuntime]::FindAllAsync('(System.Devices.Aep.ProtocolId:="{e0cbf06c-5021-4943-9112-460f89956c33}") AND (System.Devices.Aep.IsConnected:=$true)').GetAwaiter().GetResult()
        return $devices.Count > 0
      `.replace(/"/g,'\\"')}"`,(o,r)=>{if(o)return e(!1);e(r.trim().toLowerCase()==="true")}):t==="linux"?l("bluetoothctl devices Connected",(i,o)=>{if(i)return e(!1);e(o.trim().length>0)}):e(!1)}));p.on("window-all-closed",()=>{process.platform==="linux"&&!g&&p.quit()});d.handle("control-system-media",async(e,t)=>{const i=process.platform;if(i==="darwin"){const o=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;l(`osascript -e '${o}'`)}else if(i==="linux"){let o=t;t==="playpause"&&(o="play-pause"),l(`playerctl ${o}`)}});
