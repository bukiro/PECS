import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { SettingsService } from '../settings/settings.service';

@Injectable({
    providedIn: 'root',
})
export class DocumentStyleService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _settingsService: SettingsService,
    ) { }

    public setAccent(): void {
        document.documentElement.style.setProperty('--accent', this._rgbAccent());
    }

    public setDarkmode(): void {
        if (this._settingsService.isDarkmode) {
            document.body.classList.add('darkmode');
        } else {
            document.body.classList.remove('darkmode');
        }
    }

    private _rgbAccent(): string {
        const rgbLength = 4;
        const rrggbbLength = 7;
        const redIndex = 0;
        const greenIndex = 1;
        const blueIndex = 2;

        const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
            let result: RegExpExecArray;

            if (hex.length === rgbLength) {
                result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);

                return result ? {
                    r: parseInt(`${ result[redIndex] }${ result[redIndex] }`, 16),
                    g: parseInt(`${ result[greenIndex] }${ result[greenIndex] }`, 16),
                    b: parseInt(`${ result[blueIndex] }${ result[blueIndex] }`, 16),
                } : null;
            } else if (hex.length === rrggbbLength) {
                result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

                return result ? {
                    r: parseInt(result[redIndex], 16),
                    g: parseInt(result[greenIndex], 16),
                    b: parseInt(result[blueIndex], 16),
                } : null;
            }
        };

        if (!this._characterService.stillLoading) {
            const original = this._characterService.character.settings.accent;

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
