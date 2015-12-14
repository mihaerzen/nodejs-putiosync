'use strict';

const expect = require('chai').expect;

const mockAPI = require('./fixtures/mocks');

const Client = require('../lib/putio').Client;


describe('File list', function () {

    beforeEach(function() {
        mockAPI.fileList(200, {

        });

        this.client = new Client('');
        this.fileAPI = this.client.file;
    });

    it('should load file list', function() {
        expect();
    });

});