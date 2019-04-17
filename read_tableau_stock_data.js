async function fetchTableauStockData(){
  const startURL = 'https://query.data.world/s/m532vzhcaksmm3dbtbt3vqwpgo275f';
  const startFetchResult = fetch(startURL);
  const startResponse = await startFetchResult;
  const newFetchResult = fetch(startResponse.url);
  const rawData = await newFetchResult;
  const dataStr = await rawData.text();

  var allTextLines = dataStr.split(/\r\n|\n/);
  var headers = allTextLines[0].split(',');
  var lines = [];

  for (var i=1; i<allTextLines.length; i++) {
    var data = allTextLines[i].split(',');
    if (data.length == headers.length) {
      var tarr = {};
      for (var j=0; j<headers.length; j++) {
        if (headers[j] == "Date"){
          var datevalues = data[j].split("-");
          tarr[headers[j]] = new Date(parseInt(datevalues[0]), parseInt(datevalues[1]) -1, parseInt(datevalues[2]));
          //console.log("Date:", data[j], datevalues, tarr[headers[j]]);
        }
        else if (headers[j] == "Volume") {
          tarr[headers[j]] = parseInt(data[j]);
        }
        else {
          tarr[headers[j]] = parseFloat(data[j]);
        }
      }
      lines.push(tarr);
    }
  }
  console.table(headers);
  console.table(lines);
  return lines;
}

async function processData(){
  const fetchData = fetchTableauStockData();
  const dataset = await fetchData;
  console.log("Length: " + dataset.length);

  const w = 600;
  const h = 600;
  const topmargin = 150;
  const padding = 40;

  const xScale = d3.scaleTime()
                   .rangeRound([0, w - 2*padding])
                   .domain(d3.extent(dataset, (d) => d["Date"]));

  const yScale = d3.scaleLinear()
                   .domain([0, d3.max(dataset, (d) => d["Close"])])
                   .range([h - topmargin - padding, 0]);

  const svg = d3.select("svg")
                .attr("width", w)
                .attr("height", h);

  // create a g to group header elements
  var header_g = svg.append("g")
                    .attr("transform",
                          "translate(" + padding + ", 0)");

  const avgClose = d3.mean(dataset, (d) => d["Close"]);

  header_g.append("text")
          .text("### weeks")
          .attr("text-anchor", "middle")
          .attr("x", 0.25 * (w - 2*padding))
          .attr("y", topmargin/2);

  header_g.append("text")
          .text("Above " + avgClose.toFixed(1))
          .attr("text-anchor", "middle")
          .attr("x", 0.25 * (w - 2*padding))
          .attr("y", topmargin/2 + 15);

  header_g.append("text")
          .text("# weeks")
          .attr("text-anchor", "middle")
          .attr("x", 0.75 * (w - 2*padding))
          .attr("y", topmargin/2);

  header_g.append("text")
          .text("Below " + avgClose.toFixed(1))
          .attr("text-anchor", "middle")
          .attr("x", 0.75 * (w - 2*padding))
          .attr("y", topmargin/2 + 15);

  // create a g to group the chart elements
  var g = svg.append("g")
             .attr("transform",
                   "translate(" + padding + "," + topmargin + ")");

  // add scatter plot
  g.selectAll("circle")
     .data(dataset)
     .enter()
     .append("circle")
     .attr("cx", (d, i) => xScale(d["Date"]) )
     .attr("cy", (d, i) => yScale(d["Close"]))
     .attr("r", 2);

  // add labels
  g.selectAll("text")
      .data(dataset)
      .enter()
      .append("text")
      .text((d, i) => {
        if (i==0 || i == dataset.length - 1){
          return parseInt(d["Close"]);
        }
      })
      .attr("x", (d, i) => xScale(d["Date"]))
      .attr("y", (d, i) => yScale(d["Close"]));

   // add x and y axes
   const xAxis = d3.axisBottom(xScale);
   const yAxis = d3.axisLeft(yScale);

   g.append("g")
      .attr("transform", "translate(0," + (h - topmargin - padding) + ")")
      .call(xAxis)
      ;

   g.append("g")
    .call(yAxis)
    .append("text")
    .attr("fill", "#000")
    .attr("dy", "0.71em")
    .attr("transform", "translate(-32," + (0.5*(h - topmargin - padding)) + ")" +
                       "rotate(-90)")
    .text("Price ($)");

   // draw the line path
   var line = d3.line()
                .x(function(d) { return xScale(d["Date"])})
                .y(function(d) { return yScale(d["Close"])})
   ;

   g.append("path")
    .datum(dataset)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", line);

    // draw reference line
    var referenceLine = d3.line()
                          .x(function(d) { return xScale(d["Date"])})
                          .y(yScale(avgClose));
    g.append("path")
     .datum([dataset[0], dataset[dataset.length-1]])
     .attr("stroke", "LightSlateGray")
     .attr("stroke-width", 1.5)
     .style("stroke-dasharray", ("3, 1"))
     .attr("d", referenceLine);
}

processData();
