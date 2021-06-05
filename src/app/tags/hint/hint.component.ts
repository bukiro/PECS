import { Component, Input, OnInit } from '@angular/core';
import { Activity } from 'src/app/Activity';
import { CharacterService } from 'src/app/character.service';
import { ConditionSet } from 'src/app/ConditionSet';
import { Feat } from 'src/app/Feat';
import { Hint } from 'src/app/Hint';
import { Item } from 'src/app/Item';
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

    constructor(
        private characterService: CharacterService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_HintsShowMore() {
        return this.characterService.get_Character().settings.hintsShowMoreInformation;
    }

    get_Hints() {
        let isConditionSet = this.object instanceof ConditionSet;
        let isAeonStone = this.object instanceof WornItem && this.object.isAeonStone;
        return (isConditionSet ? this.object.condition.hints : this.object.hints)
            .filter((hint: Hint) =>
                (
                    isConditionSet ?
                        (
                            (
                                hint.conditionChoiceFilter ?
                                    (hint.conditionChoiceFilter == "-" && this.object.gain.choice == "") ||
                                    (this.object.gain.choice == hint.conditionChoiceFilter) :
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
        if (this.object instanceof ConditionSet && hint.conditionChoiceFilter) {
            return ": " + this.object.gain.choice;
        }
        return "";
    }

    on_ActivateEffect() {
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    get_ObjectType() {
        if (this.object instanceof Feat) {
            return "Feat";
        }
        if (this.object instanceof Activity) {
            return "Activity";
        }
        if (this.object instanceof ConditionSet) {
            return "ConditionSet";
        }
        if (this.object instanceof Item) {
            return "Item";
        }
        if (this.object?.desc) {
            return "DescOnly"
        }
        return "";
    }

    ngOnInit() {
    }

}
