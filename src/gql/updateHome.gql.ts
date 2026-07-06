export const gqlUpdateHome = `
mutation updateHome($input: UpdateHomeInput!) {
  updateHome(input: $input) {
    id
    timeZone
    appNickname
    appAvatar
    size
    type
    numberOfResidents
    primaryHeatingSource
    hasVentilationSystem
    mainFuseSize
  }
}
`;
