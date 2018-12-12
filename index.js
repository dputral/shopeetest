var maid = require('./include/helper');
global.init = require('./include/init');
global.maid = maid;

const express = require('express');
var upload = require('multer')();
var nunjucks = require('nunjucks');
// con.connect(function(err) {if (err){ throw err;}});
const url = require('url');  
// const querystring = require('querystring');
global.app = express();

app.use(express.static('public'));
// -- lib open
function read(f) {
	return fs.readFileSync(f).toString();
}
function include(f) {
	eval.apply(global, [read(f)]);
}
function openlib() {
	var libfolder = __dirname+'/lib';
	if (fs.existsSync(libfolder)) {
		fs.readdirSync(libfolder).forEach(file => {
			if (/\.js$/.test(file)) {
				var gg = include(libfolder + '/' + file);
			}
		});
	} else {
		console.log('ga ketemu');
	}
}
openlib();
// ------ lib open:end
app.set('view engine', 'html');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});
app.set('views', __dirname + '/views/');
const bodyParser = require("body-parser");

var rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

app.use(bodyParser.json({ verify: rawBodySaver }));
app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.raw({ verify: rawBodySaver, type: '*/*' }));

app.all('/*', function (req, res) {
	req.upload = upload;
	let requestSegments = req.originalUrl.split('?')[0].split('/');
	var fs = require('fs');
	// let path = __dirname+'/app/bima_'+requestSegments[1];
	let path = __dirname+'/app/model';
	
	if (fs.existsSync(path+'.js')) {
		var ex = require(path)(req,res);
		
		if(!requestSegments[2])
		{
			res.status('404').send('ampatkosongampat, silahkan mulai dari <a href="/model/list">sini</a>');return;
		}
		
		var F = eval("ex."+requestSegments[2]);
		if((typeof F ).toLowerCase() == 'function'){
			ret = F();
			return;
		}
		
		res.status('404').send('ampatkosongampat, silahkan mulai dari <a href="/model/list">sini</a>');
		return;
		
	}else{
		res.status('404').send('ampatkosongampat, silahkan mulai dari <a href="/model/list">sini</a>');
		return;
	}
});
var port = 8084;
app.listen(port, () => console.log('Example app listening on port '+port+'!'));