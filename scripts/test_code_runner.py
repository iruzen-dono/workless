#!/usr/bin/env python3
import urllib.request, json, time

api = 'http://localhost:8001/api'

# Login
req = urllib.request.Request(f'{api}/auth/login',
    data=json.dumps({'email':'visu@demo.local','password':'Password123!'}).encode(),
    headers={'Content-Type':'application/json','Accept':'application/json'}, method='POST')
token = json.loads(urllib.request.urlopen(req).read())['data']['token']
print(f'1. Logged in ✅')

# Create workflow
req2 = urllib.request.Request(f'{api}/workflows',
    data=json.dumps({'name':'Code Test','description':'Testing code runner'}).encode(),
    headers={'Authorization':f'Bearer {token}','Content-Type':'application/json','Accept':'application/json'}, method='POST')
wf = json.loads(urllib.request.urlopen(req2).read())
wf_id = wf['data']['id']
print(f'2. Workflow created: {wf_id} ✅')

# Add code step
req3 = urllib.request.Request(f'{api}/workflows/{wf_id}/steps',
    data=json.dumps({
        'step_type':'code', 'label':'Double Items',
        'config':{'code':'return input.items.map(x => x * 2);', 'timeout':5},
        'position':{'x':300,'y':100}
    }).encode(),
    headers={'Authorization':f'Bearer {token}','Content-Type':'application/json','Accept':'application/json'}, method='POST')
step = json.loads(urllib.request.urlopen(req3).read())
print(f'3. Code step added ✅')

# Deploy
req4 = urllib.request.Request(f'{api}/workflows/{wf_id}/deploy',
    headers={'Authorization':f'Bearer {token}','Accept':'application/json'}, method='POST')
deploy = json.loads(urllib.request.urlopen(req4).read())
print(f'4. Deployed ✅')

# Execute with input data
req5 = urllib.request.Request(f'{api}/workflows/{wf_id}/execute',
    data=json.dumps({'input_data':{'items':[1,2,3,4,5]}}).encode(),
    headers={'Authorization':f'Bearer {token}','Content-Type':'application/json','Accept':'application/json'}, method='POST')
exec_resp = json.loads(urllib.request.urlopen(req5).read())
exec_id = exec_resp['data']['id']
print(f'5. Execution started: {exec_id} ✅')

# Wait for queue worker
time.sleep(4)

# Check execution with full details
req6 = urllib.request.Request(f'{api}/executions/{exec_id}',
    headers={'Authorization':f'Bearer {token}','Accept':'application/json'})
exec_data = json.loads(urllib.request.urlopen(req6).read())
d = exec_data['data']
print(f'6. Status: {d["status"]}, duration: {d.get("duration_ms","?")}ms')

# Show step results
steps = d.get('execution_step_results', [])
if steps:
    for s in steps:
        out = s.get('output_data', {})
        data_out = out.get('data', 'n/a') if isinstance(out, dict) else 'n/a'
        print(f'   Step [{s.get("status","?")}] {s.get("step","n/a")} = {data_out}')
else:
    print(f'   No step results found. Keys: {list(d.keys())}')
    # Show logs
    logs = d.get('execution_logs', [])
    if logs:
        for l in logs:
            print(f'   LOG [{l.get("level","?")}] {l.get("message","")}')
    else:
        # Try accessing error
        print(f'   Error: {d.get("error_message","none")}')
