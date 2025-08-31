import { computed, Injectable, Signal } from '@angular/core';
import { CreatureService } from '../../../creatures/domain/services/creature.service';
import { Settings } from '../../util/models/settings';

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
