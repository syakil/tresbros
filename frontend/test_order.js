const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:5052/api/Order');
        console.log(JSON.stringify(res.data[0], null, 2));
    } catch(e) {
        console.error(e.message);
    }
}
test();
