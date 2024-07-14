import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';

/**
 * A component that has all the variables to update pipes with a new input creature
 */
@Component({
    selector: 'app-base-creature-element',
    template: '',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCreatureElementComponent {

    /**
     * Observables can use creature$ to keep updated on the target creature of the component.
     */
    public creature$: BehaviorSubject<Creature>;

    protected _creature?: Creature;

    constructor() {
        this.creature$ = new BehaviorSubject(this.creature);
    }

    public get creature(): Creature {
        return this._creature ?? CreatureService.character;
    }

    protected _updateCreature(creature: Creature): void {
        this._creature = creature;
        this.creature$.next(this._creature);
    }
}
