import { computed, Directive, input, model } from '@angular/core';

@Directive({
    host: {
        'class.minimized': 'minimized$$()',
        'class.tile-mode': 'tileMode$$()',
        'class.list-mode': 'listMode$$()',
    },
})
export class ContentElementComponent {

    public readonly showMinimizeButton$$ = input(false, { alias: 'showMinimizeButton' });

    public readonly showTileModeButton$$ = input(false, { alias: 'showTileModeButton' });

    public readonly minimized$$ = model(false, { alias: 'minimized' });

    public readonly tileMode$$ = model(false, { alias: 'tileMode' });

    public readonly listMode$$ = computed(() => !this.tileMode$$());

}
