from PIL import Image, ImageDraw                                        # Pillow
import pathlib                                                          # 标准库

SRC = pathlib.Path(r"C:\Users\123\.claude\image-cache\b92132c5-80ff-406a-a7cf-d5d11c9c70f6\1.png")
ROOT = pathlib.Path(__file__).resolve().parent.parent                   # 项目根
DARK_THR = 150                                                          # 深色像素阈值 (R+G+B 均值)
PAD = 0.14                                                              # 裁剪后四周留白比例 (渐变底 logo 小一点更精致)
BG_TOP_LEFT = (62, 33, 96)                                              # 渐变起点: 深紫 #3E2160
BG_BOT_RIGHT = (122, 30, 92)                                            # 渐变终点: 紫红 #7A1E5C
CORNER = 0.22                                                           # 圆角半径占画布比例 (iOS 风)
LOGO_COLOR = (232, 230, 234)                                            # 银白 #E8E6EA

PNG_OUTS = [                                                            # PNG 产物
    (512, ROOT / "desktop/build/icon.png"),
    (192, ROOT / "code/public/icons/icon-192.png"),
    (512, ROOT / "code/public/icons/icon-512.png"),
    (192, ROOT / "code/dist/icons/icon-192.png"),
    (512, ROOT / "code/dist/icons/icon-512.png"),
]
ICO_SIZES = [(256,256),(128,128),(64,64),(48,48),(32,32),(16,16)]       # ICO 多尺寸
ICO_OUT = ROOT / "desktop/build/icon.ico"

def extract_logo() -> Image.Image:                                      # 提取符号为 RGBA (深墨色+透明背景)
    src = Image.open(SRC).convert("RGBA")
    w, h = src.size
    px = src.load()
    minx, miny, maxx, maxy = w, h, 0, 0                                 # 扫描深色 bbox
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            if r + g + b < DARK_THR * 3:
                if x < minx: minx = x
                if y < miny: miny = y
                if x > maxx: maxx = x
                if y > maxy: maxy = y
    crop = src.crop((minx, miny, maxx + 1, maxy + 1))                   # 精确裁到符号
    cw, ch = crop.size
    logo = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))                    # 重建为 RGBA,深色→不透明统一墨色
    cpx = crop.load(); lpx = logo.load()
    for y in range(ch):
        for x in range(cw):
            r, g, b, _ = cpx[x, y]
            lum = (r + g + b) / 3
            a = max(0, min(255, int((200 - lum) * 255 / 150)))          # 越暗越不透明
            if a > 0:
                lpx[x, y] = (*LOGO_COLOR, a)
    return logo

def make_gradient(size: int) -> Image.Image:                            # 左上→右下对角渐变
    grad = Image.new("RGB", (size, size))
    gpx = grad.load()
    r1,g1,b1 = BG_TOP_LEFT; r2,g2,b2 = BG_BOT_RIGHT
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))                              # 对角插值 0..1
            gpx[x, y] = (int(r1 + (r2 - r1) * t),
                         int(g1 + (g2 - g1) * t),
                         int(b1 + (b2 - b1) * t))
    return grad.convert("RGBA")

def make_icon(size: int, logo: Image.Image) -> Image.Image:             # 合成单张图标
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size),
                                           radius=int(size * CORNER), fill=255)
    bg = make_gradient(size)
    canvas.paste(bg, (0, 0), mask)
    area = int(size * (1 - PAD * 2))                                    # logo 可用区域
    lw, lh = logo.size
    ratio = min(area / lw, area / lh)
    nw, nh = max(1, int(lw * ratio)), max(1, int(lh * ratio))
    resized = logo.resize((nw, nh), Image.LANCZOS)
    canvas.alpha_composite(resized, ((size - nw) // 2, (size - nh) // 2))
    return canvas

def main():
    logo = extract_logo()
    print(f"[logo] cropped size = {logo.size}")
    for size, path in PNG_OUTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        make_icon(size, logo).save(path, "PNG", optimize=True)
        print(f"[PNG] {path.relative_to(ROOT)}  {size}x{size}  ({path.stat().st_size} B)")
    ico_master = make_icon(256, logo)                                   # ICO 主图 256
    ico_master.save(ICO_OUT, format="ICO", sizes=ICO_SIZES)
    print(f"[ICO] {ICO_OUT.relative_to(ROOT)}  multi-size  ({ICO_OUT.stat().st_size} B)")

if __name__ == "__main__":
    main()
