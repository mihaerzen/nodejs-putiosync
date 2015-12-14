'use strict';

const expect = require('chai').expect;

const mockRequest = require('./fixtures/mocks').mockFile;

const Client = require('../lib/Client');


describe('File list', function () {

    beforeEach(function() {
        const fixture = require('./fixtures/filesList.json');
        mockRequest.list(200, fixture, 0);
        mockRequest.getDummy(200, {});

        this.client = new Client('Oauth');
        this.expectedResult = fixture.files;
    });

    xit('should call with OAuth token', done => {
        this.client.request('/dummy');
    });

    it('should load file list', done => {
        this.client.file.list({parent_id: 0}, (err, result) => {
            expect(result).to.deep.equal(this.expectedResult);
            done();
        });
    });

});