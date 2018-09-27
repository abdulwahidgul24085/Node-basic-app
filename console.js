const request = require('request');
var stellarSdk = require('stellar-sdk');
var horizon = new stellarSdk.Server('https://horizon-testnet.stellar.org');
stellarSdk.Network.useTestNetwork();


let newAsset = process.argv[2];
let distSecret = process.argv[3];
let issuerSceret = process.argv[4];
let limit = process.argv[5];
let amount = process.argv[6];


var distributor = stellarSdk.Keypair.fromSecret(distSecret);
var issuer = stellarSdk.Keypair.fromSecret(issuerSceret);

horizon.loadAccount(distributor.publicKey())
    .then(function(dist){
        var Asset = new stellarSdk.Asset(newAsset, issuer.publicKey());  
        console.log(Asset);
              
        var transaction = new stellarSdk.TransactionBuilder(dist)
            .addOperation(stellarSdk.Operation.changeTrust({
                asset: Asset,
                limit: limit
            }))
            .build();
        
        transaction.sign(distributor);
        return horizon.submitTransaction(transaction);
        // horizon.submitTransaction(transaction).then(function(result) {
        //     console.log('Change Trust Sucessful');
        //     // console.log(result);
        // }).catch(function(error) {
        //     console.log('Change trust Failed!');
        //     console.log(error);
            
        // })
    })
    // .then(function(){
    //     return horizon.loadAccount(issuer.publicKey())
    // })
    // .then(function(issue) {
    //     var Asset = new stellarSdk.Asset(newAsset, issuer.publicKey());
    //     var transaction = new stellarSdk.TransactionBuilder(issue)
    //         .addOperation(stellarSdk.Operation.payment({
    //             destination: distributor.publicKey(),
    //             asset: Asset,
    //             amount: '10000000'
    //         }))
    //         .build();

    //         transaction.sign(issuer);
    //         horizon.submitTransaction(transaction).then(function(results){
    //             console.log('Asset Distribution Sucessful');
    //             // console.log(results);
    //         }).catch(function(err){
    //             console.log('Asset Distribution Failer');
    //             // console.log(err);
                
                
    //         })
    // })
    // .then(function () {
    //     horizon.loadAccount(distributor.publicKey())
    //         .then(function (dist) {
    //             // console.log(dist.balances);

    //         })
    // })
    .catch(function(error){
        console.error(error);
    })