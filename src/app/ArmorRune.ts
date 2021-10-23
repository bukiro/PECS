import { Rune } from './Rune';
import { EffectGain } from './EffectGain';
import { TypeService } from './type.service';
import { ItemsService } from './items.service';
import { HintEffectsObject } from './effectsGeneration.service';

export class ArmorRune extends Rune {
    //Armor Runes should be type "armorrunes" to be found in the database
    readonly type = "armorrunes";
    public resilient: number = 0;
    //Can only be applied to an armor with this proficiency
    public profreq: string[] = [];
    //Can only be applied to a nonmetallic armor
    public nonmetallic: boolean = false;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        return this;
    }
    get_EffectsGenerationHints(): HintEffectsObject[] {
        return this.hints.map(hint => { return { hint: hint, parentItem: this, objectName: this.get_Name() } });
    }
}