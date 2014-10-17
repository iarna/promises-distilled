Promises Distilled
------------------

This is intended as an educational rather than practical module. It
implements Promises/A+ in a very simple way.  For day-to-day use I recommend
checking out `bluebird`.  You can see the source to the module at the bottom
of this document.

Making Promises
---------------

    var Promise = require('promises-distilled');

Let's make a promise that'll be resolved with the contents of a directory.

    var promise = new Promise(function(fulfill, reject){
        fs.readdir('/', function(E,V){ E ? reject(E) : fulfill(V) });
    });

For callbacks that don't produce errors it might look like:

    var promise = new Promise(function(fulfill){
        fs.exists('/path/to/file', fulfill);
    });

Of course, you can directly call fulfilll yourself:

    var promise = new Promise(function(fulfill,reject){ resolve(23) });

Similarly, you can reject the promise:

    var promise = new Promise(function(fulfill,reject){ reject(new Error("Bad")) });

Or even:

    var promise = new Promise(function(fulfill,reject){ throw new Error("Bad") });

Timing Issues
-------------

Promise chains are called at nextTick (or as soon as possible) after the
promise is fulfilled/rejected.  (We wouldn't want to summon `zalgo`.) This
means that:

    new Promise(function(fulfill){ fulfill(23) })
        .then(function(V){ console.log(V) });
    console.log(13);

Will print 13 and then 23.

Using Promisables
-----------------

    var promise = new Promise(function(fulfill, reject){
        fs.readdir('/', function(E,V){ E ? reject(E) : fulfill(V) });
    });


So imagine we have the promise from above:

    promise.then(function(files) {
        return Promisable(function(resolve){ fs.unlink(files[0], resolve.withoutErrors) });
    })
    .then(function() {
        // do more things
    }, function (error) {
        console.error( error );
    })

We also support catch, which is technically an extension to Promises/A+ but
trivial to add:

    .then(function() {
        // do more things
    })
    .catch(function (error) {
        console.error( error );
    })

If you throw an error in your then clause (or your catch clause) it'll be
forwarded down the chain as an error/rejection:

    .then(function() {
        throw new Error("bad");
    })
    .catch(function(error) {
        console.error(error); // bad
    })

API Guide
---------

    var Promise = require('promises-distilled');

### `new Promise( resolvercb ) -> Promise`

Arguments:

* resolvercb = function (fulfill, reject)

The resolvercb executed during the constructor but can defer calling fulfill
or reject as long as it likes.

If resolvercb throws an error then the promise will be rejected with that error.

### `Promise.then(thencb,errorcb) -> Promise`

Arguments:

* thencb = function (value) [-> newresult]
* errorcb = function (error) [-> newresult]

If the promise was fulfilled then thencb will be called with the value it
was fulfilled with. If it was rejected then errorcb will be called with the
value it was rejected with.

If thencb or errorcb throw an error then the chained promise will be
rejected with it.

Return values from the callbacks are handled as with calling the promise as
a function.

If you provide an errorcb then it will be assumed you handled any errors.

The chained promise is resolved with the return value of the thencb/errorcb
as appropriate, if there is one.  If there's no return value then the
chained promise is resolved/rejected the same as the current promise.


### `Promise.catch(errorcb) -> Promise`

Arguments:

* errorcb = function (error) [-> newresult]

If the promise was rejected then errorcb will be called with the error it
was rejected with.

If errorcb throws an error then the chained promise will be rejected with
it.  If errorcb returns a value then the chained promise will be fulfilled
with it.  If nothing is returned then the chained promise will be rejected
with the same error the current promise was.

If you have a catch it will be assumed you handled any errors.  If you
didn't handle the error and want to pass it on to a later catch, throw the
error.

Interop
-------

These should be 100% Promises/A+ compatible, with a constructor interface
compatible with bluebird.

Sourcecode
----------

Because this is intended to be read, the source code is included below in
the documentation. Bug fixes, obviously, would be welcome. As would any change
that increases clarity or reduces filesize with obfuscating.

```javascript
"use strict";
var is_thenable = function (P) { return P!=null && typeof(P.then)==='function' }

var maxPromiseId = 0;

var Promise = module.exports = function (resolvecb) {
    if (this == null) return new Promise(resolvecb)

    this.promiseId = ++maxPromiseId;

    this.receivers = [];
    this.resolved = false;

    var self = this;
    this._fulfill = function (V) { self._complete(null, V) }
    this._reject = function (E) { self._complete(E || new Error("Promise rejected")) }

    try {
        resolvecb(this._fulfill, this._reject)
    }
    catch (E) {
        this._complete(E);
    }
}

Promise.prototype = {}
Promise.prototype.toString = function () { return "Promise(#"+this.promiseId+")" }

Promise.prototype._complete = function (E, V) {
    if (this.resolved) {
        return console.error(new Error("Promise already resolved: " + this).stack)
    }
    if (is_thenable(E)) return E.then(this._fulfill, this._reject);
    if (E==null && is_thenable(V)) return V.then(this._fulfill, this._reject);

    this.resolved = [E, V]
    this._sendToReceivers()
}

Promise.prototype._sendToReceivers = function () {
    var self = this
    process.nextTick(function () {
        if (! self.resolved) return
        self.receivers.forEach(function(recv){ recv.apply(null, self.resolved) });
        self.receivers = [];
    })
}

Promise.prototype.then = function (success,failure) {
    if (!success) success = function (V) { return V }
    if (!failure) failure = function (E) { throw E }

    if (this._sendToReceivers) this._sendToReceivers()

    var self = this
    return new Promise( function (fulfill, reject) {
        self.receivers.push(function(E, V) {
            try {
                fulfill( E ? failure(E) : success(V) )
            }
            catch (E) {
                reject(E)
            }
        });
    })
}

Promise.prototype.catch = function (failure) { return this.then(null,failure) }

```

History
-------

This is based, in large part, on `promisable` which came from two desires:

1. I wanted to play with implementing promises using closures.
2. I wanted to try to unify promises and callback-style.

What resulted was some surprisingly compact code. It doesn't *quite* follow
Promises/A+ due to my misreading of it early on.  It was an interesting
project, but mostly a curiosity, especially in light of the unbelievable
performance of `bluebird`.

