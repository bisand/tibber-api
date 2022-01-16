export const cqlSendPushNoticifation = `
mutation sendPushNotification($input: PushNotificationInput!) {
  sendPushNotification(input: $input) {
    successful
    pushedToNumberOfDevices
  }
}
`;
