const https = require('https');
const fs = require('fs');
const { loadConfig } = require('./config.js');


function process(signer, options, callback) {

    // process request body
    var body;
    if (options.headers['content-type'] == 'application/x-www-form-urlencoded')
        body = options.body;
    else
        body = JSON.stringify(options.body);
    delete options.body;

    // begin https request
    var request = https.request(options, handleResponse( callback ));

    // sign the headers
    signer.sign(request, body);

    // send the body and close the request
    request.write(body === undefined ? '' : body);
    request.end();
}

// generates a function to handle the https.request response object
function handleResponse(callback) {
    return function (response) {
        var contentType = response.headers['content-type'];
        var JSONBody = '';
        var buffer = [];

        response.on('data', function (chunk) {
            if (contentType == 'application/json')
                JSONBody += chunk;
            if (contentType == 'application/x-www-form-urlencoded')
                buffer.push(Buffer.from(chunk, 'binary'));
            if (contentType == 'application/octet-stream')
                buffer.push(chunk);
        });

        response.on('end', function () {
            if (contentType == 'application/x-www-form-urlencoded' ||
                contentType == 'application/octet-stream') {
                var binary = Buffer.concat(buffer);
                callback(null, response.statusCode, contentType, binary);
            } else if (contentType == 'application/json' && JSONBody != '') {
                callback(null, response.statusCode, contentType, JSON.parse(JSONBody));
            } else {
                callback(new Error(contentType));
            }
        });
    }
};

module.exports = { process };
