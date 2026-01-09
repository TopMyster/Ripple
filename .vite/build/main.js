"use strict";const{app:l,BrowserWindow:h,screen:S,ipcMain:d,shell:N,Tray:k,Menu:$,nativeImage:T}=require("electron"),p=require("node:path");require("fs");process.platform==="linux"&&(l.commandLine.appendSwitch("enable-transparent-visuals"),l.disableHardwareAcceleration());let u=null,t=null;const{exec:c}=require("child_process");d.handle("set-ignore-mouse-events",(e,n,a)=>{t&&t.setIgnoreMouseEvents(n,{forward:a||!1})});const g=()=>{const e=(process.platform==="win32","png");return l.isPackaged?p.join(process.resourcesPath,`assets/icons/icon.${e}`):p.join(__dirname,`../../src/assets/icons/icon.${e}`)},w=()=>{const e=S.getPrimaryDisplay(),{width:n,height:a}=e.size;t=new h({width:n,height:a,x:0,y:0,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,icon:g(),hiddenInMissionControl:!0,type:"toolbar",fullscreen:!1,visibleOnFullScreen:!0,webPreferences:{preload:p.join(__dirname,"preload.js"),devTools:!1},show:!1}),process.platform!=="linux"&&t.setFullScreen(!0),t.setIgnoreMouseEvents(!0,{forward:!0});const s=process.platform==="linux"?300:0;t.once("ready-to-show",()=>{setTimeout(()=>{t&&(t.show(),t.focus())},s)}),setTimeout(()=>{t&&!t.isVisible()&&(t.show(),t.focus())},5e3),t.on("closed",()=>{t=null});try{t.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!l.isPackaged||process.env.NODE_ENV==="development")t.loadURL("http://localhost:5173");else{const r=p.join(__dirname,"../renderer/main_window/index.html");t.loadFile(r)}};l.whenReady().then(()=>{process.platform==="darwin"&&l.dock.hide(),w(),l.on("activate",()=>{h.getAllWindows().length===0&&w()});try{const e=g(),a=T.createFromPath(e).resize({width:16,height:16});u=new k(a);const s=$.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{t&&(t.isVisible()?t.hide():t.show())}},{type:"separator"},{label:"Quit",click:()=>{l.quit()}}]);u.setToolTip("Ripple"),u.setContextMenu(s)}catch(e){console.error("Failed to create tray:",e)}});d.handle("get-system-media",async()=>new Promise(e=>{const n=process.platform;n==="darwin"?c(`osascript -e '
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
            '`,(s,r)=>{if(s)return e(null);const i=r.trim();if(!i||i==="None"||i==="Error")return e(null);const o=i.split("||");o.length>=4?e({name:o[2],artist:o[3],album:o[4],artwork_url:o[5]||null,state:o[1]==="playing"?"playing":"paused",source:o[0]}):e(null)}):n==="win32"?c(`powershell -Command "${`
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
      `.replace(/"/g,'\\"')}"`,(s,r)=>{if(s||!r||r.trim()==="null"){c(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,(i,o)=>{var y;if(i||!o)return e(null);const m=(y=o.split(`
`).find(f=>f.includes("-")))==null?void 0:y.trim();if(m){const[f,b]=m.split(" - ");e({name:b||m,artist:f||"Unknown",state:"playing",source:"Spotify"})}else e(null)});return}try{const i=JSON.parse(r);e({name:i.Title||"Unknown Title",artist:i.Artist||"Unknown Artist",album:i.Album||"",state:i.Status==="playing"?"playing":"paused",source:i.Source||"System"})}catch{e(null)}}):n==="linux"?c('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(a,s)=>{if(a||!s)return e(null);const r=s.trim().split("||");e({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):e(null)}));l.on("window-all-closed",()=>{process.platform==="linux"&&!u&&l.quit()});d.handle("control-system-media",async(e,n)=>{const a=process.platform;if(a==="darwin"){const s=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${n} track
        else if musicRunning then
            tell application "Music" to ${n} track
        end if
        `;c(`osascript -e '${s}'`)}else if(a==="linux"){let s=n;n==="playpause"&&(s="play-pause"),c(`playerctl ${s}`)}});
