import { ApiStatusKey } from '../apiStatusKey';

export interface ApiStatus {
    key: ApiStatusKey;
    retryFn?: () => void;
    message?: string;
}
