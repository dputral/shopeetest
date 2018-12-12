
var transaction = {
    get_deal_purchases: async function (transaction_id) {
        var sql = "SELECT dpc.*, dpp.sku, sc.id as sc_id, sc.payment_code, sc.member_id, sc.`status` AS sc_status \
			FROM deal_purchases dpc \
			LEFT JOIN shopping_carts sc ON dpc.shopping_cart_id = sc.id \
			LEFT JOIN deal_package_prices dpp ON dpc.deal_package_price_id = dpp.id WHERE sc.transaction_id = '"+ transaction_id +"'";
		var result = await lak.db_sync(sql)
		return result
    },
	
}