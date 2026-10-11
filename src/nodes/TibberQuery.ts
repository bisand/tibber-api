import { IConfig } from '../models/IConfig';
import { IHome } from '../models/IHome';
import { IPrice } from '../models/IPrice';
import { EnergyResolution } from '../models/enums/EnergyResolution';
import { PriceResolution } from '../models/enums/PriceResolution';
import { PriceRangeResolution } from '../models/enums/PriceRangeResolution';
import { IConsumption } from '../models/IConsumption';
import { IProduction } from '../models/IProduction';
import { IPagingOptions } from '../models/IPagingOptions';
import { IEnergyPagingOptions } from '../models/IEnergyPagingOptions';
import { IHomeConsumptionConnection } from '../models/IHomeConsumptionConnection';
import { IHomeProductionConnection } from '../models/IHomeProductionConnection';
import { ISubscriptionPriceConnection } from '../models/ISubscriptionPriceConnection';
import { gqlHomesConsumption, gqlHomeConsumption, gqlHomeConsumptionPage } from '../gql/consumption.gql';
import { gqlHomesProduction, gqlHomeProduction, gqlHomeProductionPage } from '../gql/production.gql';
import { gqlHomes, gqlHomesComplete } from '../gql/homes.gql';
import { gqlHome, gqlHomeComplete } from '../gql/home.gql';
import { gqlCurrentEnergyPrice, gqlTodaysEnergyPrices, gqlTomorrowsEnergyPrices, gqlCurrentEnergyPrices, gqlEnergyPriceRange } from '../gql/energy.gql';
import { gqlSendPushNotification } from '../gql/sendPushNotification.gql';
import { gqlUpdateHome } from '../gql/updateHome.gql';
import { ISendPushNotification } from '../models/ISendPushNotification';
import { IUpdateHomeInput } from '../models/IUpdateHomeInput';
import { AppScreen } from '../models/enums/AppScreen';
import { TibberQueryBase } from './TibberQueryBase';

export class TibberQuery extends TibberQueryBase {
    /**
     * Constructor
     * Create an instace of TibberQuery class
     * @param {IConfig} config Config object
     * @param {number} requestTimeout Request timeout in milliseconds.
     * @see IConfig
     */
    constructor(config: IConfig, requestTimeout: number = 30000) {
        super(config, requestTimeout);
    }

    /**
     * Get selected home with some selected properties, including address and owner.
     * @param homeId Tibber home ID
     * @return IHome object
     */
    public async getHome(homeId: string): Promise<IHome> {
        const variables = { homeId };
        const result = await this.query(gqlHome, variables);
        if (result && result.viewer && result.viewer.home) {
            return Object.assign({} as IHome, result.viewer.home);
        }
        return result && result.error ? result : {};
    }

    /**
     * Get homes with all properties, including energy price, consumption and production.
     * @param homeId Tibber home ID
     * @return IHome object
     */
    public async getHomeComplete(homeId: string): Promise<IHome> {
        const variables = { homeId };
        const result = await this.query(gqlHomeComplete, variables);
        if (result && result.viewer && result.viewer.home) {
            return Object.assign({} as IHome, result.viewer.home);
        }
        return result && result.error ? result : {};
    }

    /**
     * Get homes with some selected properties, including address and owner.
     * @return Array of IHome.
     */
    public async getHomes(): Promise<IHome[]> {
        const result = await this.query(gqlHomes);
        if (result && result.viewer && Array.isArray(result.viewer.homes)) {
            return Object.assign([] as IHome[], result.viewer.homes);
        }
        return result && result.error ? result : [];
    }

    /**
     * Get homes with all properties, including energy price, consumption and production.
     * @return Array of IHome
     */
    public async getHomesComplete(): Promise<IHome[]> {
        const result = await this.query(gqlHomesComplete);
        if (result && result.viewer && Array.isArray(result.viewer.homes)) {
            return Object.assign([] as IHome[], result.viewer.homes);
        }
        return result && result.error ? result : [];
    }

    /**
     * Get current energy price for selected home.
     * @param homeId Tibber home ID
     * @param resolution Either HOURLY or QUARTER_HOURLY
     * @return IPrice object
     */
    public async getCurrentEnergyPrice(homeId: string, resolution: string = PriceResolution.HOURLY): Promise<IPrice> {
        const variables = { homeId, resolution };
        const result = await this.query(gqlCurrentEnergyPrice, variables);
        if (result && result.viewer && result.viewer.home) {
            const home: IHome = result.viewer.home;
            return Object.assign(
                {} as IPrice,
                home.currentSubscription && home.currentSubscription.priceInfo ? home.currentSubscription.priceInfo.current : {},
            );
        }
        return result && result.error ? result : {};
    }

    /**
     * Get current energy prices from all homes registered to current user
     * @param resolution Either HOURLY or QUARTER_HOURLY
     * @return Array of IPrice
     */
    public async getCurrentEnergyPrices(resolution: string = PriceResolution.HOURLY): Promise<IPrice[]> {
        const variables = { resolution };
        const result = await this.query(gqlCurrentEnergyPrices, variables);
        if (result && result.viewer && Array.isArray(result.viewer.homes)) {
            const homes: IHome[] = result.viewer.homes;
            const prices = homes.flatMap((item: IHome) => {
                if (item && item.currentSubscription && item.currentSubscription.priceInfo && item.currentSubscription.priceInfo.current) {
                    const price = item.currentSubscription.priceInfo.current;
                    price.homeId = item.id;
                    return [price];
                }
                return [];
            });
            return Object.assign([] as IPrice[], prices);
        }
        return result && result.error ? result : [];
    }

    /**
     * Get energy prices for today.
     * @param homeId Tibber home ID
     * @param resolution Either HOURLY or QUARTER_HOURLY
     * @return Array of IPrice
     */
    public async getTodaysEnergyPrices(homeId: string, resolution: string = PriceResolution.HOURLY): Promise<IPrice[]> {
        const variables = { homeId, resolution };
        const result = await this.query(gqlTodaysEnergyPrices, variables);
        if (result && result.viewer && result.viewer.home) {
            const data: IHome = result.viewer.home;
            return Object.assign(
                [] as IPrice[],
                data.currentSubscription && data.currentSubscription.priceInfo ? data.currentSubscription.priceInfo.today : {},
            );
        }
        return result && result.error ? result : [];
    }

    /**
     * Get energy prices for tomorrow. These will only be available between 12:00 and 23:59
     * @param homeId Tibber home ID
     * @param resolution Either HOURLY or QUARTER_HOURLY
     * @return Array of IPrice
     */
    public async getTomorrowsEnergyPrices(homeId: string, resolution: string = PriceResolution.HOURLY): Promise<IPrice[]> {
        const variables = { homeId, resolution };
        const result = await this.query(gqlTomorrowsEnergyPrices, variables);
        if (result && result.viewer && result.viewer.home) {
            const data: IHome = result.viewer.home;
            return Object.assign(
                [] as IPrice[],
                data.currentSubscription && data.currentSubscription.priceInfo ? data.currentSubscription.priceInfo.tomorrow : {},
            );
        }
        return result && result.error ? result : [];
    }

    /**
     * Get energy consumption for one or more homes.
     * Returns an array of IConsumption
     * @param resolution EnergyResolution. Valid values: HOURLY, DAILY, WEEKLY, MONTHLY, ANNUAL
     * @param lastCount Return the last number of records
     * @param homeId Tibber home ID. Optional parameter. Empty parameter will return all registered homes.
     * @return Array of IConsumption
     */
    public async getConsumption(resolution: EnergyResolution, lastCount: number, homeId?: string): Promise<IConsumption[]> {
        const variables = { homeId, resolution, lastCount };
        if (homeId) {
            const result = await this.query(gqlHomeConsumption, variables);
            if (result && result.viewer && result.viewer.home) {
                const home: IHome = result.viewer.home;
                return Object.assign([] as IConsumption[], home.consumption ? home.consumption.nodes : []);
            }
            return result && result.error ? result : [];
        } else {
            const result = await this.query(gqlHomesConsumption, variables);
            if (result && result.viewer && Array.isArray(result.viewer.homes)) {
                const consumptions = result.viewer.homes.flatMap((item: IHome) => {
                    const nodes = item?.consumption?.nodes?.map((node: IConsumption) => {
                        node.homeId = item.id;
                        return node;
                    });
                    return nodes ?? [];
                });
                return Object.assign([] as IConsumption[], consumptions);
            }
            return result && result.error ? result : [];
        }
    }

    /**
     * Get a page of energy consumption for selected home, including page info with totals and cursors.
     * Tibber limits the number of records per request (744 hourly, 31 daily, 52 weekly, 12 monthly, 1 annual).
     * To get the previous page, use pageInfo.startCursor as paging.before.
     * @param homeId Tibber home ID
     * @param resolution EnergyResolution. Valid values: HOURLY, DAILY, WEEKLY, MONTHLY, ANNUAL
     * @param paging Which records to return. Either first or last is required.
     * @return IHomeConsumptionConnection object
     */
    public async getConsumptionPage(homeId: string, resolution: EnergyResolution, paging: IEnergyPagingOptions): Promise<IHomeConsumptionConnection> {
        const variables = { homeId, resolution, ...this.getPagingVariables(paging), filterEmptyNodes: paging.filterEmptyNodes };
        const result = await this.query(gqlHomeConsumptionPage, variables);
        return Object.assign({ nodes: [] } as unknown as IHomeConsumptionConnection, result?.viewer?.home?.consumption);
    }

    /**
     * Get energy production for one or more homes.
     * Returns an array of IProduction
     * @param resolution EnergyResolution. Valid values: HOURLY, DAILY, WEEKLY, MONTHLY, ANNUAL
     * @param lastCount Return the last number of records
     * @param homeId Tibber home ID. Optional parameter. Empty parameter will return all registered homes.
     * @return Array of IProduction
     */
    public async getProduction(resolution: EnergyResolution, lastCount: number, homeId?: string): Promise<IProduction[]> {
        const variables = { homeId, resolution, lastCount };
        if (homeId) {
            const result = await this.query(gqlHomeProduction, variables);
            return Object.assign([] as IProduction[], result?.viewer?.home?.production?.nodes ?? []);
        } else {
            const result = await this.query(gqlHomesProduction, variables);
            const homes: IHome[] = Array.isArray(result?.viewer?.homes) ? result.viewer.homes : [];
            return homes.flatMap((item: IHome) => {
                const nodes = item?.production?.nodes?.map((node: IProduction) => {
                    node.homeId = item.id;
                    return node;
                });
                return nodes ?? [];
            });
        }
    }

    /**
     * Get a page of energy production for selected home, including page info with totals and cursors.
     * Tibber limits the number of records per request (744 hourly, 31 daily, 52 weekly, 12 monthly, 1 annual).
     * To get the previous page, use pageInfo.startCursor as paging.before.
     * @param homeId Tibber home ID
     * @param resolution EnergyResolution. Valid values: HOURLY, DAILY, WEEKLY, MONTHLY, ANNUAL
     * @param paging Which records to return. Either first or last is required.
     * @return IHomeProductionConnection object
     */
    public async getProductionPage(homeId: string, resolution: EnergyResolution, paging: IEnergyPagingOptions): Promise<IHomeProductionConnection> {
        const variables = { homeId, resolution, ...this.getPagingVariables(paging), filterEmptyNodes: paging.filterEmptyNodes };
        const result = await this.query(gqlHomeProductionPage, variables);
        return Object.assign({ nodes: [] } as unknown as IHomeProductionConnection, result?.viewer?.home?.production);
    }

    /**
     * Get historical energy prices for selected home, including page info with min/max and cursors.
     * Tibber limits the number of records per request (672 quarter-hourly, 744 hourly, 31 daily).
     * With QUARTER_HOURLY, Tibber works in whole hours: use a multiple of 4 for first and last.
     * To get the previous page, use pageInfo.startCursor as paging.before.
     * @param homeId Tibber home ID
     * @param resolution PriceRangeResolution. Valid values: DAILY, HOURLY, QUARTER_HOURLY
     * @param paging Which records to return. Either first or last is required.
     * @return ISubscriptionPriceConnection object
     */
    public async getEnergyPriceRange(homeId: string, resolution: PriceRangeResolution, paging: IPagingOptions): Promise<ISubscriptionPriceConnection> {
        const variables = { homeId, resolution, ...this.getPagingVariables(paging) };
        const result = await this.query(gqlEnergyPriceRange, variables);
        return Object.assign({ nodes: [] } as unknown as ISubscriptionPriceConnection, result?.viewer?.home?.currentSubscription?.priceInfoRange);
    }

    /**
     * Convert paging options to GQL variables. Tibber cursors are Base64 encoded ISO 8601 timestamps.
     */
    private getPagingVariables(paging: IPagingOptions) {
        const toCursor = (value?: string | Date) => (value instanceof Date ? Buffer.from(value.toISOString()).toString('base64') : value);
        return { first: paging.first, last: paging.last, before: toCursor(paging.before), after: toCursor(paging.after) };
    }

    /**
     * Sends a push notification to the current user's tibber app.
     * Returns a ISendPushNotification Object
     * @param title: "The title of your message";
     * @param message: "The message you want to send";
     * @param screen: AppScreen Object, example: AppScreen.HOME ;
     * @return ISendPushNotification Object
     */
    public async sendPushNotification(message: string, title: string, screen: AppScreen): Promise<ISendPushNotification> {
        const messagePayloadVariables = {
            input: { title, message, screenToOpen: screen },
        };

        const result = await this.query(gqlSendPushNotification, messagePayloadVariables);

        if (result.sendPushNotification || result.errors) {
            return Object.assign({} as ISendPushNotification, result);
        } else return Object.assign({}, { errors: [{ message: 'Undefined error' }] } as ISendPushNotification);
    }

    /**
     * Update home information.
     * @param input IUpdateHomeInput object. homeId is required, all other properties are optional.
     * @return IHome object with the updated home.
     */
    public async updateHome(input: IUpdateHomeInput): Promise<IHome> {
        const variables = { input };
        const result = await this.query(gqlUpdateHome, variables);
        if (result && result.updateHome) {
            return Object.assign({} as IHome, result.updateHome);
        }
        return result && (result.error || result.errors) ? result : {};
    }
}
