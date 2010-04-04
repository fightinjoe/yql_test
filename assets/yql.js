var YQL = {
  _host     : 'http://query.yahooapis.com',
  _path     : '/v1/public/yql',
  _format   : 'json',
  _env      : '',

  callbacks : {},

  // Executes a YQL query, passes the data and diagnostics to the callback function
  query : function( yql_query, callback ) {
    YQL.log.push(yql_query);
    var callbackID = Math.random();
    YQL.callbacks[ callbackID ] = function(data) { return callback( data ) };

    var params = [
      'format='   + escape(YQL._format),
      'env='      + escape(YQL._env),
      'callback=' + escape('YQL.callbacks['+callbackID+']'),
      'q='        + escape(yql_query),
      'rand='     + Math.random(),
      'debug='    + 'true'
    ].join('&');

    var url = YQL._host + YQL._path + '?' + params;
    YQL.log.push(url);

    // Call YQL by embedding
    var s  = document.createElement('script');
    s.type ="text/javascript";
    s.src  = url;
    document.body.appendChild(s);
  },

  log : []
}