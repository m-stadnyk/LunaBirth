#!/bin/sh
# Install Uncle Bob's quality-gate tools used by the ub-mode skill:
#   crapper (CRAP score), dryer (duplication), mutator (mutation testing).
# They are Python CLIs, cloned at pinned commits into .tools/ub (gitignored)
# and installed into one shared virtualenv, so mutator can import crapper.
# Local patches in scripts/patches/ are applied on top of each pin
# (currently: dryer gets .js/.jsx support, which upstream lacks).
# Idempotent: re-running only fixes what is missing or out of date.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
DIR="$ROOT/.tools/ub"
VENV="$DIR/.venv"

# name commit — bump these to update the tools.
PINS="crapper 6fd92c4c9bcc56efb64a2f8743d5a2993bcfd42d
dryer 66ff6d21a42c04afcad89c78a80066176d1294b0
mutator a5a0cb803b66e0cdb8bf471b3b08af701d424a41"

command -v python3 >/dev/null || { echo "python3 (>=3.11) is required" >&2; exit 1; }
python3 -c 'import sys; sys.exit(sys.version_info < (3, 11))' \
  || { echo "python3 >= 3.11 is required" >&2; exit 1; }

mkdir -p "$DIR"
echo "$PINS" | while read -r name rev; do
  repo="$DIR/$name"
  if [ ! -d "$repo/.git" ]; then
    git clone -q "https://github.com/unclebob/$name" "$repo"
  fi
  if [ "$(git -C "$repo" rev-parse HEAD)" != "$rev" ]; then
    git -C "$repo" fetch -q origin
    git -C "$repo" checkout -q "$rev"
  fi
  # Local patches (scripts/patches/<name>-*.patch) go on top of the pin.
  # Reset first so re-runs re-apply cleanly.
  git -C "$repo" checkout -q -- .
  for patch in "$ROOT"/scripts/patches/"$name"-*.patch; do
    [ -f "$patch" ] || continue
    git -C "$repo" apply "$patch"
  done
done

[ -x "$VENV/bin/python" ] || python3 -m venv "$VENV"
"$VENV/bin/pip" install -q -e "$DIR/crapper" -e "$DIR/dryer" -e "$DIR/mutator"

for t in crapper dryer mutator; do
  "$VENV/bin/$t" --help >/dev/null 2>&1 || { echo "$t failed to start" >&2; exit 1; }
done
echo "ub-mode tools installed in $VENV/bin (crapper, dryer, mutator)"
