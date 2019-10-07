export const gqlConsumption = `
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
