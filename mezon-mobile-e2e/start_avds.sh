# SRC_AVD="Pixel_2_API_30_clone"
# CLONE_PREFIX="Pixel_2_API_30_clone"
# AVD_DIR="$HOME/.android/avd"

# for i in {1..9}; do
#   NEW_AVD="${CLONE_PREFIX}${i}"

#   if [[ -e "${AVD_DIR}/${NEW_AVD}.ini" ]]; then
#     echo "✅ Already exists: $NEW_AVD"
#     continue
#   fi

#   echo "⚙️  Cloning $SRC_AVD → $NEW_AVD ..."

#   cp -r "${AVD_DIR}/${SRC_AVD}.avd" "${AVD_DIR}/${NEW_AVD}.avd"
#   cp "${AVD_DIR}/${SRC_AVD}.ini" "${AVD_DIR}/${NEW_AVD}.ini"

#   # Update AVD name in .ini file
#   sed -i '' "s/^avd\.name=.*/avd.name=${NEW_AVD}/" "${AVD_DIR}/${NEW_AVD}.ini"
#   sed -i '' "s|${SRC_AVD}.avd|${NEW_AVD}.avd|g" "${AVD_DIR}/${NEW_AVD}.ini"

#   echo "✅ Created: $NEW_AVD"
# done



#!/bin/bash
# BASE_AVD="Pixel_2_API_30"
# CLONE_PREFIX="Pixel_2_API_30_clone"

# # List of AVDs and corresponding ports
# declare -a AVD_LIST=(
#   "$BASE_AVD:5554"
#   "${CLONE_PREFIX}:5556"
#   "${CLONE_PREFIX}1:5558"
#   "${CLONE_PREFIX}2:5560"
#   "${CLONE_PREFIX}3:5562"
#   "${CLONE_PREFIX}4:5564"
#   "${CLONE_PREFIX}5:5566"
#   "${CLONE_PREFIX}6:5568"
#   "${CLONE_PREFIX}7:5570"
#   "${CLONE_PREFIX}8:5572"
# )

# # Start each emulator
# for entry in "${AVD_LIST[@]}"; do
#   IFS=":" read -r avd port <<< "$entry"
#   echo "🚀 Starting $avd on port $port"
#   emulator -avd "$avd" -port "$port" >/dev/null 2>&1 &
# done

# echo "🎯 Done starting AVDs."


# !/bin/bash
BASE_AVD="Pixel_2_API_30"
CLONE_PREFIX="Pixel_2_API_30_clone"

# List of AVDs to start
declare -a AVD_LIST=(
  "$BASE_AVD:5554"
  "${CLONE_PREFIX}:5556"
  # "${CLONE_PREFIX}1:5558"
  # "${CLONE_PREFIX}2:5560"
)

# Start each emulator
for entry in "${AVD_LIST[@]}"; do
  IFS=":" read -r avd port <<< "$entry"
  echo "🚀 Starting emulator $avd on port $port"
  emulator -avd "$avd" -port "$port" >/dev/null 2>&1 &
done

echo "🎯 Done starting AVDs."


# !/bin/bash

# echo "🛑 Stopping all emulators..."

# for port in $(adb devices | grep emulator | cut -f1 | cut -d'-' -f2); do
#   echo "⏹️  Stopping emulator-$port"
#   adb -s emulator-${port} emu kill
# done

# echo "✅ Sent command to stop all emulators."
