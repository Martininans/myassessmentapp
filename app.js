// Entry point — registers endpoint folders and starts server
require('module-alias/register'); // optional if you set up module aliases; harmless if not installed
const { createServer } = require('./core/server');

const ENDPOINT_CONFIGS = [
  { path: './endpoints/payment-instructions/' }
];

const PORT = process.env.PORT || 8811;

const app = createServer({ endpointConfigs: ENDPOINT_CONFIGS });

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
