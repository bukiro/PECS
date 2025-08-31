import { EmblazonArmamentTypes } from 'src/libs/shared/feats/util/models/emblazon-armament-types';

export interface EmblazonArmamentSet {
    type: EmblazonArmamentTypes;
    choice: string;
    deity: string;
    alignment: string;
    emblazonDivinity: boolean;
    source: string;
}
