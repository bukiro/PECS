import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Item } from './Item';
import { Hint } from './Hint';

export class Trait {
    public description: string = "";
    public name: string = "";
    public hints: Hint[] = [];
    public showon: string = "";
    public specialModifier: string[] = [];
    //Return all equipped items that have this trait, or alternately only their names.
    //Some trait instances have range information after the trait name, so we allow traits that include this trait's name and " ft" or " d".
    haveOn(creature: Character|AnimalCompanion|Familiar, namesOnly: boolean = false) { 
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
                                (
                                    trait.includes(" ft") ||
                                    trait.includes(" d")
                                )
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