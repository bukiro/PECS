import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';

export interface Toast {
    text: string;
    onClickCreature?: CreatureTypes;
    onClickAction?: string;
}
