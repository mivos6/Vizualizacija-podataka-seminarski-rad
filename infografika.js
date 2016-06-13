var loadingProgress = 0,
	kategorije, 
	zaposleni = [], 
	neto = [], 
	ukupnoZap = [], 
	prosjekNeto = [], 
	currentYear = 2013,
	currentMonth = 1;

var svgWidth = 800,
	svgHeight = 1000,
	horizontalPadding = 70,
	verticalPadding = 40,
	graphHeight = 400;

var xScale, yScale, rScale, colorScale, alphaScale, rScale ,xAxis, yAxis;
var plotZ, plotN, zeros;	//podaci za iscrtavanje
var criteria = [],			//kriterij za iscrtavanje
	selectedItem,			//ime odabrane stavke u meniju
	index;					//indeks koji pokazuje na podatke za odabranu godinu

var pie, arc;	//za kreiranje piecharta

var lineChartXScale,
	lineChartYScale,
	lineChartXAxis,
	lineChartYAxis;

//inicijalno iscrtavanje grafa
//dodavanje podataka i elemenata u svg
function plotData() {
	//Skaliranje podataka na širinu grafa
	xScale = d3.scale.linear()
        	.domain([(d3.min(plotZ, function(d) { return selectMonth(d); }) - 500), 
        		d3.max(plotZ, function(d) { return selectMonth(d); })])
        	.range([horizontalPadding, svgWidth - horizontalPadding]);
    yScale = d3.scale.linear()
			.domain([(d3.min(plotN, function(d, i) { 
					return selectMonth(d) != 0?selectMonth(d):selectMonth(plotN[i-1]); 
				}) - 100),
				d3.max(plotN, function(d) { return selectMonth(d); })])
        	.range([graphHeight - verticalPadding, verticalPadding]);

    colorScale = d3.scale.category20()
    		.domain(kategorije, function(d) { return d.name; });

    alphaScale = d3.scale.linear()
    		.domain([(d3.min(plotN, function(d, i) { 
					return selectMonth(d) != 0?selectMonth(d):selectMonth(plotN[i-1]); 
				}) - 100),
				d3.max(plotN, function(d) { return selectMonth(d); })])
			.domain([0, d3.max(plotN, function(d) { return selectMonth(d); })]);

	rScale = d3.scale.linear()
			.domain([0, plotZ.length])
			.range([15, 2]);
	var r = rScale(plotZ.length);

    //Koordinatne osi
	xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.ticks(10);
	yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.ticks(10);

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
			.attr("r", r)
			.style("fill", getColor)
			.style("stroke", "black")
			.style("stroke-width", "0.5px")
			.on("mouseover", showTooltip)
			.on("mouseout", hideTooltip)
			.on("mousemove", moveTooltip)
			.on("click", selectInMenu);
}

//Ažuriranje podataka na grafu
function update() {
	//Ponovno skaliranje grafa
	xScale.domain([(d3.min(plotZ, function(d) { return selectMonth(d); }) - 500), 
        d3.max(plotZ, function(d) { return selectMonth(d); })]);
	yScale.domain([(d3.min(plotN, function(d, i) { 
			return selectMonth(d) != 0?selectMonth(d):selectMonth(plotN[i-1]); 
		}) - 100),
		d3.max(plotN, function(d) { return selectMonth(d); })]);

	alphaScale.domain([(d3.min(plotN, function(d, i) { 
					return selectMonth(d) != 0?selectMonth(d):selectMonth(plotN[i-1]); 
				}) - 100),
				d3.max(plotN, function(d) { return selectMonth(d); })])
			.domain([0, d3.max(plotN, function(d) { return selectMonth(d); })]);

	var r = rScale(plotZ.length);

	var graph = d3.select("#graph");

	graph.select("#overlay").remove();
	d3.select("#tooltip").classed("hidden", true);

	//Ažuriranje točaka na grafu
	var circles = graph.selectAll("circle")
			.data(plotZ, getKey)
			.on("mouseover", showTooltip)
			.on("mouseout", hideTooltip)
			.on("mousemove", moveTooltip)
			.on("click", selectInMenu);
			/*
			.on("click", function(d) {
				if (selectedItem == "Sve djelatnosti" || selectedItem == "Sve kategorije")
					return selectInMenu(d);
			});
			*/
	circles.transition("linear")
			.duration(500)
			.attr("r", r)
			.attr("cx", function(d) { return xScale(selectMonth(d)); })
			.attr("cy", function(d, i) { return yScale(selectMonth(plotN[i])); })
	//Dodavanje novih točaka
	circles.enter()
			.append("circle")
			.attr("cx", 0)
			.attr("cy", svgHeight)
			.attr("r", r)
			.style("stroke", "black")
			.style("stroke-width", "0.5px")
			.style("fill", getColor)
			.on("mouseover", showTooltip)
			.on("mouseout", hideTooltip)
			.on("mousemove", moveTooltip)
			.on("click", selectInMenu)
			/*
			.on("click", function(d) {
				if (selectedItem == "Sve djelatnosti" || selectedItem == "Sve kategorije")
					return selectInMenu(d);
			});
			*/
			.transition()
			.duration(500)
			.attr("cx", function(d) { return xScale(selectMonth(d)); })
			.attr("cy", function(d, i) { return yScale(selectMonth(plotN[i])); })
	//Uklanjanje točakakoje se ne prikazuju
	circles.exit().remove();
			
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

//Prikaz tooltip-a
function showTooltip(d, i) {
	d3.select("#tooltip #djelatnost").text(plotZ[i].Djelatnost);
	d3.select("#tooltip #zaposleni").text(selectMonth(plotZ[i]));
	d3.select("#tooltip #neto").text(selectMonth(plotN[i]));
	d3.select("#tooltip")
			.style("top", d3.event.pageY + "px")
			.style("left", d3.event.pageX + "px")
			.classed("hidden", false);

	//Dodavanje overlay-a na graf ili piechart
	var selected = d3.select(this);
	switch (this.nodeName) {
		case "circle":
			var x = selected.attr("cx");
			var y = selected.attr("cy");
			var r = selected.attr("r");
			d3.select("#graph")
					.append("circle")
					.attr("cx", x)
					.attr("cy", y)
					.attr("r", r)
					.attr("id", "overlay")
					.style("fill", "blue")
					.style("opacity", 0.6)
					.style("pointer-events", "none");
			break;
		case "path":
			var d = selected.attr("d");
			d3.select("#infoPanel #pieChart")
					.append("path")
					.attr("d", d)
					.attr("id", "overlay")
					.style("fill", "blue")
					.style("opacity", 0.6)
					.style("pointer-events", "none");
			break;
	}
}

//Promjena pozicije tooltip-a
function moveTooltip() {
	d3.select("#tooltip")
			.style("top", d3.event.pageY + "px")
			.style("left", d3.event.pageX + "px")
}

//Skrivanje tooltip-a
function hideTooltip() {
	d3.select("#overlay").remove();
	d3.select("#tooltip").classed("hidden", true);
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
				updatePieChart(selectedItem);
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
			.attr("class", "item selected")
			.attr("id", "sve_djelatnosti")
			.html("Sve djelatnosti")
			.style("color", "white")
			.style("background-color", "blue");

	menu.append("div")
			.attr("class", "item")
			.attr("id", "sve_kategorije")
			.html("<img src=\"images/plus.png\"> Sve kategorije");
	
	//Kategorije su prva razina
	var level1 = menu.append("div")
			.attr("class", "level1 hidden")
			.selectAll("div")
					.data(kategorije)
					.enter()
					.append("div")
					.attr("class", function(d) { 
						var c = "item";
						if (d.children.length > 0)
							c += " collapsable";
						return c;
					})
					.attr("id", function(d, i) { return "kategorija" + i; })
					.html(function(d) { 
						if (d.children.length > 0) {
							return "<img src=\"images/plus.png\"> " + d.name;
						}
						return d.name; 
					});
	//Djelatnosti su druga razina
	level1.each(function(d, i) {
		d3.select(this.parentNode)
				.insert("div", "#kategorija" + i + " + *")
				.attr("class", "level2 hidden")
				.attr("id", "djelatnosti" + i)
				.selectAll("div")
						.data(d.children)
						.enter()
						.append("div")
						.attr("class", "item")
						.html(function(d) { return d.name; });
	});

	//Otvaranje/zatvaranje razina izbornika
	menu.select("#sve_kategorije").select("img")
			.on("click", function() {
				var l1 = d3.select(".level1");
				var img = d3.select(this);
				if (l1.classed("hidden")) {
					l1.classed("hidden", false);
					img.attr("src", "images/minus.png");
				}
				else {
					l1.classed("hidden", true);
					img.attr("src", "images/plus.png");
				}

			});
	menu.select(".level1").selectAll(".collapsable").each(function() {
		var l2 = d3.select(this.nextSibling);
		var img = d3.select(this).select("img")
				.on("click", function() {
					if (l2.classed("hidden")) {
						l2.classed("hidden", false);
						img.attr("src", "images/minus.png");
					}
					else {
						l2.classed("hidden", true);
						img.attr("src", "images/plus.png");
					}
				});
	});
	
	menu.selectAll(".item")
			//Promjena izgleda elemenata izbornika kod prelaska mišem
			.on("mouseover", function() {
				var item = d3.select(this);
				if (!item.classed("selected")) {
					item.transition()
							.duration(150)
							.style("color", "white")
							.style("background-color", "blue");
				}
			})
			.on("mouseout", function() {
				var item = d3.select(this);
				if (!item.classed("selected")) {
					item.transition()
							.duration(150)
							.style("color", "black")
							.style("background-color", "#CCC");
				}
			})
			//Promjena kriterija za iscrtavanje klikom na kategoriju
			.on("click.select", selectItem);
}

//Odabir stavke klikom miša
function selectItem(d, item) {
	//Defaultna vrijednost selekcije item
	if (typeof item != "object") item = d3.select(this);
	d3.select("#overlay1").remove();
	var currentlySelected = selectedItem;
	
	d3.select("#category_menu").select(".selected")
			.classed("selected", false)
			.transition()
			.duration(150)
			.style("color", "black")
			.style("background-color", "#CCC");
	item.classed("selected", true)
			.transition()
			.duration(250)
			.style("color", "white")
			.style("background-color", "blue");
			
	//Promjena kriterija za iscrtavanje
	criteria = [];
	switch(item.attr("id")) {
		case "sve_djelatnosti": 	//Prikaz svih djelatnosti
			selectedItem = "Sve djelatnosti";
			var count = 0;
			kategorije.forEach(function(d) {
				if (d.children.length > 0) {
					d.children.forEach(function(d) {
						criteria[count++] = d.name;
					});
				}
				else criteria[count++] = d.name;
			});
			break;
		case "sve_kategorije": 		//Prikaz svih kategorija
			selectedItem = "Sve kategorije";
			var count = 0;
			kategorije.forEach(function(d) {
				criteria[count++] = d.name;
			});
			break;
		default:
			selectedItem = item.node().__data__.name;
			var count = 0;
			if (d.children) {		//Ako postoje podkategorije prikazuju se
				if (d.children.length > 0) {
					d.children.forEach(function(d) {
						criteria[count++] = d.name;
					});
				}
				else {
					kategorije.forEach(function(d) {
						criteria[count++] = d.name;
					});
				}
			}
			else {	//Ako nema podkategorija onda prikaži sve podkategorije trenutne grupe
				var parent = getParentCategory(d.name);
				parent.children.forEach(function(d) {
					criteria[count++] = d.name;
				});
			}
	}
	//Izmjena podataka i ponovno iscrtavanje prema kriteriju
	setDataToPlot();
	update();
	updatePieChart(currentlySelected);
	updateLineChart();

	//Dodaj overlay na odabrani dio piechart-a
	d3.select("#overlay1").remove();
	var name = selectedItem;
	//Overlay stavljam samo ako je odabrana podkategorija
	if (name != "Sve djelatnosti" && name != "Sve kategorije" && !(name == getParentCategory(name))) {
		var selected;
		d3.select("#infoPanel #pieChart").selectAll("path")
				.each(function(d) {
					if (d) {
						if (name == d.data.Djelatnost) {
							selected = d3.select(this);
						}
					}
				});
		if (selected) {
			var d = selected.attr("d");
			d3.select("#infoPanel #pieChart")
					.append("path")
					.attr("d", d)
					.attr("id", "overlay1")
					.style("fill", "blue")
					.style("opacity", 0.6)
					.style("pointer-events", "none");
		}
	}
}

//Dodavanje grafike sdodatnim informacijama
function infoPanel() {
	var pieChartRadius = 150;
	//Container za infopanel
	var infoPanel = d3.select("svg")
			.append("g")
			.attr("id", "infoPanel")
			.attr("transform", "translate(300,450)");

	//Funkcije za crtanje piechart-a podkategorija
	pie = d3.layout.pie();
	arc = d3.svg.arc()
			.innerRadius(0)
			.outerRadius(pieChartRadius);

	//Početni kutovi piechart-a su 0
	zeros = [];
	for (var i = 0; i < plotZ.length; i++)
		zeros[i] = 0;
	pieChart = infoPanel.append("g")
			.attr("id", "pieChart")
			.attr("transform", "translate("+pieChartRadius+","+pieChartRadius+")")
			.selectAll("path")
			.data(pie(zeros))
			.enter()
			.insert("path", "*")
			.attr("d", arc)
			.attr("fill", "none");

	//Pamti se trenutni kut radi interpolacije
	pieChart.each(function(d) {
		this.currentStart = d.startAngle;
		this.currentEnd = d.endAngle;
	});

	//Dohvaćanje vrijednosti za iscrtavanje
	pie.value(function(d) { return selectMonth(d); })
			.sort(null);
	//Animacija piechart-a
	pieChart.data(pie(plotZ))
			.on("mouseover", showTooltip)
			.on("mouseout", hideTooltip)
			.on("mousemove", moveTooltip)
			.on("click", function(d) { selectInMenu(d.data); })
			.style("fill", function(d) { return getColor(d.data); })
			.style("stroke", "white")
			.style("stroke-width", "0.5px")
			.transition()
			.delay(function(d, i) { return 5*i; })
			.duration(200)
			.ease("linear")
			.attrTween("d", arcTween);

	//Dodavanje linechart-a
	var clipPath = infoPanel.append("clipPath")
			.attr("id", "linechart-area")
			.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", 2*pieChartRadius+40)
			.attr("height", pieChartRadius+25)
			.attr("transform", "translate(-40,-5)");

	var lineChart = infoPanel.append("g")
			.attr("id", "lineChart")
			.attr("clip-path", "url(#linechart-area)")
			.attr("transform", "translate(40,"+ (2*pieChartRadius + 20) +")");

	lineChartXScale = d3.scale.linear()
        	.domain([1,12])
        	.range([0, 2*pieChartRadius]);
    
    lineChartYScale = d3.scale.linear()
			.domain([d3.min(getNumeric(plotN[0])),
				d3.max(getNumeric(plotN[0]))])
        	.range([pieChartRadius, 0]);

    lineChartXAxis = d3.svg.axis()
			.scale(lineChartXScale)
			.orient("bottom")
			.ticks(12);

    lineChartYAxis = d3.svg.axis()
			.scale(lineChartYScale)
			.orient("left")
			.ticks(10);
	
	//Crtanje osi
	lineChart.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + pieChartRadius + ")")
			.call(lineChartXAxis);
	lineChart.append("g")
			.attr("class", "y axis")
			.call(lineChartYAxis);

	//Crtanje grafa
	var data = getNumeric(plotN[0]);
	var lines = lineChart.selectAll(".graph_line")
			.data(data.slice(0, data.length - 1))
			.enter()
			.append("line")
			.attr("class", "graph_line")
			.attr("id", function(d, i) { return "graph_line" + i})
			.attr("x1", function(d, i) { return lineChartXScale(i + 1); })
			.attr("y1", function(d) { return lineChartYScale(d); })
			.attr("x2", function(d, i) { return lineChartXScale(i + 2); })
			.attr("y2", function(d, i) { return lineChartYScale(data[i + 1]); })
			.style("stroke", "blue");
	var points = lineChart.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.attr("class", "graph_point")
			.attr("id",	function(d, i) { return "graph_point" + i})
			.attr("cx", function(d, i) { return lineChartXScale(i + 1); })
			.attr("cy", function(d) { return lineChartYScale(d); })
			.attr("r", 4)
			.style("fill", "blue");

	//Skrivanje linecharta
	lineChart.selectAll("*")
			.style("opacity", 0);
}

//Ažuriranje piechart-a
function updatePieChart(currentlySelected) {
	if (typeof currentlySelected == "undefined") currentlySelected = selectedItem;
	var pieChart = d3.select("#infoPanel #pieChart").selectAll("path");
	pie = d3.layout.pie();

	if (selectedItem != currentlySelected && 
		getParentCategory(selectedItem) != getParentCategory(currentlySelected)) {
		//Animacija vraćanja piechart-a na 0
		pieChart.data(pie(zeros))
				.transition()
				.delay(function(d, i) { return 5*zeros.length - 5*i; })
				.duration(200)
				.attrTween("d", arcTween)
				.style("stroke-width", "0px");

		//Postavljanje nula na novu dužinu plotZ
		zeros = [];
		for (var i = 0; i < plotZ.length; i++)
			zeros[i] = 0;

		//Dohvaćanje vrijednosti za iscrtavanje
		pie.value(function(d) { return selectMonth(d); })
				.sort(null);
		//Animacija ponovnog popunjavanja piechart-a
		setTimeout(function() {
			pieChart.data(pie(plotZ))
					.on("mouseover", showTooltip)
					.on("mouseout", hideTooltip)
					.on("mousemove", moveTooltip)
					.on("click", function(d) { selectInMenu(d.data, d3.select(this)); })
					.style("fill", function(d) { return getColor(d.data); })
					.transition()
					.delay(function(d, i) { return 5*i; })
					.duration(200)
					.ease("linear")
					.attrTween("d", arcTween)
					.style("stroke-width", "0.5px");
		}, 1000);
	}
	else {
		//Dohvaćanje vrijednosti za iscrtavanje
		pie.value(function(d) { return selectMonth(d); })
				.sort(null);
		//Animacija ponovnog popunjavanja piechart-a
		pieChart.data(pie(plotZ))
				.on("mouseover", showTooltip)
				.on("mouseout", hideTooltip)
				.on("mousemove", moveTooltip)
				.on("click", function(d) { selectInMenu(d.data, d3.select(this)); })
				.transition()
				//.delay(function(d, i) { return 5*i; })
				.duration(200)
				.ease("linear")
				.attrTween("d", arcTween);
	}

	var selected;
	pieChart.each(function(d) {
		if (d) {
			if (selectedItem == d.data.Djelatnost) {
				selected = d3.select(this);
			}
		}
	});
	if (selected) {
		setTimeout(function() {
			var d = selected.attr("d");
			d3.select("#infoPanel #pieChart #overlay1")
					.attr("d", d);
		}, 200);
	}
}

//Ažuriranje linechart-a
function updateLineChart() {
	var lineChart = d3.select("#infoPanel #lineChart");
	if ((selectedItem == "Sve djelatnosti") || (selectedItem == "Sve kategorije")) {
		lineChart.selectAll("*")
				.transition()
				.duration(250)
				.style("opacity", 0);
		return;
	} else {
		lineChart.selectAll("*")
				.transition()
				.duration(250)
				.style("opacity", 1);
	}
	var lines = lineChart.selectAll(".graph_line");
	var circles = lineChart.selectAll(".graph_point");

	var i;
	var index = yearToIndex(currentYear);
	var parent = getParentCategory(selectedItem);
	console.log(parent.name)
	console.log("=============")
	console.log(selectedItem)
	var data;
	if (parent.name == selectedItem) {
		for (i = 0; i < neto[index].length; i++) {
			if (neto[index][i].Djelatnost == selectedItem) {
				data = getNumeric(neto[index][i]);
				break;
			}
		}
	} else {
		for (i = 0; i < plotN.length; i++) {
			if (plotN[i].Djelatnost == selectedItem) {
				data = getNumeric(plotN[i]);
				break;
			}
		}
	}

	lineChartYScale.domain([d3.min(data), d3.max(data)]);

	lines.data(data.slice(0, data.length - 1))
			.transition()
			.delay(250)
			.duration(250)
			.attr("x1", function(d, i) { return lineChartXScale(i + 1); })
			.attr("y1", function(d) { return lineChartYScale(d); })
			.attr("x2", function(d, i) { return lineChartXScale(i + 2); })
			.attr("y2", function(d, i) { return lineChartYScale(data[i + 1]); });
	circles.data(data)
			.transition()
			.delay(250)
			.duration(250)
			.attr("cx", function(d, i) { return lineChartXScale(i + 1); })
			.attr("cy", function(d) { return lineChartYScale(d); });

	lineChart.select(".y.axis")
			.transition("linear")
			.delay(250)
			.duration(250)
			.call(lineChartYAxis);
}

//Odabir djelatnosti u meniju klikom na točku grafa
//(Samo kad su odabrane sve djelatnosti ili sve kategorije)
function selectInMenu(d) {
	var name = d.Djelatnost;
	var menu = d3.select("#category_menu");

	//Collapse-anje prvog nivoa
	menu.select("#sve_kategorije").select("img")
			.attr("src", "images/minus.png");
	var level1 = menu.select(".level1")
			.classed("hidden", false);

	//Traženje indeksa djelatnosti u kategorijama
	var i = 0;
	var parent = getParentCategory(name)
	for (i = 0; i < kategorije.length; i++) {
		if (parent == kategorije[i])
			break;
	}

	if (name == parent.name) {	//određivanje da li je označena kategorija ili podkategorija
		//Označavanje kategorije koja je odabrana
		var s = level1.select("#kategorija" + i)
		selectItem(s.node().__data__, s);
	}
	else {
		//Collapse-anje odgovarajuće kategorije
		level1.select("#kategorija" + i).select("img")
				.attr("src", "images/minus.png");
		var level2 = level1.select("#djelatnosti" + i)
				.classed("hidden", false);

		//Označavanje pdkategorije koja je odabrana 
		level2.selectAll("div").each(function(d) {
			if (name == d.name) {
				selectItem(d, d3.select(this));
			}
		});
	}
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
		loadingProgress++;
		if (loadingProgress >=29)
			initialize();
	});

	d3.json(pathn, function(err, dat) {
		neto[index] = dat;
		prosjekNeto[index] = neto[index].splice(0 ,1)[0];
		loadingProgress++;
		if (loadingProgress >=29)
			initialize();
	});
}

//Pretvaranje godine u odgovarajući indeks niza podataka i obrnuto
function yearToIndex(year) { return year - 2000; }
function indexToYear(index) { return index + 2000; }

//Funkcije za dohvaćanje ključa kod data join-a
function getKey(d) {
	return d.Djelatnost;	//Djelatnost je jedinstveno svojstvo podataka o zaposlenima 
}
function getName(d) {
	return d.name;			//name je jedinstveno svojstvo svake kategorije
}

//Postvljanje podatak za iscrtavanje
function setDataToPlot() {
	plotZ = [];
	plotN = [];
	index = yearToIndex(currentYear);

	var count = 0;
	var i = 0;
	criteria.forEach(function(d) {
		while (zaposleni[index][i].Djelatnost != d) i++;

		plotZ[count] = zaposleni[index][i];
		plotN[count++] = neto[index][i];
	});
}

//Odabir mjeseca, parametar je red u JSON tablici
//Ovisno o varijabli currentMonth odabire se stupac
function selectMonth(d, month) {
	if (typeof month == 'undefined') month = currentMonth;
	switch (month) {
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
			return d.VII;
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

//Vađenje vrijednosti mjeseci za objekt djelatnosti
function getNumeric(d) {
	return [d.I, d.II, d.III, d.IV, d.V, d.VI, d.VII, d.VIII, d.IX, d.X, d.XI, d.XII];
}

//Inicijalno postavi kriterij za iscrtavanje
//tako da se iscrtaju sve djelatnosti
function initialCriteria() {
	selectedItem = "Sve djelatnosti";
	var count = 0;
	kategorije.forEach(function(d) {
		if (d.children.length > 0) {
			d.children.forEach(function(d) {
				criteria[count++] = d.name;
			});
		}
		else criteria[count++] = d.name;
	});
}

//Pronalaženje roditeljske kategorije za neku djelatnost
function getParentCategory(childName) {
	for (var i = 0; i < kategorije.length; i++) {
		if (kategorije[i].name == childName)
			return kategorije[i];
		if (kategorije[i].children.length > 0) {
			var parent = kategorije[i];
			for (var j = 0; j < parent.children.length; j++) {
				if (parent.children[j].name == childName)
					return parent;
			}
		}
	}
	return { name: childName, children: [] };
}

//Custom funkcija za interpolaciju kod animacije piechart-a
function arcTween(d) {
	var interpolateS = d3.interpolate(this.currentStart, d.startAngle);
	var interpolateE = d3.interpolate(this.currentEnd, d.endAngle);

	this.currentStart = interpolateS(1);
	this.currentEnd = interpolateE(1);

	return function(t) {
		d.startAngle = interpolateS(t);
		d.endAngle = interpolateE(t);
		return arc(d);
	};
}

//Podešavanje boje elementa
function getColor(d) {
	return colorScale(getParentCategory(d.Djelatnost).name);
}

//Početno Crtanje grafa
function initialize() {
	svg.selectAll("*").remove();
	initialCriteria();
	setDataToPlot();
	plotData();
	slider();
	categoryMenu();
	infoPanel();
	d3.select("#select")
			.style("visibility", "visible");
	d3.select("#category_menu").classed("hidden", false);
}
