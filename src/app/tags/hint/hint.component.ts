import { Component, Input, OnInit } from '@angular/core';
import { Activity } from 'src/app/Activity';
import { CharacterService } from 'src/app/character.service';
import { ConditionSet } from 'src/app/ConditionSet';
import { Feat } from 'src/app/Feat';
import { Hint } from 'src/app/Hint';
import { Item } from 'src/app/Item';
import { Shield } from 'src/app/Shield';
import { TraitsService } from 'src/app/traits.service';
import { WornItem } from 'src/app/WornItem';

@Component({
    selector: 'app-hint',
    templateUrl: './hint.component.html',
    styleUrls: ['./hint.component.scss']
})
export class HintComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    object: any = null;
    @Input()
    objectName: string = "";
    @Input()
    description: string = "";
    @Input()
    noFilter: boolean = false;

    constructor(
        public characterService: CharacterService,
        private traitsService: TraitsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_HintsShowMore() {
        return this.characterService.get_Character().settings.hintsShowMoreInformation;
    }

    get_CharacterLevel() {
        return this.characterService.get_Character().level;
    }

    get_Hints() {
        let isConditionSet = this.object instanceof ConditionSet;
        if (this.noFilter) {
            return (isConditionSet ? this.object.condition.hints : this.object.hints);
        }
        let isAeonStone = this.object instanceof WornItem && this.object.isAeonStone;
        let isEmblazonArmamentShield = (this.object instanceof Shield && this.object.emblazonArmament.length) ? this.object : null;
        return (isConditionSet ? this.object.condition.hints : this.object.hints)
            .filter((hint: Hint) =>
                (hint.minLevel ? this.get_CharacterLevel() >= hint.minLevel : true) &&
                (
                    isConditionSet ?
                        (
                            (
                                hint.conditionChoiceFilter.length ?
                                    (hint.conditionChoiceFilter.includes("-") && this.object.gain.choice == "") ||
                                    (hint.conditionChoiceFilter.includes(this.object.gain.choice)) :
                                    true
                            )
                        ) :
                        true
                ) &&
                (
                    isAeonStone ?
                        (
                            hint.resonant ? this.object.isSlottedAeonStone : true
                        ) :
                        true
                )
            )
            .filter((hint: Hint) =>
                hint.showon.split(",")
                    .some(showon =>
                        showon.trim().toLowerCase() == this.objectName.toLowerCase() ||
                        showon.trim().toLowerCase() == (this.creature + ":" + name).toLowerCase() ||
                        (
                            this.objectName.toLowerCase().includes("lore") &&
                            showon.trim().toLowerCase() == "lore"
                        ) ||
                        (
                            //Show Emblazon Energy or Emblazon Antimagic Shield Block hint on Shield Block if the shield's blessing applies.
                            isEmblazonArmamentShield &&
                            (
                                (
                                    isEmblazonArmamentShield._emblazonEnergy &&
                                    this.objectName == "Shield Block" &&
                                    showon == "Emblazon Energy Shield Block"
                                ) || (
                                    isEmblazonArmamentShield._emblazonAntimagic &&
                                    this.objectName == "Shield Block" &&
                                    showon == "Emblazon Antimagic Shield Block"
                                )
                            )
                        )
                    )
            )
    }

    get_HintDescription(hint: Hint) {
        if (hint.desc) {
            return this.get_HeightenedHint(hint);
        } else {
            if (this.object instanceof ConditionSet) {
                return this.object.condition.get_Heightened(this.object.condition.desc, this.object.gain.heightened);
            } else {
                return this.object.desc || "";
            }
        }
    }

    get_HeightenedHint(hint: Hint) {
        //Spell conditions have their hints heightened to their spell level, everything else is heightened to the character level.
        if (this.object instanceof ConditionSet && this.object.condition.minLevel) {
            return hint.get_Heightened(hint.desc, this.object.gain.heightened);
        } else {
            return hint.get_Heightened(hint.desc, this.characterService.get_Character().level);
        }
    }

    get_HintChoice(hint: Hint) {
        //Only for condition hints, append the choice if the hint only showed up because of the choice.
        if (this.object instanceof ConditionSet && hint.conditionChoiceFilter.length) {
            return ": " + this.object.gain.choice;
        }
        return "";
    }

    on_ActivateEffect() {
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Source(hint: Hint) {
        if (hint.replaceSource.length) {
            let replaceSource = hint.replaceSource[0];
            if (replaceSource.source) {
                switch (replaceSource.type) {
                    case "feat":
                        return this.characterService.get_FeatsAndFeatures(replaceSource.source)[0] || this.object;
                }
            }
        }
        return this.object;
    }

    get_ObjectType(object: any) {
        if (object instanceof Feat) {
            return "Feat";
        }
        if (object instanceof Activity) {
            return "Activity";
        }
        if (object instanceof ConditionSet) {
            return "ConditionSet";
        }
        if (object instanceof Item) {
            return "Item";
        }
        if (object?.desc) {
            return "DescOnly"
        }
        return "";
    }

    ngOnInit() {
    }

}
