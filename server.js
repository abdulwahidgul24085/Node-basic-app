const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
var stellarSdk = require('stellar-sdk');
var horizon = new stellarSdk.Server('https://horizon-testnet.stellar.org');
stellarSdk.Network.useTestNetwork();

var hbs = require('express-handlebars');
const app = express();


app.engine('handlebars', hbs({
    defaultLayout: 'layout',
    helpers: {
        toJSON: function (object) {
            return JSON.stringify(object);
        }
    }
}));
app.set('view engine', 'handlebars');
// app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json()); // support json encoded bodies

app.get('/', function (req, res) {
    res.render('index', {
        title: 'Home'
    })
})
app.get('/wallets', function (req, res) {

    res.render('create_wallet', {
        title: 'Wallet'
    });
});

app.post('/wallets', async function (req, res) {
    var wallet = stellarSdk.Keypair.random();
    request.get({
        url: 'https://friendbot.stellar.org',
        qs: {
            addr: wallet.publicKey() //+'123123'
        },
        json: true
    }, async function (error, response, body) {
        if (error || response.statusCode !== 200) {
            // console.error('ERROR!', error || body);
            res.render('create_wallet', {
                publicKey: wallet.publicKey(),
                secret: wallet.secret(),
                wallet: true,
                title: 'Wallet',
                error: true,
                tx_xdr: body
            });
        } else {
            let amount = await getBalance('GACPFYOYFARJAZ3QRAYBTZYTNWNSCVDVBFG7DHVJDBR7OQJZWPLLKEQY');
            console.log(body);

            res.render('create_wallet', {
                publicKey: wallet.publicKey(),
                secret: wallet.secret(),
                wallet: true,
                title: 'Wallet',
                error: false,
                tx_xdr: body,
                amount: amount
            });
        }
    });


    // return null;
});
app.get('/transactions', async function (req, res) {
    var txns = {};
    if (req.query.txn) {
        txns = await horizon.transactions().forAccount(req.query.txn).call();
    }

    res.render('transactions', {
        title: 'Transactions',
        txns: txns,

    });
});

app.get('/balance', async function (req, res) {
    var amount = {};
    if (req.query.wallet) {
        amount = await getBalance(req.query.wallet);
        console.log(amount);

    }
    res.render('balance', {
        title: 'Balance',
        amount: amount.balances
    })
});

app.get('/transfer', function (req, res) {
    res.render('transfer', {
        title: 'Transfer'
    })
});

app.post('/transfer', async function (req, res) {
    // {
    //     sourcePublicKey: 'GB3EE4ED3EK732ZZEFMAPWFE4H3KBPUXFHXYXE6ZA3VLAEIOCC4BMSZW',
    //     sourceSecret: 'GB3EE4ED3EK732ZZEFMAPWFE4H3KBPUXFHXYXE6ZA3VLAEIOCC4BMSZW',
    //     destinationPublicKey: 'GB3EE4ED3EK732ZZEFMAPWFE4H3KBPUXFHXYXE6ZA3VLAEIOCC4BMSZWGB3EE4ED3EK732ZZEFMAPWFE4H3KBPUXFHXYXE6ZA3VLAEIOCC4BMSZW',
    //     amount: '15'
    // }
    // horizon.loadAccount(req.body.sourcePublicKey).then(function(sourcePublicKey){
    //     var transaction = new stellarSdk.TransactionBuilder(sourcePublicKey)
    //         .addOperation(stellarSdk.Operation.payment({
    //             destination: req.body.destinationPublicKey,
    //             asset: stellarSdk.Asset.native(),
    //             amount: `${req.body.amount}`
    //         }))
    //         .build();

    //     transaction.sign(req.body.sourceSecret);
    //     return horizon.submitTransaction(transaction);
    // })
    // .then(function(transactionResult){
    //     console.log(transactionResult);
    // })
    // .catch(function(err) {
    //     console.error(err);

    // })
    console.log(req.body);
    
    var result = await horizon.loadAccount(req.body.sourcePublicKey).then(function(sourceAccount) {
        var transaction = new stellarSdk.TransactionBuilder(sourceAccount)
            .addOperation(stellarSdk.Operation.payment({
                destination: req.body.destinationPublicKey,
                asset: stellarSdk.Asset.native(),
                amount: req.body.amount
            }))
            .build();

        transaction.sign(req.body.sourceSecret);
        return horizon.submitTransaction(transaction);
    }).catch(error=>error);
    console.log(result);
    

    res.render('transfer', {
        title: 'Transfer'
        // error: error
    })
});

async function accountCheck(wallet) {
    return await horizon.loadAccount(wallet).catch(error => error);
}
async function getBalance(wallet) {
    return await horizon.loadAccount(wallet);
}

// app.post('/', function (req, res) {
//     let city = req.body.city_name;
//     let apiKey = '20bca7e4aa841592bfffabc74e0d08bf';
//     let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

//     request(url, function(err, response, body) {
//         if (err) {
//             res.render('index', {
//                 weather: null,
//                 error: 'Error, please try again'
//             });
//         } else {
//             let weather = JSON.parse(body);
//             if (weather.main == undefined) {
//                 res.render('index', {
//                     weather: null,
//                     error: 'Invalid input, please try again'
//                 });
//             } else {
//                 let weatherText = `It's ${weather.main.temp}˚ Degrees in ${weather.name}`;

//                 res.render('index', {weather: weatherText, error: null});
//             }
//         }
//     });    
// });

app.listen(3000, function () {
    console.log('Example app listening on port 3000');
});