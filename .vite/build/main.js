"use strict";const{app:c,BrowserWindow:k,screen:w,ipcMain:u,shell:P,Tray:E,Menu:M,nativeImage:O}=require("electron"),m=require("node:path"),d=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.commandLine.appendSwitch("disable-gpu-compositing"),c.disableHardwareAcceleration());let y=null,a=null;const{exec:l,spawn:S}=require("child_process");function F(){return new Promise(t=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$shell   = New-Object -ComObject WScript.Shell
$dirs    = @("$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs","$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs")
$results = [System.Collections.Generic.List[object]]::new()
foreach ($dir in $dirs) {
  if (-not (Test-Path $dir)) { continue }
  Get-ChildItem $dir -Recurse -Filter '*.lnk' -EA SilentlyContinue | ForEach-Object {
    try {
      $target = $shell.CreateShortcut($_.FullName).TargetPath
      if ($target -and $target.EndsWith('.exe') -and
          $target -notlike '*\\\\explorer.exe' -and
          $target -notmatch 'WindowsApps' -and
          (Test-Path $target -EA SilentlyContinue)) {
        $results.Add([PSCustomObject]@{ name = $_.BaseName; type = 'win32'; path = $target })
      }
    } catch {}
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:5*1024*1024},(s,r)=>{if(s||!r)return t([]);try{const o=JSON.parse(r.trim());t(Array.isArray(o)?o:o?[o]:[])}catch{t([])}})})}function R(){return new Promise(t=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:2*1024*1024},(s,r)=>{if(s||!r)return t([]);try{const o=JSON.parse(r.trim());t(Array.isArray(o)?o:o?[o]:[])}catch{t([])}})})}async function W(){const[t,n]=await Promise.all([F(),R()]),e=new Set,s=[];for(const r of[...t,...n]){if(!r.name||!(r.path||r.appId))continue;const o=r.type==="uwp"?`shell:AppsFolder\\${r.appId}`:r.path,i=o.toLowerCase();e.has(i)||(e.add(i),s.push({name:r.name,launch:o}))}return s.sort((r,o)=>r.name.localeCompare(o.name))}function b(t){const n=[];let e=0;for(;e<t.length;){for(;e<t.length&&/\s/.test(t[e]);)e++;if(e>=t.length)break;let s="";for(;e<t.length&&!/\s/.test(t[e]);)if(t[e]==='"'){for(e++;e<t.length&&t[e]!=='"';)s+=t[e++];e<t.length&&e++}else s+=t[e++];s&&n.push(s)}return n}function j(t){const n=t.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,i)=>process.env[i]||`%${i}%`),e=n.match(/^"([^"]+)"(.*)/);if(e)return{exe:e[1],args:e[2].trim()?b(e[2].trim()):[]};const s=n.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(s)return{exe:s[1],args:s[2]?b(s[2]):[]};const r=n.search(/\s/);return r===-1?{exe:n,args:[]}:{exe:n.slice(0,r),args:b(n.slice(r+1).trim())}}function D(t){const n=t.trim();if(n.startsWith("shell:")){const e=n.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`);return}if(/[\\\/]/.test(n)){const{exe:e,args:s}=j(n);if(s.length===0){if(e.toLowerCase().endsWith(".url")){try{const p=d.readFileSync(e,"utf8").match(/^URL=(.+)$/im);p&&P.openExternal(p[1].trim())}catch{}return}P.openPath(e).then(i=>{i&&l(`start "" "${e}"`)});return}const r=/[\\/]/.test(e)&&!/\.[^\\.]+$/.test(e)?e+".exe":e;if(/\.(cmd|bat)$/i.test(r)){const i=S("cmd.exe",["/c",r,...s],{shell:!1,detached:!0,stdio:"ignore"});i.on("error",()=>{}),i.unref();return}if(/\.ps1$/i.test(r)){const i=S("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r,...s],{shell:!1,detached:!0,stdio:"ignore"});i.on("error",()=>{}),i.unref();return}const o=S(r,s,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(n.includes(" ")){const e=n.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`)}else l(`start "" ${n}`)}u.handle("set-ignore-mouse-events",(t,n,e)=>{a&&(process.platform!=="linux"?a.setIgnoreMouseEvents(n,{forward:e||!1}):a.setIgnoreMouseEvents(n))});u.handle("focus-window",()=>{a&&a.focus()});u.handle("open-external",async(t,n)=>{await P.openExternal(n)});u.handle("launch-app",async(t,n)=>{const e=process.platform;e==="darwin"?l(`open -a "${n}"`):e==="win32"?D(n):l(n)});u.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const t=m.join(c.getPath("userData"),"app-cache.json");try{const n=await W();d.writeFileSync(t,JSON.stringify(n))}catch{}});u.handle("search-apps",async(t,n)=>{if(process.platform!=="win32"||!n)return[];const e=m.join(c.getPath("userData"),"app-cache.json");try{if(!d.existsSync(e))return[];const s=JSON.parse(d.readFileSync(e,"utf8")),r=n.toLowerCase();return s.filter(o=>o.name&&o.name.toLowerCase().includes(r)).slice(0,8)}catch{return[]}});u.handle("get-displays",()=>w.getAllDisplays().map(n=>({id:n.id,label:n.label||`Display ${n.id}`,bounds:n.bounds})));u.handle("set-display",(t,n)=>{if(a){const s=w.getAllDisplays().find(f=>f.id.toString()===n.toString())||w.getPrimaryDisplay(),{x:r,y:o,width:i,height:p}=s.bounds;process.platform,a.setBounds({x:r,y:o,width:i,height:p}),a.show()}});u.handle("update-window-position",(t,n,e)=>{});u.handle("set-auto-launch",(t,n)=>{if(process.platform==="linux"){const e=m.join(c.getPath("home"),".config","autostart"),s=m.join(e,"ripple.desktop");try{if(n){d.existsSync(e)||d.mkdirSync(e,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${c.getPath("exe")}"
Icon=${C()}
Terminal=false
`;d.writeFileSync(s,r)}else d.existsSync(s)&&d.unlinkSync(s)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{c.setLoginItemSettings({openAtLogin:n,path:c.getPath("exe")})}catch(e){console.error("Failed to set login item settings on Windows:",e)}});const C=()=>{const t="png";if(c.isPackaged){const n=m.join(process.resourcesPath,`icon.${t}`),e=m.join(process.resourcesPath,`assets/icons/icon.${t}`);return d.existsSync(n)?n:d.existsSync(e)?e:n}return m.join(__dirname,`../../src/assets/icons/icon.${t}`)},A=()=>{const t=w.getPrimaryDisplay(),{x:n,y:e,width:s,height:r}=t.bounds,o=process.platform==="linux",i=process.platform==="win32",p=process.platform==="darwin",f=s,h=r,g=n,$=e,T=i?"toolbar":"panel";a=new k({width:f,height:h,x:g,y:$,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...i?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:C(),...p?{hiddenInMissionControl:!0}:{},type:T,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:m.join(__dirname,"preload.js"),devTools:!1},show:!0}),o?a.setIgnoreMouseEvents(!0):a.setIgnoreMouseEvents(!0,{forward:!0});const N=o?500:0;a.once("ready-to-show",()=>{setTimeout(()=>{a&&(a.show(),o?a.setAlwaysOnTop(!0,"screen-saver"):a.setAlwaysOnTop(!0,"pop-up-menu"),a.focus())},N)}),setTimeout(()=>{a&&!a.isVisible()&&(a.show(),a.focus())},5e3),a.on("closed",()=>{a=null});try{a.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")a.loadURL("http://localhost:5173");else{const x=m.join(__dirname,"../renderer/main_window/index.html");a.loadFile(x)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),A(),c.on("activate",()=>{k.getAllWindows().length===0&&A()});try{const t=C(),e=O.createFromPath(t).resize({width:16,height:16});y=new E(e);const s=M.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{a&&(a.isVisible()?a.hide():a.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);y.setToolTip("Ripple"),y.setContextMenu(s)}catch(t){console.error("Failed to create tray:",t)}});u.handle("get-system-media",async()=>new Promise(t=>{const n=process.platform;n==="darwin"?l(`osascript -e '
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
            '`,(s,r)=>{if(s)return t(null);const o=r.trim();if(!o||o==="None"||o==="Error")return t(null);const i=o.split("||");i.length>=4?t({name:i[2],artist:i[3],album:i[4],artwork_url:i[5]||null,state:i[1]==="playing"?"playing":"paused",source:i[0]}):t(null)}):n==="win32"?l(`powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Add-Type -AssemblyName System.Runtime.WindowsRuntime; $manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync().GetAwaiter().GetResult(); $session = $manager.GetCurrentSession(); if ($session) { $props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult(); $playback = $session.GetPlaybackInfo(); $status = $playback.PlaybackStatus; $thumbnail = $props.Thumbnail; $artwork = ''; if ($thumbnail) { try { $stream = $thumbnail.OpenReadAsync().GetAwaiter().GetResult(); $buffer = New-Object byte[] $stream.Size; $reader = New-Object Windows.Storage.Streams.DataReader $stream; $reader.LoadAsync($stream.Size).GetAwaiter().GetResult() | Out-Null; $reader.ReadBytes($buffer); $artwork = 'data:image/png;base64,' + [Convert]::ToBase64String($buffer); $reader.Close(); $stream.Close(); } catch { } } $info = @{ Title = $props.Title; Artist = $props.Artist; Album = $props.AlbumTitle; Status = $status.ToString().ToLower(); Source = $session.SourceAppUserModelId; Artwork = $artwork }; return $info | ConvertTo-Json -Compress; } return 'null';"`,{maxBuffer:5*1024*1024,encoding:"utf8"},(s,r)=>{if(s||!r||r.trim()==="null"||r.trim()==="'null'"){l(`powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,{encoding:"utf8"},(o,i)=>{var f;if(o||!i)return t(null);const p=(f=i.split(`
`).find(h=>h.includes("-")))==null?void 0:f.trim();if(p){const[h,...g]=p.split(" - "),$=g.join(" - ");t({name:$||p,artist:h||"Unknown",state:"playing",source:"Spotify"})}else t(null)});return}try{const o=JSON.parse(r);t({name:o.Title||"Unknown Title",artist:o.Artist||"Unknown Artist",album:o.Album||"",artwork_url:o.Artwork||null,state:o.Status==="playing"?"playing":"paused",source:o.Source||"System"})}catch{t(null)}}):n==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(e,s)=>{if(e||!s)return t(null);const r=s.trim().split("||");t({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):t(null)}));u.handle("get-bluetooth-status",async()=>new Promise(t=>{const n=process.platform;n==="darwin"?l("system_profiler SPBluetoothDataType -json",(e,s)=>{if(e)return t(!1);try{const o=JSON.parse(s).SPBluetoothDataType[0],i=o.device_connected&&o.device_connected.length>0;t(i)}catch{t(!1)}}):n==="win32"?l(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(s,r)=>{if(s)return t(!1);t(r.trim().toLowerCase()==="true")}):n==="linux"?l("bluetoothctl devices Connected",(e,s)=>{if(e)return t(!1);t(s.trim().length>0)}):t(!1)}));u.handle("get-camera-status",async()=>new Promise(t=>{const n=process.platform;n==="darwin"?l('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(e,s)=>{t(s?s.includes("= Yes"):!1)}):n==="win32"?l(`powershell -NoProfile -Command "
        $inUse = $false
        $keys = Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam" -Recurse -ErrorAction SilentlyContinue
        foreach ($key in $keys) {
            $val = Get-ItemProperty -Path $key.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue
            if ($val -and $val.LastUsedTimeStop -eq 0) {
                $inUse = $true
                break
            }
        }
        $inUse
      "`,(s,r)=>{if(s)return t(!1);t(r.trim().toLowerCase()==="true")}):n==="linux"?l("fuser /dev/video* 2>/dev/null",(e,s)=>{t(s.trim().length>0)}):t(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!y&&c.quit()});u.handle("control-system-media",async(t,n)=>{const e=process.platform;if(e==="darwin"){const s=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${n} track
        else if musicRunning then
            tell application "Music" to ${n} track
        end if
        `;l(`osascript -e '${s}'`)}else if(e==="linux"){let s=n;n==="playpause"&&(s="play-pause"),l(`playerctl ${s}`)}});
