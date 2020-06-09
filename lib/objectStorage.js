const ocirest = require('./ocirest.js');
const endpoint = require('./endpoints.js');
const { loadConfig } = require('./config.js');
const { buildHeaders } = require('./signer.js');


class Client {
    constructor({ config, signer }) {
        this.config = config;
        this.signer = signer;
    }

    createPreauthenticatedRequest({
        url,     // oci://{namespace}:{bucket}/{objectName}
        accessType = 'ObjectRead',  // ObjectRead, ObjectWrite, etc
        name = 'test-PAR',  // name of this PAR (useful for reviewing and listing active PARs)
        validSeconds = 300,  // the default validity of this PAR will be 5 minutes
    }) {
        const { config, signer } = this;
        return createPreauthenticatedRequest( {config, signer, url, accessType, name, validSeconds} );
    }
}

function createPreauthenticatedRequest({
    config,  // Authentication config: user, tenancy, region, privateKey
    signer,  // how to sign REST headers
    url,     // oci://{namespace}:{bucket}/{objectName}
    accessType = 'ObjectRead',  // ObjectRead, ObjectWrite, etc
    name = 'test-PAR',  // name of this PAR (useful for reviewing and listing active PARs)
    validSeconds = 300,  // the default validity of this PAR will be 5 minutes
}) {
    if (config === undefined || signer == undefined || url == undefined) {
        throw new Error('config, signer, and url parameters are required');
    }
    const parsed = /oci:\/\/(.+?):(.+?)(\/.+)?$/.exec(url);
    if (parsed === null) {
        throw new Error('Wrong Oracle Storage URL. Expect "oci://{namespace}:{bucket}" or "oci://{namespace}:{bucket}/{name}". Got: ' + ociUrl);
    }
    const [_, namespace, bucket, objectName] = parsed;
    const headers = buildHeaders([], {});  // FIXME: do we need some optional headers here?

    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + validSeconds);

    const body = {
        accessType,
        name,
        timeExpires: formatDateString(expiration),
    };

    if (objectName !== undefined) {
        body.objectName = objectName.slice(1);  // drop the leading slash
    }

    const host = endpoint.service.objectStore[config.region];
    if (host === undefined) {
        throw new Error('Invalid region (endpoint for this region not found): ' + config.region);
    }

    return new Promise((resolve, reject) => {
        ocirest.process(signer, {
            path: '/n/' + encodeURIComponent(namespace) +
                '/b/' + encodeURIComponent(bucket) +
                '/p/',
            host,
            method: 'POST',
            headers,
            body,
        },
        (err, status, contentType, body) => {
            if (err !== null) {
                reject(err);
            } else if (status !== 200) {
                console.error(status, body)
                reject(new Error({ status, contentType, body }));
            } else {
                resolve('https://' + host + body.accessUri);
            }
        });
    });
}


function formatDateString(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const min = date.getUTCMinutes();
    const sec = date.getUTCSeconds();

    return (
        formatNumber(year, 4) + '-' + formatNumber(month, 2) + '-' + formatNumber(day, 2) + 'T' +
        formatNumber(hours, 2) + ':' + formatNumber(min, 2) + ':' + formatNumber(sec, 2) + 'Z'
    );
}

function formatNumber(n, digits) {
    let out = '' + n;
    digits -= out.length;
    while (digits > 0) {
        digits -= 1;
        out = '0' + out;
    }
    return out;
}

module.exports = {
    Client,
};
