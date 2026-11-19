import os
from PIL import Image, ImageDraw, ImageFont

ITEMS = [
    # Tools (5)
    {'num': 1, 'id': 'demo-cordless-drill', 'title': 'Cordless Drill/Driver (20V)', 'cat': 'Tools', 'file': 'cordless-drill.jpg'},
    {'num': 2, 'id': 'demo-electric-screwdriver', 'title': 'Precision Electric Screwdriver', 'cat': 'Tools', 'file': 'electric-screwdriver.jpg'},
    {'num': 3, 'id': 'demo-complete-toolkit', 'title': 'Household Hand Tool & Socket Set', 'cat': 'Tools', 'file': 'complete-toolkit.jpg'},
    {'num': 4, 'id': 'demo-impact-driver', 'title': 'Cordless Impact Driver', 'cat': 'Tools', 'file': 'impact-driver.jpg'},
    {'num': 5, 'id': 'demo-wet-dry-shop-vac', 'title': 'Wet & Dry Workshop Vacuum', 'cat': 'Tools', 'file': 'wet-dry-shop-vac.jpg'},
    # Gardening (4)
    {'num': 6, 'id': 'demo-pruning-shears', 'title': 'Bypass Pruning Shears', 'cat': 'Gardening', 'file': 'pruning-shears.jpg'},
    {'num': 7, 'id': 'demo-hedge-trimmer', 'title': 'Cordless Hedge Trimmer', 'cat': 'Gardening', 'file': 'hedge-trimmer.jpg'},
    {'num': 8, 'id': 'demo-electric-lawn-mower', 'title': 'Push Lawn Mower', 'cat': 'Gardening', 'file': 'electric-lawn-mower.jpg'},
    {'num': 9, 'id': 'demo-cordless-leaf-blower', 'title': 'Cordless Leaf Blower', 'cat': 'Gardening', 'file': 'cordless-leaf-blower.jpg'},
    # Household (4)
    {'num': 10, 'id': 'demo-sewing-machine', 'title': 'Household Sewing Machine', 'cat': 'Household', 'file': 'sewing-machine.jpg'},
    {'num': 11, 'id': 'demo-carpet-steam-cleaner', 'title': 'Spot Cleaner & Upholstery Vacuum', 'cat': 'Household', 'file': 'carpet-steam-cleaner.jpg'},
    {'num': 12, 'id': 'demo-garment-steamer', 'title': 'Handheld Garment Steamer', 'cat': 'Household', 'file': 'garment-steamer.jpg'},
    {'num': 13, 'id': 'demo-air-purifier', 'title': 'Portable Tower Air Purifier', 'cat': 'Household', 'file': 'air-purifier.jpg'},
    # Outdoor (4)
    {'num': 14, 'id': 'demo-camping-tent', 'title': 'Family Cabin Camping Tent', 'cat': 'Outdoor', 'file': 'camping-tent.jpg'},
    {'num': 15, 'id': 'demo-portable-camp-stove', 'title': 'Portable Camping Gas Stove', 'cat': 'Outdoor', 'file': 'portable-camp-stove.jpg'},
    {'num': 16, 'id': 'demo-folding-camping-chairs', 'title': 'Folding Camping Chairs (Set)', 'cat': 'Outdoor', 'file': 'folding-camping-chairs.jpg'},
    {'num': 17, 'id': 'demo-portable-camping-table', 'title': 'Folding Camping Table', 'cat': 'Outdoor', 'file': 'portable-camping-table.jpg'},
    # Electronics (3)
    {'num': 18, 'id': 'demo-portable-projector', 'title': 'Portable HD Movie Projector', 'cat': 'Electronics', 'file': 'portable-projector.jpg'},
    {'num': 19, 'id': 'demo-portable-bluetooth-speaker', 'title': 'Wireless Bluetooth Speaker', 'cat': 'Electronics', 'file': 'portable-bluetooth-speaker.jpg'},
    {'num': 20, 'id': 'demo-portable-power-station', 'title': 'Portable Battery Power Station', 'cat': 'Electronics', 'file': 'portable-power-station.jpg'},
]

CAT_COLORS = {
    'Tools': {'bg': (239, 246, 255), 'border': (147, 197, 253), 'text': (29, 78, 216)},
    'Gardening': {'bg': (240, 253, 244), 'border': (134, 239, 172), 'text': (21, 128, 61)},
    'Household': {'bg': (254, 242, 242), 'border': (252, 165, 165), 'text': (185, 28, 28)},
    'Outdoor': {'bg': (254, 243, 199), 'border': (252, 211, 77), 'text': (180, 83, 9)},
    'Electronics': {'bg': (245, 243, 255), 'border': (196, 181, 253), 'text': (109, 40, 217)},
}

def generate_contact_sheet():
    COLS = 5
    ROWS = 4
    THUMB_W = 360
    THUMB_H = 270
    CARD_PAD = 14
    CARD_W = THUMB_W + (CARD_PAD * 2)
    CARD_H = THUMB_H + 85
    GAP_X = 24
    GAP_Y = 24
    MARGIN_X = 50
    MARGIN_TOP = 130
    MARGIN_BOTTOM = 60

    SHEET_W = (MARGIN_X * 2) + (COLS * CARD_W) + ((COLS - 1) * GAP_X)
    SHEET_H = MARGIN_TOP + (ROWS * CARD_H) + ((ROWS - 1) * GAP_Y) + MARGIN_BOTTOM

    sheet = Image.new('RGB', (SHEET_W, SHEET_H), color=(248, 250, 252))
    draw = ImageDraw.Draw(sheet)

    font_title_main = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 36)
    font_sub_main = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
    font_card_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 15)
    font_badge = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 13)
    font_num = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 13)

    # Header
    draw.text((MARGIN_X, 36), "BorrowNest — Verified 20-Product Example Catalogue", fill=(15, 23, 42), font=font_title_main)
    draw.text(
        (MARGIN_X, 82),
        "Every product verified with genuine physical photography • 5 Categories: Tools (5), Gardening (4), Household (4), Outdoor (4), Electronics (3)",
        fill=(71, 85, 105),
        font=font_sub_main
    )

    for idx, item in enumerate(ITEMS):
        col = idx % COLS
        row = idx // COLS

        card_x = MARGIN_X + col * (CARD_W + GAP_X)
        card_y = MARGIN_TOP + row * (CARD_H + GAP_Y)

        # Card container with rounded rect
        draw.rounded_rectangle(
            (card_x, card_y, card_x + CARD_W, card_y + CARD_H),
            radius=12,
            fill=(255, 255, 255),
            outline=(226, 232, 240),
            width=1
        )

        # Thumbnail
        img_path = os.path.join('public/demo/items_final', item['file'])
        thumb = Image.open(img_path).convert('RGB').resize((THUMB_W, THUMB_H), Image.Resampling.LANCZOS)
        sheet.paste(thumb, (card_x + CARD_PAD, card_y + CARD_PAD))

        # Photo border
        draw.rectangle(
            (card_x + CARD_PAD, card_y + CARD_PAD, card_x + CARD_PAD + THUMB_W, card_y + CARD_PAD + THUMB_H),
            outline=(226, 232, 240),
            width=1
        )

        # Category pill
        cat = item['cat']
        cat_style = CAT_COLORS.get(cat, {'bg': (241, 245, 249), 'border': (203, 213, 225), 'text': (51, 65, 85)})
        badge_y = card_y + CARD_PAD + THUMB_H + 12
        badge_text = f"#{item['num']} • {cat}"

        # Measure badge text
        bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
        bw = bbox[2] - bbox[0] + 16
        bh = 22
        badge_x = card_x + CARD_PAD

        draw.rounded_rectangle(
            (badge_x, badge_y, badge_x + bw, badge_y + bh),
            radius=6,
            fill=cat_style['bg'],
            outline=cat_style['border'],
            width=1
        )
        draw.text((badge_x + 8, badge_y + 2), badge_text, fill=cat_style['text'], font=font_badge)

        # Title
        title_y = badge_y + bh + 8
        draw.text((card_x + CARD_PAD, title_y), item['title'], fill=(15, 23, 42), font=font_card_title)

    out_file = 'docs/assets/DEMO_CATALOGUE_CONTACT_SHEET.webp'
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    sheet.save(out_file, 'WEBP', quality=90)
    print(f"Generated {out_file}: {sheet.size}, {os.path.getsize(out_file)} bytes")

if __name__ == '__main__':
    generate_contact_sheet()
