'use strict';

const _ = require('lodash');

function coroutine(generatorFunc) {
    const ctx = this;
    const args = slice.call(arguments, 1);
    const generator = generatorFunc.apply(ctx, args);

    (function iter(val) {
        var result = generator.next(val);

        //result.on('response', function(response) {
        //    const data = _.pick(res, ['statusCode', 'statusMessage', 'headersSent', 'sendDate', 'body']);
        //
        //
        //})
    })();
}
