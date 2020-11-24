import { Rune } from './Rune';
import { EffectGain } from './EffectGain';

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
}