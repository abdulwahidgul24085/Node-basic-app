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
            let amount = await getBalance(wallet.publicKey());

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
    let error = null;
    // let distributor = stellarSdk.Keypair.fromSecret(req.body.receiverSceret);
    // let issuer = stellarSdk.Keypair.fromSecret(req.body.issuerSecret);
    // let limit = req.body.limit;
    // let amount = req.body.amount;
    // let assetName = req.body.assetName;
    // let newAssets = new stellarSdk.Asset(assetName, issuer.publicKey());
    let distributor = stellarSdk.Keypair.fromSecret('SBSN5GRJERHJBWJFETRZXQL6HEG2RMOQOJ7M77BFFIGSVJJ24PE5OY2G');
    let issuer = stellarSdk.Keypair.fromSecret('SCADDLLPJHHFXWUMQLNBB7WHDJQMFJKOZ2N2JM6H4CK3255PTNL4G7AB');
    // let limit = '10000000.0000000';
    // let amount = '10000000.0000000';
    // let assetName = 'AWG';
    let newAssets = new stellarSdk.Asset('AWG', issuer.publicKey());
    
    await horizon.loadAccount(issuer.publicKey())
        .then(function (issue) {
            console.log(newAssets);
            let transaction = new stellarSdk.TransactionBuilder(issue)
                .addOperation(stellarSdk.Operation.payment({
                    destination: distributor.publicKey(),
                    asset: newAssets,
                    amount: '10000000'
                })).build();
            transaction.sign(issuer);
            return horizon.submitTransaction(transaction)
                .then(function (res) {
                    console.log('Successful Payment of new assets');
                })
                .catch(function (err) {
                    console.error('Failed  Payment of new assets');
                    error = err.message;
                    console.error(error);
                })
        })
        .catch(function (err) {
            console.error(err);
        })

    // await horizon.loadAccount(distributor.publicKey())
    //     .then(function (dist) {
    //         // let newAssets = new stellarSdk.Asset(assetName, issuer.publicKey())
            
    //         let transaction = new stellarSdk.TransactionBuilder(dist)
    //             .addOperation(stellarSdk.Operation.changeTrust({
    //                 asset: newAssets,
    //                 limit: limit
    //             })).build();

    //         transaction.sign(distributor);
    //         return horizon.submitTransaction(transaction)
    //         .then(function (res) {
    //             console.log('Successful Trust Changed of new assets');
    //             // console.log(res);
    //         }).catch(function (err) {
    //             console.error('Failed  Trust Changed of new assets');
    //             error = err.message;
    //         })

    //     })
    //     .then(function () {
    //         return horizon.loadAccount(issuer.publicKey())
    //     })
    //     .then(function (issue) {
    //         // let newAssets = new stellarSdk.Asset(assetName, issuer.publicKey())

    //         let transaction = new stellarSdk.TransactionBuilder(issue)
    //             .addOperation(stellarSdk.Operation.payment({
    //                 destination: distributor.publicKey(),
    //                 asset: newAssets,
    //                 amount: amount
    //             })).build();

    //         transaction.sign(issuer);
    //         return horizon.submitTransaction(transaction)
    //             .then(function (res) {
    //                 console.log('Successful Payment of new assets');
    //             })
    //             .catch(function (err) {
    //                 console.error('Failed  Payment of new assets');
    //                 error = err.message;
    //                 console.error(error);
    //             });
    //     })
        // await horizon.loadAccount(issuer.publicKey())
        // .then(function(issue){
        //     let transaction = new stellarSdk.TransactionBuilder(issue)
        //         .addOperation(stellarSdk.Operation.payment({
        //             destination: distributor.publicKey(),
        //             asset: newAssets,
        //             amount: amount
        //         })).build();
        //         transaction.sign(issuer);
        //         return horizon.submitTransaction(transaction)
        //         .then(function(res) {
        //             console.log('Successful Payment of new assets');
        //         })
        //         .catch(function (err) {  
        //             console.error('Failed  Payment of new assets');
        //             error = err.message;
        //             console.error(error);
        //         })
        // })
        // .catch(function (err) {
        //     console.error(err);
        // })

    res.render('assets', {
        title: 'Create Assets',
        error: error,
        wallet_address: req.body.receiverPublicKey
    })
});

async function getBalance(wallet) {
    return await horizon.loadAccount(wallet);
}

app.listen(3000, function () {
    console.log('Example app listening on port 3000');
});

