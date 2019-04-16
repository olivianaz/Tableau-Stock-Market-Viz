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

  const w = 1000;
  const h = 600;
  const padding = 40;

  const xScale = d3.scaleTime()
                   .rangeRound([0, w - 2*padding])
                   .domain(d3.extent(dataset, (d) => d["Date"]));

  const yScale = d3.scaleLinear()
                   .domain([0, d3.max(dataset, (d) => d["Adj Close"])])
                   .range([h - 2*padding, 0]);

  const svg = d3.select("svg")
                // Add your code below this line
                .attr("width", w)
                .attr("height", h);

  var g = svg.append("g")
             .attr("transform",
                   "translate(" + padding + "," + padding + ")");

  // add scatter plot

  g.selectAll("circle")
     .data(dataset)
     .enter()
     .append("circle")
     // Add your code below this line
     .attr("cx", (d, i) => xScale(d["Date"]) )
     .attr("cy", (d, i) => yScale(d["Adj Close"]))
     .attr("r", 2);

   // add labels
   g.selectAll("text")
      .data(dataset)
      .enter()
      .append("text")
      // Add your code below this line
      .text((d, i) => {
        if (i==0 || i == dataset.length - 1){
          return parseInt(d["Adj Close"]);
        }
      })
      .attr("x", (d, i) => xScale(d["Date"]))
      .attr("y", (d, i) => yScale(d["Adj Close"]));

   // add x and y axes
   const xAxis = d3.axisBottom(xScale);
   const yAxis = d3.axisLeft(yScale);

   g.append("g")
      .attr("transform", "translate(0," + (h - 2*padding) + ")")
      .call(xAxis)
      ;

   // Add your code below this line
   g.append("g")
      .call(yAxis)
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
       .attr("dy", "0.71em")
       .attr("text-anchor", "end")
       .text("Price ($)");
}

processData();
