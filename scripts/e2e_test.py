#!/usr/bin/env python3
"""
Workless E2E Test — Full flow test.
Tests: auth, workflow CRUD, steps, connections, deploy, execute, webhook, approval
"""
import urllib.request, json, sys, time, traceback

API = 'http://localhost:8001/api'
BASE = 'http://localhost:8001'

RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
END = "\033[0m"

passed = 0
failed = 0
token = None
test_data = {}

def req(method, path, data=None, expect=200, retries=0):
    global token
    url = f"{API}{path}"
    if method == 'GET' and data:
        url += '?' + urllib.parse.urlencode(data) if hasattr(urllib.parse, 'urlencode') else ''
    body = json.dumps(data).encode() if data and method != 'GET' else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    
    for attempt in range(retries + 1):
        try:
            resp = urllib.request.urlopen(req, timeout=15)
            content = resp.read().decode()
            status = resp.status
            try:
                return status, json.loads(content)
            except:
                return status, content
        except urllib.error.HTTPError as e:
            content = e.read().decode()
            status = e.code
            try:
                return status, json.loads(content)
            except:
                return status, content
        except Exception as e:
            if attempt < retries:
                time.sleep(2)
                continue
            return 0, str(e)

def test(name, fn):
    global passed, failed
    try:
        result = fn()
        if result is True:
            passed += 1
            sys.stdout.write(f"  {GREEN}✓{END} {name}\n")
        else:
            failed += 1
            sys.stdout.write(f"  {RED}✗{END} {name}\n")
            if result:
                sys.stdout.write(f"    {RED}{result}{END}\n")
    except Exception as e:
        failed += 1
        sys.stdout.write(f"  {RED}✗{END} {name}\n")
        sys.stdout.write(f"    {RED}{traceback.format_exc()[:300]}{END}\n")
    sys.stdout.flush()

# ===================== TEST SUITE =====================
print(f"\n{CYAN}{BOLD}═══════════════════════════════════════{END}")
print(f"{CYAN}{BOLD}  WORKLESS E2E TEST SUITE{END}")
print(f"{CYAN}{BOLD}═══════════════════════════════════════{END}\n")

# ── 1. AUTH ──
print(f"{YELLOW}{BOLD}[1/5] Authentication{END}")

def test_register():
    global test_data
    import random
    ts = int(time.time())
    email = f"e2e-{ts}@test.local"
    pw = "Password123!"
    status, data = req('POST', '/auth/register', {'name':'E2E User','email':email,'password':pw,'password_confirmation':pw}, expect=201)
    if status >= 400:
        return f"register failed: {status} {data}"
    test_data['email'] = email
    test_data['password'] = pw
    token_found = data.get('data',{}).get('token') or data.get('token','')
    if not token_found:
        return f"no token: {json.dumps(data)[:200]}"
    global token
    token = token_found
    return True
test("Register + get token", test_register)

def test_login():
    status, data = req('POST', '/auth/login', {'email': test_data['email'], 'password': test_data['password']})
    if status >= 400:
        return f"login failed: {status} {data}"
    new_token = data.get('data',{}).get('token') or data.get('token','')
    if new_token:
        global token
        token = new_token
    return True
test("Login", test_login)

def test_me():
    status, data = req('GET', '/auth/me')
    if status >= 400:
        return f"me failed: {status} {data}"
    email = (data.get('data') or data).get('email','')
    if email != test_data['email']:
        return f"wrong email: {email} != {test_data['email']}"
    return True
test("Me endpoint", test_me)

# ── 2. WORKFLOW CRUD ──
print(f"\n{YELLOW}{BOLD}[2/5] Workflow CRUD{END}")

def test_create_workflow():
    status, data = req('POST', '/workflows', {'name':'E2E Test Flow','description':'End-to-end test workflow','tags':['e2e','test']}, expect=201)
    if status >= 400:
        return f"create failed: {status} {data}"
    wf = data.get('data') or data
    wf_id = wf.get('id')
    if not wf_id:
        return f"no id: {json.dumps(data)[:200]}"
    test_data['workflow_id'] = wf_id
    return True
test("Create workflow", test_create_workflow)

def test_list_workflows():
    status, data = req('GET', '/workflows')
    if status >= 400:
        return f"list failed: {status} {data}"
    items = data.get('data') or data
    if isinstance(items, list) and len(items) > 0:
        return True
    return f"empty list: {json.dumps(data)[:200]}"
test("List workflows", test_list_workflows)

# ── 3. STEPS + CONNECTIONS ──
print(f"\n{YELLOW}{BOLD}[3/5] Builder — Steps & Connections{END}")

wid = lambda: test_data['workflow_id']

def test_add_webhook_step():
    status, data = req('POST', f'/workflows/{wid()}/steps', {
        'step_type':'webhook', 'label':'Incoming Webhook','config':{},'position':{'x':100,'y':100}
    }, expect=201)
    if status >= 400:
        return f"webhook step: {status} {data}"
    s = data.get('data') or data
    test_data['webhook_step_id'] = s.get('id')
    # Create webhook trigger for this step
    status2, data2 = req('POST', f'/workflows/{wid()}/webhooks', {'step_id': s.get('id')}, expect=201)
    test_data['webhook_trigger'] = data2.get('data',{}).get('token','')
    return True
test("Add webhook step", test_add_webhook_step)

def test_add_code_step():
    status, data = req('POST', f'/workflows/{wid()}/steps', {
        'step_type':'code','label':'Transform Data',
        'config':{'code':'return { result: input.data.map(x => x * 2), processed: true };'},
        'position':{'x':400,'y':100}
    }, expect=201)
    if status >= 400:
        return f"code step: {status} {data}"
    s = data.get('data') or data
    test_data['code_step_id'] = s.get('id')
    return True
test("Add code step", test_add_code_step)

def test_add_approval_step():
    status, data = req('POST', f'/workflows/{wid()}/steps', {
        'step_type':'approval','label':'Approve Result',
        'config':{'message':'Please approve the transform result'},
        'position':{'x':700,'y':100}
    }, expect=201)
    if status >= 400:
        return f"approval step: {status} {data}"
    s = data.get('data') or data
    test_data['approval_step_id'] = s.get('id')
    return True
test("Add approval step", test_add_approval_step)

def test_add_error_handler_step():
    status, data = req('POST', f'/workflows/{wid()}/steps', {
        'step_type':'error_handler','label':'Error Fallback',
        'config':{'error_type':'any','fallback_action':'continue'},
        'position':{'x':400,'y':300}
    }, expect=201)
    if status >= 400:
        return f"error handler: {status} {data}"
    s = data.get('data') or data
    test_data['error_handler_id'] = s.get('id')
    return True
test("Add error handler", test_add_error_handler_step)

def test_connect_steps():
    # webhook -> code
    status1, d1 = req('POST', f'/workflows/{wid()}/step-connections', {
        'source_step_id': test_data['webhook_step_id'],
        'target_step_id': test_data['code_step_id'],
        'connection_type': 'success'
    }, expect=201)
    # code -> approval
    status2, d2 = req('POST', f'/workflows/{wid()}/step-connections', {
        'source_step_id': test_data['code_step_id'],
        'target_step_id': test_data['approval_step_id'],
        'connection_type': 'success'
    }, expect=201)
    if status1 >= 400 or status2 >= 400:
        return f"connections: {status1}/{status2}"
    return True
test("Connect webhook → code → approval", test_connect_steps)

# ── 4. DEPLOY + EXECUTE ──
print(f"\n{YELLOW}{BOLD}[4/5] Deploy & Execute{END}")

def test_deploy():
    status, data = req('POST', f'/workflows/{wid()}/deploy', expect=200)
    if status >= 400:
        return f"deploy: {status} {data}"
    return True
test("Deploy workflow", test_deploy)

def test_execute():
    status, data = req('POST', f'/workflows/{wid()}/execute', {
        'input_data': {'data': [1,2,3,4,5]},
        'priority': 'high'
    }, expect=201)
    if status >= 400:
        return f"execute: {status} {data}"
    exec_data = data.get('data') or data
    test_data['execution_id'] = exec_data.get('id')
    return True
test("Execute workflow (high priority)", test_execute)

def test_execution_completes():
    time.sleep(5)
    exec_id = test_data['execution_id']
    for i in range(10):
        status, data = req('GET', f'/executions/{exec_id}')
        if status >= 400:
            return f"get execution: {status} {data}"
        exec_data = data.get('data') or data
        exec_status = exec_data.get('status','')
        if exec_status == 'completed':
            # Check step results
            results = exec_data.get('execution_step_results') or exec_data.get('step_results',[])
            if len(results) >= 2:
                return True
            return f"execution completed but no step results: {json.dumps(data)[:300]}"
        elif exec_status == 'failed':
            return f"execution failed: {exec_data.get('error_message','?')}"
        elif exec_status == 'paused':
            test_data['paused'] = True
            return True  # Paused at approval — that's expected!
        time.sleep(2)
    return f"execution still {exec_status} after 20s"
test("Execution completes (or pauses at approval)", test_execution_completes)

# ── 5. WEBHOOK + APPROVAL ──
print(f"\n{YELLOW}{BOLD}[5/5] Webhook Trigger & Approval Response{END}")

def test_webhook_trigger():
    token_val = test_data.get('webhook_trigger','')
    if not token_val:
        return "no webhook token"
    # Public route — no auth
    global token
    saved_token = token
    token = None
    status, data = req('POST', f'/webhook/{token_val}', {'data': [10,20,30]})
    token = saved_token  # restore
    if status >= 400:
        return f"webhook trigger: {status} {data}"
    wh_data = data if 'execution_id' in data else data.get('data',{})
    test_data['webhook_execution_id'] = wh_data.get('execution_id')
    return True
test("Webhook trigger creates execution", test_webhook_trigger)

def test_webhook_execution():
    exec_id = test_data.get('webhook_execution_id')
    if not exec_id:
        return "no webhook execution id"
    time.sleep(5)
    for i in range(10):
        status, data = req('GET', f'/executions/{exec_id}')
        exec_data = data.get('data') or data
        exec_status = exec_data.get('status','')
        if exec_status in ('completed', 'paused'):
            return True
        elif exec_status == 'failed':
            return f"webhook exec failed: {exec_data.get('error_message','?')}"
        time.sleep(2)
    return f"webhook exec still {exec_status} after 20s"
test("Webhook execution processes", test_webhook_execution)

def test_approval_respond():
    # Check pending approvals
    status, data = req('GET', '/approvals/pending')
    if status >= 400:
        return f"list approvals: {status} {data}"
    pending = data.get('data',[])
    if not pending:
        return "no pending approvals"
    # Approve the first one
    approval = pending[0]
    status2, d2 = req('POST', f'/approvals/{approval["id"]}/respond', {'decision':'approved','note':'Looks good!'})
    if status2 >= 400:
        return f"approve: {status2} {d2}"
    return True
test("Approve pending request", test_approval_respond)

def test_approval_resumes():
    time.sleep(3)
    exec_id = test_data.get('execution_id')
    for i in range(10):
        status, data = req('GET', f'/executions/{exec_id}')
        exec_data = data.get('data') or data
        exec_status = exec_data.get('status','')
        if exec_status == 'completed':
            return True
        elif exec_status == 'failed':
            return f"execution failed after approval: {exec_data.get('error_message','?')}"
        time.sleep(2)
    return f"execution still {exec_status} after 20s"
test("Execution resumes & completes after approval", test_approval_resumes)

def test_queue_stats():
    status, data = req('GET', '/queue/stats')
    if status >= 400:
        return f"queue stats: {status} {data}"
    return True
test("Queue monitor stats", test_queue_stats)

# ── RESULTS ──
print(f"\n{CYAN}{BOLD}═══════════════════════════════════════{END}")
total = passed + failed
if failed == 0:
    print(f"{GREEN}{BOLD}  ALL {passed}/{passed} TESTS PASSED ✅{END}")
else:
    print(f"{RED}{BOLD}  {failed}/{total} TESTS FAILED ❌{END}")
print(f"{CYAN}{BOLD}═══════════════════════════════════════{END}\n")
