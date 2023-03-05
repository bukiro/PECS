import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

export interface Toast {
    text: string;
    onClickCreature?: CreatureTypes;
    onClickAction?: string;
}
