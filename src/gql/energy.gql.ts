export const gqlCurrentEnergyPrices = `
query getCurrentEnergyPrices($resolution:PriceInfoResolution = HOURLY) {
  viewer {
    homes {
      id
      currentSubscription{
        id
        validFrom
        validTo
        status
        priceInfo(resolution:$resolution) {
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
query getCurrentEnergyPrice($homeId:ID!, $resolution:PriceInfoResolution = HOURLY) {
  viewer {
    home(id:$homeId) {
      id
      currentSubscription{
        id
        validFrom
        validTo
        status
        priceInfo(resolution:$resolution) {
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

export const gqlEnergyPriceRange = `
query getEnergyPriceRange($homeId:ID!, $resolution:PriceInfoRangeResolution!, $first:Int, $last:Int, $before:String, $after:String) {
  viewer {
    home(id:$homeId) {
      id
      currentSubscription {
        id
        priceInfoRange(resolution:$resolution, first:$first, last:$last, before:$before, after:$after) {
          pageInfo {
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
            resolution
            currency
            count
            precision
            minEnergy
            minTotal
            maxEnergy
            maxTotal
          }
          nodes {
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
