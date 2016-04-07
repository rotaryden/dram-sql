'use strict';

var _ = require('lodash');

/**
 * Simple Chainable SQL expression constructor
 * @constructor
 */
function SQL(initialSQL, options) {
    var t = this;
    t.options = {
        isSafe: false
    };
    if (options){
        Object.assign(t.options, options);
    }
    t._sql = (initialSQL || '') + ' '; //a space for attachability to other parts of the query
}

SQL.flag = {
    SAFE: 1
};

SQL.prototype.raw = function (raw) {
    var t = this;
    t._sql += ' ' + raw + ' ';
    return t;
};


SQL.prototype.allSafe = function () {
    this.options.isSafe = true;
};


SQL.prototype._extractNames = function (properties){
    if (_.isArray(properties)){
            return properties;
    } else if (_.isObject(properties)){
         return _.keys(properties);
    } else if (typeof properties === "string"){
        return properties.split(/\s*,\s*/);
    }
    throw Error("Populated Names should be an Object, " +
        "Array or String with comma-separated values:" + properties);
};

SQL.prototype._checkNameSafe = function (s, flags) {
    var t = this;
    if (! t.options.isSafe && ! (flags & SQL.flag.SAFE)) {
        if (/^\w+$/.test(s)) {
            throw Error("Invalid name (may be SQL injection!!!):" + s);
        }
    }
};

SQL.prototype._checkNamesSafe = function (names, flags) {
    var t = this;
    if (! t.options.isSafe && ! (flags & SQL.flag.SAFE)) {
        var rx = /^\w+$/;
        for (var i = 0; i < names.length; i++) {
            if (!rx.test(names[i])) {
                throw Error("Invalid name (may be SQL injection!!!):" + names[i] +
                    "\n names: " + names);
            }
        }
    }
};

SQL._raw = function(raw) {
    return function (optArgument, flags) {
        var t = this;
        t._checkNameSafe(optArgument, flags);
        t._sql += ' ' + raw + ' ' + (optArgument ? (optArgument + ' ') : '');
        return t;
    };
};

//.update('table_name').set(properties)
SQL.prototype.update = SQL._raw('UPDATE');

//.insert('table_name').set(properties)
//.insert('table_name').values(properties)
SQL.prototype.insert = SQL._raw('INSERT INTO');

SQL.prototype.set = function (properties, flags) {
    //WARNING: this.eq() has protection from SQL injection,
    //note this in case of implementation changes
    var t = this;
    t._sql += ' SET ' + t.eq(properties, ',', flags) + ' '; //.eq() gives right syntax 
    return t;
};

SQL.prototype.values = function (properties, flags) {
    var t = this;
    var names =  t._extractNames(properties);
    t._checkNamesSafe(names, flags);
    t._sql += ' (' + names.join(', ') + 
        ') VALUES ( :' + names.join(', :') + ' )'; 
    return t;
};

//.select(['a', 'b'])
//.select('a, b')
SQL.prototype.select = function (columns, flags) {
    var t = this;
    var names =  t._extractNames(columns);
    t._checkNamesSafe(names, flags);
    t._sql += ' SELECT ' + names.join(', ') + ' '; 
            
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

SQL._makeJoin = function(join, flags) {
    return function (tables) {
        var t = this;
        if (tables) {
            var names =  t._extractNames(tables);
            t._checkNamesSafe(names, flags);
            t._sql += ' (' + names.join(' ' + join + ' ') + ') ';
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

SQL._makeOp = function (operation) {
    /**
     * Compiles criteria for ON , WHERE etc 
     
     * WARNING: "joiner" is not safe!
     
     * @param props
     * @param joiner - can be , AND OR
     * @param flags
     * @returns {SQL}
     * @private
     */
    return function (properties, joiner, flags) {
        var t = this;
        var names =  t._extractNames(properties);
        t._checkNamesSafe(names, flags);
        
        t._sql += ' (' +  _.map(names, function(name) {
            return name + ' ' + operation + ' :' + name;
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


SQL.prototype.in = function (el, set, flags) {
    var t = this;
    set =  t._extractNames(set);
    t._checkNameSafe(el, flags);
    t._checkNamesSafe(set, flags);
    
    t._sql += ' (' + el + ' IN (' + set.join(', ') + ')) ';
    return t;
};

SQL.prototype.toString = SQL.prototype.ok = SQL.prototype.end = function () {
    return this._sql;
};

module.exports = {
    make: function (initialQuery) {
        return new SQL(initialQuery);
    },
    flag: SQL.flag
};