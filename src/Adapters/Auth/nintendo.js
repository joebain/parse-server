var Parse = require('parse/node').Parse;
const https = require('https');
var jwt = require('jsonwebtoken');
var jwksClient = require('jwks-rsa');

// todo move these to a config file.
const decryptionKey = '3e3e2a3cbd54dc6c7cb5e51520dfa819dd7f9c12d062d54a1f8c14ddd231377f';
const appId = '3414340';
const steam_auth_url = "https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1/"
const steam_web_api_key = "DDFA57075562113469DC8057F2C7462D";
const server_id = "kami2server";

// Returns a promise that fulfills iff this nsa id token is valid
function validateAuthData(authData) {
    
    if ("token" in authData) {
        try {
            var token = authData["token"];
            var decoded = jwt.decode(token, {complete: true});
            var header = decoded.header;

            console.log("got nsa id token, header is:");
            console.log(header);
            console.log("full decoded token is:");
            console.log(decoded);

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
            
            // client.getSigningKey(header.kid, function(err, key) {
            //     var signingKey = key.publicKey || key.rsaPublicKey;
            //     callback(null, signingKey);
            // });
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

                jwt.verify(token, getKey, options, function(err, decoded) {
                    console.log("verfied jwt, decoded value is:");
                    console.log(decoded);
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
                    if (decoded.nintendo.ai != server_id) {
                        reject("application id does not match our id");
                        return;
                    }
                    resolve(decoded);
                });
            });

            //return getJWK(jku, jwk_name);

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

function getJWK(jku, jwk_name) {
    
    return new Promise(function(resolve, reject) {
        var request = https.get(jku, (response) => {
            console.log("Got jwk");
            response.on('data', (d) => {
                console.log("got jku response from nintendo");
                console.log(data);
                jwt.verify(token, )
                resolve();
            });
        });

        request.on('error', (error) => {
            console.log(error.message);
            
            reject("Couldn't fetch a jwk from the nintendo cache");
        });

        request.end();
    });
}

module.exports = {
  validateAppId,
  validateAuthData
};