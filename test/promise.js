"use strict";

var Promise = require('../index.js'),
    test  = require('tape');

var createWith = function(F){ return function(msg,cb) { var P = new Promise(F); cb ? cb(P,P+" "+msg) : msg(P) } }
var create = {
    immediate: {
        success: createWith(function(fulfill) { fulfill('OK') }),
        failure: createWith(function(F,R) { throw new Error('NOK') })
    },
    deferred: {
        success: createWith(function(fulfill) { process.nextTick(function(){ fulfill('OK') }) }),
        failure: createWith(function(F,reject) { process.nextTick(function(){ reject(new Error('NOK')) }) })
    },
};

function forEach(A,F) { for (var K in A) F(K,A[K]) }

test("Promise Style Tests", function(T) {
    T.plan(21);
    forEach( create, function(kind,statuses) {
        forEach( statuses, function(result,create) {
            create("basic then/catch "+kind + " " + result,function (P,M){
                result == 'success'
                    ? P.then(function(V) { T.is(V,'OK',M) })
                    : P.catch(function(E) { T.ok(E instanceof Error,M) });
            });
            create("basic then(do,else) "+kind + " " + result, function (P,M){
                result == 'success'
                    ? P.then(function(V) { T.is(V,'OK',M) },function(E) { T.fail(M) })
                    : P.then(function(V) { T.fail(M) },function(E) { T.ok(E instanceof Error,M) });
            });
            create("then chained to catch "+kind+" "+result, function(P,M){
                result == 'success'
                    ? P.then(function (V){ T.is(V,'OK',M) }).catch(function(E){ T.fail(M) })
                    : P.then(function (V){ T.fail(M) }).catch(function(E){ T.ok(E instanceof Error,M)});
            });
            create("catch chained to then "+kind+" "+result, function(P,M){
                result == 'success'
                    ? P.catch(function(E){ T.fail(M) }).then(function (V){ T.is(V,'OK',M) })
                    : P.catch(function(E){ T.ok(E instanceof Error,M); return 'NOWOK' }).then(function (V){ T.is(V,'NOWOK',M) });
            });
            if ( result == 'success' ) {
                create(function(P) {
                    var CP = P.then(function (V){ return "STILL OK"});
                    CP.then(function (V){ T.is(V,"STILL OK", CP+" chained w/success->new val" ) });
                });
            }
        })
    })
    var Chained = Promise(function(R){ R(Promise(function(R){ R('OK') })) })
    Chained.then(function(V){ T.is(V,'OK', Chained+' chained promise resolve') });
});
