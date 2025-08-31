/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../../../../libs/auth/domain/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private readonly _authService: AuthService,
    ) { }

    public intercept<T>(req: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
        return next.handle(req)
            .pipe(
                tap({
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._authService.logout('Your login is no longer valid.');
                        }
                    },
                }),
            );
    }
}

