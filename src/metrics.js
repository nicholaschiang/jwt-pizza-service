const config = require("./config.js");
const os = require("os");

const metrics = {};

// HTTP requests by method/minute will be done via Express middleware. I will
// keep global counts here and increment them.
metrics.countAll = 0;
metrics.countPosts = 0;
metrics.countPuts = 0;
metrics.countDeletes = 0;
metrics.countGets = 0;

// Active users will be done by keeping a global count here. Increment it on
// login or register and decrement it on logout.
metrics.activeUsersCount = 0;

// Authentication attemps per minute will be done by keeping a global count here
// and incrementing it on each login attempt. I will track failed and success.
metrics.successAuthCount = 0;
metrics.failedAuthCount = 0;

// Pizzas sold/minute, creation failures, revenue/minute.
metrics.pizzasSoldCount = 0;
metrics.pizzasFailedCount = 0;
metrics.revenueTotal = 0;

// Order latency will be tracked via Performance.now() differences.
metrics.serviceLatency = 0;
metrics.pizzaCreationLatency = 0;

// CPU and memory usage percentage.
function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}
function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

function sendMetric(metricPrefix, metricValue) {
  const metric = `${metricPrefix},source=${config.metrics.source} total=${metricValue}`;
  console.log(`Sending metric to ${config.metrics.url}:`, metric);
  fetch(`${config.metrics.url}`, {
    method: "post",
    body: metric,
    headers: {
      Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to push metrics data to Grafana");
      } else {
        console.log(`Pushed ${metric}`);
      }
    })
    .catch((error) => {
      console.error("Error pushing metrics:", error);
    });
}

setInterval(() => {
  Object.entries(metrics).map(([metricPrefix, metricValue]) => {
    sendMetric(metricPrefix, metricValue);
  });

  const cpuUsage = getCpuUsagePercentage();
  const memoryUsage = getMemoryUsagePercentage();
  sendMetric("cpuUsage", cpuUsage);
  sendMetric("memoryUsage", memoryUsage);
}, 10_000);

module.exports = metrics;
