import { Injectable } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { SettingsService } from '../settings/settings.service';
import { StatusService } from '../status/status.service';

@Injectable({
    providedIn: 'root',
})
export class DocumentStyleService {

    public setAccent(): void {
        document.documentElement.style.setProperty('--accent', this._rgbAccent());
    }

    public setDarkmode(): void {
        if (SettingsService.isDarkmode) {
            document.body.classList.add('darkmode');
        } else {
            document.body.classList.remove('darkmode');
        }
    }

    private _rgbAccent(): string {
        const rgbLength = 4;
        const rrggbbLength = 7;
        const redIndex = 1;
        const greenIndex = 2;
        const blueIndex = 3;

        const hexToRgb = (hex: string): { r: number; g: number; b: number } | undefined => {
            let result: RegExpExecArray | null;

            if (hex.length === rgbLength) {
                result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);

                return result ? {
                    r: parseInt(`${ result[redIndex] }${ result[redIndex] }`, 16),
                    g: parseInt(`${ result[greenIndex] }${ result[greenIndex] }`, 16),
                    b: parseInt(`${ result[blueIndex] }${ result[blueIndex] }`, 16),
                } : undefined;
            } else if (hex.length === rrggbbLength) {
                result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

                return result ? {
                    r: parseInt(result[redIndex], 16),
                    g: parseInt(result[greenIndex], 16),
                    b: parseInt(result[blueIndex], 16),
                } : undefined;
            } else {
                return undefined;
            }
        };

        if (!StatusService.isLoadingCharacter$.value) {
            const original = CreatureService.settings.accent;

            if (original.length === rgbLength || original.length === rrggbbLength) {
                try {
                    const rgba = hexToRgb(original);

                    if (rgba) {
                        return `${ rgba.r }, ${ rgba.g }, ${ rgba.b }`;
                    }
                } catch (error) {
                    return Defaults.colorAccentRGB;
                }
            }
        }

        return Defaults.colorAccentRGB;
    }

}
