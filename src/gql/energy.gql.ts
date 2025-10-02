export const gqlCurrentEnergyPrices = `
query getCurrentEnergyPrice {
  viewer {
    homes {
      id
      currentSubscription{
        id
        validFrom
        validTo
        status
        priceInfo{
          current{
            total
            energy
            tax
            startsAt
            currency
            level            
          }
        }
      }
    }
  }
}
`;

export const gqlCurrentEnergyPrice = `
query getCurrentEnergyPrice($homeId:ID!) {
  viewer {
    home(id:$homeId) {
      id
      currentSubscription{
        id
        validFrom
        validTo
        status
        priceInfo{
          current{
            total
            energy
            tax
            startsAt
            currency
            level            
          }
        }
      }
    }
  }
}
`;

export const gqlTodaysEnergyPrices = `
query getTodaysEnergyPrices($homeId:ID!, $resolution:PriceInfoResolution = HOURLY) {
  viewer {
    home(id:$homeId) {
      id
      currentSubscription {
        id
        validFrom
        validTo
        status
        priceInfo(resolution:$resolution) {
          today {
            total
            energy
            tax
            startsAt
            currency
            level
          }
        }
      }
    }
  }
}
`;

export const gqlTomorrowsEnergyPrices = `
query getTomorrowsEnergyPrices($homeId:ID!, $resolution:PriceInfoResolution = HOURLY) {
  viewer {
    home(id:$homeId) {
      id
      currentSubscription {
        id
        validFrom
        validTo
        status
        priceInfo(resolution:$resolution) {
          tomorrow {
            total
            energy
            tax
            startsAt
            currency
            level
          }
        }
      }
    }
  }
}
`;
