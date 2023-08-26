import { Rune } from 'src/app/classes/Rune';
import { EffectGain } from 'src/app/classes/EffectGain';
import { HintEffectsObject } from 'src/libs/shared/effects-generation/definitions/interfaces/HintEffectsObject';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { Observable, map } from 'rxjs';

export class ArmorRune extends Rune {
    //Armor Runes should be type "armorrunes" to be found in the database
    public readonly type: string = 'armorrunes';
    public resilient = 0;
    /** If sit, the armor rune can only be applied to an armor with this proficiency. */
    public profreq: Array<string> = [];
    /** If this is set, the armor rune can only be applied to a nonmetallic armor. */
    public nonmetallic = false;

    public get secondary(): number {
        return this.resilient;
    }

    public isArmorRune(): this is ArmorRune {
        return true;
    }

    public recast(recastFns: RecastFns): ArmorRune {
        super.recast(recastFns);
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());

        return this;
    }

    public clone(recastFns: RecastFns): ArmorRune {
        return Object.assign<ArmorRune, ArmorRune>(new ArmorRune(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public effectsGenerationHints$(): Observable<Array<HintEffectsObject>> {
        return this.effectiveName$()
            .pipe(
                map(objectName =>
                    this.hints.map(hint => ({
                        hint,
                        parentItem: this,
                        objectName,
                    })),
                ),
            );
    }
}
