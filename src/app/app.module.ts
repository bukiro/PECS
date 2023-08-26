import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from 'src/app/app.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { AppInitService } from 'src/libs/shared/services/app-init/app-init.service';
import { TopBarModule } from 'src/libs/top-bar/top-bar.module';
import { ToastsModule } from 'src/libs/toasts/toasts.module';
import { CharacterSheetModule } from './views/character-sheet/character-sheet.module';
import { LoadingSpinnerModule } from 'src/libs/shared/ui/loading-spinner/loading-spinner.module';
import { DescriptionModule } from 'src/libs/shared/ui/description/description.module';
import { ButtonModule } from 'src/libs/shared/ui/button/button.module';
import { LoginModule } from 'src/libs/shared/login/login.module';
import { CharacterLoadingModule } from 'src/libs/shared/character-loading/character-loading.module';
import { StoreModule } from '@ngrx/store';
import { EffectsStoreModule } from 'src/libs/store/effects/effects-store.module';
import { AppStoreModule } from 'src/libs/store/app/app-store.module';
import { MenuStoreModule } from 'src/libs/store/menu/menu-store.module';
import { FeatsStoreModule } from 'src/libs/store/feats/feats-store.module';
import { StatusStoreModule } from 'src/libs/store/status/status-store.module';
import { AuthInterceptor } from 'src/libs/shared/error/interceptors/auth-interceptor';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        CommonModule,
        HttpClientModule,

        TopBarModule,
        ToastsModule,
        CharacterSheetModule,
        LoadingSpinnerModule,
        DescriptionModule,
        ButtonModule,
        LoginModule,
        CharacterLoadingModule,

        StoreModule.forRoot({}),
        AppStoreModule,
        MenuStoreModule,
        FeatsStoreModule,
        StatusStoreModule,
        EffectsStoreModule,
    ],
    providers: [
        NgbActiveModal,
        { provide: APP_INITIALIZER, useFactory: (service: AppInitService) => () => service, deps: [AppInitService], multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    ],
    bootstrap: [
        AppComponent,
    ],
})
export class AppModule { }
