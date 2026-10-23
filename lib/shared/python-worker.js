import {spawn} from 'node:child_process';
export class PythonWorker {
 constructor(config,script){this.config=config;this.script=script;this.children=new Set();}
 call(operation,args={},signal){
  signal?.throwIfAborted();
  return new Promise((resolve,reject)=>{
   const child=spawn(this.config.pythonExecutable,[this.script],{windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,PYTHONUTF8:'1',DSH_TOOL_CONFIG:JSON.stringify(this.config)}});this.children.add(child);
   let stdout='',stderr='',settled=false;
   const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);this.children.delete(child);error?reject(error):resolve(result);};
   const abort=()=>{child.kill();finish(signal.reason||Error('Operation aborted'));};
   const timer=setTimeout(()=>{child.kill();finish(Error('CPU file processing timed out'));},this.config.timeoutMs||120000);
   signal?.addEventListener('abort',abort,{once:true});
   child.stdout.on('data',chunk=>{stdout+=chunk.toString();if(stdout.length>16000000){child.kill();finish(Error('Worker output exceeded its bound'));}});
   child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-2000);});
   child.on('error',error=>finish(Error('独立文件运行时不可用；请运行此插件的 scripts/setup.ps1。'+error.message)));
   child.on('close',code=>{try{const value=JSON.parse(stdout.trim());if(code||value.error)throw Error(value.error||stderr||'Worker exited');finish(null,value.result);}catch(error){finish(error);}});
   child.stdin.on('error',error=>finish(error));child.stdin.end(JSON.stringify({operation,args}));
   if(signal?.aborted)abort();
  });
 }
 close(){for(const child of this.children)child.kill();this.children.clear();}
}
