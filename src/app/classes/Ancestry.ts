import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { ItemGain } from 'src/app/classes/ItemGain';
import { FeatChoice } from 'src/app/classes/FeatChoice';

export class Ancestry {
    public disabled: string = "";
    public warning: string = "";
    public abilityChoices: AbilityChoice[] = [];
    public ancestries: string[] = [];
    public baseLanguages: number = 0;
    public desc: { name: string, value: string }[] = [];
    public featChoices: FeatChoice[] = [];
    public gainItems: ItemGain[] = [];
    public heritages: string[] = [];
    public hitPoints: number = 0;
    public languages: string[] = [];
    public name: string = "";
    public recommendedLanguages: string[] = [];
    public senses: string[] = [];
    public sourceBook: string = "";
    public size: number = 0;
    public speeds: { name: string, value: number }[] = [];
    public traits: string[] = [];
    recast() {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.featChoices = this.featChoices.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        return this;
    }
}
