import {defineTool} from '@deepseek-ai/dsh-tools';
import fs from 'node:fs/promises';
import {isAbsolute,resolve,basename} from 'node:path';
import {currentFiles} from './shared/attachments.js';
function rendered(_args,value){return JSON.parse(value).content;}
export function registerDocumentTools(ctx,worker){
 ctx.effect(()=>ctx.tools.register(defineTool({
  name:'read_document',
  description:'Read actual PDF/scan/Office/image/text/code contents with source/page references and real page images. Use attachment for a file uploaded in this user message, or path for a local file. Example: {attachment:"lesson.pdf",limit:3,offset:0,images:true}. offset selects subsequent units; truncation is explicit. Never pass a JSON string as the whole argument.',
  parameters:{path:{type:'string',description:'Actual absolute path, or path relative to the session workspace. Optional if attachment is supplied.'},attachment:{type:'string',description:'Exact uploaded filename in the latest user message. Empty selects the sole attachment.'},limit:{type:'integer',description:'1 to 20 units; default 3.'},offset:{type:'integer',description:'Zero-based unit offset; default 0.'},images:{type:'boolean'}},
  output:{schema:{type:'string'},render:rendered},
  async execute(args,exec){
   exec.signal.throwIfAborted();
   if(args.limit!==undefined&&(args.limit<1||args.limit>20))throw Error('limit must be between 1 and 20');
   if(args.offset!==undefined&&args.offset<0)throw Error('offset must be nonnegative');
   let path=args.path;
   if(!path){
    const files=currentFiles(exec.agent);
    const matches=args.attachment?files.filter(f=>f.name===args.attachment):files;
    if(matches.length!==1)throw Error('Specify an exact attachment filename or an existing path; no unique uploaded file was found.');
    const store=ctx.get('attachments');if(!store)throw Error('Native attachment store unavailable.');
    path=store.fileHostPath(matches[0]);if(!path)throw Error('This attachment backend has no local file path.');
    // Verify immutable native-upload bytes through the official bounded stream.
    for await(const _chunk of store.readFileStream(matches[0],exec.signal))exec.signal.throwIfAborted();
   }
   const cwd=exec.agent?.session?.header?.cwd||process.cwd();
   path=isAbsolute(path)?path:resolve(cwd,path);
   const value=await worker.call('document',{path,limit:args.limit??3,offset:args.offset??0},exec.signal);
   exec.signal.throwIfAborted();
   const content=[];const images=[];let remaining=60000;
   for(const page of value.pages){
    const text=page.text||'';const kept=text.slice(0,Math.max(0,remaining));remaining-=kept.length;
    if(kept.length<text.length)value.textTruncated=true;
    page.text=kept;
    if(page.image&&args.images!==false&&images.length<3){
     const store=ctx.get('attachments');
     if(store){const ref=await store.saveImage({data:await fs.readFile(page.image),mediaType:page.image.toLowerCase().endsWith('.png')?'image/png':'image/jpeg',name:basename(page.image)});images.push({type:'image',attachment:ref});}
     else page.visualWarning='No attachment service; only extracted text is available.';
    }
   }
   content.push({type:'text',text:JSON.stringify({path,...value,imagesReturned:images.length})},...images);
   return JSON.stringify({content});
  }
 })),'typed document reader');
}
