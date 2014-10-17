"use strict";
var test  = require('tape'),
    Promise = require('../index.js');


// @todo Before checking interop, make sure library supports the feature with its own objects, skip if not.
var interop = module.exports = function interop(name,requiremodule,create) {
    test("Interop tests for "+name, function(T) {
        var plan = 4;
        T.plan(plan);
        try {
            var module = requiremodule();
        }
        catch(e) {
            for (var i=0; i<plan; ++i) { T.skip(""+e) }
            return;
        }
        var M1 = "Consume foreign promise w/success";
        var P1 = create(module,function(resolve,reject) { resolve("OK") });
        new Promise(function(F,R) { F(P1) })
            .then(function(V){ T.is(V,"OK",M1) })
            .catch(function(E){ T.fail(M1) });

        var M2 = "Feed foreign promise w/success";
        var P2 = new Promise(function(F,R){ F("OK") });
        create(module,function(resolve,reject){ resolve(P2) })
            .then(function(V) { T.is(V,"OK",M2) },
                  function(E) { T.fail(M2) });
        var M3 = "Consume foreign promise w/failure";
        var P3 = create(module,function(resolve,reject) { reject(new Error()) });
        new Promise(function(F,R) { R(P3) })
            .then(function(V){ T.fail(M3) })
            .catch(function(E){ T.ok(E instanceof Error,M3) });
        var M4 = "Feed foreign promise w/failure";
        var P4 = new Promise(function(F,R){ R(new Error()) });
        create(module,function(resolve,reject){ resolve(P4) })
            .then(function(V) { T.fail(M4) },
                  function(E) { T.ok(E instanceof Error,M4) });
    });
}
