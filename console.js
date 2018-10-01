const request = require('request');
var stellarSdk = require('stellar-sdk');
var horizon = new stellarSdk.Server('https://horizon-testnet.stellar.org');
stellarSdk.Network.useTestNetwork();


setInterval(async function(){
    let mainWalletPublicKey = 'GDMPOXVV2S6X6WBPMXXAW547X43FI76LCTCF7VH6PA4XBI7WR4TXNEF3';
    let mainWalletSecret = 'SBEMISHQTA2H7V5H5XICGIY2RY2OYYBW6724TMUGSA64VLJNNQ5BYXKG';

    let wallets = {
        "mainWalletPublicKey": 'GDMPOXVV2S6X6WBPMXXAW547X43FI76LCTCF7VH6PA4XBI7WR4TXNEF3',
        "mainWalletSecret": 'SBEMISHQTA2H7V5H5XICGIY2RY2OYYBW6724TMUGSA64VLJNNQ5BYXKG',
        "wallet1PublcKey": 'GAVFXF4ENHXAVGDMPOXXXJXTBKRK2KECGRJHHOYRXFF5E4F6QGN5IXRK',
        "wallet2PublicKey": 'GDWWAUCMH3XJTURJYOLSFRLDBVLFCJMW6VPWXBQS3FWWLTOT7VDEM4TF'
    }
    
    wallet1 = await horizon.loadAccount(wallets.wallet1PublcKey);
    if (wallet1.balances[0].balance > 30000){
        console.log('yes reward');
         await horizon.loadAccount(wallets.mainWalletPublicKey)
             .then(function (buy) {
                 // let newAssets = new stellarSdk.Asset(assetName, issuer.publicKey())

                 let transaction = new stellarSdk.TransactionBuilder(buy)
                     .addOperation(stellarSdk.Operation.payment({
                        destination: req.body.destinationPublicKey,
                        asset: stellarSdk.Asset.native(),
                        amount: wallet1.balances[0].balance * 0.01
                     })).build();

                 //transaction.sign(buyer);
                 transaction.sign(stellarSdk.Keypair.fromSecret(wallets.mainWalletSecret));
                 return horizon.submitTransaction(transaction).then(function (res) {
                     console.log(res);
                 }).catch(function (err) {
                     console.log('payment failed')
                     console.log(err)
                 })
             })
    }
    else{
        console.log('no reward')
    }

    wallet2 = await horizon.loadAccount(wallets.wallet2PublcKey);
    if (wallet2.balances[0].balance > 30000) {
        console.log('yes reward');
        await horizon.loadAccount(wallets.mainWalletPublicKey)
            .then(function (buy) {
                // let newAssets = new stellarSdk.Asset(assetName, issuer.publicKey())

                let transaction = new stellarSdk.TransactionBuilder(buy)
                    .addOperation(stellarSdk.Operation.payment({
                        destination: req.body.destinationPublicKey,
                        asset: stellarSdk.Asset.native(),
                        amount: wallet2.balances[0].balance * 0.01
                    })).build();

                //transaction.sign(buyer);
                transaction.sign(stellarSdk.Keypair.fromSecret(wallets.mainWalletSecret));
                return horizon.submitTransaction(transaction).then(function (res) {
                    console.log(res);
                }).catch(function (err) {
                    console.log('payment failed')
                    console.log(err)
                })
            })
    } else {
        console.log('no reward')
    }
},60*50);