/* eslint-disable complexity */
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Subject, Observable, switchMap } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { SpellChoice } from 'src/app/classes/character-creation/spell-choice';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { EffectGain } from 'src/app/classes/effects/effect-gain';
import { Trait } from 'src/app/classes/hints/trait';
import { AdventuringGear } from 'src/app/classes/items/adventuring-gear';
import { AlchemicalPoison } from 'src/app/classes/items/alchemical-poison';
import { Equipment } from 'src/app/classes/items/equipment';
import { Item } from 'src/app/classes/items/item';
import { ItemRoles } from 'src/app/classes/items/item-roles';
import { Rune } from 'src/app/classes/items/rune';
import { Talisman } from 'src/app/classes/items/talisman';
import { Weapon } from 'src/app/classes/items/weapon';
import { WornItem, RingOfWizardrySlot } from 'src/app/classes/items/worn-item';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spell-casting-types';
import { SpellTargetSelection } from 'src/libs/shared/definitions/types/spell-target-selection';
import { SpellProcessingService } from 'src/libs/shared/processing/services/spell-processing/spell-processing.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { ItemActivationService } from 'src/libs/shared/services/item-activation/item-activation.service';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { spellTraditionFromString } from 'src/libs/shared/util/spell-utils';
import { QuickdiceComponent } from '../../../quickdice/components/quickdice/quickdice.component';
import { SpellChoiceComponent } from '../../../spell-choice/components/spell-choice/spell-choice.component';
import { DescriptionComponent } from 'src/libs/shared/ui/description/components/description/description.component';
import { SpellComponent } from '../../../spell/components/spell/spell.component';
import { ActivityComponent } from '../../../activity/components/activity/activity.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { ItemContentComponent } from '../../../item-content/component/item-content/item-content.component';
import { FormsModule } from '@angular/forms';
import { TagsComponent } from '../../../tags/components/tags/tags.component';
import { TraitComponent } from 'src/libs/shared/ui/trait/components/trait/trait.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        TraitComponent,
        TagsComponent,
        ItemContentComponent,
        ActionIconsComponent,
        ActivityComponent,
        SpellComponent,
        DescriptionComponent,
        SpellChoiceComponent,
        QuickdiceComponent,
    ],
})
export class ItemComponent extends TrackByMixin(BaseClass) {

    @Input()
    public item!: Item;
    @Input()
    public allowActivate?: boolean;
    @Input()
    public armoredSkirt?: AdventuringGear;
    @Input()
    public itemStore?: boolean;
    @Input()
    public isSubItem?: boolean;

    public creature$ = new Subject<Creature>();

    private _creature: Creature = CreatureService.character;

    constructor(
        private readonly _traitsDataService: TraitsDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _refreshService: RefreshService,
        private readonly _spellsService: SpellPropertiesService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _spellProcessingService: SpellProcessingService,
        private readonly _spellPropertiesService: SpellPropertiesService,
        private readonly _itemRolesService: ItemRolesService,
        private readonly _itemActivationService: ItemActivationService,
    ) {
        super();
    }

    public get creature(): Creature {
        return this._creature;
    }

    @Input()
    public set creature(value: Creature) {
        this._creature = value;
        this.creature$.next(this._creature);
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public itemTraits$(): Observable<Array<string>> {
        return this.item.effectiveTraits$$;
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

    public gainedSpellLevel$(spell: Spell, context: { gain: SpellGain; choice: SpellChoice }): Observable<number> {
        return this.creature$
            .pipe(
                switchMap(creature => this._spellsService.effectiveSpellLevel$(
                    spell,
                    { baseLevel: (context.choice.level ? context.choice.level : 0), creature, gain: context.gain },
                    { noEffects: true },
                )),
            );
    }

    public hasMatchingTalismanCord(item: Equipment, talisman: Talisman): boolean {
        return item.talismanCords.some(cord =>
            cord.level <= talisman.level &&
            cord.data.some(data => talisman.traits.includes(data.value as string)),
        );
    }

    public onActivateTalisman(itemRoles: ItemRoles, talisman: Talisman, index: number, options: { preserve?: boolean } = {}): void {
        this._itemActivationService.useConsumable(this.creature, talisman, options.preserve);

        if (!options.preserve) {
            itemRoles.asEquipment?.talismans.splice(index, 1);
        }
    }

    public onActivatePoison(weapon: Weapon, poison: AlchemicalPoison): void {
        this._itemActivationService.useConsumable(this.creature, poison);

        weapon.poisonsApplied.length = 0;
    }

    public doublingRingsOptions(ring: string): Array<Weapon> {
        switch (ring) {
            case 'gold':
                return this.creature.mainInventory.weapons.filter(weapon => weapon.melee && weapon.potencyRune);
            case 'iron':
                return this.creature.mainInventory.weapons.filter(weapon => weapon.melee);
            default:
                return [];
        }
    }

    public onSelectDoublingRingsOption(item: WornItem): void {
        item.data.triggerOnChange();
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

    public ringOfWizardryOptions(wizardrySlot: RingOfWizardrySlot): Array<string> | undefined {
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
            if (!hasFoundSpellGain && item.gainSpells[index]?.ringOfWizardry === (wizardrySlotIndex + 1)) {
                hasFoundSpellGain = true;
                item.gainSpells.splice(index, 1);
                break;
            }
        }

        let hasFoundEffect = false;

        for (let index = 0; index < item.effects.length; index++) {
            if (!hasFoundEffect && item.effects[index]?.source === `Ring of Wizardry Slot ${ wizardrySlotIndex + 1 }`) {
                hasFoundEffect = true;
                item.effects.splice(index, 1);
                break;
            }
        }

        const dataValue = item.data[wizardrySlotIndex]?.value as string;

        //If a new spellcasting has been selected, either add a new spellgain or effectgain.
        if (dataValue !== 'no spellcasting selected') {
            const [className, tradition, castingType] = dataValue.split(' ');

            if (castingType?.toLowerCase() === 'prepared') {
                const newSpellGain = SpellChoice.from({
                    available: 1,
                    className,
                    castingType: SpellCastingTypes.Prepared,
                    tradition: tradition ? spellTraditionFromString(tradition) : undefined,
                    level: wizardrySlot.level,
                    ringOfWizardry: (wizardrySlotIndex + 1),
                    source: item.name,
                });

                item.gainSpells.push(newSpellGain);
            } else if (castingType?.toLowerCase() === 'spontaneous') {
                item.effects.push(EffectGain.from({
                    affected: `${ className } ${ castingType } Level ${ wizardrySlot.level } Spell Slots`,
                    value: '1',
                    source: `Ring of Wizardry Slot ${ wizardrySlotIndex + 1 }`,
                }));
            }
        }

        // Close any open spell choices.
        this._refreshService.closeSpellSelections();
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
            item.data[index]?.value === school ||
            !item.data.some((data, dataIndex) => dataIndex <= item.isTalismanCord && data.value === school),
        );
    }

    public runeStoredSpell(rune: Rune): Spell | undefined {
        if (rune.storedSpells.length && rune.storedSpells[0]?.spells[0]) {
            return this.spellFromName(rune.storedSpells[0].spells[0].name);
        }
    }

    public storedSpellChoices(item: Item): Array<SpellChoice> {
        return item.storedSpells.filter(choice => choice.available || choice.dynamicAvailable);
    }

    public storedSpellsTaken(item: Item): Array<{ choice: SpellChoice; taken: SpellGain }> {
        return new Array<{ choice: SpellChoice; taken: SpellGain }>()
            .concat(
                ...item.storedSpells
                    .filter(choice => choice.spells.length)
                    .map(choice =>
                        choice.spells.map(taken => ({ choice, taken })),
                    ),
            );
    }

    //TODO: Verify that effectChoices is properly mutated.
    public spellConditions$(
        spell: Spell,
        spellLevel: number,
        gain: SpellGain,
    ): Observable<Array<{ conditionGain: ConditionGain; condition: Condition; choices: Array<string>; show: boolean }>> {
        return this._spellPropertiesService.spellConditionsForComponent$(spell, spellLevel, gain.effectChoices);
    }

    public onActivateSpellRune(rune: Rune): void {
        const spellName = rune.storedSpells[0]?.spells[0]?.name || '';
        const spellChoice = rune.storedSpells[0];

        if (spellChoice && spellName) {
            const spell = this.spellFromName(spellName);
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
    }

}
