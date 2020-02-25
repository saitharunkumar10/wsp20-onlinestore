
function sortn_page(){
    auth('prodadmin@test.com',sortn_page_secured,'/login')
}

//let products; //list of products read from db


async function sortn_page_secured() {
    glPageContent.innerHTML = '<h1>Sort by Name</h1>'
    glPageContent.innerHTML += `
    <a href='/home' class="btn btn-outline-primary">Home</a>
    <a href='/show' class="btn btn-outline-primary">Show Product</a>
    <div class="btn-group" role="group">
    <button id="btnGroupDrop1" type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      Show By
    </button>
    <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">       
      <a class="dropdown-item" href="/sortname"  onclick="sortname();" >NAME</a>
      <a class="dropdown-item" href="#"  onclick="sortPrice();">PRICE</a>
    </div>
    </div>
    </br>
    `;


try {
	products = []
	const snapshot = await firebase.firestore().collection(COLLECTION)
		.orderBy("name", "asc")
		.get()
	snapshot.forEach(doc => {
		const { name, summary, price, image, image_url } = doc.data()
		const p = { docId: doc.id, name, summary, price, image, image_url }
		products.push(p)
	})
} catch (e) {
	glPageContent.innerHTML = 'Firebase access error. try again later!<br>' + e
	return
}

//console.log(products)

if (products.length === 0) {
	glPageContent.innerHTML += '<h1>No product in the database</h1>'
	return
}

for (let index = 0; index < products.length; index++) {
	const p = products[index]
	if (!p) continue;
	glPageContent.innerHTML += `
	<div id="${p.docId}" class="card" style="width: 18rem; display:inline-block">
	<img src="${p.image_url}" class="card-img-top">
	<div class="card-body">
	<h5 class="card-title">${p.name}</h5>
	<p class="card-text">${p.price}</br> ${p.summary}</p>
	</div>
	</div>

	`;
}
}
