const url = require('url'); 
var exports = module.exports = {
	api_url 	: 'http://localhost:8084/',
	cdn_url 	: 'https://cdn.ndc.com/cdn/',
	front_url 	: 'https://lakupon.com/',
}

exports.api_id = url.parse(module.exports.api_url)