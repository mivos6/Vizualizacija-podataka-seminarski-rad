
//	<table>
//		<tr>
//			<td id="zaposleni"></td>
//			<td id="neto"></td>
//		</tr>
//	</table>

function showZaposleni() {
	d3.select("body").select("#zaposleni")
			.selectAll("p")
			.data(zaposleni)
			.enter()
			.append("p")
			.text(function(d) {
				return "Djelatnost: " + d.Djelatnost + 
				", Zaposleni: " + d.I_XII;
			})
}

function showNeto() {
	d3.select("body").select("#neto")
			.selectAll("p")
			.data(neto)
			.enter()
			.append("p")
			.text(function(d) {
				return "Djelatnost: " + d.Djelatnost + 
				", Neto: " + d.I_XII;
			})
}

function sumCheck(){
	d3.select("#zaposleni")
			.selectAll("p")
			.data(kategorije)
			.enter()
			.append("p")
			.text(function(d) { return d.name; });

	d3.select("#neto")
			.selectAll("p")
			.data(zaposleni)
			.enter()
			.append("p")
			.text(function(d){ 
				return isSubCategory(d.Djelatnost) ? d.Djelatnost : ""; 
			});

	d3.select("body")
			.append("p")
			.text("Ukupno: " + ukupnoZap.I_XII);

	d3.select("body")
			.append("p")
			.text(function() {
				var suma = 0;
				for (var i = 0; i < zaposleni.length; i++) {
					if (isCategory(zaposleni[i].Djelatnost))
						suma += zaposleni[i].I_XII;
				}
				return "Zaposleni u kategorijama: " + suma;
			});
	d3.select("body")
			.append("p")
			.text(function() {
				var suma = 0;
				for (var i = 0; i < zaposleni.length; i++) {
					if (isSubCategory(zaposleni[i].Djelatnost))
						suma += zaposleni[i].I_XII;
				}
				return "Zaposleni u potkategorijama: " + suma;
			});
}

function sortData() {
	var index = yearToIndex(currentYear);

	neto[index].sort(function(a, b) {
		return d3.descending(a.I_XII, b.I_XII);
	});

	zaposleni[index].sort(function(a, b) {
		var i = 0,
			j = 0,
			flagA = false,
			flagB = false;

		while (!flagA || !flagB) {
			if (a.Djelatnost != neto[index][i].Djelatnost && !flagA)
				i++;
			else
				flagA = true;
			if (b.Djelatnost != neto[index][j].Djelatnost && !flagB)
				j++;
			else
				flagB = true;
		}

		return d3.descending(neto[index][i].I_XII, neto[index][j].I_XII);
	});
}

//Provjera je li djelatnost pripada kategorijama
function isCategory(element) {
	for (var i = 0; i < kategorije.length; i++) {
		if (element.Djelatnost == kategorije[i].name)
			return true;
	}
	return false;
}

//Provjera je li djelatnost pripada potkategorijama
function isSubCategory(element) {
	for (var i = 0; i < kategorije.length; i++) {
		if (kategorije[i].children.length > 0) {
			for (var j = 0; j < kategorije[i].children.length; j++) {
				if (element.Djelatnost == kategorije[i].children[j].name)
					return true;
			}
		}
		else {
			if (element.Djelatnost == kategorije[i].name)
				return true;
		}
	}
	return false;
}