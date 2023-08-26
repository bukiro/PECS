import { ApiStatus } from 'src/libs/shared/definitions/interfaces/api-status';

export interface StatusState {
    config: ApiStatus;
    character: ApiStatus;
    data: ApiStatus;
    savegames: ApiStatus;
}
