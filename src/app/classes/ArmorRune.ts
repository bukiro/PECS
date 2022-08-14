import { Rune } from 'src/app/classes/Rune';
import { EffectGain } from 'src/app/classes/EffectGain';
import { HintEffectsObject } from 'src/libs/shared/effects-generation/definitions/interfaces/HintEffectsObject';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class ArmorRune extends Rune {
    //Armor Runes should be type "armorrunes" to be found in the database
    public readonly type = 'armorrunes';
    public resilient = 0;
    /** If sit, the armor rune can only be applied to an armor with this proficiency. */
    public profreq: Array<string> = [];
    /** If this is set, the armor rune can only be applied to a nonmetallic armor. */
    public nonmetallic = false;
    public get secondary(): number {
        return this.resilient;
    }

    public recast(itemsDataService: ItemsDataService): ArmorRune {
        super.recast(itemsDataService);
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());

        return this;
    }

    public effectsGenerationHints(): Array<HintEffectsObject> {
        return this.hints.map(hint => ({ hint, parentItem: this, objectName: this.effectiveName() }));
    }
}
