import { enableProdMode, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { EffectsStoreModule } from 'src/libs/store/effects/effects-store.module';
import { StatusStoreModule } from 'src/libs/store/status/status-store.module';
import { FeatsStoreModule } from 'src/libs/store/feats/feats-store.module';
import { MenuStoreModule } from 'src/libs/store/menu/menu-store.module';
import { AppStoreModule } from 'src/libs/store/app/app-store.module';
import { StoreModule } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { AuthInterceptor } from 'src/libs/shared/error/interceptors/auth-interceptor';
import { HTTP_INTERCEPTORS, withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { AppInitService } from 'src/libs/shared/services/app-init/app-init.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(
            CommonModule,
            StoreModule.forRoot({}),
            AppStoreModule,
            MenuStoreModule,
            FeatsStoreModule,
            StatusStoreModule,
            EffectsStoreModule,
        ),
        NgbActiveModal,
        { provide: APP_INITIALIZER, useFactory: (service: AppInitService) => () => service, deps: [AppInitService], multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
    ],
})
    .catch(err => console.error(err));
