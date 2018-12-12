* Installment
- git clone
- pointing your docker console to where this project pulled -- type "docker-compose up --build -d"
- make some coffee.. seriously, it takes a while until its db up ready for running. i think i use "wait-for-it.sh" in a wrong way

* Usage
for browser usage with "NOT Fancy UI",
- 	open your container host address (192.168.99.100) leads with ":22122" to go along with UI Guide, Ex: http://192.168.99.100:22122/
- 	insert data through /model/input, Ex: http://192.168.99.100:22122/model/input
- 	see inserted data list through /model/list, Ex: http://192.168.99.100:22122/model/list

for Poster-fan,
- 	insert data:
	POST /model/input HTTP/1.1 
	Content-Type: application/x-www-form-urlencoded
	
	*	parameter : name=varchar(255)&tax_code=enum(1,2,3)&price=int(10)
	* 	expected properties : 
			{
				"status":int(0,1),
				"message": string("data ['name','tax_code','price'] empty","insert success"),
				"insertId": int(~) // when "status"=1
			}
-	list data:
	GET /model/list HTTP/1.1 
	
	*	parameter : (none)
	*	expected properties : 
			{
			   "summary":{
				  "total_tax":float(~),
				  "price_subtotal":int(~),
				  "grand_total":float(~)
			   },
			   "header":[
				  "name",
				  "tax_code",
				  "type",
				  "refundable",
				  "price",
				  "tax",
				  "amount"
			   ],
			   "item":{
				  "item_0":{
					 "id":1,
					 "name":string("A-z"),
					 "tax_code":int(~),
					 "type":enum(1,2,3),
					 "refundable":enum(0,1),
					 "price":int(~),
					 "tax":int(~),
					 "amount":int(~),
				  },
				  "item_1":..,
				  "item_2":..
			   }
			}

database scheme on root dir "db.story"
