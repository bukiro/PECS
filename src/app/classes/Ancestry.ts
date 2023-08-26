import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { ItemGain } from 'src/app/classes/ItemGain';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';

export class Ancestry {
    public disabled = '';
    public warning = '';
    public abilityChoices: Array<AbilityChoice> = [];
    public ancestries: Array<string> = [];
    public baseLanguages = 0;
    public desc: Array<{ name: string; value: string }> = [];
    public featChoices: Array<FeatChoice> = [];
    public gainItems: Array<ItemGain> = [];
    public heritages: Array<string> = [];
    public hitPoints = 0;
    public languages: Array<string> = [];
    public name = '';
    public recommendedLanguages: Array<string> = [];
    public senses: Array<string> = [];
    public sourceBook = '';
    public size = 0;
    public speeds: Array<{ name: string; value: number }> = [];

    private readonly _traits = new OnChangeArray<string>();

    public get traits(): OnChangeArray<string> {
        return this._traits;
    }

    public set traits(value: Array<string>) {
        this._traits.setValues(...value);
    }

    public recast(): Ancestry {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.featChoices = this.featChoices.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());

        return this;
    }

    public clone(): Ancestry {
        return Object.assign<Ancestry, Ancestry>(new Ancestry(), JSON.parse(JSON.stringify(this))).recast();
    }
}
