import { Injectable } from '@angular/core';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { SettingsService } from '../settings/settings.service';

const accentChangingDebounce = 10;

@Injectable({
    providedIn: 'root',
})
export class DocumentStyleService {

    constructor() {
        SettingsService.settings$
            .pipe(
                map(settings => settings.accent),
                debounceTime(accentChangingDebounce),
                distinctUntilChanged(),
            )
            .subscribe(accent => {
                this._setAccent(accent);
            });

        SettingsService.settings$
            .pipe(
                map(settings => settings.darkmode),
                distinctUntilChanged(),
            )
            .subscribe(darkmode => {
                this._setDarkmode(darkmode);
            });
    }

    private _setAccent(accent: string = Defaults.colorAccent): void {
        const rgbAccent = this._rgbAccent(accent);

        document.documentElement.style.setProperty('--accent', rgbAccent);
    }

    private _setDarkmode(darkmode: boolean): void {
        if (darkmode) {
            document.body.classList.add('darkmode');
        } else {
            document.body.classList.remove('darkmode');
        }
    }

    private _rgbAccent(accent: string): string {
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

        if (accent.length === rgbLength || accent.length === rrggbbLength) {
            try {
                const rgba = hexToRgb(accent);

                if (rgba) {
                    return `${ rgba.r }, ${ rgba.g }, ${ rgba.b }`;
                }
            } catch (error) {
                return Defaults.colorAccentRGB;
            }
        }

        return Defaults.colorAccentRGB;
    }

}