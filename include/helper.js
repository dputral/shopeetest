global.require = require;
global.init = require('./init');
global.session = require('express-session')
global.__dirname = __dirname 
var uri = require('url');
global.fs = require('fs');
var redis = require('redis')
global.redis = redis.createClient({host:'35.198.237.113',password:'l4kup0n'});
global.upload = require('multer');
global.con = init.pool;
const solr1 = require('solr-node')({
    host: 'lakupon.com',
    port: '8183',
    core: 'collection1',
    protocol: 'http',
    debugLevel: 'ERROR' // log4js debug level paramter
});
const solr2 = require('solr-node')({
    host: 'lakupon.com',
    port: '8183',
    core: 'collection2',
    protocol: 'http',
    debugLevel: 'ERROR' // log4js debug level paramter
});
const solr3 = require('solr-node')({
    host: 'lakupon.com',
    port: '8183',
    core: 'collection3',
    protocol: 'http',
    debugLevel: 'ERROR' // log4js debug level paramter
});


global.redis.on("error", function (err) {
    console.log("Error " + err);
});

function chr59(intu)
{
	if(intu > 59){
		return false;
	}
	ref = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","J","K","L","M","N","P","Q","R","S","T","U","V","W","X","Y","Z"];
	return ref[intu];
}

const url = require('url');  
const http = require('http');  

var get = new Array();

		
function chk_empty(ins){
    if(typeof ins === 'Object'){
	return Object.keys(ins).length ? false:true;		
    }
    return ( ins )? false : true;
}

module.exports = {
		
		solr1:solr1,
		solr2:solr2,
		solr3:solr3,
		
		api_hit:function (path,data = '',method = 'GET'){
			
			var o = init.config.api_id;
			o.path = path;
			o.method = method;
			// var o = new URL(init.config.api_id.href + path)
			return new Promise((resolve, reject) => {
				const request = http.get(init.config.api_id.href + path, (response,err) => {
					if(err) reject(err);
					const body = [];
					response.on('data', (chunk) => body.push(chunk));
					response.on('end', () => {
						resolve(body.join(''))
					});
				})
			})
		},
		external_hit:function (ur,data = '',method = 'GET'){
			return new Promise((resolve, reject) => {
				
				var options = url.parse(ur);
				const request = http.request(options, (response) => {
					const body = [];
					
					response.setEncoding('utf8');
					response.on('data', (chunk) => {
						body.push(chunk);
					});
					
					response.on('end', () => {
						resolve(body.join(''))
					});
				})
				
				request.end();
			})
		},
		
		post_hit:function (url,path,data = '',method = 'POST'){
			
			var o = init.config.api_id;
			o.method = method;
			// var o = new URL(init.config.api_id.href + path)
			return new Promise((resolve, reject) => {
				
				const options = {
						hostname: url,
						port: 80,
						path: path,
						method: method,
						headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': Buffer.byteLength(data)
					}
				};

				
				
				const req = http.request(options, (res) => {
				// console.log(`STATUS: ${res.statusCode}`);
				// console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
				res.setEncoding('utf8');
				res.on('data', (chunk) => {
				console.log(`BODY: ${chunk}`);
				});
				res.on('end', () => {
				console.log('No more data in response.');
				});
				});

				req.on('error', (e) => {
				console.error(`problem with request: ${e.message}`);
				});

				// write data to request body
				req.write(data);
				req.end();
			})
		},


		cached: function (name,callback,expiry=60){
			expiry = (expiry)?expiry:60;
			var msg = ''
			var camsg = ''
			redis.get(name,function(er,reply){
				if(er){
					msg += er
				}
				camsg = reply;
				if(reply){
					return reply;
				}
			})
			
			return new Promise((response,reject) => {
					try{
						var data = callback();
						return
						redis.set(name, JSON.stringify(data), 'EX', expiry);
						response(JSON.stringify(data))
					}catch(e){recject(e)}
			})
		},

		make_api_get: function (app, path, callback){
			
			http.get( init.config.api_id.href + path, (resp) => {
			
				let rawData ='';
				resp.on('data', (chunk) => { rawData += chunk; });
				resp.on('end', () => {
					try {
						if(callback){
							rawData = callback(rawData);
							//console.info(rawData)
							app.send(rawData);return;
						}
						parsedData = JSON.parse(data)
						app.send(parsedData);
					} catch (e) {
						console.log(e)
						console.error(e.message);
					}
				});
			});
			
		},
		
		scan : function (obj){
			
			var k;
			if (obj instanceof Object) {
				for (k in obj){
					if (obj.hasOwnProperty(k)){
						//recursive call to scan property
						scan( obj[k] );  
					}                
				}
			} else {
				//not an Object so obj[k] here is a value
			};
		},
		db_hit : function(que){
			return new Promise((resolve, reject) => {
				con.getConnection(function(err, conn){
					if (conn) conn.release()
					if (err) {
						console.log(' Error getting mysql_pool connection: ' + err);
						reject(err);
					}
					
					if(que.match(/concat/ig)){
						con.query('SET SESSION group_concat_max_len = 100000;',(er,re) => {
							if (err) reject(err);
							conn.query(que, function (err, result) {
								if (err){
									reject(err);
								}
								resolve(result);
							});
						})
					}else{
				
							conn.query(que, function (err, result) {
								if (err){
									reject(err);
								}
								resolve(result);
							});
					}
				});
			
			})
			
		},
		db_sync : async function(que){

			var a = con.query("SET SESSION sql_mode = ''",function(r,e){});
			if(que.match(/concat/ig)){

				con.query('SET SESSION group_concat_max_len = 100000;',(er,re) => {})
			}
			a = await con.aquery(que);
			
			return a;
		},
		key_intersect: function(o1, o2){
			cum = true
			o2.forEach(function(v,k){
				if(Object.keys(o1).indexOf(v) == -1){
					cum = false
				}
			})
			return cum
		},
		exist: function(obj,empty_check = false){
			var a = typeof obj == 'undefined' ? false:true;
			if(!a && empty_check){
				return chk_empty(a);
			}
			return a;
		},
		is_empty: function(obj){
			return chk_empty(obj)
		},
		flat_object_assoc: function(obj){
			var retu = [],i=0;
			var ool = this.clean_obj(obj);
			Object.keys(ool).forEach(function(vv){
				retu[i] = vv+"='"+ool[vv]+"'";
				i++;
			})
			//var parsed = JSON.stringify(obj).replace(/\:/gi,'=').replace(/\{|}/gi,'');
			
			return retu.join(',');
		},
		scan_json_val: function(o, cb)
		{
			function findVal(object,cb) {
				
				Object.keys(object).forEach(function(k) {
					
					if (object[k] && typeof object[k] === 'object') {
						return object[k] = findVal(object[k], cb);
					}
				// console.log(cb(object[k]))
					return object[k] = cb(object[k]);
				});
				return object;
			}
			o = findVal(o,cb);
			return o;
		},
		clean_obj: function(obj) {
			for (var propName in obj) { 
				if (obj[propName] === null || obj[propName] === undefined || obj[propName] === '') {
				  delete obj[propName];
				}
			}
			return obj;
		},
		make_db_cache:function (app, name, query_command, expiry_time){
			expiry_time = (expiry_time)?expiry_time:60;
			redis.get(name,function (err, reply) {
				if(err) throw err
				if(reply){
					app.send(JSON.parse(reply));
				}else{
					con.getConnection(function(err, conn){
						if (conn) conn.release()
						if (err) {
							console.log(' Error getting mysql_pool connection: ' + err);
							throw err;
						}
						
						conn.query('SET SESSION group_concat_max_len = 100000;',(er,re) => {if (err) throw err;})
						
						conn.query(query_command, function (err, result) {
							if (err) throw err;
							redis.set(name, JSON.stringify(result), 'EX', expiry_time);
							app.send(result);
						});
					});
				}
			});
		},

		make_db_select:function(app, query_command){
			
			con.getConnection(function(err, conn){
				
				if (conn) conn.release()
				if (err) {
					console.log(' Error getting mysql_pool connection: ' + err);
					throw err;
				}
				
				if(query_command.match(/concat/ig)){
					con.query('SET SESSION group_concat_max_len = 100000;',(er,re) => {if (err) throw err;})
				}
			
				conn.query(query_command, function (err, result) {
					if (err) throw err;
					app.send(result);
				});
			});
		},
		
		transcode: function(){
			var d = new Date();
			return chr59(d.getMonth()+1)+chr59(d.getDate())+chr59(d.getHours())+chr59(d.getMinutes()-2)+chr59(d.getSeconds()-2);
		}
	
}