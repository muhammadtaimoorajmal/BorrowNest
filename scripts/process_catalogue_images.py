import os
from PIL import Image

ITEMS = [
    {'target': 'cordless-drill.jpg', 'src': 'public/demo/items/cordless-drill.jpg', 'crop_mode': 'direct'},
    {'target': 'electric-screwdriver.jpg', 'src': 'public/demo/items/screwdriver-19144413.jpg', 'crop_mode': 'center'},
    {'target': 'complete-toolkit.jpg', 'src': 'public/demo/items/toolkit-3855223.jpg', 'crop_mode': 'center'},
    {'target': 'impact-driver.jpg', 'src': 'public/demo/items/impact-driver-raw.jpg', 'crop_mode': 'center'},
    {'target': 'wet-dry-shop-vac.jpg', 'src': 'public/demo/items/shopvac-6196579.jpg', 'crop_mode': 'portrait_top', 'top': 0},
    {'target': 'pruning-shears.jpg', 'src': 'public/demo/items/pruner-unsplash.jpg', 'crop_mode': 'center'},
    {'target': 'hedge-trimmer.jpg', 'src': 'public/demo/items/shears-24595770.jpg', 'crop_mode': 'portrait_top', 'top': 160},
    {'target': 'electric-lawn-mower.jpg', 'src': 'public/demo/items/mower-test.jpg', 'crop_mode': 'center'},
    {'target': 'cordless-leaf-blower.jpg', 'src': 'public/demo/items/blower-test.jpg', 'crop_mode': 'center'},
    {'target': 'sewing-machine.jpg', 'src': 'public/demo/items/sewing-machine-2.jpg', 'crop_mode': 'center'},
    {'target': 'carpet-steam-cleaner.jpg', 'src': 'public/demo/items/upholstery-4401538.jpg', 'crop_mode': 'center'},
    {'target': 'garment-steamer.jpg', 'src': 'public/demo/items/steamer-test.jpg', 'crop_mode': 'center'},
    {'target': 'air-purifier.jpg', 'src': 'public/demo/items/air-purifier-test.jpg', 'crop_mode': 'portrait_top', 'top': 450},
    {'target': 'camping-tent.jpg', 'src': 'public/demo/items/camping-tent.jpg', 'crop_mode': 'direct'},
    {'target': 'portable-camp-stove.jpg', 'src': 'public/demo/items/stove-6831220.jpg', 'crop_mode': 'center'},
    {'target': 'folding-camping-chairs.jpg', 'src': 'public/demo/items/chairs-test.jpg', 'crop_mode': 'center'},
    {'target': 'portable-camping-table.jpg', 'src': 'public/demo/items/table-9354585.jpg', 'crop_mode': 'center'},
    {'target': 'portable-projector.jpg', 'src': 'public/demo/items/projector-31726737.jpg', 'crop_mode': 'portrait_top', 'top': 280},
    {'target': 'portable-bluetooth-speaker.jpg', 'src': 'public/demo/items/speaker-test.jpg', 'crop_mode': 'center'},
    {'target': 'portable-power-station.jpg', 'src': 'public/demo/items/zendure-1.jpg', 'crop_mode': 'center'},
]

os.makedirs('public/demo/items_final', exist_ok=True)

for item in ITEMS:
    im = Image.open(item['src']).convert('RGB')
    mode = item['crop_mode']
    if mode == 'direct':
        res = im.resize((600, 450), Image.Resampling.LANCZOS)
    elif mode == 'portrait_top':
        w, h = im.size
        top = item['top']
        target_w = w
        target_h = int(w * 0.75)
        res = im.crop((0, top, target_w, top + target_h)).resize((600, 450), Image.Resampling.LANCZOS)
    elif mode == 'center':
        w, h = im.size
        target_ratio = 4.0 / 3.0
        current_ratio = w / h
        if current_ratio > target_ratio:
            new_w = int(h * target_ratio)
            left = (w - new_w) // 2
            crop_box = (left, 0, left + new_w, h)
        else:
            new_h = int(w / target_ratio)
            top = (h - new_h) // 2
            crop_box = (0, top, w, top + new_h)
        res = im.crop(crop_box).resize((600, 450), Image.Resampling.LANCZOS)
    
    out_path = os.path.join('public/demo/items_final', item['target'])
    res.save(out_path, 'JPEG', quality=85)
    print(f"Saved {item['target']:30} size: {res.size} file: {os.path.getsize(out_path)} bytes")

print("All 20 processed successfully!")
