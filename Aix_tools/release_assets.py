#!/usr/bin/env python3
# Release 资产上传器 - 将本地历史安装包按版本挂到对应 GitHub Release
from __future__ import annotations
import json
import mimetypes
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'desktop' / 'dist-installer'
OWNER = 'Aixgeekx'
REPO = 'AixSystems'
API = f'https://api.github.com/repos/{OWNER}/{REPO}'
ASSET_RE = re.compile(r'AixSystems-(?:v)?(?P<version>\d+\.\d+\.\d+)(?:-.+)?\.(?:exe|blockmap|zip)$')


def token() -> str:
    env = os.getenv('GITHUB_TOKEN') or os.getenv('GH_TOKEN')
    if env:
        return env.strip()
    proc = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n', text=True, capture_output=True, check=False)
    for line in proc.stdout.splitlines():
        if line.startswith('password='):
            return line.split('=', 1)[1].strip()
    raise SystemExit('未找到 GitHub token，请先登录 git credential 或设置 GITHUB_TOKEN。')


def request(method: str, url: str, auth: str, data: bytes | None = None, content_type: str = 'application/json'):
    req = urllib.request.Request(url, data=data, method=method, headers={
        'Accept': 'application/vnd.github+json',
        'Authorization': f'Bearer {auth}',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': content_type,
        'User-Agent': 'AixSystems-release-assets'
    })
    with urllib.request.urlopen(req, timeout=120) as resp:
        body = resp.read().decode('utf-8')
        return json.loads(body) if body else None


def get_release(auth: str, tag: str):
    try:
        return request('GET', f'{API}/releases/tags/{tag}', auth)
    except urllib.error.HTTPError as err:
        if err.code != 404:
            raise
    body = json.dumps({'tag_name': tag, 'name': f'AixSystems {tag}', 'body': '历史安装包补档 Release。', 'draft': False, 'prerelease': False}).encode('utf-8')
    return request('POST', f'{API}/releases', auth, body)


def upload(auth: str, release, file: Path):
    names = {asset['name'] for asset in release.get('assets', [])}
    if file.name in names:
        print(f'SKIP {release["tag_name"]}: {file.name}')
        return
    upload_url = release['upload_url'].split('{', 1)[0]
    ctype = mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
    url = f'{upload_url}?name={urllib.parse.quote(file.name)}'
    request('POST', url, auth, file.read_bytes(), ctype)
    print(f'OK   {release["tag_name"]}: {file.name}')


def main():
    auth = token()
    files = sorted(p for p in DIST.iterdir() if p.is_file() and ASSET_RE.match(p.name))
    by_tag: dict[str, list[Path]] = {}
    for file in files:
        version = ASSET_RE.match(file.name).group('version')
        by_tag.setdefault(f'v{version}', []).append(file)
    if not by_tag:
        raise SystemExit(f'未找到可上传资产：{DIST}')
    for tag, assets in sorted(by_tag.items()):
        release = get_release(auth, tag)
        for asset in assets:
            upload(auth, release, asset)


if __name__ == '__main__':
    main()
