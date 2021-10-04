import { Rune } from './Rune';
import { EffectGain } from './EffectGain';
import { TypeService } from './type.service';

export class ArmorRune extends Rune {
    public readonly _className: string = this.constructor.name;
    //Armor Runes should be type "armorrunes" to be found in the database
    readonly type = "armorrunes";
    public resilient: number = 0;
    //Can only be applied to an armor with this proficiency
    public profreq: string[] = [];
    //Can only be applied to a nonmetallic armor
    public nonmetallic: boolean = false;
    public effects: EffectGain[] = [];
    recast(typeService: TypeService) {
        super.recast(typeService);
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        return this;
    }
}