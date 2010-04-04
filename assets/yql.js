var YQL = {
  _host     : 'http://query.yahooapis.com',
  _format   : 'json',
  _env      : '',

  callbacks : {},

  // Executes a YQL query, passes the data and diagnostics to the callback function
  query : function( yql_query, callback ) {
    console.log(yql_query);
    var callbackID = Math.random();
    YQL.callbacks[ callbackID ] = function(data) { return callback( data ) };

    var params = [
      'format='   + escape(YQL._format),
      'env='      + escape(YQL._env),
      'callback=' + escape('YQL.callbacks['+callbackID+']'),
      'q='        + escape(yql_query),
      'rand='     + Math.random()
    ].join('&');

    var url = YQL._host + '/v1/public/yql?' + params;

    // Call YQL by embedding
    var s  = document.createElement('script');
    s.type ="text/javascript";
    s.src  = url;
    document.body.appendChild(s);
  }
}