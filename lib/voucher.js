
	async function get_voucher_by_param(param)
	{
		var sql = "select \
				(select count(scs.id) from shopping_carts scs where 1 and UPPER(scs.voucher_code) = '" + param['voucher_code'] + "' and scs.created_at between (now() - INTERVAL vcr.interval_per_usage DAY) and now() and (scs.status = 4 or scs.status = 1)) daily_used, \
				(select count(scs.id) from shopping_carts scs where 1 and scs.member_id = '" + param['member_id'] + "' and UPPER(scs.voucher_code) = '" + param['voucher_code'] + "' and scs.created_at  \
				between STR_TO_DATE(CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'),' 00:00:00'), '%Y-%m-%d %H:%i:%s') - INTERVAL (vcr.interval_per_usage - 1) DAY and now() and (scs.status = 4 or scs.status = 1)) member_x_interval, \
				(select count(scs.id) from shopping_carts scs where 1 and UPPER(scs.voucher_code) = '" + param['voucher_code'] + "' and scs.created_at between STR_TO_DATE(CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'),' 00:00:00'), '%Y-%m-%d %H:%i:%s') - INTERVAL (vcr.interval_voucher - 1) DAY and now() and (scs.status = 4 or scs.status = 1)) voucher_x_interval, \
				vcr.daily_dosage as member_dosage, vcr.interval_per_usage as interval_member, vcr.*, vty.name,vty.info,group_concat(vsku.sku) implemented, \
				(select count(distinct(scs.id)) from shopping_carts scs where scs.voucher_code=vcr.code \
				 and scs.created_at between vcr.start and vcr.end and (scs.status = 4 or scs.status = 1)) voucher_used, \
				(select count(distinct(scu.id)) from shopping_carts scu where scu.voucher_code=vcr.code \
				and (scu.status=1 or scu.status=4) \
				and scu.member_id = '" + param['member_id'] + "' and scu.created_at between vcr.start and vcr.end) member_used \
						from vouchers vcr \
						left join ref_voucher_types vty on vcr.voucher_type = vty.id \
						left join voucher_skus vsku on vsku.voucher_id = vcr.id \
						left join shopping_carts sc on (sc.voucher_code=vcr.code and sc.member_id = '" + param['member_id'] + "' \
						and if(vcr.interval_per_usage>0,(sc.created_at between (now() - INTERVAL vcr.interval_per_usage DAY) and now()),0) \
								) \
				where  vcr.code = '" + param['voucher_code'] + "' \
				and (now() BETWEEN vcr.start AND vcr.end) and taken = 0 \
				group by vcr.id";
		var vcr = (await lak.db_sync(sql))[0];
		return vcr;
	}
	async function get_voucher_by_code(param)
	{
		var sql = "select vcr.*,vty.name,vty.info,group_concat(vsku.sku) implemented \
					from vouchers vcr \
					left join ref_voucher_types vty on vcr.voucher_type = vty.id \
					left join voucher_skus vsku on vsku.voucher_id = vcr.id \
					#	left join voucher_payment_type vpt on vpt.voucher_id = vcr.id \
					where  vcr.code = '" + param['voucher_code'] + "' \
					and (now() BETWEEN vcr.start AND vcr.end) and taken = 0 \
					group by vcr.id";
		var vcr = (await lak.db_sync(sql))[0];
		return vcr;
	}
    var voucher = {
        a:
            {
		get_voucher_disc: async function(param, mode_all=false)
		{
            var ret = param['ret'];
			ret['message'] = "promo code not found or inactive or cart is empty or cart item is not right";
			
			if(lak.key_intersect(Object.keys(param), ['transaction_id', 'voucher_code']))
			{
				return {"status":false,"message":"data incomplete","pos": "voc1"};
			}
			if(lak.exist(param['check_only']) || lak.is_empty(param['check_only']))
			{
				param['check_only'] = false;
			}
			var pergi = await transaction.get_deal_purchases(param['transaction_id']);
            var vcr = {};
			if(mode_all)
			{	
				
				vcr = await get_voucher_by_code(param);
                if(lak.is_empty(vcr) == true) { ret['message'] = "promo code not found or inactive"; }
			}
			else
			{
				if(lak.is_empty(param['member_id'])){res.send(ret);return;};
//				if(lak.is_empty(param['member_id']))
//				{
//					return {"status":false,"message":"data incomplete","pos": "voc2"};
//				}
				vcr = await get_voucher_by_param(param);
			}
			if (lak.is_empty(vcr) === false)
			{
				if(lak.is_empty(vcr['id'])){res.send(ret);return;};
//				if(vcr['id'] == null)
//				{
//					return ret;
//				}
				var payment_type = vcr['payment_type_id'].split(',');
				if(param['check_only'] == false)
				{
					var day_allow = 1;
					var time_allow = 1;
					if (vcr['day_allow'])
					{
						var day_list = vcr['day_allow'];
						var d = new Date();
						var echo_today = general.day_name(d.getDay(), 'long');
						if (day_list.indexOf(echo_today) > -1)
						{
								day_allow = 1;
						} else
						{
								day_allow = 0;
						}
					}
					if (vcr['time_period_start'] != null && vcr['time_period_end'] != null)
					{
					
					var hhmmii = general.date_mutator(null,"hh:mm:ii"); // 2001 is a boilerplate pinpoint -- not a debuging dummy
					var new_time = Date.parse("01/01/2001 " + hhmmii)
							if (new_time <= Date.parse("01/01/2001 " + vcr['time_period_start']))
							{
									time_allow = 0;
							}
							if (new_time >= Date.parse("01/01/2001 " + vcr['time_period_end']))
							{
									time_allow = 0;
							}
					}
				}
				
				var price = 0;
				var shipping_cost = 0;
				var prd_prc = {}
				var peri = {}
				prd_prc['quantity'] = 0;
				Object.keys(pergi).forEach(function(v, k)
				{
					prd_prc['quantity'] = prd_prc['quantity'] + pergi[k]['quantity']
					shipping_cost += shipping_cost + pergi[k]['shipping_cost']
					price = price + (pergi[k]['price'] * pergi[k]['quantity'])
					peri[pergi[k]['deal_package_price_id']] = {}
					peri[pergi[k]['deal_package_price_id']] = pergi[k]
				})
				
				prd_prc['real_price'] = price;
				prd_prc['shipping_cost'] = shipping_cost;
				var condition_meet = 0;
				if(param['check_only'])
				{
					if((vcr['interval_member'] < 1 || vcr['member_dosage'] > vcr['member_x_interval']) //member_limit
					&& (vcr['interval_voucher'] < 1 || vcr['voucher_dosage'] > vcr['voucher_x_interval']) //voucher_limit
					&& prd_prc['real_price'] >= vcr['minimum_payment'])
					{
						condition_meet = 1;
					}
				} else
				{
					if((vcr['interval_member'] < 1 || vcr['member_dosage'] > vcr['member_x_interval']) //member_limit
					&& (vcr['interval_voucher'] < 1 || vcr['voucher_dosage'] > vcr['voucher_x_interval']) //voucher_limit
					&& (prd_prc['real_price'] >= vcr['minimum_payment']) && day_allow == 1 && time_allow == 1  && (prd_prc['real_price'] >= vcr['minimum_payment']) )
					{
						if(!lak.is_empty(param['payment_type_id'])){
							var payment_type_id = [param['payment_type_id']];
						
							if(payment_type.includes(param['payment_type_id']))
							{
								condition_meet = 1;
							}
						} else {
							condition_meet = 1;
						}
					}
					
				}
				if (condition_meet != 0)
				{
					
					if (vcr['voucher_type'] == 1 || vcr['voucher_type'] == 3 || vcr['voucher_type'] == 2 || vcr['voucher_type'] == 4)
					{
						var kembali = {}
						if (typeof vcr != "undefined" || vcr != null)
						{
							if (vcr['implemented'] != null)
							{
								var implement = vcr['implemented'].split(',');
							}
						}
						else
						{
							kembali['tot_dis'] = 0;
							return kembali
						}
						var vcr_flg = 0;
						var disc_purc = 0;
						var tot_dis = 0;
						var price = 0;
						var ret = {}
						var sqldp_up = {}
						if (peri)
						{
							Object.keys(peri).forEach(function(v, k)
							{
								price = price + (peri[v]['price'] * peri[v]['quantity']);
								if (lak.exist(implement) && implement.indexOf(peri[v]['sku']) != - 1)
								{
									if (vcr['voucher_type'] == 2 || vcr['voucher_type'] == 4)
									{
										disc_purc = ((peri[v]['price'] * vcr['percent'] / 100) + vcr['ammount']) * peri[v]['quantity'];
									}
									if (vcr['voucher_type'] == 1 || vcr['voucher_type'] == 3)
									{
										disc_purc = (peri[v]['price'] * vcr['percent'] / 100) + vcr['ammount'];
									}
									disc_purc = disc_purc - disc_purc % 1000
									tot_dis = tot_dis + disc_purc

									ret['dpp_disc'] = {}
									ret['dpp_disc'][peri[v]['id']] = disc_purc

									sqldp_up = '(' + peri[v]['id'] + ',' + disc_purc + ')'
								}
								else
								{
									sqldp_up = '(' + peri[v]['id'] + ',0)'
								}
							})
						}

						if (price < vcr['minimum_payment'])
						{
							tot_dis = 0;
						}
						var checker = "INSERT INTO deal_purchases (id,discount) VALUES " + sqldp_up.split(',') + " ON DUPLICATE KEY UPDATE discount= values (discount)";
						var result = await lak.db_hit(checker)
						if (result.affectedRows > 0)
						{
							delete ret['dpp_disc'];
						}

						ret['tot_dis'] = tot_dis;
						ret['voucher_id'] = vcr['id'];
						if (vcr['voucher_type'] == 1 || vcr['voucher_type'] == 2)
						{
							ret['burn'] = true;
						}
						else
						{
							ret['burn'] = false;
						}

						if (vcr['member_id'] != null && vcr['member_id'] != d_pack_prc[0]['member_id'])
						{
							ret['tot_dis'] = 0;
							ret['voucher_id'] = vcr['id'];
							ret['burn'] = false;
						}
						
					}
					if (vcr['voucher_type'] == 5 || vcr['voucher_type'] == 6)
					{
						cost = 0;
						ret = {};
						pergi.forEach(function(item){
						cost += item['price'] * item['quantity'];
						})
						if (vcr['voucher_type'] == 5)
						{
							ret['tot_dis'] = (cost * vcr['percent'] / 100) + vcr['ammount'];
							ret['voucher_id'] = vcr['id'];
							ret['burn'] = true;
						}
						else if (vcr['voucher_type'] == 6)
						{
							ret['tot_dis'] = (cost * vcr['percent'] / 100) + vcr['ammount'];
							ret['voucher_id'] = vcr['id'];
							ret['burn'] = false;
						}

						if (vcr['member_id'] != null && vcr['member_id'] != pergi[0]['member_id'])
						{
							ret['tot_dis'] = 0;
							ret['voucher_id'] = vcr['id'];
							ret['burn'] = false;
						}
					}
					if(vcr['is_cashback']){
						ret['cashback']=ret['tot_dis'];
						ret['tot_dis']="0";
					}
					
				}
			}
			else
			{
			
				ret['tot_dis'] = 0;
				ret['voucher_id'] = null;
				ret['burn'] = false;
			}
		if(lak.is_empty(vcr) === false)
		{
			ret['member_dosage'] = (vcr['member_dosage'] != undefined)?vcr['member_dosage']:null;
			ret['voucher_used'] = (vcr['voucher_used'] != undefined)?vcr['voucher_used']:null;
			ret['member_used'] = (vcr['member_used'] != undefined)?vcr['member_used']:null;
			ret['minimum_payment'] = (vcr['minimum_payment'] != undefined)?vcr['minimum_payment']:null;
			ret['tot_dis'] = ret['tot_dis'] > vcr['max_disc'] && vcr['max_disc']?vcr['max_disc']:ret['tot_dis'];
			
			// $data['tot_dis']=$data['tot_dis']>0?(substr_replace($data['tot_dis'], '000', -3, 3)):0;
		}
		
		if(typeof ret['cashback'] == 'undefined'){ret['cashback'] = 0;}
		return ret;

		}
	}
}