'use strict';

var _ = require('lodash');

/**
 * Simple Chainable SQL expression constructor
 * @constructor
 */
function SQL(initialSQL) {
    var t = this;
    t._sql = (initialSQL || '') + ' '; //a space for attachability to other parts of the query
}

SQL.prototype.raw = function (raw) {
    var t = this;
    t._sql += ' ' + raw + ' ';
    return t;
};

SQL._raw = function(raw) {
    return function (optArg) {
        var t = this;
        if (typeof optArg !== "string") throw Error("_raw: optional argument may be only string: " + optArg);
        t._sql += ' ' + raw + ' ' + (optArg ? (optArg + ' ') : '');
        return t;
    };
};

//.update('table_name').set(properties)
SQL.prototype.update = SQL._raw('UPDATE');
//.insert('table_name').set(properties)
//.insert('table_name').values(properties)
SQL.prototype.insert = SQL._raw('INSERT INTO');
SQL.prototype.set = function (properties) {
    var t = this;
    t._sql += ' SET ' + t.eq(properties, ',') + ' '; //.eq() gives right syntax 
    return t;
};

SQL.prototype.values = function (properties) {
    var t = this;
    if (! _.isObject(properties)) throw Error("Invalid VALUES properties:" + properties);
    var keys =  _.keys(properties);
    t._sql += ' (' + keys.join(', ') + 
        ') VALUES ( ' + keys.join(', :') + ' )'; 
    return t;
};

//.select(['a', 'b'])
SQL.prototype.select = function (properties) {
    var t = this;
    if (arguments.length > 1){
        properties = _.slice(arguments);
    } else if (_.isObject(properties)) {
        properties = _.values(properties);
    }
    if (! _.isArray(properties)) throw Error("Invalid SELECT properties:" + properties + 
        "\n Use selectFrom() for SELECT * FROM");
    
    t._sql += ' SELECT ' + properties.join(', ') + ' '; 
            
    return t;
};

//terminate statement - for multiple statements
SQL.prototype.end = SQL._raw(';');

//.from('table_name') -- for single table select
//.from().join(tables) -- for joining tables
SQL.prototype.from = SQL._raw('FROM');
//shortcut: .selectFrom().join('A', 'B')
//.selectFrom('A')
SQL.prototype.selectFrom = SQL._raw('SELECT * FROM');
SQL.prototype.deleteFrom = SQL._raw('DELETE FROM');

SQL.prototype.open = SQL.prototype.o = SQL._raw('(');
SQL.prototype.close = SQL.prototype.c = SQL._raw(')');

//.and()
// .and('(').someOp().someOp().close() -- close the parenthesis
// .and().o().someOp().someOp().c() -- close the parenthesis
SQL.prototype.and = SQL._raw('AND');
SQL.prototype.or = SQL._raw('OR');
SQL.prototype.not = SQL._raw('NOT');

SQL.prototype.where = SQL._raw('WHERE');
SQL.prototype.groupBy = SQL._raw('GROUP BY');
SQL.prototype.having = SQL._raw('HAVING');

//.limit(100)
SQL.prototype.limit = SQL._raw('LIMIT');

SQL._makeJoin = function(join) {
    return function (tables) {
        var t = this;
        if (tables) {
            if (_.isObject(tables)){
                tables = _.values(tables);
            } else if (arguments.length > 1){
                tables = _.slice(arguments);
            }
            if (! _.isArray(tables)) throw Error("Invalid JOIN tables:" + tables);
            t._sql += ' (' + tables.join(' ' + join + ' ') + ') ';
        }else{
            //act as simple conjunction
            t._sql += ' ' + join + ' ';
        }
        return t;
    };
};

SQL.prototype.inner = SQL.prototype.join = SQL._makeJoin('JOIN');
SQL.prototype.left = SQL._makeJoin('LEFT JOIN');
SQL.prototype.right = SQL._makeJoin('RIGHT JOIN');
SQL.prototype.outer = SQL._makeJoin('FULL OUTER JOIN');

SQL._makeOp = function (op) {
    /**
     * Compiles criteria for ON , WHERE etc 
     * @param props
     * @param joiner - can be , AND OR
     * @returns {SQL}
     * @private
     */
    return function (properties, joiner) {
        var t = this;
        if (! _.isObject(properties)) throw Error("Invalid " + op + " properties:" + properties);
        t._sql += ' (' +  _.map(properties, function(value, key) {
          return key + ' ' + op + ' :' + key;
        }).join(' ' + joiner + ' ') + ') ';
        return t;
    };
};

SQL.prototype.eq = SQL._makeOp('=');
SQL.prototype.ne = SQL._makeOp('<>');
SQL.prototype.lt = SQL._makeOp('<');
SQL.prototype.le = SQL._makeOp('<=');
SQL.prototype.gt = SQL._makeOp('>');
SQL.prototype.ge = SQL._makeOp('>=');


SQL.prototype.in = function (el, set) {
    var t = this;
    if (! _.isArray(set)) throw Error("Invalid IN set:" + set);
    t._sql += ' (' + el + ' IN (' + set.join(', ') + ')) ';
    return t;
};

SQL.prototype.toString = SQL.prototype.ok = function () {
    return this._sql;
};


module.exports = function (initialQuery) {
    return new SQL(initialQuery)
};