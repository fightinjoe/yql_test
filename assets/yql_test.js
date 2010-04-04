var YQLTests = {
  tests   : {},
  results : {},

  gatherTables : function(){},

  getTestsForTable : function( table, callback ){
    var yqlQuery = 'select * from '+table+' where test="unit"';
    YQL.query(yqlQuery, function( data, diag ){
      YQLTests.tests[ table ] = data;
      callback();
    });
  },

  // Given the name of a "table", runs all of the tests for that table
  runTestsForTable : function( table, callback ){
    if( !YQLTests.tests[table] ) {
      YQLTests.getTestsForTable(table, function(){YQLTests.runTestsForTable(table, callback)});
    } else {
      var asserts = YQLTests.tests[table].asserts || YQLTests.tests[table].query.results.asserts;
      if(!asserts.length) asserts = [asserts];
      YQLTests.results[table] = new YQLTests.Runner( table, asserts, callback );
    }
  },

  /*==== Classes ====*/

  // This class is used to run all of the tests for a given YQL table.  It should be invoked by the
  // YQLTests.runTestsForTable() method.
  Runner : function(table, tests, callback) {
    var self     = this;
    this.table   = table;
    this.tests   = tests;
    this.results = {};

    var html = { pass:null, fail:null, container:null, count:null };
    var assertions = { pass:0, fail:0, error:0, total:0, pending:0 };

    /*=== Printing Methods ===*/

    // http://en.wikipedia.org/wiki/Unicode_symbols
    var icons = {
      pass  : '<span class="icon">&#10004;</span>', // %u2714 - check
      fail  : '<span class="icon">&#10008;</span>', // %u2718 - x
      error : '<span class="icon">&#10008;</span>'
      // error   : '<span class="icon">&#10026;</span>'  // %u272A - reverse star in circle
    }

    this.printPass = function( name, title, should, result ) {
      assertions.pass++; assertions.total++; assertions.pending--;
      title = title.replace(/_+/g,' ');
      html.pass.append('<li class="test pass">'+icons.pass+'<p class="title">'+name+': <em>should '+title+'</em></p></li>');
      self.printCount();
    }

    this.printFail = function( name, title, should, result, data ) {
      assertions.fail++; assertions.total++; assertions.pending--;
      title = title.replace(/_+/g,' ');
//      html.fail.append('<li class="test fail">'+icons.fail+'<p class="title">Should '+title+'</p></li>');
      html.fail.append(
        '<li class="test fail">'+
          icons.error+
          '<p class="title">'+name+': <em>should '+title+'</em></p>'+
          '<p class="should"><tt>'+should+'</tt></p>'+
          '<p class="result"><tt>=> '+result+'</tt></p>'+
        '</li>'
      );

      var button = jQuery('<button>Log Data Object</button>');
      html.fail.find('li:last').append(button);
      button.click(function(){ console.log(data); console.log(error); });

      self.printCount();
    }

    this.printError = function( name, title, should, error, data ) {
      assertions.error++; assertions.total++; assertions.pending--;
      title = title.replace(/_+/g,' ');
      console.log(error);
      html.fail.append(
        '<li class="test error">'+
          icons.error+
          '<p class="title">'+name+': <em>should '+title+'</em></p>'+
          '<p class="should"><tt>'+should+'</tt></p>'+
          '<ul class="errorObj">'+
            '<li class="message"><tt>'+ (error.description || error.message) +'</tt></li>' +
          '</ul>'+
        '</li>'
      );

      var button = jQuery('<button>Log Data Object</button>');
      html.fail.find('li:last').append(button);
      button.click(function(){ console.log(data); console.log(error); });

      self.printCount();
    }

    this.printCount = function() {
      html.count.html([assertions.total, 'assertions.', assertions.pass, 'pass', assertions.fail, 'fail', assertions.error, 'errors', assertions.pending, 'pending'].join(' '));
    }

    var _setupPrintResults = function() {
      html.pass  = jQuery('<ul class="tests pass"></ul>');
      html.fail  = jQuery('<ul class="tests fail"></ul>');
      html.container = jQuery('<div class="tests '+self.table+'"><h1>'+self.table+' tests</h1></div>');
      html.count = jQuery('<p class="count"></p>');
      jQuery('#meat').prepend(html.container);
      html.container.append( html.count ).append( html.pass ).append( html.fail );
    }

    var init = function() {
      // Setup the printing of the results
      _setupPrintResults();

      // Run all of the tests
      for(var i=0;i<self.tests.length;i++){
        var id = Math.random();
        for(var key in self.tests[i].should) { assertions.pending++; }
        self.printCount();

        // substitue {table} with the actual table name
        self.tests[i].query = self.tests[i].query.replace(/\{table\}/,table);

        self.results[id] = new YQLTests.Test( self.tests[i], self, id, callback );
      }
    }

    init();
  },

  Test : function( testObj, runner, id, callback ) {
    var self     = this, data, diag;
    this.runner  = runner;
    this.testObj = testObj;
    this.id      = id;

    this.vars = {
      name     : testObj.name,
      query    : testObj.query,
      should   : testObj.should,
      callback : callback || function(){},
      data     : null,
      diagnostics : null
    };

    var _loadYQL = function(yqlData){
      if(yqlData.error) {
        _printError( yqlData.error );
        return;
      }

      self.vars.data        = data = yqlData.query.results;
      self.vars.diagnostics = diag = yqlData.query.diagnostics;
      self.vars.callback( _runTests() );
    }

    var _runTests = function() {
      var out = true;
      for(var title in self.vars.should) { out && _runTest(title, self.vars.should[title]) }
      return out;
    }

    var _runTest = function( title, should ) {
      var out;
      try {
        out = eval(self.vars.should[title]);
      } catch(err) {
        console.log(err);
        runner.printError( self.vars.name, title, self.vars.should[title], err, data );
      }
      out ? runner.printPass( self.vars.name, title, self.vars.should[title], out ) :
            runner.printFail( self.vars.name, title, self.vars.should[title], out, data );
      return out;
    }

    // Given a query specified in a test, parses it for #{} blocks, evaluates the contents,
    // and returns the final full query
    var _evalQuery = function() {
      var q = (' '+self.vars.query).split(/#\{([^}]+)\}/);
      var out = '';
      for(var i=0;i<q.length;i++) {
        out += (i%2==0) ? q[i] : eval(q[i]);
      }
      //self.output.append('<li class="summary"><a href="'+YQL._host+'/v1/test/console.html?env='+YQL._env+'#h='+escape(out)+'">'+ out +'</a></li>');
      return out;
    }

    var _printError = function( errorObj ) {
      //self.output.append('<li class="error">'+errorObj.description+'</li>');
    }

    /*== Helper Methods ==*/

    // Returns a random number with value less than 10^i
    var rand = function(i) {
      return Math.floor( Math.pow(10,i) * Math.random() );
    }

    // Traverses down the "chain" and only passes if the whole chain is found
    var assertHasElements = function( chain ) {
      chain = chain.split(/\./);
      return assertHasAtLeastOne( chain.pop(), chain.join('.') );
    }

    // Traverses down the "chain" and only fails if the whole chain is found
    var assertDoesNotHaveElements = function( chain ) {
      return(! assertHasElements(chain) );
    }

    // Traverses down the "chain" in the current data object until the end is reached, and then
    // each item is reviewed to see if it contains a key named "elt".
    // Params:
    //   chain - string representation of the path to descend down the data object.  e.g. "results.result.urls"
    //   elt   - string representation of the key to check for.  e.g. "mobile"
    var assertHasAtLeastOne = function( elt, chain ) {
      chain = chain.split(/\./);
      var currentElement = data;
      while(chain.length) {
        currentElement = currentElement[ chain.shift() ];
        if(!currentElement) return false;
      }

      // in the case the currentElement is an object and not an array
      if(currentElement[elt]) return true;

      for(var i=0;i<currentElement.length;i++) {
        if(currentElement[i][elt]) return true;
      }
      return false;
    }

    var assertChain = function( chain, fn ) {
      chain = chain.split(/\./);
      var currentElement = data;
      try {
        while(chain.length) currentElement = currentElement[ chain.shift() ];
      } catch(err) {
        //console.log(chain.join('.'));
      }
      return fn( currentElement );
    }

    // Checks that all elements at the "chain" position satisfy the test within "fn"
    var assertAll = function( chain, fn ) {
      var out = true;
      assertChain(chain, function(currentElement){
        for(var i=0;i<currentElement.length;i++) {
          out = out && fn(currentElement[i]);
        }
      });
      return out;
    }

    /*== Init functions ==*/

    var init = function() {
      self.vars.query = _evalQuery();
      YQL.query( self.vars.query, _loadYQL );
    }

    init();
  }
};