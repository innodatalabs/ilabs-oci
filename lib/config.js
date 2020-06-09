const fs = require('fs').promises;
const { Signer } = require('./signer.js');

/**
 * Loads configuration
 */
async function loadConfig({ fileName, profile='DEFAULT' } = {}) {
    if (fileName === undefined) {
        const homedir = require('os').homedir();
        fileName = `${homedir}/.oci/config`;
    }

    const config = (await parseConfig(fileName))[profile];
    if (config === undefined) {
        throw new Error('Profile "' + profile + '" not found in config ' + fileName);
    }

    let keyId;
    if (config.user !== undefined) {
        keyId = config.tenancy + "/" + config.user + "/" + config.fingerprint;
    } else if (config.security_token_file !== undefined) {
        const token = fs.readFileSync(config.security_token_file, { encoding: 'utf-8' });
        keyId = 'ST$' + token;
    } else {
        throw new Error('Config format not understood. Please use "oci session authenticate" or "oci setup config" to create a valid config.')
    }

    const privateKey = await fs.readFile(config.key_file, { encoding: 'utf-8' });
    const signer = new Signer(keyId, privateKey);

    return { config, signer };
}

async function parseConfig(fileName) {
    const lines = await fs.readFile(fileName, { encoding: 'utf-8' });
    const config = {};

    let profile;

    for (let line of lines.split('\n')) {
        line = line.trim();
        if (line === '') continue;
        if (line.startsWith('#')) continue;
        if (line.startsWith('[') && line.endsWith(']')) {
            const profileName = line.slice(1, line.length-1);
            profile = {};
            config[profileName] = profile;
        } else {
            const [key, val] = line.split('=');
            profile[key] = val;
        }
    }

    return config;
}

module.exports = { loadConfig };