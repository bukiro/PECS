import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Item } from './Item';
import { Hint } from './Hint';
import { Creature } from './Creature';

export class Trait {
    public desc: string = "";
    public dynamic: boolean = false;
    public name: string = "";
    public hints: Hint[] = [];
    public specialModifier: string[] = [];
    //Return all equipped items that have this trait, or alternatively only their names.
    //Some trait instances have information after the trait name, so we allow traits that include this trait's name as long as this trait is dynamic.
    haveOn(creature: Creature, namesOnly: boolean = false) { 
        let filteredItems: Item[] = []
        creature.inventories.forEach(inventory => {
            filteredItems.push(...inventory.allEquipment()
                .filter(item =>
                    item.equipped &&
                    item.traits
                        .find(trait =>
                            this.name == trait ||
                            (
                                trait.includes(this.name) &&
                                this.dynamic
                            )
                        )
                    )
                );
        });
        if (namesOnly) {
            return filteredItems.map(item => item.name);
        } else {
            return filteredItems;
        }
    };
}