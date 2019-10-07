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
query getTodaysEnergyPrices($homeId:ID!) {
  viewer {
    home(id:$homeId) {
      id
      currentSubscription {
        id
        validFrom
        validTo
        status
        priceInfo {
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
query getTomorrowsEnergyPrices($homeId:ID!) {
  viewer {
    home(id:$homeId) {
      id
      currentSubscription {
        id
        validFrom
        validTo
        status
        priceInfo {
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
