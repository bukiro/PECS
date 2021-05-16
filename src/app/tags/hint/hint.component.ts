import { Component, Input, OnInit } from '@angular/core';
import { Activity } from 'src/app/Activity';
import { CharacterService } from 'src/app/character.service';
import { ConditionSet } from 'src/app/ConditionSet';
import { Feat } from 'src/app/Feat';
import { Hint } from 'src/app/Hint';
import { Item } from 'src/app/Item';

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
        return (this.object instanceof ConditionSet ? this.object.condition.hints : this.object.hints)
            .filter((hint: Hint) =>
                this.object instanceof ConditionSet ?
                    (
                        (hint.conditionChoiceFilter ? this.object.gain.choice == hint.conditionChoiceFilter : true) &&
                        (hint.conditionMinHeightened ? this.object.gain.heightened >= hint.conditionMinHeightened : true) &&
                        (hint.conditionMaxHeightened ? this.object.gain.heightened <= hint.conditionMaxHeightened : true)
                    ) :
                    true
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
