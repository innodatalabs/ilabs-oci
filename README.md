# ilabs-oci

NodeJS utilities to talk to Oracle Cloud.

Inspired by: https://github.com/christopherbeck/OCI-Rest-APIs-nodejs

## Example:

```js
const oci = require('./lib');

(async () => {
    const { config, signer } = await oci.config.loadConfig({profile='DEFAULT'});
    const client = new oci.objectStorage.Client( {config, signer} )
    const result = await client.createPreauthenticatedRequest({ url: 'oci://idtrhslgwwqi:tmp-storage/test.txt' });
    console.log(result);
})();
```

## Walk-thru

There are 3 authentication methods:

1. Authenticate with session token
2. Authenticate with user private API key
3. Implicit authentication with Instance Principal (if code is running on OCI VM)

### Set up authentication with a session token

A. Install `oci-cli`. For example:
   ```
   mkdir ~/tmp
   cd ~/tmp
   python3 -m venv .venv
   . .venv/bin/activate
   pip install oci-cli
   ```
   This installs command-line utility into python virtual environemt.

   For other ways, see https://docs.cloud.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm

B. Login
   ```
   oci session authenticate --region us-ashburn-1
   ```
   This will open a browser prompting you to log into the Oracle Cloud. After successful login, this command
   creates a file `~/.oci/config` containing pointer to the session token.

   This has to be done ONLY ONCE. When token expires, do
   ```
   oci session refresh
   ```

Note that authenticated user has to have proper priveledges configured to use this API/

### Set up authentication with a priviate API key

A. Install `oci-cli`, as above

B. Configure
   ```
   oci setup config  --region us-ashburn-1
   ```
   This will walk you thru the configuration. You will need to supply OCIIDs of user (you), and tenancy. You will
   also need to create and secret key pair for API access.

Note that authenticated user has to have proper priveledges configured to use this API/

### Implicit authentication when running on Oracle Cloud

When code is executed on Oracle Cloud, one can rely on the compute instance principal for authentication.
Note that a a dynamic group has to be created for compute resources, and then proper priveledges granted
to this group.