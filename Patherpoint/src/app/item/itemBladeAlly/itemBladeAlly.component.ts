import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { ItemsService } from 'src/app/items.service';
import { WeaponRune } from 'src/app/WeaponRune';
import { Equipment } from 'src/app/Equipment';
import { LoreChoice } from 'src/app/LoreChoice';
import { Rune } from 'src/app/Rune';
import { ArmorRune } from 'src/app/ArmorRune';
import { ItemCollection } from 'src/app/ItemCollection';
import { WornItem } from 'src/app/WornItem';
import { Weapon } from 'src/app/Weapon';
import { TimeService } from 'src/app/time.service';
import { Armor } from 'src/app/Armor';
import { ActivitiesService } from 'src/app/activities.service';
import { SpellsService } from 'src/app/spells.service';
import { ConditionsService } from 'src/app/conditions.service';

@Component({
    selector: 'app-itemBladeAlly',
    templateUrl: './itemBladeAlly.component.html',
    styleUrls: ['./itemBladeAlly.component.scss']
  })
  export class ItemBladeAllyComponent implements OnInit {

    @Input()
    item: Equipment;
    
    public newPropertyRune: { rune: Rune, disabled?: boolean };
    
    constructor(
        public characterService: CharacterService,
        private itemsService: ItemsService,
        private timeService: TimeService,
        private activitiesService: ActivitiesService,
        private spellsService: SpellsService,
        private conditionsService: ConditionsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_CleanItems() {
        return this.itemsService.get_CleanItems();
    }

    get_RuneCooldown(rune: Rune) {
        //If any activity on this rune has a cooldown, return the lowest of these in a human readable format.
        if (rune.activities && rune.activities.length && rune.activities.filter(activity => activity.activeCooldown).length) {
            let lowestCooldown = Math.min(...rune.activities.filter(activity => activity.activeCooldown).map(activity => activity.activeCooldown));
            return " (Cooldown " + this.timeService.get_Duration(lowestCooldown) + ")";
        } else {
            return "";
        }
    }

    get_InitialPropertyRunes() {
        let weapon = this.item;
        //Start with one empty rune to select nothing.
        let allRunes: { rune: Rune, disabled?: boolean }[] = [{ rune: new WeaponRune() }];
        allRunes[0].rune.name = "";
        //Add the current choice, if the item has a rune at that index.
        if (weapon.bladeAllyRunes[0]) {
            allRunes.push(this.newPropertyRune as { rune: WeaponRune });
        }
        return allRunes;
    }

    get_WeaponPropertyRunes() {
        let weapon: Weapon | WornItem;
        if (this.item.type == "wornitems") {
            weapon = this.item as WornItem
        } else {
            weapon = this.item as Weapon
        }
        //In the case of Handwraps of Mighty Blows, we need to compare the rune's requirements with the Fist weapon, but its potency rune requirements with the Handwraps.
        //For this purpose, we use two different "weapon"s.
        let weapon2 = this.item;
        if ((weapon as WornItem).isHandwrapsOfMightyBlows) {
            weapon2 = this.get_CleanItems().weapons.filter(weapon => weapon.name == "Fist")[0];
        }
        let allRunes: { rune: Rune, disabled?: boolean }[] = [];
        //Add all runes either from the item store or from the inventories.
        if (this.get_Character().alignment.includes("Good")) {
            this.get_CleanItems().weaponrunes.filter(rune => ["Disrupting", "Ghost Touch", "Returning", "Shifting"].includes(rune.name)).forEach(rune => {
                allRunes.push({ rune: rune });
            });
        } else if (this.get_Character().alignment.includes("Evil")) {
            this.get_CleanItems().weaponrunes.filter(rune => ["Fearsome", "Returning", "Shifting"].includes(rune.name)).forEach(rune => {
                allRunes.push({ rune: rune });
            });
        }
        //Set all runes to disabled that have the same name as any that is already equipped.
        allRunes.forEach((rune: { rune: WeaponRune, disabled?: boolean }) => {
            if (weapon.bladeAllyRunes
                .map(propertyRune => propertyRune.name)
                .includes(rune.rune.name)) {
                rune.disabled = true;
            }
        });
        //Filter all runes whose requirements are not met.
        allRunes.forEach((rune: { rune: WeaponRune, inv: ItemCollection, disabled?: boolean }, $index) => {
                if (
                    (
                        //Show runes that require a trait if that trait is present on the weapon.
                        rune.rune.traitreq ?
                            weapon2.traits
                                .filter(trait => trait.includes(rune.rune.traitreq)).length
                            : true
                    ) && (
                        //Show runes that require a range if the weapon has a value for that range.
                        rune.rune.rangereq ?
                            weapon2[rune.rune.rangereq] > 0
                            : true
                    ) && (
                        //Show runes that require a damage type if the weapon's dmgType contains either of the letters in the requirement.
                        rune.rune.damagereq ?
                            (
                                (weapon2 as Weapon).dmgType &&
                                (
                                    rune.rune.damagereq.split("")
                                        .filter(req => (weapon2 as Weapon).dmgType.includes(req)).length ||
                                    (weapon2 as Weapon).dmgType == "modular"
                                )
                            )
                            : true
                    )
                ) {
                    rune.disabled = false;
                } else {
                    rune.disabled = true;
                }
            })
        return allRunes.sort(function (a, b) {
            if (a.rune.name > b.rune.name) {
                return 1;
            }
            if (a.rune.name < b.rune.name) {
                return -1;
            }
            return 0;
        }).sort((a, b) => a.rune.level - b.rune.level);
    }

    add_BladeAllyRune() {
        let weapon = this.item;
        let rune = this.newPropertyRune.rune;
        if (!weapon.bladeAllyRunes[0] || rune !== weapon.bladeAllyRunes[0]) {
            //If there is a rune in this slot, remove it from the item.
            if (weapon.bladeAllyRunes[0]) {
                this.remove_BladeAllyRune()
                weapon.bladeAllyRunes.splice(0);
            }
            //Then add the new rune to the item.
            if (rune.name != "") {
                //Add a copy of the rune to the item
                weapon.bladeAllyRunes[0] = Object.assign(new WeaponRune, JSON.parse(JSON.stringify(rune)));
                weapon.bladeAllyRunes[0] = this.characterService.reassign(weapon.bladeAllyRunes[0]);
                weapon.bladeAllyRunes[0].amount = 1;
            }
        }
        this.characterService.set_ToChange("Character", "inventory");
        this.characterService.set_ToChange("Character", "attacks");
        if (rune.activities?.length) {
            this.characterService.set_ToChange("Character", "activities");
        }
        this.set_PropertyRuneNames();
        this.characterService.process_ToChange();
    }

    remove_BladeAllyRune() {
        let weapon: Equipment = this.item;
        let oldRune: Rune = weapon.bladeAllyRunes[0];
        if (oldRune.activities?.length) {
            this.characterService.set_ToChange("Character", "activities");
        }
        //Deactivate any active toggled activities of the removed rune.
        oldRune.activities.filter(activity => activity.toggle && activity.active).forEach(activity => {
            this.activitiesService.activate_Activity(this.get_Character(), "Character", this.characterService, this.conditionsService, this.itemsService, this.spellsService, activity, activity, false);
        })
    }

    set_PropertyRuneNames() {
        this.newPropertyRune =
            (this.item.bladeAllyRunes[0] ? { rune: this.item.bladeAllyRunes[0] } : { rune: new Rune() });
        if (this.newPropertyRune.rune.name == "New Item") {
            this.newPropertyRune.rune.name = "";
        };
    }

    ngOnInit() {
        this.set_PropertyRuneNames();
    }

}
