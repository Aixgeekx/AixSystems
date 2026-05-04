import zipfile, os
from pathlib import Path

src = Path('E:/Desktop/Aix_ai/AixApp')
dst = src / 'results' / 'AixSystems-0.66.0-project.zip'
exclude = {'node_modules', 'dist', 'dist-installer', '.git', '.vite', '__pycache__', '.claude'}
include_dirs = ['code', 'desktop', 'Aix_tools', 'title', 'data', 'results']
include_files = ['.gitignore', 'CLAUDE.md']

with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as zf:
    for d in include_dirs:
        base = src / d
        if not base.exists():
            continue
        for root, dirs, files in os.walk(base):
            dirs[:] = [x for x in dirs if x not in exclude]
            for f in files:
                if f.endswith('.tmp') or f.endswith('.bak'):
                    continue
                p = Path(root) / f
                arcname = str(p.relative_to(src)).replace('\\', '/')
                zf.write(p, arcname)
    for f in include_files:
        p = src / f
        if p.exists():
            zf.write(p, f)
    print('Created', dst, 'size', dst.stat().st_size)
