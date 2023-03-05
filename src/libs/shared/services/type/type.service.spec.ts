import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { TypeService } from './type.service';

describe('TypeService', () => {

    let service: TypeService;

    beforeEach(() => {
        service = new TypeService();
    });

    describe('mergeObject', () => {
        it('should deep merge two objects and their properties', () => {
            const feat1 = new Feat();

            const conditionGain = new ConditionGain();

            conditionGain.name = 'Condition1';

            const conditionGain2 = new ConditionGain();

            conditionGain2.name = 'Condition2';

            const itemGain = new ItemGain();

            itemGain.name = 'Item1';

            conditionGain.gainItems = [itemGain];

            feat1.gainConditions = [
                conditionGain,
                conditionGain2,
            ];
            feat1.traits = [
                'Trait',
                'Trait2',
            ];

            const feat2 = new Feat();

            const conditionGain3 = new ConditionGain();

            conditionGain3.name = 'Condition3';

            feat2.gainConditions = [
                conditionGain3,
            ];

            feat2.traits = [
                'Trait',
                'Trait3',
                'Trait4',
            ];

            const mergedFeat = service.mergeObject(feat1, feat2);

            mergedFeat.recast();

            expect(mergedFeat.traits).toEqual(feat2.traits);
            expect(mergedFeat.gainConditions.length).toEqual(Math.max(feat1.gainConditions.length, feat2.gainConditions.length));
            expect(mergedFeat.gainConditions[0].name).toEqual(conditionGain3.name);
            expect(mergedFeat.gainConditions[1].name).toEqual(conditionGain2.name);
            expect(mergedFeat.gainConditions[0].gainItems.length).toEqual(1);
            expect(mergedFeat.gainConditions[0].gainItems[0].name).toEqual(itemGain.name);
        });
    });
});
