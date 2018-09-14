const express =require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
    res.render('index');
});

app.post('/', function (req, res) {
    let city = req.body.city_name;
    let apiKey = '20bca7e4aa841592bfffabc74e0d08bf';
    let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
    request(url, function(err, response, body) {
        if (err) {
            res.render('index', {
                weather: null,
                error: 'Error, please try again'
            });
        } else {
            let weather = JSON.parse(body);
            if (weather.main == undefined) {
                res.render('index', {
                    weather: null,
                    error: 'Invalid input, please try again'
                });
            } else {
                let weatherText = `It's ${weather.main.temp}˚ Degrees in ${weather.name}`;
                
                res.render('index', {weather: weatherText, error: null});
            }
        }
    });    
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000');
});