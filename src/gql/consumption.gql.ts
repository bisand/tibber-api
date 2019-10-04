export const gqlConsumption = `
query getMovie($resolution: EnergyResolution! $lastCount:Int!){
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
