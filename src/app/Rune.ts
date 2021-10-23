import { ItemActivity } from './ItemActivity';
import { Item } from './Item';
import { LoreChoice } from './LoreChoice';
import { Hint } from './Hint';
import { TypeService } from './type.service';
import { ItemsService } from './items.service';
import { EffectGain } from './EffectGain';

export class Rune extends Item {
    public activities: ItemActivity[] = [];
    public desc: string = "";
    //For weapon runes, the hints are shown directly on the weapon. They don't have effects and are not taken into account when collecting hints or generating effects.
    //The hints on armor runes can have effects and are taken into account when collecting hints and generating effects.
    public hints: Hint[] = [];
    public effects: EffectGain[] = [];
    //One rune trains a lore skill while equipped.
    public loreChoices: LoreChoice[] = [];
    public potency: number = 0;
    public traits: string[] = [];
    public usage: string = "";
    readonly allowEquippable = false;
    readonly equippable = false;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.activities = this.activities.map(obj => Object.assign(new ItemActivity(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.loreChoices = this.loreChoices.map(obj => Object.assign(new LoreChoice(), obj).recast());
        return this;
    }
    can_Stack() {
        //Additionally to the usual considerations, runes can't stack if they add any activities.
        return (
            super.can_Stack() &&
            !this.activities.filter((activity: ItemActivity) => !activity.displayOnly).length
        )
    }
}
