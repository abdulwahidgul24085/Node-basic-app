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
    let result = null;
    let error = null;

    await horizon.loadAccount(req.body.destinationPublicKey).catch(stellarSdk.NotFoundError, (err) => {
            error = 'The destination account does not exist';
        })
        .then(() => {
            return horizon.loadAccount(req.body.sourcePublicKey);
        })
        .then((sourceAccount) => {

            transaction = new stellarSdk.TransactionBuilder(sourceAccount)
                .addOperation(stellarSdk.Operation.payment({
                    destination: req.body.destinationPublicKey,
                    asset: stellarSdk.Asset.native(),
                    amount: req.body.amount
                }))
                .build();

            transaction.sign(stellarSdk.Keypair.fromSecret(req.body.sourceSecret));

            return horizon.submitTransaction(transaction);
        })
        .then((res) => {
            result = res;            
        })
        .catch((err) => {            
            error = err;
        })

    res.render('transfer', {
        title: 'Transfer',
        error: error,
        result: result
        
    })
});

app.get('/assets', function(req, res) {
    res.render('assets', {
        title: 'Create Assets'
    })
});

app.post('/assets', async function(req, res) {
    var error = null;
    // console.log(req.body);
    
    await horizon.loadAccount(req.body.receiverPublicKey)
        .then(async function (dist) {
            var newAsset = new stellarSdk.Asset(req.body.assetName, req.body.issuerPublicKey);
            var transaction = new stellarSdk.TransactionBuilder(dist)
                .addOperation(stellarSdk.Operation.changeTrust({
                    asset: newAsset,
                    limit: req.body.limit
                }))
                .build();

            transaction.sign(stellarSdk.Keypair.fromSecret(req.body.receiverSceret));
            return horizon.submitTransaction(transaction);
        })
        .then(function () {
            return horizon.loadAccount(req.body.issuerPublicKey);
        })
        .then(function (issue) {
            var newAsset = new stellarSdk.Asset(req.body.assetName, req.body.issuerPublicKey);
            
            var transaction = new stellarSdk.TransactionBuilder(issue)
                .addOperation(stellarSdk.Operation.payment({
                    destination: req.body.receiverPublicKey,
                    asset: newAsset,
                    amount: req.body.amount
                }))
                .build();
            
            transaction.sign(stellarSdk.Keypair.fromSecret(req.body.issuerSecret));
            // return horizon.submitTransaction(transaction);
            horizon.submitTransaction(transaction).then(function(result){
                console.log(result);
                
            }).catch(function(err){
                console.log(err);
            })
        })
        .catch(function (err) {
            error = err.message;
            // console.error(err);

        })
    
    res.render('assets', {
        title: 'Create Assets',
        error: error
    })
});

async function getBalance(wallet) {
    return await horizon.loadAccount(wallet);
}

app.listen(3000, function () {
    console.log('Example app listening on port 3000');
});

