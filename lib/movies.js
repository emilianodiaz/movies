const http = require("http");

var Cache = {};


function movies(db) {
    this.db = db;

    setInterval(()=>{
        var now = new Date().getTime();
        for(var k in Cache){
            if(now - Cache[k].created> (10 * 1000) ) delete Cache[k];
        }
    }, 10000);
}




movies.prototype.request = function (path) {

    var options = {
        hostname: 'www.omdbapi.com',
        port: 80,
        path: path,
        method: 'GET',
        headers: {
            //'Content-Type': 'application/x-www-form-urlencoded',
            //'Content-Length': postData.length
        }
    };


    return new Promise((resolve, reject)=> {

        var body = "";

        function process(body) {
            try {
                var parse = JSON.parse(body);
                resolve(parse);
            } catch (e) {
                reject(e);
            }
        };


        var req = http.request(options, (res) => {
            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                body = body + chunk;
            });

            res.on('end', () => {
                process(body);
            });
        });

        req.on('error', (e) => {
            console.log(`problem with request: ${e.message}, sorry`);
            reject(e);
        });

        req.end();
    });

}


movies.prototype.findInDB = function (key) {
    var self = this;

    return new Promise((resolve, reject)=> {

        self.db.movies.findOne({key: key}, {}, (err, doc)=> {
            err ? reject(err) : (doc ? resolve(true) : resolve(false));
        });
    });
}

movies.prototype.deleteFromDB = function (key) {
    var self = this;

    return new Promise((resolve, reject)=> {
        self.db.movies.remove({key: key}, {multi: true}, (err, doc)=> {
            err ? reject(err) : resolve(doc);
        });
    });
}

movies.prototype.saveIntoDB = function (key, data) {
    var self = this;

    return new Promise((resolve, reject)=> {

        self.findInDB(key)
            .then((r)=> {
                if (r) {
                    return self.deleteFromDB(key)
                } else {
                    return Promise.resolve();
                }
            })
            .then(()=> {
                self.db.movies.save({key: key, results: data}, (err, doc)=> {
                    err ? reject(err) : resolve(doc);
                })
            })
            .catch(reject);
    });
}




movies.prototype.search = function (key) {
    var self = this;
    var rdata =  null;


    return new Promise((resolve, reject)=> {


        if(typeof Cache[key]!="undefined") return resolve(Cache[key].result);

        self.request('/?s=' + key)
            .then((data)=> {
                rdata = data;
                return self.saveIntoDB(key, data.Search);
            })
            .then(()=> {
                console.log("proceso normal");
                Cache[key] = {created: new Date().getTime(), result:  rdata};
                resolve(rdata);
            })
            .catch(reject);
    });
}

module.exports = movies;