import { IErrors } from './IErrors';

export interface ISendMeterReading {
    sendMeterReading?: {
        homeId: string;
        time: string;
        reading: number;
    };
    errors?: IErrors[];
}
