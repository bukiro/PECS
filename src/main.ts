import { enableProdMode, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppInitService } from './old/shared/services/app-init/app-init.service';
import { AuthInterceptor } from './old/shared/error/interceptors/auth-interceptor';

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(
            CommonModule,
        ),
        NgbActiveModal,
        { provide: APP_INITIALIZER, useFactory: (service: AppInitService) => () => service, deps: [AppInitService], multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
    ],
})
    .catch(err => console.error(err));
