export interface ISendPushNotification {
    sendPushNotification?: {
        successful: string;
        pushedToNumberOfDevices: number;
    };
    errors?: [
        {
            message: string;
            locations: [
                {
                    line: number;
                    column: number;
                },
            ];
            path: string[];
            extensions: {
                code: string;
            };
        },
    ];
}
