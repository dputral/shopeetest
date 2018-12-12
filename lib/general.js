const __root = __dirname + '/../views/';

var pathlib = require('path');

var nunjucks = require('nunjucks');
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'),
		{autoescape: false,
			express: app
		});


/* global day */

let date = require('date-and-time');
function regexEscape(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function reg(input) {
    var flags;
    //could be any combination of 'g', 'i', and 'm'
    flags = 'g';
    input = regexEscape(input);
    return new RegExp(input, flags);
}

function two_digit(n) {
    return String("0" + n).slice(-2);
}

var general = {
	a : {
		
		log: async function(o){
			var req = ['namespace','log_content','nanotime'];
			if(lak.key_intersect(o,req)){
				return {"status":false,"message":"data incomplete,"+JSON.stringify(req)+" required"}
			}
			
			var n = o['nanotime']/ 1000000; // nano time to millisec
			delete o['nanotime'];
			
			return await lak.db_sync("insert into general_log set "+lak.flat_object_assoc(o))
			
		},
		db_query_cached: async function(cached_name,sql,force_refresh = 0){
		    expiry = (force_refresh > 1)?force_refresh:60;
		    force_refresh = (force_refresh == 1)?true:false;
		    var msg = '';
		    var camsg = '';
		    redis.get(name,function(er,reply){
			    if(er){
				    msg += er
			    }
			    camsg = reply;
			    if(reply){
				    return reply;
			    }
		    })
		}
	},
//	get_today: function(){
//		var d = new Date();
//		var weekday = new Array(7);
//		weekday[0] = "Sunday";
//		weekday[1] = "Monday";
//		weekday[2] = "Tuesday";
//		weekday[3] = "Wednesday";
//		weekday[4] = "Thursday";
//		weekday[5] = "Friday";
//		weekday[6] = "Saturday";
//
//		var n = weekday[d.getDay()];
//		return n;
//	},
	render_template: function(template_path,data)
	{
		var tmpl = env.getTemplate(pathlib.resolve(__root + template_path));
		var html_str =  nunjucks.render(tmpl, data);
		return html_str;
	},
	json_process: function(data)
	{
		try {
			var stringify = JSON.stringify(data);
			var parse = JSON.parse(stringify);
			return (typeof parse == 'string')?JSON.parse(parse):parse;
        } catch (e) {
            return false;
        }
	},
	print_coupon_mobile: function(ini) {

		var dabok = null,nobok = null,tabok = null,tekbok = null

		if (typeof ini['data']['sent_data'] === 'undefined') {
			ini['data']['sent_data'] = null
		}
		if (ini['data']['deal_id'] == 207)
		{
			if (ini['data']['sent_data'] != null) {
				dabok = Object.values(general.json_process(ini['data']['sent_data']));
				nobok = dabok['nobook'];
				tabok = dabok['tgl_ticket'];
				tekbok = '<b>Nomer Booking:</b> ' + nobok + '<br><img alt=\"' + nobok + '\" src=\"http://lakupon.com/main/barcode?codetype=Code128&size=40&text=' + nobok + '&print=true\" /><br><b>Tanggal Kedatangan:</b> ' + tabok + '<br><b>Sesi Kedatangan:</b>';

				tekbok = tekbok + ($dabok['shift']) ? ' Sore' : ' Pagi';
			}
		}

		ini['data']['dabok'] = dabok;
		ini['data']['nobok'] = nobok;
		ini['data']['tabok'] = tabok;
		ini['data']['tekbok'] = tekbok;
		let now = new Date();
		// var datenow = date.format(now, 'YYYY-MM-DD HH:mm:ss');
		ini['data']['datenow'] = this.date_mutator(null, 'YYYY-MM-DD HH:mm:ss');

		var image = ini['data']['image'];
		ini['data']['eko'] = image;
		var html = this.render_template('print_coupon_mobile.html',ini)

		return html;
	},
	day_name: function(day=null, type="short") {
		if(type === "short") {
			var day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		}
		if(type === "long") {
			var day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		}
		if(day === null) {
			return day_names;
		}
		return day_names[day];
	},
	month_name: function(month=null, type="short") {
		if(type === "short") {
			var month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		}
		if(type === "long") {
			var month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		}
		if(month === null) {
			return month_names;
		}
		return month_names[month];
	},
	date_mutator: function(whatever=null, date_format="YYYY-MM-DD hh:mm:ss", output=null) {
		var new_time = {};
		if(whatever){
			new_time = new Date(whatever);
		} else {
			new_time = new Date();
		};
		if(output === "unix")
		{
			date_format="YYYY-MM-DD hh:mm:ss";
		}
		date_format = date.format(new_time, date_format);
//            var cd = {};
//            cd['YYYY'] = new_time.getFullYear();
//            cd['MM'] = two_digit(new_time.getMonth()+1);
//            cd['DD'] = two_digit(new_time.getDate());
//            cd['hh'] = two_digit(new_time.getHours());
//            cd['mm'] = two_digit(new_time.getMinutes());
//            cd['ii'] = two_digit(new_time.getSeconds());
//            var available = ['YYYY', 'MM', 'DD', 'hh', 'mm', 'ii'];
//            available.forEach(function(v){
//                var regexp = reg(v);
//                date_format = date_format.replace(regexp, cd[v]);
//            });
		if(output === "unix")
		{
			var t = date_format.split(/[- :]/);
			var d = new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
			var date_format = Math.round((d).getTime() / 1000);
			date_format = String(date_format);
		}
		return date_format;
	},
//	hour_min_sec: function(){		
//		var new_time = new Date();
//		var hour = new_time.getHours();
//		var minute = new_time.getMinutes();
//		var second = new_time.getSeconds();
//		var hhmmii = hour+":"+minute+":"+second;
//		return hhmmii
//	},
//	date_mysql: function(datum){
//		var datenow = date.format(datum, 'YYYY-MM-DD HH:mm:ss');
//		return datenow;
//	},
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
	}
}
