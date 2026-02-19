"use strict";const{app:u,BrowserWindow:b,screen:h,ipcMain:p,shell:T,Tray:P,Menu:R,nativeImage:x}=require("electron"),f=require("node:path"),g=require("fs");process.platform==="linux"&&u.commandLine.appendSwitch("enable-transparent-visuals");let y=null,n=null;const{exec:l}=require("child_process");p.handle("set-ignore-mouse-events",(e,t,i)=>{n&&n.setIgnoreMouseEvents(t,{forward:i||!1})});p.handle("open-external",async(e,t)=>{await T.openExternal(t)});p.handle("launch-app",async(e,t)=>{const i=process.platform;l(i==="darwin"?`open -a "${t}"`:i==="win32"?`start "" "${t}"`:t)});p.handle("get-displays",()=>h.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));p.handle("set-display",(e,t)=>{if(n){const s=h.getAllDisplays().find(c=>c.id.toString()===t.toString())||h.getPrimaryDisplay(),{x:a,y:r,width:o,height:d}=s.bounds,m=process.platform==="linux";if(n.setFullScreen(!1),m){const k=a+Math.floor((o-800)/2),A=r;n.setBounds({x:k,y:A,width:800,height:600})}else n.setBounds({x:a,y:r,width:o,height:d}),n.setFullScreen(!0);n.show()}});const $=()=>{const e="png";if(u.isPackaged){const t=f.join(process.resourcesPath,`icon.${e}`),i=f.join(process.resourcesPath,`assets/icons/icon.${e}`);return g.existsSync(t)?t:g.existsSync(i)?i:t}return f.join(__dirname,`../../src/assets/icons/icon.${e}`)},S=()=>{const e=h.getPrimaryDisplay(),{width:t,height:i}=e.size,s=process.platform==="linux",a=s?800:t,r=s?600:i,o=s?Math.floor((t-a)/2):0,d=0;n=new b({width:a,height:r,x:o,y:d,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,icon:$(),hiddenInMissionControl:!0,type:s?"utility":"toolbar",fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:f.join(__dirname,"preload.js"),devTools:!1},show:!1}),s||n.setFullScreen(!0),n.setIgnoreMouseEvents(!0,{forward:!s});const m=s?500:0;n.once("ready-to-show",()=>{setTimeout(()=>{n&&(n.show(),n.focus())},m)}),setTimeout(()=>{n&&!n.isVisible()&&(n.show(),n.focus())},5e3),n.on("closed",()=>{n=null});try{n.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!u.isPackaged||process.env.NODE_ENV==="development")n.loadURL("http://localhost:5173");else{const c=f.join(__dirname,"../renderer/main_window/index.html");n.loadFile(c)}};u.whenReady().then(()=>{process.platform==="darwin"&&u.dock.hide(),S(),u.on("activate",()=>{b.getAllWindows().length===0&&S()});try{const e=$(),i=x.createFromPath(e).resize({width:16,height:16});y=new P(i);const s=R.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{n&&(n.isVisible()?n.hide():n.show())}},{type:"separator"},{label:"Quit",click:()=>{u.quit()}}]);y.setToolTip("Ripple"),y.setContextMenu(s)}catch(e){console.error("Failed to create tray:",e)}});p.handle("get-system-media",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l(`osascript -e '
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
            '`,(s,a)=>{if(s)return e(null);const r=a.trim();if(!r||r==="None"||r==="Error")return e(null);const o=r.split("||");o.length>=4?e({name:o[2],artist:o[3],album:o[4],artwork_url:o[5]||null,state:o[1]==="playing"?"playing":"paused",source:o[0]}):e(null)}):t==="win32"?l(`powershell -Command "${`
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
      `.replace(/"/g,'\\"')}"`,(s,a)=>{if(s||!a||a.trim()==="null"){l(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(r,o)=>{var m;if(r||!o)return e(null);const d=(m=o.split(`
`).find(c=>c.includes("-")))==null?void 0:m.trim();if(d){const[c,w]=d.split(" - ");e({name:w||d,artist:c||"Unknown",state:"playing",source:"Spotify"})}else e(null)});return}try{const r=JSON.parse(a);e({name:r.Title||"Unknown Title",artist:r.Artist||"Unknown Artist",album:r.Album||"",state:r.Status==="playing"?"playing":"paused",source:r.Source||"System"})}catch{e(null)}}):t==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(i,s)=>{if(i||!s)return e(null);const a=s.trim().split("||");e({name:a[0],artist:a[1],album:a[2],state:a[3].toLowerCase(),source:"System"})}):e(null)}));p.handle("get-bluetooth-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l("system_profiler SPBluetoothDataType -json",(i,s)=>{if(i)return e(!1);try{const r=JSON.parse(s).SPBluetoothDataType[0],o=r.device_connected&&r.device_connected.length>0;e(o)}catch{e(!1)}}):t==="win32"?l(`powershell -Command "${`
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $devices = [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType = WindowsRuntime]::FindAllAsync('(System.Devices.Aep.ProtocolId:="{e0cbf06c-5021-4943-9112-460f89956c33}") AND (System.Devices.Aep.IsConnected:=$true)').GetAwaiter().GetResult()
        return $devices.Count > 0
      `.replace(/"/g,'\\"')}"`,(s,a)=>{if(s)return e(!1);e(a.trim().toLowerCase()==="true")}):t==="linux"?l("bluetoothctl devices Connected",(i,s)=>{if(i)return e(!1);e(s.trim().length>0)}):e(!1)}));u.on("window-all-closed",()=>{process.platform==="linux"&&!y&&u.quit()});p.handle("control-system-media",async(e,t)=>{const i=process.platform;if(i==="darwin"){const s=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;l(`osascript -e '${s}'`)}else if(i==="linux"){let s=t;t==="playpause"&&(s="play-pause"),l(`playerctl ${s}`)}});
