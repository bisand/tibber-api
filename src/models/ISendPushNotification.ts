import { IErrors } from './IErrors';

export interface ISendPushNotification {
    sendPushNotification?: {
        successful: string;
        pushedToNumberOfDevices: number;
    };
    errors?: IErrors[];
}
