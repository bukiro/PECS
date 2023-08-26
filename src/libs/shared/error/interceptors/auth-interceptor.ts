/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '../../services/config/config.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private readonly _configService: ConfigService,
    ) { }

    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req)
            .pipe(
                tap({
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._configService.logout('Your login is no longer valid.');
                        }
                    },
                }),
            );
    }
}

