import { EnergyResolution } from '../models/enums/EnergyResolution';
import { IConfig } from '../models/IConfig';
import { IConsumption } from '../models/IConsumption';
import { IHome } from '../models/IHome';
import { IPrice } from '../models/IPrice';
import { AppScreen } from '../models/enums/AppScreen';
import { ISendPushNotification } from '../models/ISendPushNotification';

export interface ITibberQuery {
    get config(): IConfig;
    set config(value: IConfig);
    getWebsocketSubscriptionUrl(): Promise<URL>;
    getHome(homeId: string): Promise<IHome>
    getHomeComplete(homeId: string): Promise<IHome>
    getHomes(): Promise<IHome[]>
    getHomesComplete(): Promise<IHome[]>
    getCurrentEnergyPrice(homeId: string): Promise<IPrice>
    getCurrentEnergyPrices(): Promise<IPrice[]>
    getTodaysEnergyPrices(homeId: string): Promise<IPrice[]>
    getTomorrowsEnergyPrices(homeId: string): Promise<IPrice[]>
    getConsumption(resolution: EnergyResolution, lastCount: number, homeId?: string): Promise<IConsumption[]>
    sendPushNotification(message: string, title: string, screen: AppScreen): Promise<ISendPushNotification>
    }
