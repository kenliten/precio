;(function(name){

	'use strict';

	const products = new PouchDB(name);
	const settings = new PouchDB('settings');
	const newProduct = document.getElementById('product-registry');

	var records = [];
	var productList = document.getElementById('products');
	var business = {};

	var isNewProduct = document.getElementById('new-product');

	const _trans = {
		code: 'C&oacute;digo: ',
		name: 'Nombre: ',
		description: 'Descripci&oacute;n: ',
		size: 'Talla: ',
		prices: 'Precios (1-6, 7-12, 12+): '
	}

	products.changes({since: 'now', live: true}).on('change', loadProducts);
	settings.changes({since: 'now', live: true}).on('change', loadSettings);

	function updateUi(){
		document.getElementById('settings-business-name').value = business.name;
		document.getElementById('business-name').innerHTML = business.name;
	}

	async function loadSettings(){
		await settings.get('0').then( r =>{
			for (let field in r){
				business[field] = r[field];
			}
		}).catch( err => {
			console.log(err);

			$('#settings-modal').modal('toggle');
		});

		updateUi();
	}

	async function saveSettings(){
		// bn = business name
		let bn = document.getElementById('settings-business-name');

		await settings.get('0').then( r => {
			r.name = bn.value;

			return r;
		}).then( r => {
			settings.put(r);
		}).catch(err => {
			let doc = {
				_id: '0',
				name: bn.value
			};
			settings.put(doc);
		});

		$('#settings-modal').modal('hide');
	}

	async function saveProduct(){
		let productCode = document.getElementById('product-code').value;
		let productName = document.getElementById('product-name').value;
		let productDescription = document.getElementById('product-description').value;
		let productSize = document.getElementById('product-size').value;
		let priceBase = parseInt(document.getElementById('product-cost').value);

		let productPrices = new Array();
		productPrices.push([priceBase + Math.round(priceBase * .16)]);
		productPrices.push([priceBase + Math.round(priceBase * .24)]);
		productPrices.push([priceBase + Math.round(priceBase * .35)]);

		let doc = {
			_id: productCode,
			code: productCode,
			name: productName,
			description: productDescription,
			size: productSize,
			prices: productPrices
		};

		console.log(doc);

		await products.put(doc).then( result =>{
			return true;
		}).catch( err =>{
			console.log(err);
		});

		$('#product-registry-modal').modal('hide');
	}

	async function loadProducts(){
		await products.allDocs({include_docs: true}).then( result =>{
			let rows = result.rows;
			productList.innerHTML = '';
			records = [];
			for (let row = 0; row < rows.length; row++){
				records.push(rows[row].doc);
			}

			showRegistry();
		}).catch( err =>{
			throw err;
		})
	}

	async function seeProduct(record){
		let base = document.createElement('div');
		base.className = 'container-fluid';
		for (let field in _trans){
			let b = document.createElement('b');
			b.innerHTML = _trans[field];
			let p = document.createElement('p');
			p.appendChild(b);
			if (field != 'prices'){
				p.innerHTML += records[record][field];
			}else{
				p.innerHTML += 'RD$' + records[record][field].join('.00, RD$');
			}
			base.appendChild(p);
		}
		document.getElementById('product-details').innerHTML = '';
		document.getElementById('product-details').appendChild(base);

		$('#product-details-modal').modal();

		document.getElementById('product-details-edit-button').addEventListener('click', e => {
			openProductEdit(record);
			$('#product-details-modal').modal('toggle');
		});
	}

	function openProductEdit(record){
		document.getElementById('product-edit-target').value = records[record]._id;

		let editCode = document.getElementById('product-edit-code');
		editCode.value = records[record].code;

		let editName = document.getElementById('product-edit-name');
		editName.value = records[record].name;

		let editDescription = document.getElementById('product-edit-description');
		editDescription.value = records[record].description;

		let editSize = document.getElementById('product-edit-size');
		editSize.value = records[record].size;

		let editPrices = document.getElementById('product-edit-prices');
		editPrices.value = records[record].prices;

		$('#product-edit-modal').modal();
	}

	async function editProduct(){

		let editTarget = document.getElementById('product-edit-target').value;

		let editCode = document.getElementById('product-edit-code').value;
		let editName = document.getElementById('product-edit-name').value;
		let editDescription = document.getElementById('product-edit-description').value;
		let editSize = document.getElementById('product-edit-size').value;
		let editPrices = document.getElementById('product-edit-prices').value.split(',');

		await products.get(editTarget).then( r => {
			r.code = editCode;
			r.name = editName;
			r.description = editDescription;
			r.size = editSize;
			r.prices = editPrices;

			return r;
		}).then( r => {
			products.put(r);
		}).catch(err => {
			console.log(err);
		});

		$('#product-edit-modal').modal('hide');
	}

	async function deleteProduct(record){
		await products.get(record).then( r => {
			products.remove(r);
		});
	}

	function showRegistry(){
		let c = document.getElementById('products');
		c.innerHTML = '';

		for (let record in records){

			let code = document.createElement('td');
			code.innerHTML = records[record].code;

			let name = document.createElement('td');
			name.innerHTML = records[record].name;

			let description = document.createElement('td');
			description.innerHTML = records[record].description;

			let size = document.createElement('td');
			size.innerHTML = records[record].size;

			let prices = document.createElement('td');
			prices.innerHTML = 'RD$' + records[record].prices.join(', RD$') + '.00';

			let actions = document.createElement('td');

			let seeAction = document.createElement('a');
			seeAction.className = 'product-action';
			seeAction.href = '#';
			seeAction.title = 'Ver';
			seeAction.innerHTML = '<i class="fas fa-eye"></i>&nbsp;';
			seeAction.addEventListener('click', e => {
				seeProduct(('' + record));
			});

			actions.appendChild(seeAction);

			let editAction = document.createElement('a');
			editAction.className = 'product-action';
			editAction.href = '#';
			editAction.title = 'Editar';
			editAction.innerHTML = '<i class="fas fa-edit"></i>&nbsp;';
			editAction.addEventListener('click', e => {
				openProductEdit(('' + record));
			});

			actions.appendChild(editAction);

			let deleteAction = document.createElement('a');
			deleteAction.className = 'product-action';
			deleteAction.href = '#';
			deleteAction.title = 'Eliminar';
			deleteAction.innerHTML = '<i class="fas fa-trash"></i>';
			deleteAction.addEventListener('click', e => {
				deleteProduct(('' + records[record].code));
			});

			actions.appendChild(deleteAction);

			let tr = document.createElement('tr');

			tr.appendChild(code);
			tr.appendChild(name);
			tr.appendChild(description);
			tr.appendChild(size);
			tr.appendChild(prices);
			tr.appendChild(actions);

			c.appendChild(tr);
		}
	}
	document.getElementById('new-product-submit').addEventListener('click', saveProduct);
	document.getElementById('settings-save').addEventListener('click', saveSettings);
	document.getElementById('edit-product-submit').addEventListener('click', editProduct);

	loadSettings();
	loadProducts();

})( 'products' );
