import { Component, ChangeDetectionStrategy, Input, TemplateRef, Output, EventEmitter } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { QuickdiceComponent } from 'src/libs/shared/quickdice/components/quickdice/quickdice.component';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { forceBooleanFromInput } from 'src/libs/shared/util/component-input-utils';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { BonusDescription } from '../../../bonus-list';

@Component({
    selector: 'app-attribute-value',
    templateUrl: './attribute-value.component.html',
    styleUrls: ['./attribute-value.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeValueComponent extends TrackByMixin(BaseClass) {
    @Input()
    public title?: string;

    @Input()
    public sublines?: Array<string>;

    @Input()
    public value?: number | string;

    @Input()
    public showNotesIcon?: boolean;

    @Input()
    public quickdiceTemplate?: TemplateRef<QuickdiceComponent>;

    @Input()
    public customEffectsTarget?: { creature: Creature; target: string };

    @Output()
    public readonly showNotesChange = new EventEmitter<boolean>();

    public hasBonuses = false;
    public hasPenalties = false;
    public hasAbsolutes = false;

    private _bonuses?: Array<BonusDescription>;
    private _showNotes?: boolean | undefined;
    private _showValueOnLeftSide?: boolean | undefined;

    public get showNotes(): boolean | undefined {
        return this._showNotes;
    }

    @Input()
    public set showNotes(showNotes: boolean | undefined) {
        this._showNotes = showNotes;
        this.showNotesChange.emit(!!showNotes);
    }

    public get bonuses(): Array<BonusDescription> | undefined {
        return this._bonuses;
    }

    @Input()
    public set bonuses(bonuses: Array<BonusDescription> | undefined) {
        this._bonuses = bonuses;
        this.hasBonuses = !!bonuses?.some(bonus => bonus.isBonus);
        this.hasPenalties = !!bonuses?.some(bonus => bonus.isPenalty);
        this.hasAbsolutes = !!bonuses?.some(bonus => bonus.isAbsolute);
    }

    public get showValueOnLeftSide(): boolean {
        return !!this._showValueOnLeftSide;
    }

    @Input()
    public set showValueOnLeftSide(showValueOnLeftSide: boolean | string | undefined) {
        this._showValueOnLeftSide = forceBooleanFromInput(showValueOnLeftSide);
    }
}
