from itertools import product

# 100 English words suitable for company names
english_words = [
    "Nova", "Peak", "Vision", "Bright", "Sky", "Core", "Prime", "Elite",
    "Future", "Spark", "Rise", "Vertex", "Summit", "Pioneer", "Unity",
    "Dynamic", "Infinite", "Global", "Modern", "Smart", "Golden", "Silver",
    "Blue", "Green", "Crystal", "Royal", "Phoenix", "Eagle", "Falcon",
    "Horizon", "Everest", "Atlas", "Star", "Moon", "Sun", "Orbit", "Pulse",
    "Nexus", "Fusion", "Bridge", "Crown", "Master", "Leader", "Advance",
    "Value", "Power", "Trust", "Success", "Victory", "Harmony", "Origin",
    "Matrix", "Empire", "Legacy", "Pinnacle", "Frontier", "Gateway",
    "Zenith", "Beacon", "Aspire", "Crest", "Momentum", "Impact", "Prosper",
    "Thrive", "Growth", "Innovate", "Venture", "Capital", "Anchor",
    "Aurora", "Blossom", "Quest", "Path", "Stone", "River", "Mountain",
    "Oasis", "Energy", "Wisdom", "Liberty", "Unity", "Fortune", "Advance",
    "Infinity", "Diamond", "Legend", "Radiant", "Dynamic", "Courage",
    "Progress", "Pride", "Integrity", "Genius", "Network", "Focus",
    "Excellence", "Merit", "Visionary", "Next"
]

# Remove duplicates and keep exactly 100
english_words = list(dict.fromkeys(english_words))[:100]

# 100 Dari/Pashto words suitable for company names
local_words = [
    "پخلا", "زرین", "روښان", "بریا", "هیله", "ارمان", "دوست", "اتل",
    "سپوږمۍ", "غر", "ستوری", "لمر", "سحر", "ویاړ", "بریالی", "پرمختګ",
    "روښانتیا", "ارزښت", "خدمت", "نوښت", "پیاوړی", "باور", "همت", "ځواک",
    "اتحاد", "سوکالي", "ځلانده", "روان", "پرمختیا", "کور", "بنسټ", "سپین",
    "شین", "طلایي", "سپوږمیز", "ښکلا", "سمسور", "پتمن", "بریمن", "امید",
    "وفا", "صداقت", "ریښتیا", "لار", "هدف", "چټک", "لوړ", "پیاوړتیا",
    "ښه", "تکړه", "غوړېدنه", "بریالیتوب", "ځلېدنه", "هوسا", "رڼا", "روښانه",
    "همغږي", "جوړښت", "نوې", "پېژند", "نړیوال", "ځمکه", "اسمان", "سپرلی",
    "ګل", "باران", "سیند", "څپه", "مرغلره", "زمرد", "الماس", "شفق",
    "سهار", "ماښام", "نیکمرغي", "هاند", "تلاش", "پیاوړ", "بیدار", "ودان",
    "اباد", "مهتاب", "صدف", "سمون", "چینه", "پالنه", "سرچینه", "غښتلی",
    "شمله", "ارزانه", "بریمنه", "ځواکمن", "خلاق", "امانت", "مینه", "ملی",
    "عزت", "وقار", "پرتو", "ځلانده", "ځواک"
]

# Remove duplicates and keep exactly 100
local_words = list(dict.fromkeys(local_words))[:100]

all_names = set()

for eng, local in product(english_words, local_words):
    all_names.add(eng + local)
    all_names.add(local + eng)
    all_names.add(eng + "-" + local)
    all_names.add(local + "-" + eng)

print(f"Generated {len(all_names)} company names.\n")

# Save to a text file
with open("company_names.txt", "w", encoding="utf-8") as f:
    for name in sorted(all_names):
        f.write(name + "\n")

print("All company names have been saved to company_names.txt")