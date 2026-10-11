export enum DataScope {
    OPENID = 'openid',
    PROFILE = 'profile',
    EMAIL = 'email',
    /** Needed to get a refresh token */
    OFFLINE_ACCESS = 'offline_access',
    USER_READ = 'data-api-user-read',
    HOMES_READ = 'data-api-homes-read',
    VEHICLES_READ = 'data-api-vehicles-read',
    CHARGERS_READ = 'data-api-chargers-read',
    THERMOSTATS_READ = 'data-api-thermostats-read',
    ENERGY_SYSTEMS_READ = 'data-api-energy-systems-read',
    INVERTERS_READ = 'data-api-inverters-read',
    /** Live measurements from Tibber Pulse and Watty */
    METERS_READ = 'data-api-meters-read',
}
