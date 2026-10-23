param([Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$Commit,[ValidatePattern('^[a-zA-Z0-9_-]+$')][string]$Profile='web')
$ErrorActionPreference='Stop'
$taskDshRoot=if($env:DSH_HOME){$env:DSH_HOME}else{Join-Path $env:USERPROFILE '.dsh'}
$profilePath=Join-Path $taskDshRoot ('profiles\'+$Profile)
if(!(Test-Path -LiteralPath (Join-Path $profilePath 'package.json'))){throw '请先创建独立 DSH profile；此脚本不修改官方入口。'}
$backupPath=Join-Path $env:USERPROFILE ('.local-ai-tools\backups\dsh-document-tools-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $backupPath|Out-Null
foreach($file in @('package.json','pnpm-lock.yaml','cordis.patch.yml')){if(Test-Path -LiteralPath (Join-Path $profilePath $file)){Copy-Item -LiteralPath (Join-Path $profilePath $file) -Destination (Join-Path $backupPath $file)}}
& dsh plugin --profile $Profile add ('https://codeload.github.com/BCSDL/dsh-document-tools/tar.gz/'+$Commit) --ignore-scripts
if($LASTEXITCODE -ne 0){throw ('安装失败；配置备份：'+$backupPath)}
& dsh --profile $Profile --dump-config|Out-Null
if($LASTEXITCODE -ne 0){throw ('配置校验失败；请从备份恢复 profile 配置：'+$backupPath)}
Write-Output ('已安装固定提交；配置备份：'+$backupPath)
Write-Output '脚本没有启动服务、结束进程、删除数据或修改 Codex CLI。请在正常退出 DSH 后重新启动。'
