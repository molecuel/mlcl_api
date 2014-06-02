/**
 * Created by Dominic Böttger on 14.01.2014
 * INSPIRATIONlabs GmbH
 * http://www.inspirationlabs.com
 */
var molecuel;

/**
 * This module serves the molecuel elements the type definition for database objects
 * @todo implement the dynamic generation of elements
 * @constructor
 */
var api = function () {
  var self = this;

  // emit molecuel elements pre init event
  molecuel.emit('mlcl::api::init:pre', self);


  molecuel.emit('mlcl::api::init:post', self);
  return this;
};

api.prototype.get = function get(req, res) {
  if(res.locals && res.locals.api) {
    res.send(res.locals.api);
  } else {
    res.send(404);
  }
};

/* ************************************************************************
 SINGLETON CLASS DEFINITION
 ************************************************************************ */
var instance = null;

/**
 * Singleton getInstance definition
 * @return singleton class
 */
var getInstance = function () {
  if (instance === null) {
    instance = new api();
  }
  return instance;
};



var init = function (m) {
  // store molecuel instance
  molecuel = m;
  return getInstance();
};

module.exports = init;