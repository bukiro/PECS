import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TraitsService } from 'src/app/traits.service';
import { ActivitiesService } from 'src/app/activities.service';
import { AdventuringGear } from 'src/app/AdventuringGear';
import { CharacterService } from 'src/app/character.service';
import { ItemsService } from 'src/app/items.service';
import { Item } from 'src/app/Item';
import { Character } from 'src/app/Character';
import { AnimalCompanion } from 'src/app/AnimalCompanion';
import { SpellsService } from 'src/app/spells.service';
import { Talisman } from 'src/app/Talisman';
import { SpellGain } from 'src/app/SpellGain';
import { AlchemicalPoison } from 'src/app/AlchemicalPoison';
import { Weapon } from 'src/app/Weapon';
import { Spell } from 'src/app/Spell';
import { ConditionGain } from 'src/app/ConditionGain';
import { Condition } from 'src/app/Condition';
import { ConditionsService } from 'src/app/conditions.service';
import { Equipment } from 'src/app/Equipment';
import { WornItem } from 'src/app/WornItem';
import { Shield } from 'src/app/Shield';
import { Armor } from 'src/app/Armor';

@Component({
    selector: 'app-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    item;
    @Input()
    allowActivate: boolean = false;
    @Input()
    armoredSkirt: AdventuringGear;
    @Input()
    itemStore: boolean = false;
    @Input()
    isSubItem: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private traitsService: TraitsService,
        private activitiesService: ActivitiesService,
        public characterService: CharacterService,
        private itemsService: ItemsService,
        private spellsService: SpellsService,
        private conditionsService: ConditionsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Creature(type: string = this.creature) {
        return this.characterService.get_Creature(type) as Character | AnimalCompanion;
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    get_HaveMatchingTalismanCord(talisman: Talisman) {
        if (this.item instanceof Equipment) {
            return this.item.talismanCords?.some(cord => cord.level <= talisman.level && cord.data.some(data => talisman.traits.includes(data.value)));
        }
    }

    on_TalismanUse(talisman: Talisman, index: number, preserve: boolean = false) {
        this.characterService.on_ConsumableUse(this.get_Creature(), talisman, preserve);
        if (!preserve) {
            this.item.talismans.splice(index, 1)
        }
        if (this.item instanceof Armor || this.item instanceof Shield) {
            this.characterService.set_ToChange(this.creature, "defense");
        }
        if (this.item instanceof Weapon) {
            this.characterService.set_ToChange(this.creature, "attacks");
        }
        this.characterService.process_ToChange();
    }

    on_PoisonUse(poison: AlchemicalPoison) {
        this.characterService.on_ConsumableUse(this.get_Creature(), poison);
        if (this.item instanceof Weapon) {
            this.item.poisonsApplied.length = 0;
            this.characterService.set_ToChange(this.creature, "attacks");
        }
        this.characterService.process_ToChange();
    }

    get_DoublingRingsOptions(ring: string) {
        switch (ring) {
            case "gold":
                return this.get_Creature().inventories[0].weapons.filter(weapon => weapon.melee && weapon.potencyRune);
            case "iron":
                return this.get_Creature().inventories[0].weapons.filter(weapon => weapon.melee);
        }
    }

    on_DoublingRingsChange() {
        this.characterService.set_ToChange(this.creature, "inventory");
        let ironItem = this.get_DoublingRingsOptions("iron").find(weapon => weapon.id == this.item.data[0].value);
        if (ironItem && this.item.invested) {
            this.characterService.set_ToChange(this.creature, "attacks");
            this.characterService.set_ToChange(this.creature, ironItem.id);
            this.characterService.set_EquipmentViewChanges(this.get_Creature(), ironItem);
        }
        this.characterService.process_ToChange();
    }

    get_TalismanCordOptions(item: WornItem, index: number) {
        return [
            "no school attuned",
            "Abjuration",
            "Conjuration",
            "Divination",
            "Enchantment",
            "Evocation",
            "Illusion",
            "Necromancy",
            "Transmutation"
        ].filter(school => school == "no school attuned" || item.data[index].value == school || !item.data.some((data, dataIndex) => dataIndex <= item.isTalismanCord && data.value == school));
    }

    get_ItemSpell(item: Item) {
        if (item.storedSpells.length && item.storedSpells[0].spells.length) {
            let spell = this.get_Spells(item.storedSpells[0].spells[0].name)[0];
            if (spell) {
                return [spell];
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    get_StoredSpells(item: Item) {
        return item.storedSpells.filter(choice => choice.available || choice.dynamicAvailable);
    }

    get_StoredSpellsTaken(item: Item) {
        return item.storedSpells.filter(choice => choice.spells.length);
    }

    get_SpellConditions(spell: Spell, spellLevel: number, gain: SpellGain) {
        //For all conditions that are included with this spell on this level, create an effectChoice on the gain and set it to the default choice, if any. Add the name for later copyChoiceFrom actions.
        let conditionSets: { gain: ConditionGain, condition: Condition }[] = [];
        spell.get_HeightenedConditions(spellLevel)
            .map(conditionGain => { return { gain: conditionGain, condition: this.conditionsService.get_Conditions(conditionGain.name)[0] } })
            .forEach((conditionSet, index) => {
                //Create the temporary list of currently available choices.
                conditionSet.condition?.get_Choices(this.characterService, true, (conditionSet.gain.heightened ? conditionSet.gain.heightened : spellLevel));
                //Add the condition to the selection list. Conditions with no choices or with automatic choices will not be displayed.
                conditionSets.push(conditionSet);
                //Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices, insert or replace that choice on the gain.
                while (!gain.effectChoices.length || gain.effectChoices.length < index - 1) {
                    gain.effectChoices.push({ condition: conditionSet.condition.name, choice: conditionSet.condition.choice });
                }
                if (!conditionSet.condition._choices.includes(gain.effectChoices?.[index]?.choice)) {
                    gain.effectChoices[index] = { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                }
            })
        return conditionSets;
    }

    on_SpellItemUse(item: Item) {
        let spellName = item.storedSpells[0]?.spells[0]?.name || "";
        let spellChoice = item.storedSpells[0];
        if (spellChoice && spellName) {
            let spell = this.get_Spells(item.storedSpells[0]?.spells[0]?.name)[0];
            let target = "";
            if (spell.target == "self") {
                target = "Character";
            }
            if (spell) {
                let tempGain: SpellGain = new SpellGain();
                this.spellsService.process_Spell(this.get_Creature("Character"), target, this.characterService, this.itemsService, this.characterService.conditionsService, null, tempGain, spell, spellChoice.level, true, true, false);
            }
            spellChoice.spells.shift();
        }
        this.characterService.set_ToChange("Character", "spellchoices")
        this.characterService.process_ToChange();
    }

    update_Item() {
        //This updates any gridicon that has this item's id set as its update id.
        this.characterService.set_Changed(this.item.id);
    }

    finish_Loading() {
        if (this.item.id) {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (target == this.item.id) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.target == this.item.id) {
                        this.changeDetector.detectChanges();
                    }
                });
        }
    }

    ngOnInit() {
        if (["weaponrunes", "armorrunes", "oils"].includes(this.item.type) && !this.isSubItem) {
            this.allowActivate = false;
        }
        this.finish_Loading();
    }

}
