# OLED Display Control — GNOME Shell Extension

A GNOME Shell extension that adds **Brightness**, **Contrast**, and **Saturation**
sliders to Quick Settings, built for laptops with an `amdgpu_bl0` raw-value
backlight (e.g. Asus OLED panels) where the normal Settings brightness slider
either doesn't work well or doesn't expose the full range.

The sliders appear in the same Quick Settings panel as Volume/Wi-Fi (top-right
corner of the screen), not in a separate menu.

## What it controls

| Slider | How |
|---|---|
| Brightness | Writes the raw value directly to `/sys/class/backlight/amdgpu_bl0/brightness` |
| Contrast | Screen-wide compositor effect (`Clutter.BrightnessContrastEffect`) |
| Saturation | Screen-wide compositor effect (`Clutter.DesaturateEffect`) |

Brightness is real hardware control. Contrast and saturation are a
**software/compositor-level approximation** applied to the whole screen — not
true panel-level adjustment, since there's no DDC/CI or vendor API exposed on
this panel for that.

**Known limitation:** the saturation slider can only desaturate (go *down*
toward grayscale). It cannot boost color *above* normal, because the
underlying `Clutter.DesaturateEffect` doesn't support that. The top half of
the slider (above the midpoint) has no visible effect beyond normal color.

## Requirements

- GNOME Shell 48 (tested). Other 45+ versions probably work but aren't tested.
- A backlight device at `/sys/class/backlight/amdgpu_bl0/brightness` that's
  writable by your normal user account (no `sudo`/`pkexec` needed). Check with:
  ```bash
  ls /sys/class/backlight/
  cat /sys/class/backlight/amdgpu_bl0/max_brightness
  echo 200000 > /sys/class/backlight/amdgpu_bl0/brightness   # test write access
  ```
  If your device folder has a different name (e.g. `intel_backlight`,
  `nvidia_0`), or a different `max_brightness`, edit `backlight.js` (see
  [Adapting to other hardware](#adapting-to-other-hardware) below) before
  installing — the path and max value are hardcoded, not auto-detected.
- If writing to the backlight file requires `sudo`, you'll need a `udev` rule
  granting your user write access to that sysfs file. This isn't included —
  search `udev rule backlight permissions` for your distro if needed.

## Install

```bash
git clone https://github.com/<your-username>/gnome-oled-control.git
mkdir -p ~/.local/share/gnome-shell/extensions
cp -r gnome-oled-control/oled-control@manil ~/.local/share/gnome-shell/extensions/
cd ~/.local/share/gnome-shell/extensions/oled-control@manil/schemas
glib-compile-schemas .
```

**Log out and log back in** (required — GNOME Shell on Wayland does not
hot-reload extension code, even with `disable`/`enable`).

Then enable it:

```bash
gnome-extensions enable oled-control@manil
gnome-extensions info oled-control@manil   # should show State: ACTIVE
```

Open Quick Settings (top-right corner of the screen) — the three sliders sit
alongside your volume/Wi-Fi toggles.

### Or install from a release zip

Download the latest `oled-control@manil.zip` from
[Releases](../../releases), then:

```bash
unzip oled-control@manil.zip -d ~/.local/share/gnome-shell/extensions/
cd ~/.local/share/gnome-shell/extensions/oled-control@manil/schemas
glib-compile-schemas .
```

Log out, log back in, then enable as above.

## Adapting to other hardware

The backlight device path and max value are hardcoded in `backlight.js`:

```js
const BACKLIGHT_PATH = '/sys/class/backlight/amdgpu_bl0/brightness';
const MAX_BRIGHTNESS = 399000;
```

Edit these two lines to match your device (`ls /sys/class/backlight/` and
`cat .../max_brightness`), then reinstall.

## Uninstall

```bash
gnome-extensions disable oled-control@manil
rm -rf ~/.local/share/gnome-shell/extensions/oled-control@manil
```

## Troubleshooting

Check the extension's state and recent errors:

```bash
gnome-extensions info oled-control@manil
journalctl --user -b 0 -o cat | grep -A 20 "oled-control@manil:"
```

If `State: ERROR` after editing the code, you likely need to **log out and
back in** — GNOME Shell caches the JS module on first import and won't pick
up file changes from a simple disable/enable cycle.

## License

MIT — see [LICENSE](LICENSE).
