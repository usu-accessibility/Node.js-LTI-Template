const redis = require('redis');

// Replace these values with your ElastiCache endpoint and port
const redisClient = redis.createClient({
    host: 'accessibilitycache.fif8xk.ng.0001.usw2.cache.amazonaws.com',
    port: 6379
});

console.log("connecting to elasticache");

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error(`Redis Error: ${err}`);
});