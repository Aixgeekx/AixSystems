import json, os, subprocess, urllib.request, urllib.parse

ROOT = 'E:/Desktop/Aix_ai/AixApp'
OWNER = 'Aixgeekx'
REPO = 'AixSystems'
API = f'https://api.github.com/repos/{OWNER}/{REPO}'

def token():
    proc = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n', text=True, capture_output=True, check=False)
    for line in proc.stdout.splitlines():
        if line.startswith('password='):
            return line.split('=', 1)[1].strip()
    return os.getenv('GITHUB_TOKEN') or os.getenv('GH_TOKEN')

auth = token()
req = urllib.request.Request(f'{API}/releases/tags/v0.64.0', headers={'Accept':'application/vnd.github+json','Authorization':f'Bearer {auth}','X-GitHub-Api-Version':'2022-11-28'})
with urllib.request.urlopen(req) as resp:
    release = json.loads(resp.read())
upload_url = release['upload_url'].split('{', 1)[0]
file_path = f'{ROOT}/results/AixSystems-0.64.0-project.zip'
url = f'{upload_url}?name={urllib.parse.quote("AixSystems-0.64.0-project.zip")}'
req2 = urllib.request.Request(url, data=open(file_path, 'rb').read(), method='POST', headers={'Accept':'application/vnd.github+json','Authorization':f'Bearer {auth}','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/zip'})
try:
    with urllib.request.urlopen(req2) as resp:
        print('OK project ZIP uploaded')
except urllib.error.HTTPError as e:
    if e.code == 422:
        print('SKIP project ZIP already exists')
    else:
        raise
