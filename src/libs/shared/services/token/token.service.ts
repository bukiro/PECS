import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

interface SessionToken {
    characterId?: string;
    timeStamp: number;
}

const ninetyDaysInHours = 2160;

@Injectable({
    providedIn: 'root',
})
export class TokenService {
    private readonly _accessTokenKey = 'pecs_access_token';
    private readonly _sessionTokenKey = 'pecs_session_token';
    private readonly _sessionId: string;

    constructor() {
        this._sessionId = sessionStorage['tabID'] ? sessionStorage['tabID'] : sessionStorage['tabID'] = uuidv4();
    }

    public getAccessToken(): string | undefined {
        return window.localStorage.getItem(this._accessTokenKey) || undefined;
    }

    public setAccessToken(token?: string): void {
        if (token) {
            window.localStorage.setItem(this._accessTokenKey, token || '');
        } else {
            window.localStorage.removeItem(this._accessTokenKey);
        }
    }

    public getSessionCharacterId(): string | undefined {
        const sessionTokens = this._getSessionTokens();

        const sessionToken = sessionTokens[this._sessionId];

        if (sessionToken) {
            // Update the token with the current timestamp.
            this._writeSessionToken({ ...sessionToken, timeStamp: Date.now() });

            return sessionToken.characterId;
        }
    }

    public writeSessionCharacterId(id?: string): void {
        if (id) {
            this._writeSessionToken({ characterId: id, timeStamp: Date.now() });
        } else {
            this._removeSessionToken();
        }

        this._cleanupSessionTokens();
    }

    private _getSessionTokens(): Record<string, SessionToken> {
        const sessionTokenJSON = window.localStorage.getItem(this._sessionTokenKey) || '{}';

        return JSON.parse(sessionTokenJSON);
    }

    private _writeSessionToken(token: SessionToken): void {
        const sessionTokens = this._getSessionTokens();

        window.localStorage.setItem(
            this._sessionTokenKey,
            JSON.stringify({ ...sessionTokens, [this._sessionId]: token }),
        );
    }

    private _removeSessionToken(): void {
        const sessionTokens = this._getSessionTokens();

        if (sessionTokens[this._sessionId]) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete sessionTokens[this._sessionId];
        }

        window.localStorage.setItem(
            this._sessionTokenKey,
            JSON.stringify(sessionTokens),
        );
    }

    /**
     * Cleanup session tokens that haven't been read or written in 90 days.
     */
    private _cleanupSessionTokens(): void {
        const sessionTokens = this._getSessionTokens();

        const ninetyDaysOld = new Date();

        ninetyDaysOld.setHours(ninetyDaysOld.getHours() - ninetyDaysInHours);

        for (const key in sessionTokens) {
            if (sessionTokens[key]) {
                const sessionToken = sessionTokens[key];

                if (sessionToken) {
                    if (sessionToken.timeStamp < ninetyDaysOld.getUTCMilliseconds()) {
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete sessionTokens[this._sessionId];
                    }
                }
            }
        }
    }
}
