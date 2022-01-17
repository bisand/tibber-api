import { AppScreen } from './enums/AppScreen';

export interface ISendPushNotificationPayload {
    input: {
        title: string;
        message: string;
        screenToOpen: AppScreen;
    };
}
