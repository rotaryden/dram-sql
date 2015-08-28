Dramatically simple SQL Builder for Node.js
==========================
Simple opinionated SQL builder under 200 lines of code.

Prepares query predicates with placeholders like ":variable" to be used with 
appropriate query substitutors.

Unlike other wrappers, dram-sql heavily relies on object data processing,
and driven by a single properties object meant to be bound to the query on the execution time.

Features
-----------------------

* Lightweight
* Object-driven

Install
--------------

npm install dram-sql --save

Usage with node-mysql2
---------------

node-mysql2 has built-in substitution for :variable placeholders
```javascript
 
    var driver = require('mysql2');
    var connection = {
        ...
        namedPlaceholders: true
    }
    
    var db = driver.createPool(connection);
    
    var params = {id: 45, email: 'den@example.com'};
    
    db.query( 
        sql().selectFrom('table1').where().eq(params).ok(),
        params,
        callback
    );
    
```
)

Also see examples below.

Syntax
-------------

```javascript
    var sql = require('dram-sql');
    
    sql().selectFrom('table1').where().eq({id: 45, email: 'den@example.com'}).ok()
    
    sql('SELECT * FROM table1').where().eq({id: 45, email: 'den@example.com'}).ok()

    sql().select('a', 'b', 'c').from('table1').where().eq({id: 45, email: 'den@example.com'}).ok()

    sql().select(['a', 'b', 'c']).where().eq({id: 45, email: 'den@example.com'}).ok()

    var props = {id: 45, email: 'den@example.com'};
    var anotherProsp = {toselect: 88}; 

    sql().select(anotherProps).from('table1').where().eq(props).ok()
    >>> SELECT toselect FROM table1 WHERE 

    sql().update('table1').set(props).ok();
    
    sql().update('table1').set(props)
    .end()                                     -------------- ';'
    .insert('subtable').values(props2)
    .ok()
    
    sql().insert('table1').values(obj).ok();
    
    sql().select({a: disregardValue, b: disreg2}).from('table1')
    .where()
        .o()
            .eq(props1).or().eq(props2)
        .c() -- close the parenthesis
    .and().ne('type')
    .ok()

    
```

Dependencies
--------------

[lodash](http://lodash.com)


Licese
--------------

MIT