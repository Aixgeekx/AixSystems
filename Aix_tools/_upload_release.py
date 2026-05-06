import subprocess, sys, os

# Get token
p = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n', capture_output=True, text=True, encoding='utf-8')
for line in p.stdout.splitlines():
    if line.startswith('password='):
        token = line.split('=', 1)[1]
        break
else:
    print('No token found')
    sys.exit(1)

import requests
headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json'}
url = 'https://api.github.com/repos/Aixgeekx/AixSystems/releases'
releases = requests.get(url, headers=headers).json()
existing = [r for r in releases if r.get('tag_name') == 'v0.85.0']
if existing:
    release_id = existing[0]['id']
    upload_url = existing[0]['upload_url'].replace('{?name,label}', '')
    print('Release exists, id:', release_id)
else:
    body = {'tag_name': 'v0.85.0', 'name': 'AixSystems v0.85.0', 'body': 'v0.85.0: 日记统计新增写作效率评分+时段偏好+字数里程碑+本月vs上月对比+TOP3高产日+最佳写作周'}
    r = requests.post(url, headers={**headers, 'Content-Type': 'application/json'}, json=body)
    if r.status_code not in (200, 201):
        print('Create release failed:', r.status_code, r.text)
        sys.exit(1)
    release_id = r.json()['id']
    upload_url = r.json()['upload_url'].replace('{?name,label}', '')
    print('Created release id:', release_id)

assets = [
    ('results/AixSystems-0.85.0-Setup.exe', 'AixSystems-0.85.0-Setup.exe'),
    ('results/AixSystems-0.85.0-portable.exe', 'AixSystems-0.85.0-portable.exe'),
    ('results/AixSystems-0.85.0-project.zip', 'AixSystems-0.85.0-project.zip'),
]
for path, name in assets:
    print('Uploading', name)
    with open(path, 'rb') as f:
        r = requests.post(f"{upload_url}?name={name}", headers={'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/octet-stream'}, data=f, stream=True)
    print(name, r.status_code, r.json().get('browser_download_url','')[:60] if r.status_code in (200,201) else r.text[:200])
print('Done')
