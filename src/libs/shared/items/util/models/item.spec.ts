import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils'
import { Item } from './item'
import { Weapon } from './weapon'

describe('Item', () => {
    let item: Item

    it('should keep the trait activations intact when the traits change', () => {
        const recastFns = mockRecastFns()
        item = Weapon.from({ traits: ['A', 'B'] }, recastFns)

        expect(item.effectiveTraits$$()).toStrictEqual(['A', 'B'])
        expect(item.traitActivations()).toStrictEqual([
            expect.objectContaining({ trait: 'A' }),
            expect.objectContaining({ trait: 'B' })
        ])

        item.traitActivations.update(value => {
            const activation = value.find(({ trait }) => trait === 'A')

            if (activation) {
                activation.active = true
            }

            return [...value]
        })

        expect(item.traitActivations()).toStrictEqual([
            expect.objectContaining({ trait: 'A', active: true }),
            expect.objectContaining({ trait: 'B' })
        ])

        item.effectiveTraits$$.set(['A', 'C'])

        expect(item.traitActivations()).toStrictEqual([
            expect.objectContaining({ trait: 'A', active: true }),
            expect.objectContaining({ trait: 'C' })
        ])
    })
})
