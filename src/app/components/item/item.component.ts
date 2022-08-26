import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TraitsDataService } from 'src/app/core/services/data/traits-data.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { CreatureService } from 'src/app/services/character.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { Item } from 'src/app/classes/Item';
import { Talisman } from 'src/app/classes/Talisman';
import { SpellGain } from 'src/app/classes/SpellGain';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { Weapon } from 'src/app/classes/Weapon';
import { Spell } from 'src/app/classes/Spell';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Condition } from 'src/app/classes/Condition';
import { Equipment } from 'src/app/classes/Equipment';
import { RingOfWizardrySlot, WornItem } from 'src/app/classes/WornItem';
import { Subscription } from 'rxjs';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { EffectGain } from 'src/app/classes/EffectGain';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Creature } from 'src/app/classes/Creature';
import { Character } from 'src/app/classes/Character';
import { Trait } from 'src/app/classes/Trait';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { Activity } from 'src/app/classes/Activity';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { SpellTraditionFromString } from 'src/libs/shared/util/spellUtils';
import { Rune } from 'src/app/classes/Rune';
import { SpellTargetSelection } from 'src/libs/shared/definitions/Types/spellTargetSelection';
import { ItemTraitsService } from 'src/libs/shared/services/item-traits/item-traits.service';
import { ConditionsDataService } from 'src/app/core/services/data/conditions-data.service';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';
import { SpellsDataService } from 'src/app/core/services/data/spells-data.service';
import { SpellProcessingService } from 'src/libs/shared/services/spell-processing/spell-processing.service';
import { ItemActivationService } from 'src/libs/shared/services/item-activation/item-activation.service';

@Component({
    selector: 'app-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public item: Item;
    @Input()
    public allowActivate = false;
    @Input()
    public armoredSkirt: AdventuringGear;
    @Input()
    public itemStore = false;
    @Input()
    public isSubItem = false;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _refreshService: RefreshService,
        private readonly _spellsService: SpellPropertiesService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _spellProcessingService: SpellProcessingService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _conditionPropertiesService: ConditionPropertiesService,
        private readonly _itemRolesService: ItemRolesService,
        private readonly _itemTraitsService: ItemTraitsService,
        private readonly _itemActivationService: ItemActivationService,
        public trackers: Trackers,
    ) { }

    private get _currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public itemTraits(): Array<string> {
        this._itemTraitsService.cacheItemEffectiveTraits(this.item, { creature: this._currentCreature });

        return this.item.$traits;
    }

    public traitFromName(name: string): Trait {
        return this._traitsDataService.traitFromName(name);
    }

    public activityFromName(name: string): Activity {
        return this._activitiesDataService.activityFromName(name);
    }

    public itemRoles(): ItemRoles {
        return this._itemRolesService.getItemRoles(this.item);
    }

    public spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

    public gainedSpellLevel(spell: Spell, context: { gain: SpellGain; choice: SpellChoice }): number {
        return this._spellsService.effectiveSpellLevel(
            spell,
            { baseLevel: (context.choice.level ? context.choice.level : 0), creature: this._currentCreature, gain: context.gain },
            { noEffects: true },
        );
    }

    public hasMatchingTalismanCord(item: Equipment, talisman: Talisman): boolean {
        return item.talismanCords.some(cord =>
            cord.level <= talisman.level &&
            cord.data.some(data => talisman.traits.includes(data.value as string)),
        );
    }

    public onActivateTalisman(itemRoles: ItemRoles, talisman: Talisman, index: number, options: { preserve?: boolean } = {}): void {
        this._itemActivationService.useConsumable(this._currentCreature, talisman, options.preserve);

        if (!options.preserve) {
            itemRoles.asEquipment?.talismans.splice(index, 1);
        }

        if (itemRoles.asArmor || itemRoles.asShield) {
            this._refreshService.prepareDetailToChange(this.creature, 'defense');
        }

        if (itemRoles.asWeapon) {
            this._refreshService.prepareDetailToChange(this.creature, 'attacks');
        }

        this._refreshService.processPreparedChanges();
    }

    public onActivatePoison(weapon: Weapon, poison: AlchemicalPoison): void {
        this._itemActivationService.useConsumable(this._currentCreature, poison);

        weapon.poisonsApplied.length = 0;
        this._refreshService.prepareDetailToChange(this.creature, 'attacks');

        this._refreshService.processPreparedChanges();
    }

    public doublingRingsOptions(ring: string): Array<Weapon> {
        switch (ring) {
            case 'gold':
                return this._currentCreature.inventories[0].weapons.filter(weapon => weapon.melee && weapon.potencyRune);
            case 'iron':
                return this._currentCreature.inventories[0].weapons.filter(weapon => weapon.melee);
            default:
                return [];
        }
    }

    public onSelectDoublingRingsOption(item: WornItem): void {
        this._refreshService.prepareDetailToChange(this.creature, 'inventory');

        const ironItem = this.doublingRingsOptions('iron').find(weapon => weapon.id === this.item.data[0].value);

        if (ironItem && item.invested) {
            this._refreshService.prepareChangesByItem(this._currentCreature, ironItem);
        }

        this._refreshService.processPreparedChanges();
    }

    public ringOfWizardrySlotName(wizardrySlot: RingOfWizardrySlot): string {
        const spellLevels = [
            'cantrip',
            '1st-level spell',
            '2nd-level spell',
            '3rd-level spell',
            '4th-level spell',
            '5th-level spell',
            '6th-level spell',
            '7th-level spell',
            '8th-level spell',
            '9th-level spell',
            '10th-level spell',
        ];

        return `${ (wizardrySlot.tradition ? `${ wizardrySlot.tradition } ` : '') + spellLevels[wizardrySlot.level] } slot`;
    }

    public ringOfWizardryOptions(wizardrySlot: RingOfWizardrySlot): Array<string> {
        if (this._character.class) {
            return ['no spellcasting selected']
                .concat(this._character.class?.spellCasting
                    .filter(casting =>
                        !['focus', 'innate'].includes(casting.castingType.toLowerCase()) &&
                        (wizardrySlot.tradition ? casting.tradition.toLowerCase() === wizardrySlot.tradition.toLowerCase() : true),
                    )
                    .map(casting => `${ casting.className } ${ casting.tradition } ${ casting.castingType } Spells`));
        }
    }

    public onSelectRingOfWizardryOption(item: WornItem, wizardrySlot: RingOfWizardrySlot, wizardrySlotIndex: number): void {
        //Remove any spellgain or effectgain that comes from this ring of wizardry slot.
        let hasFoundSpellGain = false;

        for (let index = 0; index < item.gainSpells.length; index++) {
            if (!hasFoundSpellGain && item.gainSpells[index].ringOfWizardry === (wizardrySlotIndex + 1)) {
                hasFoundSpellGain = true;
                item.gainSpells.splice(index, 1);
                break;
            }
        }

        let hasFoundEffect = false;

        for (let index = 0; index < item.effects.length; index++) {
            if (!hasFoundEffect && item.effects[index].source === `Ring of Wizardry Slot ${ wizardrySlotIndex + 1 }`) {
                hasFoundEffect = true;
                item.effects.splice(index, 1);
                break;
            }
        }

        //If a new spellcasting has been selected, either add a new spellgain or effectgain.
        if (item.data[wizardrySlotIndex].value !== 'no spellcasting selected') {
            const dataValue = (item.data[wizardrySlotIndex].value as string);
            const [className, tradition, castingType] = dataValue.split(' ');

            if (castingType.toLowerCase() === 'prepared') {
                const newSpellGain = new SpellChoice();

                newSpellGain.available = 1;
                newSpellGain.className = className;
                newSpellGain.castingType = SpellCastingTypes.Prepared;
                newSpellGain.tradition = SpellTraditionFromString(tradition);
                newSpellGain.level = wizardrySlot.level;
                newSpellGain.ringOfWizardry = (wizardrySlotIndex + 1);
                newSpellGain.source = item.name;
                item.gainSpells.push(newSpellGain);
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'Spells');
            } else if (castingType.toLowerCase() === 'spontaneous') {
                const newEffectGain = new EffectGain();

                newEffectGain.affected = `${ className } ${ castingType } Level ${ wizardrySlot.level } Spell Slots`;
                newEffectGain.value = '1';
                newEffectGain.source = `Ring of Wizardry Slot ${ wizardrySlotIndex + 1 }`;
                item.effects.push(newEffectGain);
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
            }
        }

        //Close any open spell choices.
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells', 'clear');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        this._refreshService.processPreparedChanges();
    }

    public talismanCordOptions(item: WornItem, index: number): Array<string> {
        return [
            'no school attuned',
            'Abjuration',
            'Conjuration',
            'Divination',
            'Enchantment',
            'Evocation',
            'Illusion',
            'Necromancy',
            'Transmutation',
        ].filter(school =>
            school === 'no school attuned' ||
            item.data[index].value === school ||
            !item.data.some((data, dataIndex) => dataIndex <= item.isTalismanCord && data.value === school),
        );
    }

    public runeStoredSpell(rune: Rune): Spell {
        if (rune.storedSpells.length && rune.storedSpells[0].spells.length) {
            const spell = this.spellFromName(rune.storedSpells[0].spells[0].name);

            if (spell) {
                return spell;
            }
        }
    }

    public storedSpellChoices(item: Item): Array<SpellChoice> {
        return item.storedSpells.filter(choice => choice.available || choice.dynamicAvailable);
    }

    public storedSpellsTaken(item: Item): Array<{ choice: SpellChoice; taken: SpellGain }> {
        return ([] as Array<{ choice: SpellChoice; taken: SpellGain }>)
            .concat(
                ...item.storedSpells
                    .filter(choice => choice.spells.length)
                    .map(choice =>
                        choice.spells.map(taken => ({ choice, taken })),
                    ),
            );
    }

    public spellConditions(spell: Spell, spellLevel: number, gain: SpellGain): Array<{ gain: ConditionGain; condition: Condition }> {
        // For all conditions that are included with this spell on this level,
        // create an effectChoice on the gain and set it to the default choice, if any. Add the name for later copyChoiceFrom actions.
        const conditionSets: Array<{ gain: ConditionGain; condition: Condition }> = [];

        spell.heightenedConditions(spellLevel)
            .map(conditionGain => ({ gain: conditionGain, condition: this._conditionsDataService.conditionFromName(conditionGain.name) }))
            .forEach((conditionSet, index) => {
                // Create the temporary list of currently available choices.
                this._conditionPropertiesService.cacheEffectiveChoices(
                    conditionSet.condition,
                    (conditionSet.gain.heightened ? conditionSet.gain.heightened : spellLevel),
                );
                // Add the condition to the selection list. Conditions with no choices or with automatic choices will not be displayed.
                conditionSets.push(conditionSet);

                // Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices,
                // insert or replace that choice on the gain.
                while (!gain.effectChoices.length || gain.effectChoices.length < index - 1) {
                    gain.effectChoices.push({ condition: conditionSet.condition.name, choice: conditionSet.condition.choice });
                }

                if (!conditionSet.condition.$choices.includes(gain.effectChoices?.[index]?.choice)) {
                    gain.effectChoices[index] = { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                }
            });

        return conditionSets;
    }

    public onActivateSpellRune(rune: Rune): void {
        const spellName = rune.storedSpells[0]?.spells[0]?.name || '';
        const spellChoice = rune.storedSpells[0];

        if (spellChoice && spellName) {
            const spell = this.spellFromName(rune.storedSpells[0]?.spells[0]?.name)[0];
            let target: SpellTargetSelection = '';

            if (spell.target === 'self') {
                target = CreatureTypes.Character;
            }

            if (spell) {
                const tempGain: SpellGain = new SpellGain();

                this._spellProcessingService.processSpell(
                    spell,
                    true,
                    { creature: this._character, target, choice: spellChoice, gain: tempGain, level: spellChoice.level },
                    { manual: true },
                );
            }

            spellChoice.spells.shift();
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
        this._refreshService.processPreparedChanges();
    }

    public onSelectVariation(): void {
        this._refreshService.prepareChangesByItem(this._currentCreature, this.item);
        this._refreshService.processPreparedChanges();
        this._updateItem();
    }

    public ngOnInit(): void {
        if (['weaponrunes', 'armorrunes', 'oils'].includes(this.item.type) && !this.isSubItem) {
            this.allowActivate = false;
        }

        if (this.item.id) {
            this._changeSubscription = this._refreshService.componentChanged$
                .subscribe(target => {
                    if (target === this.item.id) {
                        this._changeDetector.detectChanges();
                    }
                });
            this._viewChangeSubscription = this._refreshService.detailChanged$
                .subscribe(view => {
                    if (view.target === this.item.id) {
                        this._changeDetector.detectChanges();
                    }
                });
        }
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _updateItem(): void {
        //This updates any gridicon that has this item's id set as its update id.
        this._refreshService.setComponentChanged(this.item.id);
    }

}
