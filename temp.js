//File.prototype.tree = function (cb) {
//    let fileTree = {};
//
//    async(function *(parentId, fileTree, cb) {
//        parentId = parentId || 0;
//        const tree = yield this.client.get(File.routes.fileList, {qs: parentId});
//
//        fileTree[parentId] = tree.result;
//
//        for(let item in fileTree[parentId]) {
//            if(item.contentType === 'application/x-directory') {
//                this.tree(item.id, fileTree[parentId], cb);
//            }
//        }
//    }).call(this, 0, fileTree, cb);
//};

//const results = [];
//
//function parseDir(startId, cb) {
//    client.file.list({'parent_id': startId}, function(err, fileList) {
//        let i = 0;
//
//        while(i < fileList.files.length) {
//            const item = fileList.files[i];
//
//            if(item.content_type === 'application/x-directory') {
//                parseDir(item.id, function(err, res) {
//                    results.concat(res);
//                });
//            } else {
//                results.push(item);
//            }
//
//            i++;
//            if(i === fileList.files.length -1) {
//                cb(null, results);
//            }
//        }
//    });
//}
//
//parseDir(285681349, function(err, res) {
//    log.info(res);
//});