import { computed, Injectable, Signal } from '@angular/core';
import { Settings } from 'src/app/classes/app/settings';
import { CreatureService } from '../creature/creature.service';

@Injectable({
    providedIn: 'root',
})
export class SettingsService {

    public static settings$$: Signal<Settings> = computed(() => CreatureService.character$$().settings());

    // TODO: Probably not necessary with signals?
    public static setSetting(fn: (settings: Settings) => void): void {
        fn(SettingsService.settings$$());
    }

}
