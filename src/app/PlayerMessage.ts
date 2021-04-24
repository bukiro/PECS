import { ConditionGain } from './ConditionGain';
import { v1 as uuidv1 } from 'uuid';

export class PlayerMessage {
    public id = uuidv1();
    //The recipient is the character id of the character who will receive the message.
    public recipientId: string = "";
    //The sender is the character id of the character who sent the message.
    public senderId: string = "";
    //The target is the creature id of the creature (character, companion or familiar) for whom the message is intended.
    public targetId: string = "";
    //gainCondition can contain ONE condition that is applied to the target creature.
    public gainCondition: ConditionGain[] = [];
    public time: string = "";
    public timeStamp: number = 0;
    //Start a condition? False will try to end a condition.
    public activate: boolean = true;
    public selected: boolean = true;
    public deleted: boolean = false;
}
