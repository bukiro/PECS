

import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    input,
    output,
    viewChild,
} from '@angular/core';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

type Alignment = 'left' | 'right' | 'center';

@Component({
    selector: 'app-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgbTooltipModule,
    ],
    host: {
        'class.full-size': 'fullSize$$()',
        'class.disabled': 'disabled$$()',
        'class.processing': 'processing$$()',
        'class.toggled': 'toggled$$()',
        'class.ghost': 'ghost$$()',
        'class.danger': 'danger$$()',
        'class.no-outline': 'noOutline$$()',
        'class.compact': 'compact$$()',
        'class.tight': 'tight$$()',
        'class.circle': 'circle$$()',
        'class.tab-like': 'tabLike$$()',
        'class.left-aligned': 'leftAligned$$()',
        'class.center-aligned': 'centerAligned$$()',
        'class.right-aligned': 'rightAligned$$()',
    },
})
export class ButtonComponent {
    public readonly button = viewChild<ElementRef<HTMLButtonElement>>('Button');

    public readonly label$$ = input<string | undefined>(undefined, { alias: 'label' });
    public readonly tabIndex$$ = input<number | undefined>(undefined, { alias: 'tabIndex' });

    public readonly fullSize$$ = input(false, { transform: booleanAttribute, alias: 'fullSize' });
    public readonly disabled$$ = input(false, { transform: booleanAttribute, alias: 'disabled' });
    public readonly processing$$ = input(false, { transform: booleanAttribute, alias: 'processing' });
    public readonly toggled$$ = input(false, { transform: booleanAttribute, alias: 'toggled' });
    public readonly ghost$$ = input(false, { transform: booleanAttribute, alias: 'ghost' });
    public readonly danger$$ = input(false, { transform: booleanAttribute, alias: 'danger' });
    public readonly noOutline$$ = input(false, { transform: booleanAttribute, alias: 'noOutline' });
    public readonly compact$$ = input(false, { transform: booleanAttribute, alias: 'compact' });
    public readonly tight$$ = input(false, { transform: booleanAttribute, alias: 'tight' });
    public readonly circle$$ = input(false, { transform: booleanAttribute, alias: 'circle' });
    public readonly tabLike$$ = input(false, { transform: booleanAttribute, alias: 'tabLike' });
    public readonly hideLabel$$ = input(false, { transform: booleanAttribute, alias: 'hideLabel' });

    public readonly alignment$$ = input<Alignment>('center', { alias: 'alignment' });

    public readonly clicked = output<void>();

    public readonly leftAligned$$ = computed(() => this.alignment$$() === 'left');
    public readonly centerAligned$$ = computed(() => this.alignment$$() === 'center');
    public readonly rightAligned$$ = computed(() => this.alignment$$() === 'right');

    public focus(): void {
        this.button()?.nativeElement?.focus();
    }
}
