export const gqlHomesConsumption = `
query getConsumption($resolution: EnergyResolution! $lastCount:Int!){
  viewer {
    homes {
      id
      consumption(resolution: $resolution, last: $lastCount) {
        nodes {
          from
          to
          cost
          unitPrice
          unitPriceVAT
          consumption
          consumptionUnit
          totalCost
          unitCost
          currency
        }
      }
    }
  }
}
`;

export const gqlHomeConsumption = `
query getConsumption($homeId:ID! $resolution: EnergyResolution! $lastCount:Int!){
  viewer {
    home(id:$homeId) {
      id
      consumption(resolution: $resolution, last: $lastCount) {
        nodes {
          from
          to
          cost
          unitPrice
          unitPriceVAT
          consumption
          consumptionUnit
          totalCost
          unitCost
          currency
        }
      }
    }
  }
}
`;

export const gqlHomeConsumptionPage = `
query getConsumptionPage($homeId:ID! $resolution: EnergyResolution! $first:Int $last:Int $before:String $after:String $filterEmptyNodes:Boolean){
  viewer {
    home(id:$homeId) {
      id
      consumption(resolution: $resolution, first: $first, last: $last, before: $before, after: $after, filterEmptyNodes: $filterEmptyNodes) {
        pageInfo {
          startCursor
          endCursor
          hasNextPage
          hasPreviousPage
          count
          currency
          totalCost
          totalConsumption
          filtered
        }
        nodes {
          from
          to
          cost
          unitPrice
          unitPriceVAT
          consumption
          consumptionUnit
          currency
        }
      }
    }
  }
}
`;
