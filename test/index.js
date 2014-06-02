/**
 * Created by Dominic Böttger on 11.05.2014
 * INSPIRATIONlabs GmbH
 * http://www.inspirationlabs.com
 */
var should = require('should'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  express = require('express'),
  mlcl_database = require('mlcl_database'),
  mlcl_elastic = require('mlcl_elastic'),
  request = require('request'),
  assert = require('assert'),
  mlcl_elements = require('mlcl_elements'),
  mlcl_collections = require('mlcl_collections'),
  mlcl_api = require('../');

describe('mlcl_elastic', function() {
  var mlcl;
  var molecuel;
  var mongo;
  var elastic;
  var elements;
  var collections;
  var api;

  before(function(done) {
    // init fake molecuel
    mlcl = function() {
      return this;
    };
    util.inherits(mlcl, EventEmitter);
    molecuel = new mlcl();

    molecuel.config = { };
    molecuel.config.search = {
      host: 'localhost',
      port: '9200',
      prefix: 'mlcl-api-unit'
    };
    molecuel.config.database = {
      type: 'mongodb',
      uri: 'mongodb://localhost/mlcl-api-unit'
    };
    molecuel.config.elements = {
      schemaDir: __dirname + '/definitions'
    };

    molecuel.config.collections = {
      collectionDir: __dirname + '/collections'
    };

    mongo = mlcl_database(molecuel);
    elastic = mlcl_elastic(molecuel);
    elements = mlcl_elements(molecuel);
    collections = mlcl_collections(molecuel);
    api = mlcl_api(molecuel);
    done();
  });

  describe('collections', function() {
    var elements;
    var app;
    var pagemodel;

    it('should initialize db connection', function(done) {
      molecuel.once('mlcl::elements::init:post', function(ele) {
        elements = ele;
        ele.should.be.a.object;
        done();
      });
      molecuel.emit('mlcl::core::init:post', molecuel);
    });

    it('should initialize the middleware', function(done) {
      app = express();
      //elements.initApplication(app);
      elements.middleware({type: 'formsangular'}, app);
      app.get(elements.get);
      app.get('/api/collections/:name', collections.apiGet);
      app.get('/api/*', api.get);
      app.listen(8000);
      elements.appInitialized.should.be.true;
      done();
    });

    it('should return the registered page model', function(done) {
      pagemodel = elements.getModel('page');
      pagemodel.should.be.a.object;
      done();
    });

    var mypage;

    it('should save a object to database', function(done) {
      mypage = new pagemodel();
      mypage.url = '/test_my_url';
      mypage.lang = 'en';
      mypage.title = 'This is a testpage';
      mypage.save(function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('should wait for saved objects be refreshed in index', function(done) {
      setTimeout(function() {
        done();
      }, 1000);
    });

    it('should return a object via url and lang', function(done) {
      elements.searchByUrl('/test_my_url', 'en', function(err, result) {
        should.not.exists(err);
        should.exist(result);
        result.should.be.an.Object;
        result.hits.should.be.an.Object;
        result.hits.hits.should.be.an.Array;
        result.hits.hits[0].should.be.an.Object;
        done();
      });
    });

    it('should answer the request with the correct page', function(done) {
      request('http://localhost:8000/api/page/'+mypage._id, function (error, response, body) {
        assert(response.statusCode === 200);
        if (!error && response.statusCode === 200) {
          var mybody = JSON.parse(body);
          assert(mybody.title === 'This is a testpage');
          done();
        }
      });
    });

    it('should answer with the collection object', function(done) {
      request('http://localhost:8000/api/collections/findbyid?_id='+mypage._id, function (error, response, body) {
        assert(response.statusCode === 200);
        if (!error && response.statusCode === 200) {
          var mybody = JSON.parse(body);
          assert(mybody.hits.hits[0]._source.title === 'This is a testpage');
          done();
        }
      });
    });

    after(function(done) {
      elements.database.database.connection.db.dropDatabase(function(error) {
        should.not.exists(error);
        elements.elastic.deleteIndex('*', function(error) {
          should.not.exists(error);
          done();
        });
      });
    });
  });
});
