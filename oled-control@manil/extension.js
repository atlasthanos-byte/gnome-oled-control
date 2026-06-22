import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { OledColorEffects } from './colorEffect.js';

const OledSlider = GObject.registerClass(
class OledSlider extends QuickSettings.QuickSlider {
    _init({ iconName, accessibleName, initialValue, onChange }) {
        super._init({ iconName });
        this._onChange = onChange;
        this.slider.accessible_name = accessibleName;
        this.slider.value = initialValue;
        this._changedId = this.slider.connect('notify::value',
            () => this._onChange(this.slider.value));
    }

    setValueSilently(value) {
        this.slider.block_signal_handler(this._changedId);
        this.slider.value = value;
        this.slider.unblock_signal_handler(this._changedId);
    }
});

export default class OledControlExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        this._colorEffects = new OledColorEffects({
            contrast: this._settings.get_double('contrast'),
            saturation: this._settings.get_double('saturation'),
        });
        this._colorEffects.applyTo(Main.uiGroup);

        this._indicator = new QuickSettings.SystemIndicator();

        this._contrastSlider = new OledSlider({
            iconName: 'contrast-symbolic',
            accessibleName: 'OLED Contrast',
            // map slider 0..1 to contrast range 0.5..1.5
            initialValue: (this._settings.get_double('contrast') - 0.5) / 1.0,
            onChange: (value) => {
                const contrast = 0.5 + value * 1.0;
                this._colorEffects.setContrast(contrast);
                this._settings.set_double('contrast', contrast);
            },
        });

        this._saturationSlider = new OledSlider({
            iconName: 'color-symbolic',
            accessibleName: 'OLED Saturation',
            // map slider 0..1 to saturation range 0.0..2.0
            initialValue: this._settings.get_double('saturation') / 2.0,
            onChange: (value) => {
                const saturation = value * 2.0;
                this._colorEffects.setSaturation(saturation);
                this._settings.set_double('saturation', saturation);
            },
        });

        this._indicator.quickSettingsItems.push(
            this._contrastSlider, this._saturationSlider);

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator, 2);
    }

    disable() {
        if (this._colorEffects) {
            this._colorEffects.removeFrom(Main.uiGroup);
            this._colorEffects = null;
        }
        if (this._indicator) {
            this._indicator.quickSettingsItems.forEach(item => item.destroy());
            this._indicator.destroy();
            this._indicator = null;
        }
        this._contrastSlider = null;
        this._saturationSlider = null;
        this._settings = null;
    }
}
