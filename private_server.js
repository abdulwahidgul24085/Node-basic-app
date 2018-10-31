const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
var stellarSdk = require('stellar-sdk');

var NETWORK_PASSPHRASE = "Brightcoin ; October 2018";
var HORIZON_ENDPOINT = "http://localhost:8000/";

stellarSdk.Network.use(new stellarSdk.Network(NETWORK_PASSPHRASE));

var opts = new stellarSdk.Config.setAllowHttp(true);
var horizon = new stellarSdk.Server(HORIZON_ENDPOINT, opts);


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
    var sourceAccount = stellarSdk.Keypair.fromSecret("SCJWWJ3U2QNE2GEA7G3AJQUHLYD26MSWE4DLWMILX7L4XBAZYOJ6UFKL")
    horizon.loadAccount(sourceAccount.publicKey())
        .then(function (account) {
            var transaction = new stellarSdk.TransactionBuilder(account)
                .addOperation(stellarSdk.Operation.createAccount({
                    destination: wallet.publicKey(),
                    startingBalance: "10000"
                }))
                .build();
            transaction.sign(sourceAccount);
            return horizon.submitTransaction(transaction);
        })
        .then( async function (result) {
            let amount = await getBalance(wallet.publicKey());

            res.render('create_wallet', {
                publicKey: wallet.publicKey(),
                secret: wallet.secret(),
                wallet: true,
                title: 'Wallet',
                error: false,
                tx_xdr: result,
                amount: amount
            });
        })
        .catch(function (err) {
            res.render('create_wallet', {
                publicKey: wallet.publicKey(),
                secret: wallet.secret(),
                wallet: true,
                title: 'Wallet',
                error: true,
                tx_xdr: err
            });
        })
});
app.get('/transactions', async function (req, res) {
    var txns = null;
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

app.get('/ico_transfer', function (req, res) {
    res.render('ico_transfer', {
        title: 'ICO Transfer'
    })
});

app.post('/ico_transfer', async function (req, res) {
    let result = null;
    let error = null;
    let buyer = stellarSdk.Keypair.fromSecret(req.body.buyerSecret);
    console.log(req.body);

    await horizon.loadAccount(buyer.publicKey())
        .then(function (buy) {
            // let newAssets = new stellarSdk.Asset(assetName, issuer.publicKey())

            let transaction = new stellarSdk.TransactionBuilder(buy)
                .addOperation(stellarSdk.Operation.manageOffer({
                    selling: stellarSdk.Asset.native(),
                    buying: new stellarSdk.Asset(req.body.tokenName, req.body.issuerPublicKey),
                    amount: req.body.amount,
                    price: req.body.newAsset,
                    offerId: 0
                })).build();

            //transaction.sign(buyer);
            transaction.sign(stellarSdk.Keypair.fromSecret(req.body.buyerSecret));
            return horizon.submitTransaction(transaction).then(function (res) {
                console.log(res);
                result = res;
            }).catch(function (err) {
                console.log('from manage offer error')
                console.log(err)
            })

        })
        .catch(function (err) {
            console.log(err)
            error = err;
        })
    res.render('ico_transfer', {
        title: 'ICO Transfer',
        error: error,
        result: result
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

app.get('/assets', function (req, res) {
    res.render('assets', {
        title: 'Create Assets'
    })
});

app.post('/assets', async function (req, res) {
    let error = null;
    let success = true;
    let receiver = stellarSdk.Keypair.fromSecret(req.body.receiverSecret);
    let issuer = stellarSdk.Keypair.fromSecret(req.body.issuerSecret);
    let limit = req.body.limit;
    let amount = req.body.amount;
    let assetName = req.body.assetName;
    let newAssets = new stellarSdk.Asset(assetName, issuer.publicKey());

    await horizon.loadAccount(receiver.publicKey())
        .then(function (receive) {
            // let newAssets = new stellarSdk.Asset(assetName, issuer.publicKey())

            let transaction = new stellarSdk.TransactionBuilder(receive)
                .addOperation(stellarSdk.Operation.changeTrust({
                    asset: newAssets,
                    limit: limit
                })).build();

            transaction.sign(receiver);
            return horizon.submitTransaction(transaction)
                .then(function (res) {
                    console.log('Successful Trust Changed of new assets');
                    // console.log(res);
                }).catch(function (err) {
                    console.error('Failed  Trust Changed of new assets');
                    error = err.message;
                })

        })
        .then(function () {
            return horizon.loadAccount(issuer.publicKey())
        })
        .then(function (issue) {
            // let newAssets = new stellarSdk.Asset(assetName, issuer.publicKey())

            let transaction = new stellarSdk.TransactionBuilder(issue)
                .addOperation(stellarSdk.Operation.payment({
                    destination: receiver.publicKey(),
                    asset: newAssets,
                    amount: amount
                })).build();

            transaction.sign(issuer);
            return horizon.submitTransaction(transaction)
                .then(function (res) {
                    console.log('Successful Payment of new assets');
                    success = 'Successful Payment of new assets';
                })
                .catch(function (err) {
                    console.error('Failed  Payment of new assets');
                    error = err.message;
                    console.error(error);
                });
        })
        .catch(function (err) {
            console.error(err);
        });

    res.render("assets", {
        title: "Create Assets",
        error: error,
        wallet_address: receiver.publicKey(),
        success: success
    });
});

async function getBalance(wallet) {
    return await horizon.loadAccount(wallet);
}


app.listen(3000, function () {
    console.log('Example app listening on port 3000');
});