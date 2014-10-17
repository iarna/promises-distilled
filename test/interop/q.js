"use strict";

var interop = require('../interop.js');
var name = "q";

interop( name,
    function(){ return require('q') },
    function (Q,cb) {
        var deferred = Q.defer();
        cb( deferred.resolve, deferred.reject );
        return deferred.promise;
    });
