import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const BACKLIGHT_PATH = '/sys/class/backlight/amdgpu_bl0/brightness';
const MAX_BRIGHTNESS = 399000;

export class Backlight {
    static get max() {
        return MAX_BRIGHTNESS;
    }

    // Reads the currently-set value (the 'brightness' file, not 'actual_brightness' -
    // amdgpu_bl0 applies an internal curve so actual_brightness will not match what
    // we wrote, and that is expected/normal, not an error).
    static read() {
        try {
            const file = Gio.File.new_for_path(BACKLIGHT_PATH);
            const [ok, contents] = file.load_contents(null);
            if (!ok)
                return null;
            const text = new TextDecoder().decode(contents).trim();
            const value = parseInt(text, 10);
            return Number.isFinite(value) ? value : null;
        } catch (e) {
            logError(e, 'OledControl: failed to read backlight value');
            return null;
        }
    }

    // Writes asynchronously so the slider never blocks the UI thread.
    static write(value) {
        const clamped = Math.max(0, Math.min(MAX_BRIGHTNESS, Math.round(value)));
        const file = Gio.File.new_for_path(BACKLIGHT_PATH);
        const bytes = new GLib.Bytes(new TextEncoder().encode(String(clamped)));

        file.replace_contents_bytes_async(
            bytes,
            null,
            false,
            Gio.FileCreateFlags.NONE,
            null,
            (source, result) => {
                try {
                    source.replace_contents_finish(result);
                } catch (e) {
                    logError(e, `OledControl: failed to write brightness ${clamped}`);
                }
            }
        );
    }
}
