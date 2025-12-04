                          ##############################################################################
                          # HOMETRONIX FRONTEND AUTO-DEPLOY (FTPS, cPanel Compatible — FINAL CLEAN VERSION)
                          ##############################################################################

                          $LocalProject = "F:/WebstormProjects/project-management-system-deployment/frontend"
                          $RemoteDir    = "/pms.webtechassets.com"
                          $ServerHost   = "cp1.host-forest.com"
                          $FtpUser      = "webtecha"
                          $FtpPassword  = "xMo#Q)4D488Vmn"

                          $DistDir = "$LocalProject/dist/hometronix-frontend"
                          $ZipFile = "$LocalProject/deploy_build.zip"

                          Write-Host "=== Hometronix Auto Deploy (FTPS) ===" -ForegroundColor Cyan

                          # === STEP 1: BUILD ANGULAR ===================================================
                          Write-Host "`n🔨 Building Angular..." -ForegroundColor Yellow
                          Set-Location $LocalProject

                          npm install
                          npm run build

                          if (!(Test-Path $DistDir)) {
                              Write-Host "❌ Build folder not found at: $DistDir" -ForegroundColor Red
                              exit
                          }

                          Write-Host "✔ Angular Build Completed." -ForegroundColor Green

                          # === STEP 2: ZIP BUILD =======================================================
                          Write-Host "`n📦 Creating ZIP package..." -ForegroundColor Yellow

                          if (Test-Path $ZipFile) { Remove-Item $ZipFile -Force }

                          Compress-Archive -Path "$DistDir\*" -DestinationPath $ZipFile -Force

                          if (!(Test-Path $ZipFile)) {
                              Write-Host "❌ ZIP creation failed!" -ForegroundColor Red
                              exit
                          }

                          Write-Host "✔ ZIP Created: $ZipFile" -ForegroundColor Green

                          # === STEP 3: CONNECT TO FTPS =================================================
                          Write-Host "`n🌐 Connecting to FTPS..." -ForegroundColor Yellow

                          Add-Type -Path "C:/Program Files (x86)/WinSCP/WinSCPnet.dll"

                          $sessionOptions = New-Object WinSCP.SessionOptions
                          $sessionOptions.Protocol   = [WinSCP.Protocol]::Ftp
                          $sessionOptions.HostName   = $ServerHost
                          $sessionOptions.UserName   = $FtpUser
                          $sessionOptions.Password   = $FtpPassword
                          $sessionOptions.FtpSecure  = [WinSCP.FtpSecure]::Explicit
                          $sessionOptions.PortNumber = 21

                          $session = New-Object WinSCP.Session
                          $session.Open($sessionOptions)

                          Write-Host "✔ FTPS Connected" -ForegroundColor Green

                          # === STEP 4: CLEAN OLD FILES =================================================
                          Write-Host "`n🧹 Cleaning old build on server..." -ForegroundColor Yellow

                          $session.RemoveFiles("$RemoteDir/index.html")
                          $session.RemoveFiles("$RemoteDir/*.js")
                          $session.RemoveFiles("$RemoteDir/*.css")
                          $session.RemoveFiles("$RemoteDir/assets/*")

                          Write-Host "✔ Old build removed" -ForegroundColor Green

                          # === STEP 5: UPLOAD ZIP ======================================================
                          Write-Host "`n⬆ Uploading new ZIP..." -ForegroundColor Yellow

                          $session.PutFiles($ZipFileWindows, "$RemoteDir/deploy_build.zip").Check()


                          Write-Host "✔ ZIP Uploaded" -ForegroundColor Green

                          Write-Host "`n📂 FINAL STEP REQUIRED:"
                          Write-Host "Go to cPanel → File Manager → public_html/pms.webtechassets.com"
                          Write-Host "Right-click deploy_build.zip → Extract"
                          Write-Host "Done!"

                          Write-Host "`n🎉 Deployment COMPLETE!"
                          Write-Host "Visit: https://pms.webtechassets.com"
                          ##############################################################################
