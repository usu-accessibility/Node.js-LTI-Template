// const redis = require('redis');

// // Replace these values with your ElastiCache endpoint and port
// const redisClient = redis.createClient({
//     rootNodes: [
//         {
//             url: 'redis://accessibilitycache.fif8xk.ng.0001.usw2.cache.amazonaws.com:6379'
//         }
//     ]});

// console.log("connecting to elasticache");

// redisClient.on('connect', () => {
//     console.log('Connected to Redis');
// });

// redisClient.on('error', (err) => {
//     console.error(`Redis Error: ${err}`);
// });

// redisClient.set('my_key', 'my_value', (err, response) => {
//     if (err) {
//       console.error(`Set error: ${err}`);
//     } else {
//       console.log(`Set response: ${response}`);
//     }
//   });

var RedisClustr = require('redis-clustr');
var RedisClient = require('redis');

var redis = new RedisClustr({
    servers: [
        {
            host: "accessibilitycache-001.fif8xk.0001.usw2.cache.amazonaws.com",
            port: 6379
        }
    ],
    createClient: function (port, host) {
        // this is the default behaviour
        return RedisClient.createClient(port, host);
    }
});

//connect to redis
redis.on("connect", function () {
  console.log("connected to redis");
});

// //check the functioning
// redis.set("framework", "No", function (err, reply) {
//   console.log("redis.set " , reply);
// });

// redis.get("framework", function (err, reply) {
//   console.log("redis.get ", reply);
// });