// config/hashids.js
const Hashids = require('hashids/cjs');
const config = require('./index');

const hashids = new Hashids(config.hashidsSecret, config.hashidsMinLength);

module.exports = hashids;
