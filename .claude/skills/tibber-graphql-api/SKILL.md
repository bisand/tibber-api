---
name: tibber-graphql-api
description: Working knowledge of the Tibber GraphQL API — endpoint, authentication, price/consumption queries (incl. QUARTER_HOURLY resolution), mutations, and the live-measurement websocket subscription API. Use when developing or debugging the tibber-api library or anything calling api.tibber.com.
---

# Tibber GraphQL API Reference

Practical reference for the Tibber developer API (https://developer.tibber.com), written for maintaining the `bisand/tibber-api` TypeScript library. Verified against the live docs (overview, guides, schema reference, changelog) as of 2026-07.

## Endpoints

| Purpose | URL |
|---|---|
| GraphQL queries & mutations (HTTP POST) | `https://api.tibber.com/v1-beta/gql` |
| WebSocket subscriptions | **Dynamic** — must be queried via `viewer.websocketSubscriptionUrl` |
| Current value returned for the WS URL | `wss://websocket-api.tibber.com/v1-beta/gql/subscriptions` (do not hardcode) |
| API explorer (GraphiQL) | `https://developer.tibber.com/explorer` |

The old static WS endpoint `wss://api.tibber.com/v1-beta/gql/subscriptions` was removed in December 2022 along with the legacy `graphql-ws` (subscriptions-transport-ws) sub-protocol.

## Authentication

- OAuth bearer token passed on **every** request: `Authorization: Bearer <token>`.
- Two token types:
  1. **Personal Access Token** — access to your own data only; created at https://developer.tibber.com/settings/access-token. Tokens carry **scopes** (e.g. USER, HOME) chosen at creation.
  2. **OAuth client** — for apps distributed to other users; standard OAuth handshake yields a token on the user's behalf (contact hello@tibber.com to register).
- **Demo token** (docs examples, backed by an auto-generated demo account whose data may be nonsensical):
  `3A77EECF61BD445F47241A5A36202185C35AF3AF58609E19B53F3A8872AD7BE1-1`

### Mandatory client requirements

- Set a `User-Agent` header on every GraphQL call, on the call fetching the WS URL, and on the WebSocket connection itself. It must include both platform and driver version, e.g. `Homey/10.0.0 com.tibber/1.8.3`.
- Implement jitter + exponential backoff on all retries/reconnects.

## Calling the API

Always HTTP **POST**, JSON body with the query as a *string* property:

```bash
curl \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "User-Agent: my-platform/1.0 tibber-api/6.0.0" \
  -X POST \
  -d '{ "query": "{viewer {homes {currentSubscription {priceInfo {current {total energy tax startsAt}}}}}}" }' \
  https://api.tibber.com/v1-beta/gql
```

### Error handling (changed 2025-01-03 — potentially breaking)

Authentication failures (missing/invalid token) **no longer return HTTP 400**. The server now returns **HTTP 200** with a GraphQL `errors` array; the error object has `extensions.code === "UNAUTHENTICATED"`. Do not rely on HTTP status codes to detect auth errors — inspect the `errors` array:

```json
{ "errors": [ { "message": "...", "extensions": { "code": "UNAUTHENTICATED" } } ] }
```

### Rate limits & best practices

- **100 requests per 5 minutes per IP address** (protective limit).
- Max **2 concurrently open WebSockets** per token.
- Prices are computed once per day (afternoon; NO/SE first preliminary, later finalized). Fetch `today`/`tomorrow` **once per day**, cache locally, and pick the current price from the cache instead of polling `priceInfo.current`.
- Add a long random delay when querying prices; waiting an hour or two after tomorrow's prices normally arrive improves first-try success.
- Prefer several small queries (prices, consumption, production separately) over one giant query; large consumption queries that time out should be split into smaller time windows and stitched.
- Consumption/production is **not real-time** — don't poll it continually. It is also cached aggressively server-side; if readings look stale, wait and re-fetch.

## Schema overview

```
Query
└── viewer: Viewer!
    ├── login, userId, name, accountType: [String!]!
    ├── homes: [Home]!
    ├── home(id: ID!): Home!
    └── websocketSubscriptionUrl: String

Home
├── id, timeZone!, appNickname, appAvatar!, size, type!, numberOfResidents,
│   primaryHeatingSource, hasVentilationSystem, mainFuseSize
├── address, owner: LegalEntity, meteringPointData
├── currentSubscription: Subscription        # current/latest subscription
├── subscriptions: [Subscription]!           # historic
├── consumption(resolution: EnergyResolution!, first, last, before, after, filterEmptyNodes)
├── production(resolution: EnergyResolution!, ...same args)
└── features { realTimeConsumptionEnabled }  # true if Pulse/Watty paired

Subscription (the power-deal object, NOT a GraphQL subscription)
├── id, subscriber: LegalEntity!, validFrom, validTo, status
├── priceInfo(resolution: PriceInfoResolution): PriceInfo      # HOURLY | QUARTER_HOURLY
├── priceInfoRange(resolution: PriceInfoRangeResolution!, first, last, before, after)
└── priceRating  ⚠️ DEPRECATED (use priceInfo)
```

## Price queries

### PriceInfo — `resolution` argument (added 2025-09-01)

`Subscription.priceInfo` takes an optional `resolution: PriceInfoResolution` argument:

| Enum `PriceInfoResolution` | Behavior |
|---|---|
| `HOURLY` (default) | 24 items in `today`/`tomorrow`; `current` = current hour |
| `QUARTER_HOURLY` | **96** items in `today`/`tomorrow`; `current` = current quarter-hour |

Background: European day-ahead markets (Nord Pool, EPEX) switched to 15-minute MTUs on 2025-09-30; the first day with real quarter-hourly prices was **2025-10-01**. Before that date, `QUARTER_HOURLY` returned 4 identical prices per hour. The change is opt-in/backward-compatible — omitting `resolution` still yields `HOURLY`. Tibber has said the default *may* change to `QUARTER_HOURLY` in the future (with advance notice in the changelog), so always pass the argument explicitly.

```graphql
{
  viewer {
    home(id: "my-home-id") {
      currentSubscription {
        priceInfo(resolution: QUARTER_HOURLY) {
          current { total energy tax startsAt currency level }
          today    { startsAt total energy tax level }
          tomorrow { startsAt total energy tax level }
        }
      }
    }
  }
}
```

### Price fields

| Field | Type | Notes |
|---|---|---|
| `total` | Float | energy + taxes |
| `energy` | Float | Nord Pool spot price |
| `tax` | Float | certificates + energy tax (SE) + VAT |
| `startsAt` | String | ISO8601 start time of the price period |
| `currency` | String! | |
| `level` | PriceLevel | vs. trailing average |

`PriceLevel` enum: `VERY_CHEAP` (≤60 % of avg), `CHEAP` (60–90 %), `NORMAL` (90–115 %), `EXPENSIVE` (115–140 %), `VERY_EXPENSIVE` (≥140 %).

### Historical prices: `priceInfoRange` (replaces `priceInfo.range`)

- `PriceInfo.range` is **deprecated** — it still works but will never support `QUARTER_HOURLY`. Migrate to `Subscription.priceInfoRange`.
- `priceInfoRange(resolution: PriceInfoRangeResolution!, first, last, before, after)` returns a `SubscriptionPriceConnection` (`nodes: [Price]!`, `edges`, `pageInfo` with `count`, cursors, `minTotal`/`maxTotal` etc.).
- `PriceInfoRangeResolution` enum: `DAILY` | `HOURLY` | `QUARTER_HOURLY`.
- Result caps: **672 items (7 days) QUARTER_HOURLY, 744 items (31 days) HOURLY, 31 items DAILY.** Longer ranges are silently capped, not errored — paginate with cursors.
- Cursors (`before`/`after`) are **Base64-encoded ISO8601 date/time strings**. `before` can't combine with `after`; `first` can't combine with `last`.
- History from before Tibber's quarter-hourly backend support still returns hourly items even with `resolution: QUARTER_HOURLY`.
- Prices never change once published — cache historical prices permanently.

### Deprecated: `priceRating`

`Subscription.priceRating` (hourly/daily/monthly aggregates with LOW/NORMAL/HIGH levels) is deprecated as of 2025-09-01 and will not get quarter-hourly support. It still works; migrate to `priceInfo`. (Historical irony: in 2021 the docs deprecated `priceInfo` in favor of `priceRating`; this was reversed.)

## Consumption & production

`Home.consumption` / `Home.production` take a required `resolution: EnergyResolution!`:

`EnergyResolution` enum: `HOURLY` | `DAILY` | `WEEKLY` | `MONTHLY` | `ANNUAL`

**These do NOT accept QUARTER_HOURLY** — as of the 2025-09-01 changelog they remain hourly at finest; Tibber is evaluating 15-minute support based on demand.

Result caps (since 2024-10-18/24, silently capped): 744 (HOURLY, a full 31-day month), 31 (DAILY), 52 (WEEKLY), 12 (MONTHLY), 1 (ANNUAL).

```graphql
{
  viewer {
    home(id: "my-home-id") {
      consumption(resolution: HOURLY, last: 24, filterEmptyNodes: true) {
        pageInfo { startCursor endCursor count totalCost totalConsumption currency filtered }
        nodes { from to consumption consumptionUnit cost unitPrice unitPriceVAT currency }
      }
      production(resolution: HOURLY, last: 24) {
        nodes { from to production productionUnit profit unitPrice currency }
      }
    }
  }
}
```

Field notes:
- `Consumption.cost` = consumption × unitPrice, incl. VAT, excl. fees/production reward/Grid Rewards. `totalCost` and `unitCost` are **deprecated** in favor of `cost`; `energyCost` on pageInfo is deprecated as redundant.
- Pagination: same `first`/`last`/`before`/`after` Base64-ISO8601 cursor scheme as prices; `filterEmptyNodes` (default false) drops empty entries and reports the count in `pageInfo.filtered`.

## Mutations

```graphql
mutation {
  sendPushNotification(input: {
    title: "Price alert", message: "Cheap power now!", screenToOpen: CONSUMPTION
  }) {
    successful
    pushedToNumberOfDevices
  }
}

mutation {
  updateHome(input: { homeId: "my-home-id", appNickname: "Cabin", appAvatar: COTTAGE }) {
    appNickname
    appAvatar
  }
}
```

| Mutation | Input | Returns | Status |
|---|---|---|---|
| `sendPushNotification` | `PushNotificationInput` (`title`, `message!`, `screenToOpen: AppScreen`) | `PushNotificationResponse` (`successful!`, `pushedToNumberOfDevices!`) | Active |
| `updateHome` | `UpdateHomeInput` (`homeId!`, `appNickname`, `appAvatar: HomeAvatar`, `size`, `type: HomeType`, `numberOfResidents`, `primaryHeatingSource: HeatingSource`, `hasVentilationSystem`, `mainFuseSize`) | `Home!` | Active |
| `sendMeterReading` | `MeterReadingInput` (`homeId!`, `time`, `reading!`) | `MeterReadingResponse` | **DEPRECATED — calling it does nothing**; response fields always `null`/`0` |

Enums: `AppScreen` = `HOME, REPORTS, CONSUMPTION, COMPARISON, DISAGGREGATION, HOME_PROFILE, CUSTOMER_PROFILE, METER_READING, NOTIFICATIONS, INVOICES`. `HomeAvatar` = `APARTMENT, ROWHOUSE, FLOORHOUSE1, FLOORHOUSE2, FLOORHOUSE3, COTTAGE, CASTLE`. `HomeType` = `APARTMENT, ROWHOUSE, HOUSE, COTTAGE`.

## Real-time subscription API (liveMeasurement)

### Connection procedure

1. Check the home actually streams: query `viewer.home(id:...).features.realTimeConsumptionEnabled` — must be `true` (a Pulse or Watty device is paired). Also re-check before reconnect attempts (devices get removed).
2. Query the WS endpoint dynamically:
   ```graphql
   { viewer { websocketSubscriptionUrl } }
   ```
3. Open a WebSocket to that URL with sub-protocol **`graphql-transport-ws`** (the enisdenjo/graphql-ws protocol; the old Apollo `graphql-ws` protocol was removed Dec 2022) and a proper `User-Agent` header.
4. Send `connection_init` with the token in the payload (as used by the reference clients — graphql-ws in the Tibber Homey app, pyTibber, Tibber.SDK.NET):
   ```json
   { "type": "connection_init", "payload": { "token": "<access token>" } }
   ```
   Wait for `connection_ack`, then send `subscribe` with an id and the query payload.

### Subscription query

```graphql
subscription {
  liveMeasurement(homeId: "96a14971-525a-4420-aae9-e5aedaa129ff") {
    timestamp
    power
    accumulatedConsumption
    accumulatedCost
    currency
    minPower
    averagePower
    maxPower
  }
}
```

There is also `testMeasurement(count: Int, complete: Boolean): LiveMeasurement` for testing streams.

### LiveMeasurement fields

| Field | Type | Meaning |
|---|---|---|
| `timestamp` | String! | when usage occurred |
| `power` | Float! | current consumption, W |
| `powerProduction` | Float | net production (A-), W |
| `minPower` / `averagePower` / `maxPower` | Float! | since midnight, W |
| `minPowerProduction` / `maxPowerProduction` | Float | since midnight, W |
| `accumulatedConsumption` / `accumulatedProduction` | Float! | since midnight, kWh |
| `accumulatedConsumptionLastHour` / `accumulatedProductionLastHour` | Float! | since last hour shift, kWh |
| `accumulatedCost` / `accumulatedReward` | Float | since midnight; requires active Tibber deal; `accumulatedReward` is production only (unrelated to Grid Rewards) |
| `currency` | String | requires active Tibber deal |
| `lastMeterConsumption` / `lastMeterProduction` | Float | meter import/export register, kWh |
| `powerReactive` / `powerProductionReactive` | Float | Q+ / Q-, kVAr |
| `powerFactor` | Float | active/apparent power, 0–1 |
| `voltagePhase1/2/3` | Float | may be `null` on some frames; single-phase homes not guaranteed to report on phase 1 |
| `currentL1/L2/L3` | Float | same nullability caveat |
| `currentPhase1/2/3` | Float | **DEPRECATED** → use `currentL1/L2/L3` |
| `signalStrength` | Int | Pulse: dB(m); Watty: percent |

### Reconnect / resilience rules (from the docs)

- If no data received for several minutes: destroy the old socket, reconnect with jitter + exponential backoff.
- Server restart closes with `code: 1001, reason: "Going away"` → reconnect after a random 1–60 s delay (jitter mandatory, avoids thundering herd).
- Auth-rejected connection (e.g. deleted account): **do not retry with the same token** — require fresh credentials.
- Verify `realTimeConsumptionEnabled === true` before reconnecting.
- Max 2 open WebSockets.

## Changelog highlights (newest first)

- **2025-09-01** — QUARTER_HOURLY support: `priceInfo(resolution:)` added; `priceInfo.range` deprecated → `Subscription.priceInfoRange`; `priceRating` deprecated; consumption/production still hourly-max. First quarter-hourly prices 2025-10-01.
- **2025-01-03** — auth errors now HTTP 200 + `extensions.code: UNAUTHENTICATED` instead of HTTP 400.
- **2024-10-18/24** — hard result caps on range/consumption/production (744/31/52/12/1); silent capping; date-range bugfixes; more aggressive caching.
- **2022-10-10 / Dec 2022** — `websocketSubscriptionUrl` added; static WS URL and old sub-protocol removed. Clients MUST fetch the URL dynamically and speak `graphql-transport-ws`.
- **2021-03-14** — `accumulatedConsumptionLastHour`/`accumulatedProductionLastHour` added.
- **2020** — `powerReactive`, `powerProductionReactive`, `signalStrength`, `currentL1/2/3` (replacing `currentPhase1/2/3`), `Viewer.userId`.
- **2019** — production connection, `powerFactor`, `minPowerProduction`/`maxPowerProduction`, `Price.level`, `lastMeterConsumption`/`lastMeterProduction`.
- **2018** — `liveMeasurement` subscription, `Home.features`, `sendPushNotification`.
- **2017** — `sendMeterReading` (now defunct), `updateHome`, `filterEmptyNodes`.

## Gotchas for tibber-api maintainers

- Two things named "Subscription": the GraphQL root subscription (`liveMeasurement`) and the `Subscription` object type (the customer's power deal, under `home.currentSubscription`). Don't confuse them.
- `resolution` argument appears on **four** fields with **three different enums**: `priceInfo(PriceInfoResolution: HOURLY|QUARTER_HOURLY)`, `priceInfoRange(PriceInfoRangeResolution: DAILY|HOURLY|QUARTER_HOURLY)`, and `consumption`/`production` (`EnergyResolution: HOURLY|DAILY|WEEKLY|MONTHLY|ANNUAL` — no QUARTER_HOURLY).
- `sendMeterReading` is a silent no-op now — surface a deprecation warning rather than trusting `MeterReadingResponse`.
- Result capping is silent: asking for 2000 hourly consumption nodes returns 744 with no error. Check `pageInfo.count`/`hasNextPage`.
- HTTP 200 does not mean success — always check the `errors` array, and map `extensions.code === "UNAUTHENTICATED"` to an auth failure.
- Never hardcode the websocket URL; re-query `websocketSubscriptionUrl` on (re)connect.
- The `/docs/guides/graphql-subscriptions-real-time-api` page no longer exists as a separate guide; WS content now lives in the "Communicating with the API" guide (`/docs/guides/calling-api`) and the overview's "Breaking change in WebSocket subscriptions" section.
- Demo-account data is auto-generated and can be nonsensical; fine for smoke tests, not for assertions on values.
