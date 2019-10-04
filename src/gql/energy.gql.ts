export const gqlCurrentEnergyPrice = `
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

export const gqlTodaysEnergyPrices = `
query getTodaysEnergyPrices {
  viewer {
    homes {
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
query getTomorrowsEnergyPrices {
  viewer {
    homes {
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
