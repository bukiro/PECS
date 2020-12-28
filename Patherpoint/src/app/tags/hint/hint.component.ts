import { Component, Input, OnInit } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { Hint } from 'src/app/Hint';

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
    className: string = "";
    @Input()
    description: string = "";

    constructor(private characterService: CharacterService) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Hints(hints: Hint[], name: string) {
        return hints
            .filter(hint =>
                hint.showon.split(",")
                    .some(showon =>
                        showon.trim().toLowerCase() == name.toLowerCase() ||
                        showon.trim().toLowerCase() == (this.creature + ":" + name).toLowerCase() ||
                        (
                            name.toLowerCase().includes("lore") &&
                            showon.trim().toLowerCase() == "lore"
                        )
                    )
            )
    }

    on_ActivateEffect() {
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    ngOnInit() {
    }

}
