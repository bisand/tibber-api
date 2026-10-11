export const gqlHomesProduction = `
query getProduction($resolution: EnergyResolution! $lastCount:Int!){
  viewer {
    homes {
      id
      production(resolution: $resolution, last: $lastCount) {
        nodes {
          from
          to
          profit
          unitPrice
          unitPriceVAT
          production
          productionUnit
          currency
        }
      }
    }
  }
}
`;

export const gqlHomeProduction = `
query getProduction($homeId:ID! $resolution: EnergyResolution! $lastCount:Int!){
  viewer {
    home(id:$homeId) {
      id
      production(resolution: $resolution, last: $lastCount) {
        nodes {
          from
          to
          profit
          unitPrice
          unitPriceVAT
          production
          productionUnit
          currency
        }
      }
    }
  }
}
`;

export const gqlHomeProductionPage = `
query getProductionPage($homeId:ID! $resolution: EnergyResolution! $first:Int $last:Int $before:String $after:String $filterEmptyNodes:Boolean){
  viewer {
    home(id:$homeId) {
      id
      production(resolution: $resolution, first: $first, last: $last, before: $before, after: $after, filterEmptyNodes: $filterEmptyNodes) {
        pageInfo {
          startCursor
          endCursor
          hasNextPage
          hasPreviousPage
          count
          currency
          totalProfit
          totalProduction
          filtered
        }
        nodes {
          from
          to
          profit
          unitPrice
          unitPriceVAT
          production
          productionUnit
          currency
        }
      }
    }
  }
}
`;
