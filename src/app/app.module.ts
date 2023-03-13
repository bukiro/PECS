import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
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
    ],
    providers: [
        NgbActiveModal,
        { provide: APP_INITIALIZER, useFactory: (service: AppInitService) => () => service, deps: [AppInitService], multi: true },
    ],
    bootstrap: [
        AppComponent,
    ],
})
export class AppModule { }
