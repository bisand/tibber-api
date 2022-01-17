export const gqlSendPushNotification = `
mutation sendPushNotification($input: PushNotificationInput!) {
  sendPushNotification(input: $input) {
    successful
    pushedToNumberOfDevices
  }
}
`;
