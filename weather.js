const request = require('request');
const argv = require('yargs').argv;

let apiKey = '20bca7e4aa841592bfffabc74e0d08bf';
let city = argv.c ||  'karachi';
let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

request(url, function(err, res, body) {
    if (err) {
        console.error('error:', err);
    } else {
        let weather = JSON.parse(body);
        let msg = `It's ${weather.main.temp}˚ degree in ${weather.name}!`
        console.log(msg);
        
        console.log('body:', body);
        
    }
})