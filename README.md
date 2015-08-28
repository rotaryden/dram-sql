Dramatically simple SQL Builder for Node.js
==========================
Simple opinionated SQL builder under 200 lines of code.

Prepares query predicates with placeholders like ":variable" to be used with 
appropriate query substitutors

(e.g. node-mysql2 has built-in substitutor for such placeholders,
```javascript
    var connection = {
        ...
        namedPlaceholders: true
    }
```
)

See examples.

Install
--------------

npm install dram-sql --save

Usage
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
```

Dependencies
--------------

[lodash](http://lodash.com)


Licese
--------------

MIT