var kategorije, 
	zaposleni = [], 
	neto = [], 
	ukupnoZap = [], 
	prosjekNeto = [], 
	currentYear = 2013,
	currentMonth = 1;

var svgWidth = 800,
	svgHeight = 800,
	horizontalPadding = 70,
	verticalPadding = 40,
	graphHeight = 400;

var xScale, yScale, rScale, colorScale, xAxis, yAxis;
var plotZ, plotN;		//podaci za iscrtavanja(uklonjene su kategorije koje objedinjuju više djelatnosti)
var criteria, index;	//kriterij za iscrtavanje, indeks koji pokazuje na podatke za odabranu godinu

//inicijalno iscrtavanje grafa
//dodavanje podataka i elemenata u svg
function plotData() {
	//Skaliranje podataka na širinu grafa
	xScale = d3.scale.linear()
        	.domain([(d3.min(plotZ, function(d) { return selectMonth(d); }) - 1000), 
        		d3.max(plotZ, function(d) { return selectMonth(d); })])
        	.range([horizontalPadding, svgWidth - horizontalPadding]);
    yScale = d3.scale.linear()
			.domain([(d3.min(plotN, function(d, i) { 
					return selectMonth(d) != 0?selectMonth(d):selectMonth(plotN[i-1]); 
				}) - 100),
				d3.max(plotN, function(d) { return selectMonth(d); })])
        	.range([graphHeight - verticalPadding, verticalPadding]);

    colorScale = d3.scale.category10();

    //Koordinatne osi
	xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.ticks(10);
	yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.ticks(15);

	var svg = d3.select("svg")

	//Clip-path za graf(elementi izvan njega se ne vide)
	var clipPath = svg.append("clipPath")
			.attr("id", "graph-area")
			.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", svgWidth)
			.attr("height", graphHeight);
			
	//Dodavanje grafa
	var graph = svg.append("g")
			.attr("id", "graph")
			.attr("clip-path", "url(#graph-area)");
	//Crtanje osi
	graph.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (graphHeight - verticalPadding) + ")")
			.call(xAxis);
	graph.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(" + horizontalPadding + ",0)")
			.call(yAxis);
	//Točke grafa
	var circles = graph.selectAll("circle")
			.data(plotZ, getKey)
			.enter()
			.append("circle")
			.attr("cx", function(d) { return xScale(selectMonth(d)); })
			.attr("cy", function(d, i) { return yScale(selectMonth(plotN[i])); })
			.attr("r", 2)
			.style("fill", function(d, i) { return colorScale(i); })
			.on("mouseover", function(d, i) {	//Prikazivanje tooltipa na prelaz mišem preko točke
				d3.select(this).transition()
						.duration(250)
						.attr("r", 10);
				d3.select("#tooltip #djelatnost").text(d.Djelatnost);
				d3.select("#tooltip #zaposleni").text(selectMonth(d));
				d3.select("#tooltip #neto").text(selectMonth(plotN[i]));
				d3.select("#tooltip")
						.style("top", d3.event.pageY + "px")
						.style("left", function() {
							var xPos = d3.event.pageX;
							return ((xPos > svgWidth/2)?(xPos - 200):xPos) + "px";
						})
						.classed("hidden", false);
			})
			.on("mouseout", function() {	//Uklanjanje tooltipa
				d3.select(this).transition()
						.duration(250)
						.attr("r", 2);
				d3.select("#tooltip").classed("hidden", true);
			});
}

//Ažuriranje podataka na grafu
function update() {
	//Reskaliranje grafa
	xScale.domain([(d3.min(plotZ, function(d) { return selectMonth(d); }) - 1000), 
        d3.max(plotZ, function(d) { return selectMonth(d); })]);
	yScale.domain([(d3.min(plotN, function(d, i) { 
			return selectMonth(d) != 0?selectMonth(d):selectMonth(plotN[i-1]); 
		}) - 100),
		d3.max(plotN, function(d) { return selectMonth(d); })]);

	var graph = d3.select("#graph");

	//Ažuriranje točaka na grafu
	var circles = graph.selectAll("circle")
			.data(plotZ, getKey)
			.on("mouseover", function(d, i) {
				d3.select(this).transition()
						.duration(250)
						.attr("r", 10);
				d3.select("#tooltip #djelatnost").text(d.Djelatnost);
				d3.select("#tooltip #zaposleni").text(selectMonth(d));
				d3.select("#tooltip #neto").text(selectMonth(plotN[i]));
				d3.select("#tooltip")
						.style("top", d3.event.pageY + "px")
						.style("left", function() {
							var xPos = d3.event.pageX;
							return ((xPos > svgWidth/2)?(xPos - 200):xPos) + "px";
						})
						.classed("hidden", false);
			});

	//Pomicanje točaka
	circles.transition("linear")
			.duration(500)
			.attr("cx", function(d) { return xScale(selectMonth(d)); })
			.attr("cy", function(d, i) { return yScale(selectMonth(plotN[i])); })
	//Ponovo iscrtavanje osi
	graph.select(".x.axis")
			.transition("linear")
			.duration(500)
			.call(xAxis)
	graph.select(".y.axis")
			.transition("linear")
			.duration(500)
			.call(yAxis)
}

//Dodavanje slidera za odabir mjeseca u godini
function slider() {
	//Podaci segmenata slidera
	var data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
	var textData = [
		"1.siječanj",
		"2.veljača",
		"3.ožujak",
		"4.travanj",
		"5.svibanj",
		"6.lipanj",
		"7.srpanj",
		"8.kolovoz",
		"9.rujan",
		"10.listopad",
		"11.studeni",
		"12.prosinac"
	];
	//Skala koja preračunava poziciju slidera u br. segmenta
	var sliderScale = d3.scale.quantize()
			.domain([horizontalPadding, (svgWidth - horizontalPadding)])
			.range(data)

	var svg = d3.select("svg");

	//Dodavanje slidera
	var slider = svg.append("g")
			.attr("id", "slider")
			.attr("transform", "translate(0," + graphHeight + ")");
	//Iscrtavanje trake slidera
	var sliderBar = slider.selectAll("rect")
			.data(data)
			.enter()
			.append("rect")
			.attr("x", function(d) { 
				return horizontalPadding + d*(svgWidth - 2*horizontalPadding)/12; 
			})
			.attr("y", 0)
			.attr("width", (svgWidth - 2*horizontalPadding)/12)
			.attr("height", 10)
	//Iscrtavanje slidera
	var sliderPointer = slider.append("circle")
			.attr("cx", horizontalPadding)
			.attr("cy", 5)
			.attr("r", 10);
	//Naslovi segmenata
	var sliderText = slider.selectAll("text")
			.data(textData)
			.enter()
			.append("text")
			.attr("x", function(d, i) { 
				return horizontalPadding + i*(svgWidth - 2*horizontalPadding)/12; 
			})
			.attr("y", 25)
			.text(function(d) { return d; })
			.attr("text-anchor", "middle")
			.attr("transform", function(d) {
				return "translate(" + (svgWidth - 2*horizontalPadding)/12/2 + ",0)";
			});

	//Reakcija slidera na povlačenje mišem
	var drag = d3.behavior.drag()
			.on("dragstart", function() { 
				d3.select(this)
						.transition()
						.duration(250)
						.attr("opacity", 0.7); 
			})
			.on("drag", function() {
				//x pozicija slidera ovisno o pozicij miša
				//ne smije biti manja od početka slidera, tj. veća od kraja
				var pointerPos = d3.max([horizontalPadding, 
						d3.min([(svgWidth - horizontalPadding), d3.event.x])
					]);
				d3.select(this).attr("cx", pointerPos);	//postavljanje slidera na poziciju miša
				var newCurrentMonth = sliderScale(pointerPos) + 1; 	//izračunavanje segmenta i 
																	//postavljanje trenutnog mjeseca
				if (newCurrentMonth != currentMonth) {
					currentMonth = newCurrentMonth;
					update();
				}
			})
			.on("dragend", function() {
				d3.select(this)
						.transition()
						.duration(250)
						.attr("opacity", 1); 
			});
	//Poziv drag funkcije na slideru
	sliderPointer.call(drag);
}

//Dodavanje izbornika kategorija
function categoryMenu() {
	var menu = d3.select("#category_menu");

	menu.append("div")
			.attr("class", "item")
			.html("Sve djelatnosti");

	menu.append("div")
			.attr("class", "item")
			.html("<img src=\"images/minus.png\"> Kategorije");
	

	var level1 = menu.append("div")
			.attr("class", "level1")
			.selectAll("div")
					.data(kategorije)
					.enter()
					.append("div")
					.attr("class", "item")
					.attr("id", function(d, i) { return "e" + i; })
					.html(function(d) { 
						if (d.children.length > 0) {
							return "<img src=\"images/minus.png\"> " + d.name;
						}
						return d.name; 
					});

	level1.each(function(d, i) {
		d3.select(this.parentNode)
				.insert("div", "#e" + i + " + *")
				.attr("class", "level2")
				.selectAll("div")
						.data(d.children)
						.enter()
						.append("div")
						.attr("class", "item")
						.html(function(d) { return d.name; });
	});
}

//Učitavanje podatakaiz .json datoteka i spremanje u niz
//Svaki element niza je JSON tablica za određenu godinu
function loadData(year) {
	var pathz = "zaposleni/rows/"+year+".json",
		pathn = "neto/rows/"+year+".json",
		index = yearToIndex(year);

	d3.json(pathz, function(err, dat) {
		zaposleni[index] = dat;
		ukupnoZap[index] = zaposleni[index].splice(0 ,1)[0];
	});

	d3.json(pathn, function(err, dat) {
		neto[index] = dat;
		prosjekNeto[index] = neto[index].splice(0 ,1)[0];
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

//Pretvaranje godine u odgovarajući indeks niza podataka i obrnuto
function yearToIndex(year) { return year - 2000; }
function indexToYear(index) { return index + 2000; }

//Funkcija za dohvaćanje ključa kod data join-a
function getKey(d) {
	return d.Djelatnost;
}

function getName(d) {
	return d.name;
}

//Postvljanje podatak za iscrtavanje
function setDataToPlot() {
	plotZ = [];
	plotN = [];
	index = yearToIndex(currentYear);

	var count = 0;

	zaposleni[index].forEach(function(d) {
		if (isSubCategory(d))
			plotZ[count++] = d;
	});

	count = 0;

	neto[index].forEach(function(d) {
		if (isSubCategory(d))
			plotN[count++] = d;
	});
}

//Odabir mjeseca, parametar je red u JSON tablici
//Ovisno o varijabli currentMonth odabire se stupac
function selectMonth(d) {
	switch (currentMonth) {
		case 1:
			return d.I;
		case 2:
			return d.II;
		case 3:
			return d.III;
		case 4:
			return d.IV;
		case 5:
			return d.V;
		case 6:
			return d.VI;
		case 7:
			return d.VII
		case 8:
			return d.VIII;
		case 9:
			return d.IX;
		case 10:
			return d.X;
		case 11:
			return d.XI;
		case 12:
			return d.XII;
		default:
			return d.I_XII;
	}
}