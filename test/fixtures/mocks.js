'use strict';

const nock = require('nock');
const _ = require('lodash');

const BASE_URL = 'https://api.put.io/v2/';

const putioApi = nock(BASE_URL);

const mockFile = {
    getDummy: (statusCode, body) => {
        putioApi.get('/dummy')
            .query(true)
            .reply(statusCode, body);
    },
    postDummy: (statusCode, body) => {
        putioApi.post('/dummy')
            .query(true)
            .reply(statusCode, body);
    },
    list: (statusCode, body, parent_id) => {
        putioApi.get('/files/list/' + (parent_id || 0))
            .query(true)
            .reply(statusCode, body);
    }
};

module.exports = {
    mockFile: mockFile
};