import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Spell } from 'src/app/classes/Spell';
import { TraitsService } from 'src/app/services/traits.service';
import { CharacterService } from 'src/app/services/character.service';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-spell',
    templateUrl: './spell.component.html',
    styleUrls: ['./spell.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellComponent implements OnInit, OnDestroy {

    @Input()
    spell: Spell
    @Input()
    spellLevel: number;
    @Input()
    source: string = "";
    @Input()
    casting: SpellCasting = null;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private refreshService: RefreshService,
        private traitsService: TraitsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_FeatsShowingOn(spellName: string) {
        return this.characterService.get_FeatsShowingOn(spellName);
    }

    finish_Loading() {
        if (this.characterService.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["individualspells", "all", "character"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == "character" &&
                        (
                            view.target.toLowerCase() == "all" ||
                            (view.target.toLowerCase() == "individualspells" && [this.spell.name.toLowerCase(), "all"].includes(view.subtarget.toLowerCase()))
                        )) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
