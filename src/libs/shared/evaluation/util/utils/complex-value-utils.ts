import { Signal, signal } from '@angular/core';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';
import { ComplexValueContext, DomainValueBasicProps } from '../models/complex-value';

export function determineCreature$$(
    basicProps: DomainValueBasicProps,
    context: ComplexValueContext,
): Signal<Creature> {
    switch (basicProps.creatureToTest) {
        case CreatureTypes.Character:
            return signal(context.character).asReadonly();
        case CreatureTypes.AnimalCompanion:
            return context.character.minionsAdapter.animalCompanion$$;
        case CreatureTypes.Familiar:
            return context.character.minionsAdapter.familiar$$;
        default:
            return signal(context.creature).asReadonly();
    }
}
