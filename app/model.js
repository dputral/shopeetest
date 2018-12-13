module.exports = function (req, res) {  
var fs = require('fs');
const express = require('express');
var app = express();
let requestSegments = req.originalUrl.split('?')[0].split('/');
    
	function completing(oret,price,tax){
		oret.tax = tax;
		oret.amount = price + tax
		return oret;
	}
	function calculate_food(price)
	{
		var ret = {tax:0.0,refundable:0,type:"Food & Beverage",amount:0},tax = 0;
		
		ret.refundable = 1;
		tax = (price * 10)/ 100;
		
		return ret = completing(ret,price,tax);
	}
	function calculate_tobacco(price)
	{
		var ret = {tax:0.0,refundable:0,type:"Tobacco",amount:0},tax = 0;
		
		tax = ((price * 2)/ 100) +10;
		
		return ret = completing(ret,price,tax);
	}
	function calculate_entertainment(price){
		var ret = {tax:0.0,refundable:0,type:"Entertainment",amount:0},tax = 0;
		
		if( price > 100){
			tax = ((price - 100) * 1)/ 100;
		}
		
		return ret = completing(ret,price,tax);
	}
	return {
		input: async function() {
			var post = {};	
			var query = req.query;
			
			post = req.body;

			if(post.name && post.tax_code && post.price)
			{
				var sql = "insert into tax set name='"+post.name+"', tax_code = '"+post.tax_code+"', price ='"+post.price+"'";
				var insert = await maid.db_sync(sql);
				
				if(insert.insertId){
					
					if(query['cli']){
						res.send({
							"status":1,
							"message":"insert success",
							"insertId":insert.insertId
							});
						return;
					}
					
					res.redirect('/model/list');
					return;
				}
				
				res.send(" data inserted failed, <a href='/model/insert'>go to list</a> or <a href='/model/list'>go to list</a>");
				return;
			}
			else
			{	
				if(query['cli']){
					res.send({"status":0,"message":"data ['name','tax_code','price'] empty"});
					return;
				}
				res.render("insert_form.html",null,function(err,html){
					res.send(html)
				})
			}
			return;
			
		},
		
		
		test: async function(){
			res.send("im alright..")
		},
		
		list: async function(){
			var query = req.query;
			var sql = "select * from tax where 1";
			var data = await maid.db_sync(sql);
			var price_subtotal = 0, grand_total = 0, total_tax = 0, header = {},list={};
			if(!data.length){
			
				if(query['cli']){
					res.send([]);
					return;
				}
				
				res.send('Data kosong, mohon mengisi <a href="/model/input">disini</a> ')
				return;
			}
			
			for(var i = 0; i < (data.length); i++ ){
				var temporary = null,page = {total_tax:0,price_subtotal:0,grand_total:0};
				switch(data[i].tax_code){
					case 1:
						temporary = calculate_food(data[i].price);
						break;
					case 2:
						temporary = calculate_tobacco(data[i].price)
						break;
					default:
						temporary = calculate_entertainment(data[i].price)
						break;
				}
				page.total_tax =+ temporary.tax;
				page.price_subtotal =+ data[i].price;
				page.grand_total =+ temporary.amount;
				
				data[i] = Object.assign({},data[i],temporary);
				// reorder
				var reorder = {}
				if(query['cli']){
					reorder.id = data[i].id;
				}
				reorder.name = data[i].name;
				reorder.tax_code = data[i].tax_code;
				reorder.type = data[i].type;
				reorder.refundable = data[i].refundable;
				reorder.price = data[i].price;
				reorder.tax = data[i].tax;
				reorder.amount = data[i].amount;
				data[i]=reorder;
				header = Object.keys(reorder);
				
			}
			
			
			if(query['cli']){
				res.send({"summary":page, "item":data});
				return;
			}
			
			res.render("list.html",{summary:page, header:header, item:data},function(err,html)
			{
				res.send(html)
			})
		}
		
    }
}