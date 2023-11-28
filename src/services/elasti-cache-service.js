const { createClient } = require('redis');

const client = createClient();

client.on('error', err => console.log('Redis Client Error', err));

async function connectToRedis(){
    await client.connect();

    await client.hSet('user-session:123', {
        name: 'John',
        surname: 'Smith',
        company: 'Redis',
        age: 29
    })

    await client.set('key', 'value');
    const value = await client.get('key');
    console.log(value)
}

module.exports = {
    connectToRedis
}
