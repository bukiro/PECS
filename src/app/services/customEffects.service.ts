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

    private _effectProperties: Array<ItemProperty> = [];

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _refreshService: RefreshService,
    ) { }

    public get effectProperties(): Array<ItemProperty> {
        return this._effectProperties;
    }

    public tickCustomEffects(creature: Creature, turns: number): void {
        //Tick down all custom effects and set them to remove when they expire.
        creature.effects.filter(gain => gain.duration > 0).forEach(gain => {
            //Tick down all custom effects and set them to remove when they expire.
            gain.duration -= turns;

            if (gain.duration <= 0) {
                gain.type = 'DELETE';
            }

            this._refreshService.set_ToChange(creature.type, 'effects');
        });
        //Remove all effects that were marked for removal.
        creature.effects = creature.effects.filter(gain => gain.type !== 'DELETE');
    }

    public initialize(): void {
        this._loadEffectProperties();
    }

    private _loadEffectProperties(): void {
        this._effectProperties = [];

        const data = this._extensionsService.extend(json_effectproperties, 'effectProperties');

        Object.keys(data).forEach(key => {
            this._effectProperties.push(...data[key].map((obj: ItemProperty) => Object.assign(new ItemProperty(), obj).recast()));
        });
        this._effectProperties =
            this._extensionsService.cleanupDuplicatesWithMultipleIdentifiers(
                this._effectProperties,
                ['parent', 'key'],
                'custom effect properties',
            ) as Array<ItemProperty>;
    }

}
