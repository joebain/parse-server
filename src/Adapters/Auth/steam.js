/**
 * Parse Server authentication adapter for Steam.
 *
 * @class SteamAdapter
 * @param {Object} options - The adapter configuration options.
 *
 * @description
 * ## Parse Server Configuration
 * To configure Parse Server for Steam authentication, use the following structure:
 * ```json
 * {
 *   "auth": {
 *     "steam": {
 *       "appId": "your-app-id",
 *       "webApiKey": "your-web-api-key"
 *     }
 *   }
 * }
 * ```
 *
 * The adapter requires the following `authData` fields:
 *
 * ## Auth Payloads
 * ```json
 * {
 *   "steam": {
 *     "??": "??"
 *   }
 * }
 * ```
 *
 * @see {@link https://partner.steamgames.com/doc/api/ISteamUser#GetAuthTicketForWebApi Steam Web API docs}
 */

var Parse = require('parse/node').Parse;
const https = require('https');
const querystring = require('querystring');


// Returns a promise that fulfills iff this application ticket is valid
function validateAuthData(authData, authOptions) {
    if ("auth_ticket" in authData) {
        //console.log("Authenticate steam user using web api and auth ticket");
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
            //console.log("Steam web auth sucess");
            resolve();
        });

        request.on('error', (error) => {
            //console.log(error.message);
            reject('The Steam web api could not authenticate the user with the given auth ticket');
        });

        request.end();
    });
}

module.exports = {
  validateAppId,
  validateAuthData
};