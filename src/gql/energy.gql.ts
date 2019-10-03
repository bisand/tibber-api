export const gqlCurrentEnergyPrice = `
{
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
