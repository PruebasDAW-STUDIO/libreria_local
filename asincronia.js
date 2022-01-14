async.waterfall([
    function(callback){

        callback(null, 'one', 'two');
    },
    function(arg1, arg2, callback){

        callback(null, 'three');
    },
    function(arg1, callback){

        callback(null, 'done');
    }
    
],
    
    function(err, results){


    }

);