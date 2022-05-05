import { Injectable } from '@angular/core';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import * as json_effectproperties from 'src/assets/json/effectproperties';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { Creature } from 'src/app/classes/Creature';
import { RefreshService } from 'src/app/services/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class CustomEffectsService {

    private effectProperties: Array<ItemProperty> = [];

    constructor(
        private readonly extensionsService: ExtensionsService,
        private readonly refreshService: RefreshService,
    ) { }

    public get get_EffectProperties(): Array<ItemProperty> {
        return this.effectProperties;
    }

    tick_CustomEffects(creature: Creature, turns: number): void {
        //Tick down all custom effects and set them to remove when they expire.
        creature.effects.filter(gain => gain.duration > 0).forEach(gain => {
            //Tick down all custom effects and set them to remove when they expire.
            gain.duration -= turns;

            if (gain.duration <= 0) {
                gain.type = 'DELETE';
            }

            this.refreshService.set_ToChange(creature.type, 'effects');
        });
        //Remove all effects that were marked for removal.
        creature.effects = creature.effects.filter(gain => gain.type != 'DELETE');
    }

    initialize(): void {
        //Initialize effect properties only once.
        if (!this.effectProperties.length) {
            this.load_EffectProperties();
        }
    }

    private load_EffectProperties(): void {
        this.effectProperties = [];

        const data = this.extensionsService.extend(json_effectproperties, 'effectProperties');

        Object.keys(data).forEach(key => {
            this.effectProperties.push(...data[key].map((obj: ItemProperty) => Object.assign(new ItemProperty(), obj).recast()));
        });
        this.effectProperties = this.extensionsService.cleanup_DuplicatesWithMultipleIdentifiers(this.effectProperties, ['parent', 'key'], 'custom effect properties') as Array<ItemProperty>;
    }

}
