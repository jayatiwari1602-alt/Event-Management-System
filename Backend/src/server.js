const app = require("./app");
const config = require("./config");
const { seedIfEmpty } = require("./data/seed");

seedIfEmpty();

app.listen(config.port, () => {
  console.log(`\n  EventPro backend running → http://localhost:${config.port}`);
  console.log(`  Health check          → http://localhost:${config.port}/health`);
  console.log(`  API base              → http://localhost:${config.port}/api\n`);
});
