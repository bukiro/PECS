import { Feat } from 'src/libs/shared/definitions/models/feat';
import { FeatTaken } from 'src/libs/shared/definitions/models/feat-taken';

export interface FeatsState {
    levelFeats: Record<number, Record<string, Feat>>;
    levelCountAs: Record<number, Record<string, boolean>>;
    levelTakenFeats: Record<number, Record<string, Feat>>;
    characterFeatsTaken: Array<{ levelNumber: number; gain: FeatTaken; feat: Feat; temporary: boolean }>;
}
