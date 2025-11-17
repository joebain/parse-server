var Parse = require('parse/node').Parse;
const AppTicket = require('steam-appticket');
const https = require('https');
const querystring = require('querystring');


// Returns a promise that fulfills iff this application ticket is valid
function validateAuthData(authData, authOptions) {
    // using an encrypted app ticket to authenticate
    if ("app_ticket" in authData) {
        console.log("Authenticate steam user using encrypted app ticket");
        var encrypted_ticket = Buffer.from(authData.app_ticket, 'hex');
        var ticket = AppTicket.parseEncryptedAppTicket(encrypted_ticket, authOptions.decryptionKey)
        if (ticket === null) {
            throw new Parse.Error(
                Parse.Error.OBJECT_NOT_FOUND,
                'Steam auth is invalid for this user.');
        }
        var user_id = authData.id;
        if (user_id != ticket.steamID.accountid) {
            throw new Parse.Error(
                Parse.Error.OBJECT_NOT_FOUND,
                'The provided application ticket does not match the given user id'
            );
        }
        if (authOptions.appId !== ticket.appID && authOptions.demoAppId != ticket.appID) {
            throw new Parse.Error(
                Parse.Error.OBJECT_NOT_FOUND,
                'The provided application ticket does not match the Kami 2 or Kami 2 Demo application ids'
            );
        }
        return Promise.resolve();
    }
    // using the web api to authenticate
    else if ("auth_ticket" in authData) {
        console.log("Authenticate steam user using web api and auth ticket");
        return callSteamWebApi(authData.auth_ticket, authOptions);
    }
    
}

// steam auth bundles the app id in the auth data so don't validate seperately
function validateAppId() {
  return Promise.resolve();
}

function callSteamWebApi(auth_ticket, authOptions) {
    
    return new Promise(function(resolve, reject) {
        // GET parameters
        const parameters = {
            key: authOptions.webApiKey,
            appid: authOptions.appId, // could try the demo id too, but we know that doesn't allow online play so don't worry for now
            ticket: auth_ticket,
            identity: authOptions.serverId
        }

        const get_request_args = querystring.stringify(parameters);

        const options = {
            host: "partner.steam-api.com",
            path: "/ISteamUserAuth/AuthenticateUserTicket/v1/?" + get_request_args,
            headers : {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    
        var request = https.request(options, (response) => {
            console.log("Steam web auth sucess");
            resolve();
        });

        request.on('error', (error) => {
            console.log(error.message);
            reject('The Steam web api could not authenticate the user with the given auth ticket');
        });

        request.end();
    });
}

module.exports = {
  validateAppId,
  validateAuthData
};