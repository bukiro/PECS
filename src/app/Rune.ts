import { ItemActivity } from './ItemActivity';
import { Item } from './Item';
import { LoreChoice } from './LoreChoice';
import { Hint } from './Hint';
import { TypeService } from './type.service';

export class Rune extends Item {
    public _className;
    public activities: ItemActivity[] = [];
    public desc: string = "";
    //For weapon runes, the hints are shown directly on the weapon.
    public hints: Hint[] = [];
    //One rune trains a lore skill while equipped.
    public loreChoices: LoreChoice[] = [];
    public potency: number = 0;
    public traits: string[] = [];
    public usage: string = "";
    readonly allowEquippable = false;
    readonly equippable = false;
    recast(typeService: TypeService) {
        super.recast(typeService);
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
