import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';

export interface Toast {
    text: string;
    onClickCreature?: CreatureTypes;
    onClickAction?: string;
}
