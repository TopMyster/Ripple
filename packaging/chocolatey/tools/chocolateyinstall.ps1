$packageName = 'ripple'
$fileType = 'exe'
$url = 'https://github.com/TopMyster/Ripple/releases/download/v2.3.3/Ripple-Setup-2.3.3.exe'
$silentArgs = '/S'

Install-ChocolateyPackage -PackageName $packageName `
                          -FileType $fileType `
                          -SilentArgs $silentArgs `
                          -Url $url
