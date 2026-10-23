"""Independent document protocol; exits after each request, no model loading."""
import json, os, sys, uuid
from pathlib import Path
from document_reader import document
def dispatch(config, args):
    root=Path(config['dataDirectory']).resolve();destination=root/'previews'/uuid.uuid4().hex
    destination.mkdir(parents=True,exist_ok=True)
    limit=min(20,max(1,int(args.get('limit',3))));offset=max(0,int(args.get('offset',0)));pages=[]
    iterator=document(args['path'],destination)
    try:
        for index,unit in enumerate(iterator):
            if index<offset:continue
            pages.append(unit)
            if len(pages)>limit:break
    finally:iterator.close()
    return {'pages':pages[:limit],'truncated':len(pages)>limit,'limit':limit,'offset':offset,'nextOffset':offset+min(limit,len(pages))}
if __name__=='__main__':
    try:
        request=json.load(sys.stdin)
        if request['operation']!='document':raise ValueError('Unknown document operation')
        print(json.dumps({'result':dispatch(json.loads(os.environ['DSH_TOOL_CONFIG']),request['args'])},ensure_ascii=False))
    except Exception as error:
        print(json.dumps({'error':str(error)},ensure_ascii=False));sys.exit(1)
