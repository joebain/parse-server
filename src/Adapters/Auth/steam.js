var Parse = require('parse/node').Parse;
const AppTicket = require('steam-appticket');
const https = require('https');
const querystring = require('querystring');

// todo move these to a config file.
const decryptionKey = '3e3e2a3cbd54dc6c7cb5e51520dfa819dd7f9c12d062d54a1f8c14ddd231377f';
const appId = '3414340';
const steam_auth_url = "https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1/"
const steam_web_api_key = "DDFA57075562113469DC8057F2C7462D";
const server_id = "kami2server";

// Returns a promise that fulfills iff this application ticket is valid
function validateAuthData(authData) {
    // using an encrypted app ticket to authenticate
    if ("app_ticket" in authData) {
        console.log("Authenticate steam user using encrypted app ticket");
        var encrypted_ticket = Buffer.from(authData.app_ticket, 'hex');
        var ticket = AppTicket.parseEncryptedAppTicket(encrypted_ticket, decryptionKey)
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
        if (appId !== ticket.appID && demoAppId != ticket.appID) {
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
        //var web_api_ticket = Buffer.from(authData.auth_ticket, 'hex');
        return callSteamWebApi(authData.auth_ticket);
    }
    
}

// steam auth bundles the app id in the auth data so don't validate seperately
function validateAppId() {
  return Promise.resolve();
}

function callSteamWebApi(auth_ticket) {
    
    return new Promise(function(resolve, reject) {
        // GET parameters
        const parameters = {
            key: steam_web_api_key,
            appid: appId,
            ticket: auth_ticket,
            identity: server_id
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
            // throw new Parse.Error(
            //     Parse.Error.OBJECT_NOT_FOUND,
            //     'The Steam web api could not authenticate the user with the given auth ticket'
            // );
            reject('The Steam web api could not authenticate the user with the given auth ticket');
        });

        request.end();
    });
}

module.exports = {
  validateAppId,
  validateAuthData
};