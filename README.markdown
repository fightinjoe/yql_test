YQL Unit Test
-------------

This is a library for writing unit tests for YQL tables.  Tests run in the
browser using the [Client].  Here is an [example] of tests running.

  [client]:  http://fightinjoe.com/yql_test/test.html
  [example]: http://fightinjoe.com/yql_test/test.html?env=http%3A%2F%2Ffightinjoe.com%2Fyql_test%2Ftables.env#yql.unit_test_helper

Structure
---------

Unit tests are embedded within the YQL table they are testing.  They live in
a simple <select> block.  So as not to conflict with other <select> blocks
in the YQL table, they take a single key: test.  Setting 'test' to any value
will trigger the return of the test suite.

The test suite is a JSON object.  The object contains an array of assertion
groups.  Each group has a name and is related to a single YQL query.  Each
group also has a list of assertions, collected in a key-value pair called
'should'.

Should-pairs state in human language what should happen (the key) and
programatically (the value) what to test.

Flow
----

The client performs two functions: table lookup, and unit test execution. The
table lookup is done against an ENV file.  The ENV file is parsed for all
included tables.  These tables are then printed out as links on the left-hand
side of the client.  Clicking on any table will run the unit tests for that
table.  The ENV file defaults to the test ENV file, but may be exchanged in
the white input field at the top of the page for any other ENV file.

When a table is clicked, the client fetches the unit tests for the table
(using the YQL query 'SELECT * FROM {table} WHERE test="unit"').  When the
unit tests are returned, the client traverses each assertion group, executing
the associated YQL query for the group.  When the YQL response is received,
each of the should-assertions is run against the returned YQL response.

The YQL response is made available to the should-assertions as a variable
called 'data'.  Should-assertion values are strings that are eval()'d by the
client within the scope of YQLTests.Test.  In this way, the eval'd code
has access to the 'data' variable as well as several helper methods.

To see examples view the example [yqlUnitTestHelper].

  [yqlUnitTestHelper]: http://fightinjoe.com/yql_test/yql.unitTestHelper.xml