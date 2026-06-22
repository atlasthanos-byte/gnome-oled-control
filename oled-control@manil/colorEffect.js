import Clutter from 'gi://Clutter';

// Wraps two built-in, standard Clutter effects - no custom GLSL needed:
//  - Clutter.BrightnessContrastEffect: handles contrast (and brightness, unused here
//    since real backlight brightness is handled separately via sysfs)
//  - Clutter.DesaturateEffect: handles saturation (its "factor" is desaturation
//    strength, 0.0 = no change/full color, 1.0 = fully grayscale, so we invert
//    our 0..2 saturation value into that range)
export class OledColorEffects {
    constructor({ contrast = 1.0, saturation = 1.0 } = {}) {
        this.contrastEffect = new Clutter.BrightnessContrastEffect();
        this.desaturateEffect = new Clutter.DesaturateEffect();
        this.setContrast(contrast);
        this.setSaturation(saturation);
    }

    // contrast: 0.5 .. 1.5 (1.0 = unchanged)
    // Clutter.BrightnessContrastEffect.set_contrast_full takes red/green/blue in
    // range -1.0..1.0, where 0.0 = no change. Map our 0.5..1.5 range onto -1.0..1.0.
    setContrast(contrast) {
        const mapped = (contrast - 1.0); // 0.5..1.5 -> -0.5..0.5
        const clamped = Math.max(-1.0, Math.min(1.0, mapped));
        this.contrastEffect.set_contrast_full(clamped, clamped, clamped);
    }

    // saturation: 0.0 .. 2.0 (1.0 = unchanged, 0.0 = grayscale, 2.0 = oversaturated)
    // DesaturateEffect only supports desaturating (0..1), it cannot boost saturation
    // above normal. Values above 1.0 are clamped to "no desaturation" (factor 0).
    setSaturation(saturation) {
        const factor = saturation >= 1.0 ? 0.0 : (1.0 - saturation);
        this.desaturateEffect.set_factor(Math.max(0.0, Math.min(1.0, factor)));
    }

    applyTo(actor) {
        actor.add_effect(this.contrastEffect);
        actor.add_effect(this.desaturateEffect);
    }

    removeFrom(actor) {
        actor.remove_effect(this.contrastEffect);
        actor.remove_effect(this.desaturateEffect);
    }
}
