import { ApiStatusKey } from '../api-status-key';

export interface ApiStatus {
    key: ApiStatusKey;
    retryFn?: () => void;
    message?: string;
}
