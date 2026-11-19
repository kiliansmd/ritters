#!/bin/zsh
# Bild-Pipeline: erzeugt AVIF, WebP und JPG in mehreren Breiten aus einem Original.
#
#   scripts/bilder.sh <original.jpg> <zielname>
#   z. B. scripts/bilder.sh ~/Fotos/IMG_1234.jpg schornsteinfeger-koeln-messung-heizungskeller
#
# Ergebnis: assets/img/<zielname>-<breite>.{avif,webp,jpg} für die Breiten 480/800/1200/1600
# (nur Breiten bis zur Originalbreite; kleinere Originale nur in Originalbreite) und ein
# <picture>-Schnipsel zum Einfügen. Benötigt: sips (macOS, inkl. AVIF) und cwebp.
# Dateinamen: Kleinbuchstaben, Bindestriche, mit Köln-Bezug (z. B. „schornsteinfeger-koeln-…“).
set -euo pipefail
src=$1; name=$2
root=${0:A:h:h}; out=$root/assets/img
mkdir -p $out
w0=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
h0=$(sips -g pixelHeight "$src" | awk '/pixelHeight/{print $2}')
widths=()
for w in 480 800 1200 1600; do (( w <= w0 )) && widths+=$w; done
(( ${#widths} == 0 )) && widths=($w0)
tmp=$(mktemp -d)
for w in $widths; do
  sips -s format jpeg -s formatOptions 82 --resampleWidth $w "$src" --out $out/$name-$w.jpg >/dev/null
  sips -s format avif -s formatOptions 55 $out/$name-$w.jpg --out $out/$name-$w.avif >/dev/null
  cwebp -quiet -q 78 $out/$name-$w.jpg -o $out/$name-$w.webp
done
rm -rf $tmp
largest=${widths[-1]}
h=$(( h0 * largest / w0 ))
set_for() { local ext=$1 s=""; for w in $widths; do s+="/assets/img/$name-$w.$ext ${w}w, "; done; print -r -- ${s%, }; }
cat <<EOF
<picture class="pic">
  <source type="image/avif" srcset="$(set_for avif)" sizes="SIZES">
  <source type="image/webp" srcset="$(set_for webp)" sizes="SIZES">
  <img src="/assets/img/$name-$largest.jpg" srcset="$(set_for jpg)" sizes="SIZES" width="$largest" height="$h" loading="lazy" decoding="async" alt="ALT">
</picture>
EOF
