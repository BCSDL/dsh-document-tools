import z from '@deepseek-ai/schemastery';
import {homedir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';
import {PythonWorker} from './shared/python-worker.js';import {rememberFiles} from './shared/attachments.js';
import {registerDocumentTools} from './document-tools.js';
export const name='document-tools';export const inject=['tools','attachments'];
export const Config=z.object({pythonExecutable:z.string().default(''),dataDirectory:z.string().default('')});
export function apply(ctx,config){
 const runtime=join(homedir(),'.local-ai-tools','document-tools');
 const resolved={...config,pythonExecutable:config.pythonExecutable||join(runtime,process.platform==='win32'?'Scripts/python.exe':'bin/python'),dataDirectory:config.dataDirectory||join(process.env.DSH_HOME||join(homedir(),'.dsh'),'document-tools')};
 const worker=new PythonWorker(resolved,fileURLToPath(new URL('../backend/worker.py',import.meta.url)));
 registerDocumentTools(ctx,worker);ctx.on('dispose',()=>worker.close());
 ctx.on('agent/pre-step',async(payload,next)=>{const decision=await next();if(decision.kind==='enter')rememberFiles(payload.agent,payload.messages);return decision;});
 ctx.inject(['systemPrompt'],scope=>scope.effect(()=>scope.systemPrompt.section({name:'document-tools',order:945,interpolate:false,text:'文件读取工具 read_document 使用当前原生附件 attachment 或实际 path。PDF/Office 用专用解析；images:true 返回真实页面图片。truncated=true 需按 nextOffset 续读。未支持的二进制格式不得声称已读懂。'}),'document guidance'));
}
