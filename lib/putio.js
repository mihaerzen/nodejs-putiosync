'use strict';

const _ = require('lodash');
const url = require('url');
const request = require('request');
const co = require('co');

const log = require('../util/log');

const BASE_URL = 'https://api.put.io/v2/';
const ACCESS_TOKEN_URL = 'oauth2/access_token';
const AUTHENTICATION_URL = 'oauth2/authenticate';

function Client(OAUTH_TOKEN) {
    if(!(this instanceof Client)) {
        return new Client(OAUTH_TOKEN);
    }

    if(!OAUTH_TOKEN) {
        throw new Error('No OAUTH_TOKEN supplied');
    }

    this.defaultParams = {
        oauth_token: OAUTH_TOKEN,
        headers: {
            'Accept': 'application/json'
        }
    };
}

Client.genUrl = function(path) {
    path = _.trimLeft(path, '/');
    return url.resolve(BASE_URL, path);
};

Client.prototype = {
    get file() {
        return new File(this);
    }
};

Client.prototype.GET = function(path, params) {
    const reqParams = _.defaults(params, this.defaultParams);
    reqParams.url = Client.genUrl(path);

    const req = request.GET(reqParams);

    req.on('response', function(res) {
        const data = _.pick(res, ['statusCode', 'statusMessage', 'headersSent', 'sendDate']);

        log.debug({type: 'response', data: data});
    }).on('error', function(err) {
        log.error();
    });

    return req;
};

/**
 *
 * @param {Client} client
 * @returns {File}
 * @constructor
 */
function File(client) {
    if(!(client instanceof Client)) {
        throw new Error('Wrong client argument!');
    }

    this.client = client;
}

File.routes = {
    fileList: '/files/list'
};

File.prototype.list = co.wrap(function* (parentId) {
    const result = yield this.client.GET(File.routes.fileList, parentId || 0);
    return result;
});


module.exports = {
    Client: Client
};
