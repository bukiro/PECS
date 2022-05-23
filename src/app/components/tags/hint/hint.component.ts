import { Component, Input } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionSet } from 'src/app/classes/ConditionSet';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { Hint } from 'src/app/classes/Hint';
import { Item } from 'src/app/classes/Item';
import { RefreshService } from 'src/app/services/refresh.service';
import { Shield } from 'src/app/classes/Shield';
import { TraitsService } from 'src/app/services/traits.service';
import { WornItem } from 'src/app/classes/WornItem';
import { EffectsService } from 'src/app/services/effects.service';
import { Character } from 'src/app/classes/Character';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Equipment } from 'src/app/classes/Equipment';
import { Material } from 'src/app/classes/Material';
import { Oil } from 'src/app/classes/Oil';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { Condition } from 'src/app/classes/Condition';

type HintObject = Feat | Activity | ConditionSet | Equipment | Oil | WornItem | ArmorRune | WeaponRune | Material | { desc?: string; hints: Array<Hint> };

@Component({
    selector: 'app-hint',
    templateUrl: './hint.component.html',
    styleUrls: ['./hint.component.scss'],
})
export class HintComponent {

    @Input()
    creature = 'Character';
    @Input()
    object: HintObject = null;
    @Input()
    objectName = '';
    @Input()
    sourceBook = '';
    @Input()
    description = '';
    @Input()
    noFilter = false;
    @Input()
    color = '';

    constructor(
        public characterService: CharacterService,
        public effectsService: EffectsService,
        private readonly refreshService: RefreshService,
        private readonly traitsService: TraitsService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Creature() {
        return this.characterService.creatureFromType(this.creature);
    }

    public get_Character(): Character {
        return this.characterService.character();
    }

    get_CharacterLevel() {
        return this.characterService.character().level;
    }

    get_Hints(): Array<Hint> {
        if (this.noFilter) {
            return (this.object instanceof ConditionSet ? this.object.condition.hints : this.object.hints);
        }

        const isSlottedAeonStone = this.object instanceof WornItem && this.object.isSlottedAeonStone;
        const isEmblazonArmamentShield = (this.object instanceof Shield && this.object.emblazonArmament.length) ? this.object : null;

        return (this.object instanceof ConditionSet ? this.object.condition.hints : this.object.hints)
            .filter((hint: Hint) =>
                (hint.minLevel ? this.get_CharacterLevel() >= hint.minLevel : true) &&
                (
                    this.object instanceof ConditionSet ?
                        (
                            (
                                hint.conditionChoiceFilter.length ?
                                    (hint.conditionChoiceFilter.includes('-') && this.object.gain.choice == '') ||
                                    (hint.conditionChoiceFilter.includes(this.object.gain.choice)) :
                                    true
                            )
                        ) :
                        true
                ) &&
                (hint.resonant ? isSlottedAeonStone : true),
            )
            .filter((hint: Hint) =>
                hint.showon.split(',')
                    .some(showon =>
                        showon.trim().toLowerCase() == this.objectName.toLowerCase() ||
                        showon.trim().toLowerCase() == (`${ this.creature }:${ this.objectName }`).toLowerCase() ||
                        (
                            this.objectName.toLowerCase().includes('lore') &&
                            showon.trim().toLowerCase() == 'lore'
                        ) ||
                        (
                            //Show Emblazon Energy or Emblazon Antimagic Shield Block hint on Shield Block if the shield's blessing applies.
                            isEmblazonArmamentShield &&
                            (
                                (
                                    isEmblazonArmamentShield.$emblazonEnergy &&
                                    this.objectName == 'Shield Block' &&
                                    showon == 'Emblazon Energy Shield Block'
                                ) || (
                                    isEmblazonArmamentShield.$emblazonAntimagic &&
                                    this.objectName == 'Shield Block' &&
                                    showon == 'Emblazon Antimagic Shield Block'
                                )
                            )
                        ),
                    ),
            );
    }

    get_HintDescription(hint: Hint) {
        if (hint.desc) {
            return this.get_HeightenedHint(hint);
        } else {
            if (this.object instanceof ConditionSet) {
                return this.object.condition.heightenedText(this.object.condition.desc, this.object.gain.heightened);
            } else {
                return this.object.desc || '';
            }
        }
    }

    get_HeightenedHint(hint: Hint) {
        //Spell conditions have their hints heightened to their spell level, everything else is heightened to the character level.
        if (this.object instanceof ConditionSet && this.object.condition.minLevel) {
            return hint.heightenedText(hint.desc, this.object.gain.heightened);
        } else {
            return hint.heightenedText(hint.desc, this.characterService.character().level);
        }
    }

    get_HintChoice(hint: Hint) {
        //Only for condition hints, append the choice if the hint only showed up because of the choice.
        if (this.object instanceof ConditionSet && hint.conditionChoiceFilter.length) {
            return `: ${ this.object.gain.choice }`;
        }

        return '';
    }

    on_ActivateEffect() {
        this.refreshService.prepareDetailToChange(this.creature, 'effects');
        this.refreshService.processPreparedChanges();
    }

    get_Traits(traitName = '') {
        return this.traitsService.getTraits(traitName);
    }

    get_Source(hint: Hint) {
        if (hint.replaceSource.length) {
            const replaceSource = hint.replaceSource[0];

            if (replaceSource.source) {
                switch (replaceSource.type) {
                    case 'feat':
                        return this.characterService.featsAndFeatures(replaceSource.source)[0] || this.object;
                }
            }
        }

        return this.object;
    }

    public objectHasType(object: HintObject): boolean {
        return (
            object instanceof Feat ||
            object instanceof Activity ||
            object instanceof ConditionSet ||
            object instanceof Item ||
            !!object.desc
        );
    }

    public objectAsNamedObject(object: HintObject): Feat | Activity | Item | Condition {
        if (
            object instanceof Feat ||
            object instanceof Activity ||
            object instanceof Item
        ) {
            return object;
        }

        if (
            object instanceof ConditionSet
        ) {
            return object.condition;
        }

        return null;
    }

    public objectAsFeat(object: HintObject): Feat {
        return object instanceof Feat ? object : null;
    }

    public objectAsActivity(object: HintObject): Activity {
        return object instanceof Activity ? object : null;
    }

    public objectAsConditionSet(object: HintObject): ConditionSet {
        return object instanceof ConditionSet ? object : null;
    }

    public objectAsItem(object: HintObject): Item {
        return object instanceof Item ? object : null;
    }

    public objectAsDescOnly(object: HintObject): { desc: string } {
        if (!(this.objectAsFeat(object) || this.objectAsActivity(object) || this.objectAsConditionSet(object) || this.objectAsItem(object))) {
            return Object.prototype.hasOwnProperty.call(object, 'desc') ? object as { desc: string } : null;
        } else {
            return null;
        }
    }

}
