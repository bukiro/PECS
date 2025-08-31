import { ApiStatus } from 'src/libs/shared/api/util/models/api-status';

export interface StatusState {
    auth: ApiStatus;
    config: ApiStatus;
    character: ApiStatus;
    data: ApiStatus;
    savegames: ApiStatus;
}
