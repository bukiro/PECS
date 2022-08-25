import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { Familiar } from 'src/app/classes/Familiar';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';

@Component({
    selector: 'app-familiarabilities',
    templateUrl: './familiarabilities.component.html',
    styleUrls: ['./familiarabilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamiliarabilitiesComponent implements OnInit, OnDestroy {

    public creatureTypesEnum = CreatureTypes;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) { }

    public get character(): Character {
        return this._characterService.character;
    }

    public get isFamiliarAvailable(): boolean {
        return this._creatureAvailabilityService.isFamiliarAvailable();
    }

    public get familiar(): Familiar {
        return this._characterService.familiar;
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['familiarabilities', 'all', 'Familiar'].includes(target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature === 'Familiar' && ['familiarabilities', 'all'].includes(view.target)) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
