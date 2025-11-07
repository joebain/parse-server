var Parse = require('parse/node').Parse;
const AppTicket = require('steam-appticket');

// todo move these to a config file.
const decryptionKey = '3e3e2a3cbd54dc6c7cb5e51520dfa819dd7f9c12d062d54a1f8c14ddd231377f';
const appId = '3414340';

// Returns a promise that fulfills iff this application ticket is valid
function validateAuthData(authData) {
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

// steam auth bundles the app id in the auth data so don't validate seperately
function validateAppId() {
  return Promise.resolve();
}