"use strict";

var interop = require('../interop.js');
var name = "self";

interop( name,
    function(){ return require('../../index.js') },
    function (P,cb) { return new P(cb) }
    );
