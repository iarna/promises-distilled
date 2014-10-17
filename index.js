"use strict";
var is_thenable = function (P) { return P && typeof(P.then)==='function' }

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
