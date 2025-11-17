var Parse = require('parse/node').Parse;
const { URL } = require('url');
var jwt = require('jsonwebtoken');
var jwksClient = require('jwks-rsa');

// Returns a promise that fulfills iff this nsa id token is valid
function validateAuthData(authData, authOptions) {
    //console.log("going to validate for nintendo");
    //console.log(authData);
    if ("token" in authData) {
        try {
            var token = authData["token"];
            var decoded = jwt.decode(token, {complete: true});
            var header = decoded.header;

            // console.log("got nsa id token, header is:");
            // console.log(header);
            // console.log("full decoded token is:");
            // console.log(decoded);

            if (!('alg' in header) || header['alg'] != "RS256") {
                error("No algorithm specified or it didn't match expected value 'RS256'");
            }

            if (!('kid' in header) || !('jku' in header)) {
                error("Either 'kid' or 'jku' value not present in token.");
            }
            var jwk_name = header['kid'];
            var jku = header['jku'];

            if (!isValidJKU(jku)) {
                error("JKU url in token isn't valid");
            }
            
            return new Promise(function(resolve, reject) {
                var client = jwksClient({
                    jwksUri: jku
                });
                function getKey(header, callback) {
                    client.getSigningKey(header.kid, function (err, key) {
                        var signingKey = key.publicKey || key.rsaPublicKey;
                        callback(null, signingKey);
                    });
                }
                var options = {};
                jwt.verify(token, getKey, options, function(err, decoded) {
                    // console.log("verfied jwt, decoded value is:");
                    // console.log(decoded);
                    if (err != null) {
                        reject("Error verifying jwt: " + err.message);
                        return;
                    }
                    if (!new URL(decoded.iss).hostname.endsWith("nintendo.com")) {
                        reject("iss claim in token is not a nintendo server");
                        return;
                    }
                    var now = Math.floor(Date.now() / 1000);
                    if (Number.parseInt(decoded.iat) > (now + 10000)) {
                        reject("iat value is not in the past");
                        return;
                    }
                    if (Number.parseInt(decoded.exp) < (now - 10000)) {
                        reject("exp value is not in the future");
                        return;
                    }
                    if (decoded.nintendo.ai != authOptions.serverId) {
                        reject("application id does not match our id");
                        return;
                    }
                    resolve(decoded);
                });
            });

        } catch (e) {
            error('Error authenticating NSA id token: ' + e);
        }
    }
    else {
       error('No token found in the request');
    }
}

// steam auth bundles the app id in the auth data so don't validate seperately
function validateAppId() {
  return Promise.resolve();
}

function isValidJKU(jku) {
    // todo - validate this properly?
    return new URL(jku).hostname.endsWith("nintendo.com");
}

function error(message) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, message);
}
module.exports = {
  validateAppId,
  validateAuthData
};