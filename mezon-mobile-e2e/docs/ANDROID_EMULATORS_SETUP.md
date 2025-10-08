## Setup Android Emulator and run test parallel (macOS & Windows)

This document will guide you to create 2 Android Emulator with the same configuration in `tests/manage-drive/capabilities.ts`, install app APK, and run test multi-remote by WebdriverIO + Appium, for both macOS and Windows.

- AVD according to repo:
  - `Pixel_2_API_30` → `udid`: `emulator-5554`, `systemPort`: `8201`
  - `Pixel_2_API_30_clone` → `udid`: `emulator-5556`, `systemPort`: `8202`
- App under test: `com.mezon.mobile` (activity `.MainActivity`).
- Command to run: `npm run android.app` (using `config/wdio.android.app.conf.ts` and capabilities multiremote).

---

### 1) Prepare

- Common requirements
  - Node.js `>=18` (or `^16.13.0`).
  - Java JDK 11+ (recommended Temurin/OpenJDK).
  - Android Studio (SDK, Emulator, Platform Tools).
  - Appium 2: already run by WDIO Appium Service, not required to install globally.

- Install Android Studio & SDK
  - Open Android Studio > SDK Manager and install:
    - Android SDK Platform 30 (Android 11)
    - Android SDK Build-Tools (latest)
    - Android Emulator
    - Android Platform-Tools (ADB)

- Environment variables
  - macOS (zsh): add to `~/.zshrc`

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home -v 11)"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/tools/bin"
```

- Windows: Set through System Properties > Environment Variables
  - `JAVA_HOME` → JDK directory (e.g. `C:\Program Files\Java\jdk-17`)
  - `ANDROID_HOME` or `ANDROID_SDK_ROOT` → `%LOCALAPPDATA%\Android\Sdk`
  - Add to `Path`: `%ANDROID_HOME%\platform-tools`, `%ANDROID_HOME%\emulator`, `%ANDROID_HOME%\tools\bin`

---

### 2) Create 2 AVD (Android Virtual Device)

You can use AVD Manager (UI) or CLI `avdmanager`/`sdkmanager`.

- Configuration requirements
  - AVD 1 name: `Pixel_2_API_30`
  - AVD 2 name: `Pixel_2_API_30_clone`
  - System image: `Android 11 (API 30)`
    - Intel (x86_64) → use HAXM/Hypervisor.
    - Apple Silicon (ARM) → use `arm64-v8a` (Google APIs).

- Create by AVD Manager (UI)
  1. Android Studio > Tools > Device Manager.
  2. Create device > Select `Pixel 2` > System Image `R (API 30)`.
  3. Set name correctly: `Pixel_2_API_30` and `Pixel_2_API_30_clone`.
  4. Finish.

- Create by CLI (optional)

```bash
# Install system image (choose the appropriate variant for your machine)
sdkmanager "system-images;android-30;google_apis;x86_64"
# Apple Silicon (optional)
# sdkmanager "system-images;android-30;google_apis;arm64-v8a"

avdmanager create avd -n Pixel_2_API_30 -k "system-images;android-30;google_apis;x86_64" -d pixel_2
avdmanager create avd -n Pixel_2_API_30_clone -k "system-images;android-30;google_apis;x86_64" -d pixel_2
```

---

### 3) Start 2 emulator and check UDID

- Start emulator

```bash
emulator -avd Pixel_2_API_30 &
emulator -avd Pixel_2_API_30_clone &
```

- Check online device

```bash
adb devices | cat
```

Expected to see: `emulator-5554` and `emulator-5556` in `device` state.

If serial is different (e.g. `emulator-5558`, `emulator-5560`), you have 2 options:

- Fix `udid` in `tests/manage-drive/capabilities.ts` to match the actual serial.
- Or turn off emulator and restart to reset serial to 5554/5556 (not guaranteed 100%).

---

### 4) Install app APK to both emulator

Repo has APK in `mezon-mobile-e2e/apps/`. Select APK with package `com.mezon.mobile` (e.g. `mezon-1009.apk`).

```bash
cd /Users/macbookpro/automation/mezon-e2e/mezon-mobile-e2e

# Install for AVD 1
adb -s emulator-5554 install -r ./apps/mezon-1009.apk

# Install for AVD 2
adb -s emulator-5556 install -r ./apps/mezon-1009.apk

# Check installed
adb -s emulator-5554 shell pm list packages | grep com.mezon.mobile | cat
adb -s emulator-5556 shell pm list packages | grep com.mezon.mobile | cat
```

Note: `capabilities` specify `appPackage` and `appActivity`, so app needs to be installed on both emulator.

---

### 5) Configure multi-remote (capabilities) and WDIO

`tests/manage-drive/capabilities.ts` define 2 driver with separate `udid`, `avd` and `systemPort`.

- Each emulator must have different `systemPort` (8201/8202) to avoid UiAutomator2 conflict.
- `udid` must match serial in `adb devices`.

WDIO multi-remote uses file `config/wdio.android.app.conf.ts` to load `capabilities` above and run test app native.

---

### 6) Run test (macOS & Windows)

```bash
cd /Users/macbookpro/automation/mezon-e2e/mezon-mobile-e2e
npm ci
npm run android.app
```

- Log Appium: `mezon-mobile-e2e/logs/appium.log`.
- Allure report (optional):

```bash
npm run allure:generate
npm run allure:open
```

---

### 7) Checklist quickly by OS

- macOS
  1. Set `ANDROID_HOME`, `JAVA_HOME`, `PATH` (item 1).
  2. Install SDK Platform 30 + Emulator + Platform-Tools.
  3. Create AVD `Pixel_2_API_30` and `Pixel_2_API_30_clone` (item 2).
  4. Open 2 emulator and check `adb devices` (item 3).
  5. Install APK to both emulator (item 4).
  6. `npm ci` and `npm run android.app` (item 6).

- Windows
  1. Set `JAVA_HOME`, `ANDROID_HOME`/`ANDROID_SDK_ROOT`, update `Path` (item 1).
  2. Install SDK Platform 30 + Emulator + Platform-Tools.
  3. Create AVD `Pixel_2_API_30` and `Pixel_2_API_30_clone` (item 2).
  4. Open 2 emulator and check `adb devices` (item 3).
  5. Install APK to both emulator (item 4).
  6. `npm ci` and `npm run android.app` (item 6).

---

### 8) Note about Appium 4727 and port configuration

Repo configure Appium local at `127.0.0.1:4727`. If port is busy:

- macOS

```bash
lsof -i :4727 | cat
kill -9 <PID>
```

- Windows (PowerShell)

```powershell
netstat -ano | findstr :4727
taskkill /PID <PID> /F
```

Or change port in `config/wdio.shared.conf.ts` (attribute `port`) and in `services -> appium -> args.port`.

---

### 9) Important tips and notes

- Each emulator needs separate serial/`udid` and different `systemPort`.
- `disableWindowAnimation: true` helps test faster.
- `noReset: true` keeps app state; change to `false` if you want to clear data.
- On Apple Silicon, prefer system image `arm64-v8a`.

---

### 10) Quick fix

- Appium doesn't connect: check port 4727 (item 8) and network permissions.
- Emulator doesn't open due to virtualization: turn on VT-x/Hyper-V/Hypervisor Platform; use x86_64 (Intel) or ARM image (Apple Silicon).
- `adb devices` doesn't see 5554/5556: restart emulator or update `udid` in `capabilities.ts` to match.
- `systemPort` conflict: ensure 8201/8202 are different in `capabilities.ts`.
- Allure doesn't create: ensure there are results in `allure-results`, then run `npm run allure:generate`.
