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
    getWebsocketSubscriptionUrl(): URL | Promise<URL>;
    getHome(homeId: string): IHome | Promise<IHome>
    getHomeComplete(homeId: string): IHome | Promise<IHome>
    getHomes(): IHome[] | Promise<IHome[]>
    getHomesComplete(): IHome[] | Promise<IHome[]>
    getCurrentEnergyPrice(homeId: string): IPrice | Promise<IPrice>
    getCurrentEnergyPrices(): IPrice[] | Promise<IPrice[]>
    getTodaysEnergyPrices(homeId: string): IPrice[] | Promise<IPrice[]>
    getTomorrowsEnergyPrices(homeId: string): IPrice[] | Promise<IPrice[]>
    getConsumption(resolution: EnergyResolution, lastCount: number, homeId?: string): IConsumption[] | Promise<IConsumption[]>
    sendPushNotification(message: string, title: string, screen: AppScreen): ISendPushNotification | Promise<ISendPushNotification>
    }
