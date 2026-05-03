#!/bin/bash
# Background image generation script for all 75 adult products
# Runs sequentially with delays to avoid rate limiting

LOGFILE="/home/z/my-project/generation_results.txt"
OUTDIR="/home/z/my-project/public/images/products"

echo "START:$(date +%s)" > "$LOGFILE"
SUCCESS=0
FAIL=0

generate() {
  local slug="$1"
  local prompt="$2"
  local output="${OUTDIR}/${slug}.png"
  
  if [ -f "$output" ] && [ -s "$output" ]; then
    echo "SKIP:$slug:already_exists" >> "$LOGFILE"
    return 0
  fi
  
  if z-ai image -p "$prompt" -o "$output" -s 1024x1024 2>/dev/null; then
    echo "OK:$slug" >> "$LOGFILE"
    SUCCESS=$((SUCCESS+1))
    return 0
  else
    echo "FAIL:$slug" >> "$LOGFILE"
    FAIL=$((FAIL+1))
    return 1
  fi
}

# 1-5
generate "pornhub-premium" "Professional digital Premium streaming service PH brand, dark premium background with orange and black accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "xhamster-premium" "Professional digital Premium streaming service XH brand, dark premium background with amber and charcoal accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "faphouse-premium" "Professional digital Premium streaming service FH brand, dark premium background with deep purple and gold accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "brazzers-original" "Professional digital Premium streaming service BZ brand, dark premium background with gold and dark navy accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "fap-house-ultra" "Professional digital Ultra premium streaming service Fhu brand, dark premium background with platinum and dark violet accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 6-10
generate "xnxx-gold-premium" "Professional digital Gold premium streaming service XG brand, dark premium background with gold and midnight blue accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "xvideos-red" "Professional digital Red premium streaming service XV brand, dark premium background with crimson and black accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "kooku-gold" "Professional digital Indian streaming service Kooku brand, dark premium background with red and gold Bollywood style accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "ullu-gold" "Professional digital Indian streaming service Ullu brand, dark premium background with deep red and gold South Asian style accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "bangbros" "Professional digital Premium network streaming BB brand, dark premium background with blue and silver accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 11-15
generate "reality-kings" "Professional digital Premium streaming network RK brand, dark premium background with royal blue and gold accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "mofos" "Professional digital Premium streaming network MF brand, dark premium background with teal and charcoal accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "babes" "Professional digital Premium streaming network elegant style, dark premium background with rose gold and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "digital-playground" "Professional digital entertainment platform DP brand, dark premium background with neon blue and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "fakehub" "Professional digital Streaming network hub FH brand, dark premium background with green and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 16-20
generate "sexy-hub" "Professional digital Premium hub streaming service SH brand, dark premium background with magenta and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "blacked" "Professional digital Premium streaming service BLK brand, dark premium background with black and white minimalist luxury accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "blacked-raw" "Professional digital Raw premium streaming service BLR brand, dark premium background with black and white with red accent, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "tushy" "Professional digital Premium streaming service T brand, dark premium background with white and black luxury accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "tushy-raw" "Professional digital Raw premium streaming TR brand, dark premium background with white and black with silver accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 21-25
generate "vixen" "Professional digital Premium streaming service V brand, dark premium background with emerald green and gold luxury accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "slayed" "Professional digital Premium streaming service S brand, dark premium background with purple and silver luxury accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "deeper" "Professional digital Premium streaming service D brand, dark premium background with deep blue and platinum accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "milfy" "Professional digital Premium streaming service ML brand, dark premium background with warm amber and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "niksindian" "Professional digital Indian premium streaming NI brand, dark premium background with saffron and dark desi style accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 26-30
generate "erito" "Professional digital Japanese streaming service Erito brand, dark premium background with pink and white sakura style accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "hentai-pros" "Professional digital Anime streaming service HP brand, dark premium background with pink and purple anime style accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "jav-hd" "Professional digital Japanese HD streaming JAV brand, dark premium background with pink and white Tokyo neon accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "av69-tv" "Professional digital Japanese streaming service AV69 brand, dark premium background with cherry blossom pink and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "gangav" "Professional digital Japanese streaming network GA brand, dark premium background with coral pink and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 31-35
generate "shiofuky" "Professional digital Japanese streaming service SF brand, dark premium background with lavender and white zen style accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "hey-milf" "Professional digital Japanese streaming service HM brand, dark premium background with blush pink and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "school-girl-hd" "Professional digital Japanese HD streaming SG brand, dark premium background with soft pink and navy accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "hairy-pov" "Professional digital Japanese streaming service HP brand, dark premium background with warm brown and cream accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "pov-av" "Professional digital Japanese streaming service PA brand, dark premium background with light pink and charcoal accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 36-40
generate "av-tits" "Professional digital Japanese streaming service AT brand, dark premium background with coral and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "av-anal" "Professional digital Japanese streaming service AA brand, dark premium background with muted rose and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "av-stockings" "Professional digital Japanese streaming service AS brand, dark premium background with soft pink and black lace accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "pussy-av" "Professional digital Japanese streaming service PV brand, dark premium background with peach and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "hey-outdoor" "Professional digital Japanese outdoor streaming HO brand, dark premium background with sky blue and forest green accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 41-45
generate "trans-angels" "Professional digital Premium streaming service TA brand, dark premium background with pastel blue pink and white accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "trans-harder" "Professional digital Premium streaming service TH brand, dark premium background with bold blue and white accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "trans-sensual" "Professional digital Premium streaming service TS brand, dark premium background with soft lavender and cream accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "mile-high-media" "Professional digital Premium media network MH brand, dark premium background with sky blue and gold accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "sweet-heart-video" "Professional digital Premium streaming service SHV brand, dark premium background with soft pink and rose gold accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 46-50
generate "sweet-sinner" "Professional digital Premium streaming service SS brand, dark premium background with dark red and black accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "milfed" "Professional digital Premium streaming service ML brand, dark premium background with warm orange and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "family-sinners" "Professional digital Premium streaming service FS brand, dark premium background with dark crimson and charcoal accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "property-sex" "Professional digital Premium streaming service PS brand, dark premium background with green and dark luxury accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "fake-taxi" "Professional digital Streaming network FT brand, dark premium background with yellow and black taxi style accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 51-55
generate "fake-hostel" "Professional digital Streaming network FHo brand, dark premium background with orange and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "letsdoit" "Professional digital Premium streaming service LDI brand, dark premium background with vibrant red and white accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "dog-house-digital" "Professional digital Digital streaming DHD brand, dark premium background with blue and grey accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "forgive-me-father" "Professional digital Premium streaming FMF brand, dark premium background with dark purple and gold gothic accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "twistys" "Professional digital Premium streaming service TW brand, dark premium background with blue and orange accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 56-60
generate "girl-grind" "Professional digital Premium streaming service GG brand, dark premium background with hot pink and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "deviante" "Professional digital Premium streaming service DV brand, dark premium background with neon green and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "metro-hd" "Professional digital HD streaming service MHD brand, dark premium background with silver and dark blue accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "spicevids" "Professional digital Premium streaming service SV brand, dark premium background with red and gold spicy accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "erotics-pice" "Professional digital Premium streaming service EP brand, dark premium background with burgundy and gold accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 61-65
generate "bromo" "Professional digital Premium streaming service Bro brand, dark premium background with steel blue and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "reality-dudes" "Professional digital Premium streaming service RD brand, dark premium background with teal and charcoal accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "sean-cody" "Professional digital Premium streaming service SC brand, dark premium background with navy and white accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "men" "Professional digital Premium streaming service Men brand, dark premium background with dark blue and white accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "noir-male" "Professional digital Premium streaming service NM brand, dark premium background with black and gold noir style accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 66-70
generate "bi-empire" "Professional digital Premium streaming service BE brand, dark premium background with purple and gold imperial accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "why-not-bi" "Professional digital Premium streaming service WNB brand, dark premium background with violet and silver accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "true-amateurs" "Professional digital Premium streaming service TA brand, dark premium background with warm amber and brown accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "i-know-that-girl" "Professional digital Premium streaming service IKTG brand, dark premium background with pink and dark teal accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "reality-junkies" "Professional digital Premium streaming service RJ brand, dark premium background with electric blue and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3

# 71-75
generate "pretty-dirty-teens" "Professional digital Premium streaming service PDT brand, dark premium background with neon pink and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "squirted" "Professional digital Premium streaming service Sq brand, dark premium background with aqua blue and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "love-her-ass" "Professional digital Premium streaming service LHA brand, dark premium background with warm red and dark accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "teenlovehugecock" "Professional digital Premium streaming service TLHC brand, dark premium background with hot pink and black accents, sleek modern design, clean typography, app icon style, high quality"
sleep 3
generate "sex-working" "Professional digital Premium streaming service SW brand, dark premium background with dark red and charcoal accents, sleek modern design, clean typography, app icon style, high quality"

echo "END:$(date +%s)" >> "$LOGFILE"
echo "SUMMARY:success=$SUCCESS,fail=$FAIL" >> "$LOGFILE"
