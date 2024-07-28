import { Injectable } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { SettingsService } from '../settings/settings.service';
import { propMap$ } from '../../util/observable-utils';
import { DisplayService } from '../display/display.service';

const accentChangingDebounce = 10;

@Injectable({
    providedIn: 'root',
})
export class DocumentStyleService {

    constructor() {
        propMap$(SettingsService.settings$, 'accent$')
            .pipe(
                distinctUntilChanged(),
                debounceTime(accentChangingDebounce),
            )
            .subscribe(accent => {
                this._setAccent(accent);
            });

        propMap$(SettingsService.settings$, 'darkmode$')
            .pipe(
                distinctUntilChanged(),
            )
            .subscribe(darkmode => {
                this._setDarkmode(darkmode);
            });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            this._setDarkmode(SettingsService.settings.darkmode);
        });
    }

    private _setAccent(accent: string = Defaults.colorAccent): void {
        const rgbAccent = this._rgbAccent(accent);

        document.documentElement.style.setProperty('--accent', rgbAccent);
    }

    private _setDarkmode(darkmode: boolean | undefined): void {
        if (darkmode === true) {
            document.body.classList.add('darkmode');
        } else if (darkmode === false) {
            document.body.classList.remove('darkmode');
        } else {
            if (DisplayService.isDarkMode) {
                document.body.classList.add('darkmode');
            } else {
                document.body.classList.remove('darkmode');
            }
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
                    r: parseInt(result[redIndex] ?? '00', 16),
                    g: parseInt(result[greenIndex] ?? '00', 16),
                    b: parseInt(result[blueIndex] ?? '00', 16),
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
