"use strict";

var interop = require('../interop.js');
var name = "rsvp";

interop( name,
    function(){ return require('rsvp') },
    function (rsvp,cb) {
        return new rsvp.Promise(function(resolve,reject) {
            cb( resolve, reject );
        });
    });
