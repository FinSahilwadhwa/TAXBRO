#!/usr/bin/env bash
set -euo pipefail

# TaxBro - Daily SBI FOREX Card Rates Fetcher
# Saves SBI's official PDF to sbi-rates/YYYY/MM/YYYY-MM-DD.pdf

export TZ="${TZ:-Asia/Kolkata}"

RUN_DATE="$(date '+%Y-%m-%d')"
YEAR="$(date '+%Y')"
MONTH="$(date '+%m')"
OUTPUT_DIR="sbi-rates/${YEAR}/${MONTH}"
OUTPUT_FILE="${OUTPUT_DIR}/${RUN_DATE}.pdf"
TMP_FILE="$(mktemp)"

PDF_URLS=(
  "https://sbi.bank.in/documents/16012/1400784/FOREX_CARD_RATES.pdf"
  "https://www.sbi.co.in/documents/16012/1400784/FOREX_CARD_RATES.pdf"
)

cleanup() {
  rm -f "${TMP_FILE}"
}
trap cleanup EXIT

echo "Fetching SBI FOREX rates for ${RUN_DATE}..."
mkdir -p "${OUTPUT_DIR}"

downloaded=0
for url in "${PDF_URLS[@]}"; do
  echo "Trying ${url}"
  if curl -fsSL \
    --retry 3 \
    --retry-delay 10 \
    --connect-timeout 30 \
    --max-time 90 \
    -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36" \
    -H "Accept: application/pdf,*/*" \
    -H "Referer: https://sbi.co.in/" \
    "${url}" \
    --output "${TMP_FILE}"; then
    downloaded=1
    break
  fi
done

if [ "${downloaded}" -ne 1 ]; then
  echo "Download failed from all SBI URLs."
  exit 1
fi

if [ "$(wc -c < "${TMP_FILE}")" -le 1000 ]; then
  echo "Downloaded file is too small to be a valid rates PDF."
  exit 1
fi

if ! head -c 4 "${TMP_FILE}" | grep -q "%PDF"; then
  echo "Downloaded file does not look like a PDF."
  exit 1
fi

mv "${TMP_FILE}" "${OUTPUT_FILE}"
echo "Saved ${OUTPUT_FILE} ($(wc -c < "${OUTPUT_FILE}") bytes)"

git config user.email "auto@taxbro.in"
git config user.name "TaxBro Auto Update"
git add "${OUTPUT_FILE}"

if git diff --cached --quiet; then
  echo "No new SBI rates PDF to commit."
  exit 0
fi

git commit -m "SBI rates update: ${RUN_DATE}"
git push origin "HEAD:${GITHUB_REF_NAME:-main}"

echo "Done. Rates pushed to GitHub."
