"use strict";

var interop = require('../interop.js');
var name = "when";

interop( name,
    function(){ return require('when') },
    function (when,cb) {
        return new when.Promise(function(resolve,reject) {
            cb( resolve, reject );
        });
    });
