import { Rune } from 'src/app/classes/Rune';
import { EffectGain } from 'src/app/classes/EffectGain';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';
import { HintEffectsObject } from 'src/app/services/effectsGeneration.service';

export class ArmorRune extends Rune {
    //Armor Runes should be type "armorrunes" to be found in the database
    readonly type = 'armorrunes';
    public resilient = 0;
    //Can only be applied to an armor with this proficiency
    public profreq: Array<string> = [];
    //Can only be applied to a nonmetallic armor
    public nonmetallic = false;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());

        return this;
    }
    effectsGenerationHints(): Array<HintEffectsObject> {
        return this.hints.map(hint => ({ hint, parentItem: this, objectName: this.getName() }));
    }
}
