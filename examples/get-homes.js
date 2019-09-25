// Uncomment the following line to include tibber-api NPM package instead.
// const TibberQuery = require("tibber-api").TibberQuery;

const TibberQuery = require("../index").TibberQuery;

const http = require("http");

const hostname = "127.0.0.1";
const port = 3000;

let config = {
  apiEndpoint: {
    queryUrl: "https://api.tibber.com/v1-beta/gql",
    feedUrl: "wss//api.tibber.com/v1-beta/gql/subscriptions",
    apiKey: "d1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a" // Demo token
  }
};

let queryHomes =
  "{viewer{homes{id size appNickname appAvatar address{address1 address2 address3 postalCode city country latitude longitude}}}}";

let tibberQuery = new TibberQuery(config);

const server = http.createServer(async (req, res) => {
  let result = {};
  try {
    // Call the Tibber API and return the result.
    result = await tibberQuery.query(queryHomes);
  } catch (e) {
    console.log(e);
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.write("<html><body><h1>Hello Tibber API</h1>");
  res.write("Home Id: " + result.viewer.homes[0].id);
  res.write("<br/>Address: " + result.viewer.homes[0].address.address1);
  res.end("</body></html>");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
