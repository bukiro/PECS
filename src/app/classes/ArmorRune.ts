import { Rune } from 'src/app/classes/Rune';
import { EffectGain } from 'src/app/classes/EffectGain';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';
import { HintEffectsObject } from 'src/app/services/effectsGeneration.service';

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
    public recast(itemsService: ItemsService): ArmorRune {
        super.recast(itemsService);
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());

        return this;
    }
    public effectsGenerationHints(): Array<HintEffectsObject> {
        return this.hints.map(hint => ({ hint, parentItem: this, objectName: this.effectiveName() }));
    }
}
