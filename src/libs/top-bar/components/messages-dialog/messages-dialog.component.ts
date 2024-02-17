import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { BehaviorSubject, map, Observable, of, take, zip } from 'rxjs';
import { Creature } from 'src/app/classes/Creature';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { DialogFooterComponent } from 'src/libs/shared/dialog/components/dialog-footer/dialog-footer.component';
import { DialogHeaderComponent } from 'src/libs/shared/dialog/components/dialog-header/dialog-header.component';
import { DialogComponent } from 'src/libs/shared/dialog/components/dialog/dialog.component';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { MessagePropertiesService } from 'src/libs/shared/services/message-properties/message-properties.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

interface EnrichedMessage {
    message: PlayerMessage;
    messageTargetCreature: Creature;
    messageSenderName: string;
    conditionMessageDurationDescription: string;
    itemMessageIncludedAmount: string;
}

@Component({
    selector: 'app-messages-dialog',
    templateUrl: './messages-dialog.component.html',
    styleUrls: ['./messages-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesDialogComponent extends TrackByMixin(DialogComponent) implements AfterViewInit {

    @ViewChild('Header')
    public declare header?: DialogHeaderComponent;

    @ViewChild('Footer')
    public declare footer?: DialogFooterComponent;

    public title = 'Apply messages';

    public applyMessages?: (messages: Array<PlayerMessage>) => void;

    public readonly buttons = [{
        label: 'Apply selected messages',
        danger: false,
        onClick: () => this.applyMessages?.(this._enrichedMessages.map(message => message.message)),
    }];

    public enrichedMessages$ = new BehaviorSubject<Array<EnrichedMessage>>([]);

    public character = CreatureService.character;

    private _enrichedMessages = new Array<EnrichedMessage>();

    constructor(
        private readonly _messagePropertiesService: MessagePropertiesService,
        private readonly _durationsService: DurationsService,
    ) {
        super();
    }

    public set messages(messages: Array<PlayerMessage>) {
        this._enrichMessages(messages);
    }

    public onSelectAllMessages(event: Event): void {
        const isChecked = (event.target as HTMLInputElement).checked;

        this._enrichedMessages?.forEach(message => {
            message.message.selected = isChecked;
        });

        this.enrichedMessages$.next(this._enrichedMessages);
    }

    public with(values: Partial<MessagesDialogComponent>): MessagesDialogComponent {
        super.with(values);

        if (values.messages) {
            this.messages = values.messages;
        }

        if (values.applyMessages) {
            this.applyMessages = values.applyMessages;
        }

        return this;
    }

    public areAllMessagesSelected(): boolean {
        return this._enrichedMessages.every(message => message.message.selected);
    }

    private _messageTargetCreature$(message: PlayerMessage): Observable<Creature | undefined> {
        return this._messagePropertiesService.messageTargetCreature$(message) || undefined;
    }

    private _messageSenderName(message: PlayerMessage): string {
        return this._messagePropertiesService.messageSenderName(message);
    }

    private _itemMessageIncludedAmount(message: PlayerMessage): string {
        const included: Array<string> = [];

        if (message.includedItems.length) {
            included.push(`${ message.includedItems.length } extra items`);
        }

        if (message.includedInventories.length) {
            included.push(`${ message.includedInventories.length } containers`);
        }

        if (included.length) {
            return `Includes ${ included.join(' and ') }`;
        }

        return '';
    }

    private _conditionMessageDurationDescription$(message: PlayerMessage): Observable<string> {
        const duration = message.gainCondition[0].duration;

        if (duration === TimePeriods.Default) {
            return of('(Default duration)');
        } else {
            return this._durationsService.durationDescription$(duration, false, true);
        }
    }

    //TO-DO: instead of updating the BehaviorSubject, make enrichedMessages$ an observable that uses this as a pipe.
    private _enrichMessages(messages: Array<PlayerMessage>): void {
        zip(
            messages.map(message => zip([
                this._messageTargetCreature$(message),
                this._conditionMessageDurationDescription$(message),
            ])
                .pipe(
                    map(([messageTargetCreature, conditionMessageDurationDescription]) =>
                        messageTargetCreature
                            ? ({
                                message,
                                messageTargetCreature,
                                messageSenderName: this._messageSenderName(message),
                                itemMessageIncludedAmount: this._itemMessageIncludedAmount(message),
                                conditionMessageDurationDescription,
                            })
                            : undefined,
                    ),
                ),
            ),
        )
            .pipe(
                take(1),
                map(enrichedMessages => enrichedMessages
                    .filter((message): message is EnrichedMessage => !!message),
                ),
            )
            .subscribe(enrichedMessages => {
                this._enrichedMessages = enrichedMessages;
                this.enrichedMessages$.next(this._enrichedMessages);
            });
    }
}
