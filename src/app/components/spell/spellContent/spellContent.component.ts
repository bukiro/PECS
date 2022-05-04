import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Spell } from 'src/app/classes/Spell';
import { CharacterService } from 'src/app/services/character.service';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellsService } from 'src/app/services/spells.service';
import { TraitsService } from 'src/app/services/traits.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-spellContent',
    templateUrl: './spellContent.component.html',
    styleUrls: ['./spellContent.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellContentComponent implements OnInit, OnDestroy {

    @Input()
    spell: Spell;
    @Input()
    spellLevel: number;
    @Input()
    casting: SpellCasting = null;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly traitsService: TraitsService,
        private readonly spellsService: SpellsService
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Traits(name = '') {
        return this.traitsService.get_Traits(name);
    }

    get_Heightened(desc: string) {
        let levelNumber = this.spellLevel;
        if ((!levelNumber && (this.spell.traits.includes('Cantrip'))) || levelNumber == -1) {
            levelNumber = this.characterService.get_Character().get_SpellLevel();
        }
        if (this.spell.levelreq && levelNumber < this.spell.levelreq) {
            levelNumber = this.spell.levelreq;
        }
        return this.spell.get_Heightened(desc, levelNumber);
    }

    get_Spells(name: string) {
        return this.spellsService.get_Spells(name);
    }

    finish_Loading() {
        if (this.characterService.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500);
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (['individualspells', 'all', 'character'].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == 'character' &&
                        (
                            view.target.toLowerCase() == 'all' ||
                            (view.target.toLowerCase() == 'individualspells' && [this.spell.name.toLowerCase(), 'all'].includes(view.subtarget.toLowerCase()))
                        )) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    public ngOnInit(): void {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
