#!/bin/bash
# Generate adult product images in batches of 5

OUTDIR="/home/z/my-project/public/images/products"
LOG="/home/z/my-project/generation_log.txt"
SUCCESS=0
FAIL=0

echo "=== Image Generation Started: $(date) ===" > "$LOG"

# Define products: slug|name|style
# style: gold = gold/amber, indian = red/gold, japanese = pink/white
PRODUCTS=(
  "pornhub-premium|Pornhub Premium|gold"
  "xhamster-premium|XHamster Premium|gold"
  "faphouse-premium|FapHouse Premium|gold"
  "brazzers-original|Brazzers Original|gold"
  "fap-house-ultra|FapHouse Ultra|gold"
  "xnxx-gold-premium|XNXX Gold Premium|gold"
  "xvideos-red|XVideos Red|gold"
  "kooku-gold|Kooku Gold|indian"
  "ullu-gold|Ullu Gold|indian"
  "bangbros|Bang Bros|gold"
  "reality-kings|Reality Kings|gold"
  "mofos|Mofos|gold"
  "babes|Babes|gold"
  "digital-playground|Digital Playground|gold"
  "fakehub|Fakehub|gold"
  "sexy-hub|Sexy Hub|gold"
  "blacked|Blacked|gold"
  "blacked-raw|Blacked Raw|gold"
  "tushy|Tushy|gold"
  "tushy-raw|Tushy Raw|gold"
  "vixen|Vixen|gold"
  "slayed|Slayed|gold"
  "deeper|Deeper|gold"
  "milfy|Milfy|gold"
  "niksindian|NIKSINDIAN|indian"
  "erito|Erito|japanese"
  "hentai-pros|Hentai Pros|japanese"
  "jav-hd|JAV HD|japanese"
  "av69-tv|AV69.TV|japanese"
  "gangav|GangAV|japanese"
  "shiofuky|ShioFuky|japanese"
  "hey-milf|Hey MILF|japanese"
  "school-girl-hd|School Girl HD|japanese"
  "hairy-pov|Hairy POV|japanese"
  "pov-av|POV AV|japanese"
  "av-tits|AV Tits|japanese"
  "av-anal|AV Anal|japanese"
  "av-stockings|AV Stockings|japanese"
  "pussy-av|Pussy AV|japanese"
  "hey-outdoor|Hey Outdoor|japanese"
  "trans-angels|Trans Angels|gold"
  "trans-harder|Trans Harder|gold"
  "trans-sensual|Trans Sensual|gold"
  "mile-high-media|Mile High Media|gold"
  "sweet-heart-video|Sweet Heart Video|gold"
  "sweet-sinner|Sweet Sinner|gold"
  "milfed|Milfed|gold"
  "family-sinners|Family Sinners|gold"
  "property-sex|Property Sex|gold"
  "fake-taxi|Fake Taxi|gold"
  "fake-hostel|Fake Hostel|gold"
  "letsdoit|LetsDoIt|gold"
  "dog-house-digital|Dog House Digital|gold"
  "forgive-me-father|Forgive Me Father|gold"
  "twistys|Twistys|gold"
  "girl-grind|Girl Grind|gold"
  "deviante|Deviante|gold"
  "metro-hd|Metro HD|gold"
  "spicevids|Spicevids|gold"
  "erotics-pice|Erotics Pice|gold"
  "bromo|Bromo|gold"
  "reality-dudes|Reality Dudes|gold"
  "sean-cody|Sean Cody|gold"
  "men|Men.com|gold"
  "noir-male|Noir Male|gold"
  "bi-empire|Bi Empire|gold"
  "why-not-bi|Why Not Bi|gold"
  "true-amateurs|True Amateurs|gold"
  "i-know-that-girl|I Know That Girl|gold"
  "reality-junkies|Reality Junkies|gold"
  "pretty-dirty-teens|Pretty Dirty Teens|gold"
  "squirted|Squirted|gold"
  "love-her-ass|Love Her Ass|gold"
  "teenlovehugecock|TeenLoveHugeCock|gold"
  "sex-working|Sex Working|gold"
)

BATCH=0
TOTAL=${#PRODUCTS[@]}

for i in "${!PRODUCTS[@]}"; do
  IFS='|' read -r slug name style <<< "${PRODUCTS[$i]}"
  
  # Build prompt based on style
  case "$style" in
    indian)
      PROMPT="Professional digital streaming service logo icon for ${name}, dark premium background with red and gold accents, sleek modern design, clean typography, app icon style, high quality"
      ;;
    japanese)
      PROMPT="Professional digital streaming service logo icon for ${name}, dark premium background with pink and white accents, sleek modern design, clean typography, app icon style, high quality"
      ;;
    *)
      PROMPT="Professional digital subscription service logo icon for ${name}, dark premium background with gold and amber accents, sleek modern design, clean typography, app icon style, high quality"
      ;;
  esac

  OUTPUT="${OUTDIR}/${slug}.png"
  
  echo "[$((i+1))/$TOTAL] Generating: $slug ($name)..."
  
  if z-ai image -p "$PROMPT" -o "$OUTPUT" -s 1024x1024 >> "$LOG" 2>&1; then
    echo "  ✓ Success: $slug"
    SUCCESS=$((SUCCESS+1))
  else
    echo "  ✗ Failed: $slug"
    FAIL=$((FAIL+1))
  fi

  # Batch delay: wait 2 seconds between each image
  if [ $((i+1)) -lt $TOTAL ]; then
    sleep 2
  fi

  # Extra pause every 5 images (batch marker)
  BATCH=$((BATCH+1))
  if [ $((BATCH % 5)) -eq 0 ] && [ $((i+1)) -lt $TOTAL ]; then
    echo "--- Batch $((BATCH/5)) complete, pausing 3s ---"
    sleep 3
  fi
done

echo "" >> "$LOG"
echo "=== Generation Complete: $(date) ===" >> "$LOG"
echo "Success: $SUCCESS, Failed: $FAIL" >> "$LOG"
echo ""
echo "FINAL RESULTS: Success=$SUCCESS, Failed=$FAIL"
