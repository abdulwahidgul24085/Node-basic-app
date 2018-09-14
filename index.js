var http = require('http');
var url = require('url');
var querystring = require('querystring');

var server = http.createServer(function (req, res) {
    var page = url.parse(req.url).pathname;
    var params = querystring.parse(url.parse(req.url).query);

    console.log(page);

    res.writeHead(200, {'Content-Type':'text/plain'});
    // switch (page) {
    //     case '/':
    //         res.write('You are on the homepage');
    //         if('firstname' in params){
    //             res.write(params['firstname']);
    //         }
    //         break;
    //     case 'bio':
    //     res.write('This is the BIO page');
    //     default:
    //     // res.writeHead(404, {'Content-Type': 'text/plain'});
    //     // res.write('Page Not Found')
    //         break;
    // }
    // res.write('Hello URL world in Node');
    if('firstname' in params){
        res.write('your Firstname is:' + params['firstname']);
    }
    else{
        res.write('No firstname, is that so?')
    }
    res.end()
});
// var instructionNewVistor = function (req, res) {
//     res.writeHead(200, { "Content-Type": "text/html" });
//     res.end('<h1>Hello <i>NODE</i> world!</h1>');
// }

// var server = http.createServer(instructionNewVistor);

server.listen(8080);

