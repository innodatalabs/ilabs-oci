const httpSignature = require('http-signature');
const jsSHA = require('jssha');


class Signer {
    constructor(keyId, privateKey) {
        this.keyId = keyId;
        this.privateKey = privateKey;
    }

    sign(request, body) {
        signRequest(this.privateKey, this.keyId, request, body);
    }
}

function signRequest(key, keyId, request, body) {
    var headersToSign = ["host", "date", "(request-target)"];

    // methodsThatRequireExtraHeaders ["POST", "PUT"];
    if (["POST", "PUT"].indexOf(request.method.toUpperCase()) !== -1) {
        body = body || "";
        request.setHeader("content-length", body.length);
        headersToSign = headersToSign.concat(["content-type", "content-length"]);

        if (request.getHeader('content-type') != 'application/x-www-form-urlencoded') {
            var shaObj = new jsSHA("SHA-256", "TEXT");
            shaObj.update(body);
            request.setHeader("x-content-sha256", shaObj.getHash('B64'));
            headersToSign = headersToSign.concat(["x-content-sha256"]);
        }
    }

    httpSignature.sign(request, {
        key, keyId,
        headers: headersToSign
    });

    var newAuthHeaderValue = request.getHeader("Authorization").replace("Signature ", "Signature version=\"1\",");
    request.setHeader("Authorization", newAuthHeaderValue);
};


function buildHeaders(possibleHeaders, options, bString) {
    var headers = {};
    headers['content-type'] = bString ? 'application/x-www-form-urlencoded' : 'application/json';
    headers['user-agent'] = 'Mozilla/5.0';
    for (var i = 0; i < possibleHeaders.length; i++)
        if (possibleHeaders[i].toLowerCase() in options)
            headers[possibleHeaders[i].toLowerCase()] = options[possibleHeaders[i]];
    return headers;
};


function buildQueryString(possibleQuery, options) {
    var query = '';
    for (var i = 0; i < possibleQuery.length; i++)
        if (possibleQuery[i] in options)
            query += (query == '' ? '?' : '&') + possibleQuery[i] + '=' + encodeURIComponent(options[possibleQuery[i]]);
    return query;
};


module.exports = { Signer, buildHeaders, buildQueryString };
