param([string]$Runtime=(Join-Path $env:USERPROFILE '.local-ai-tools\document-tools'),[switch]$Engineering)
$ErrorActionPreference='Stop'
$pythonPath=Join-Path $Runtime 'Scripts\python.exe'
if(!(Test-Path -LiteralPath $pythonPath)){& uv venv --python 3.12 $Runtime;if($LASTEXITCODE -ne 0){throw '独立 Python 环境创建失败'}}
& uv pip install --python $pythonPath -r (Join-Path $PSScriptRoot '..\backend\requirements.txt')
if($LASTEXITCODE -ne 0){throw 'CPU 文件解析依赖安装失败'}
if($Engineering){$extra=Join-Path $PSScriptRoot '..\backend\engineering-requirements.txt';if(!(Test-Path -LiteralPath $extra)){throw '此插件没有工程解析组件'};& uv pip install --python $pythonPath -r $extra;if($LASTEXITCODE -ne 0){throw '工程解析依赖安装失败'}}
Write-Output ('独立 CPU Python：'+$pythonPath)
