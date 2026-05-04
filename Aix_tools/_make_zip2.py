import zipfile, os
from pathlib import Path

src = Path('E:/Desktop/Aix_ai/AixApp')
dst = src / 'results' / 'AixSystems-0.71.0-project.zip'
exclude_dirs = {'node_modules', 'dist', 'dist-installer', '.git', '.vite', '__pycache__', '.claude'}
exclude_exts = {'.tmp', '.bak', '.exe', '.zip'}
include_dirs = ['code', 'desktop', 'Aix_tools', 'title', 'data', 'results']
include_files = ['.gitignore', 'CLAUDE.md']

with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as zf:
    for d in include_dirs:
        base = src / d
        if not base.exists():
            continue
        for root, dirs, files in os.walk(base):
            # Exclude unwanted directories
            dirs[:] = [x for x in dirs if x not in exclude_dirs]
            for f in files:
                if any(f.endswith(e) for e in exclude_exts):
                    continue
                p = Path(root) / f
                if not p.exists():
                    continue
                arcname = str(p.relative_to(src)).replace(chr(92), '/')
                zf.write(str(p), arcname)
    for f in include_files:
        p = src / f
        if p.exists():
            zf.write(str(p), f)

size = dst.stat().st_size
print(f'Created {dst} size {size}')
