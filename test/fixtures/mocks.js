'use strict';

const nock = require('nock');
const _ = require('lodash');

const BASE_URL = 'https://api.put.io/v2/';

const putioApi = nock(BASE_URL);

const mockFile = {
    fileList: function (statusCode, body) {
        putioApi.get('/files/list')
            .reply(statusCode, body);
    }
};

module.exports = {
    mockFile: mockFile
};