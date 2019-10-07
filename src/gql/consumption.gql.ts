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
          currency
        }
      }
    }
  }
}
`;
