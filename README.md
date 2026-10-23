> Windows installer fix 0.1.1: PowerShell scripts include an explicit UTF-8 BOM for Windows PowerShell 5.1 and PowerShell 7. Plugin runtime behavior is unchanged.

# dsh-document-tools

独立的 read_document：支持当前原生上传和本地路径，返回分页文本与真实图片。PDF/图片、DOCX、PPTX、XLSX、文本代码及可选工程交换格式；专有二进制格式仍需厂商导出。扫描 PDF 返回页面像素供视觉模型阅读，不包含独立 OCR，也不保证任意格式都能读懂。PPTX 是文本、备注和嵌入图，完整布局请导出 PDF。

## 独立安装与边界

- 单独的 npm 包、DSH bundle、配置入口和版本；不依赖 dsh-classroom 或其他同级插件。可分别启用、禁用、卸载。
- 用 `dsh plugin --profile web remove dsh-document-tools` 卸载（以当前 DSH 帮助为准）；不主动删除用户数据。
- 不监听任何端口，使用 DSH 当前服务。3081 只用于隔离验收，与插件本身无关。
- 默认数据目录是 DSH_HOME/document-tools，与 classroom 数据分离。插件调用 CPU 子进程后退出，不保持后台模型。

## 旧课堂版本迁移

若 profile 安装了 0.7.1 之前的课堂插件，先升级到课堂解耦版，再安装独立工具。旧版本仍注册通用工具/钩子，会造成重复；安装器会在修改前拒绝这种组合。没有课堂插件时可以直接独立安装。

## 发布与安装

先公开源码，再用完整固定提交 SHA 下载，检查后在隔离 DSH_HOME 安装并验收，最后才切换正式环境。

`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-release.ps1 -Commit <40位SHA>`

首次使用先运行 scripts/setup.ps1；它创建插件自己的 Python 环境，不使用课堂环境。pythonExecutable 可明确指定其他兼容的 CPU Python，但不会成为对课堂插件的依赖。document-tools 的工程解析可另加 -Engineering。

公共工具与协议的构建时复用记录在 SHARED-SOURCES.json；发布包包含所需源码，没有跨插件相对导入、file: 依赖或安装时回指工作目录。

## 测试

`npm install --ignore-scripts` 后 `npm test`。Python 插件另运行自己的 test/*.py。自动检查不等于任意提示、全图库或长课程质量验收。
