var stellarSdk = require('stellar-sdk');

var NETWORK_PASSPHRASE = "Brightcoin ; October 2018";
var HORIZON_ENDPOINT = "http://localhost:8000/";

stellarSdk.Network.use(new stellarSdk.Network(NETWORK_PASSPHRASE));

var opts = new stellarSdk.Config.setAllowHttp(true);
var horizon = new stellarSdk.Server(HORIZON_ENDPOINT, opts);

var sourceAccount = stellarSdk.Keypair.fromSecret("SCJWWJ3U2QNE2GEA7G3AJQUHLYD26MSWE4DLWMILX7L4XBAZYOJ6UFKL")

function create_wallet() {
    var pair = stellarSdk.Keypair.random();
    console.log("publickey:", pair.publicKey());
    console.log("secret:", pair.secret());

    horizon.loadAccount(sourceAccount.publicKey())
    .then(function (account) {
        var transaction = new stellarSdk.TransactionBuilder(account)
                                .addOperation(stellarSdk.Operation.createAccount({
                                    destination : pair.publicKey(),
                                    startingBalance: "1000"
                                }))
                                .build();
                                transaction.sign(sourceAccount);
                                return horizon.submitTransaction(transaction);
    })
    .then(function(result) {
        console.log('Success! Results:',result);
    })
    .catch(function(err) {
        console.log(err)
    })
}

create_wallet()
// horizon.loadAccount("GCEAFIFLZZR4O2R2CB72ZOFWBXSO3U2EZ56GW6GZ7BEW6VDVWNNK4RXG")
// .then(function (account) {
//     console.log(account);
// })
// .catch(function(err) {
//     console.log(err)
// })