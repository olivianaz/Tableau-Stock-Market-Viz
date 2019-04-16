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
      var tarr = [];
      for (var j=0; j<headers.length; j++) {
        tarr.push(data[j]);
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
  const adjCloseColumn = 5;
  console.log("Length: " + dataset.length);
  var adjClose = [];

  for (var i=0; i<dataset.length; i++){
    adjClose.push(parseFloat(dataset[i][adjCloseColumn]));
  }
  console.log("AdjClose: ");
  console.log(adjClose);

  const w = 1000;
  const h = 600;
  const padding = 40;

  const xScale = d3.scaleLinear()
                   .domain([0, dataset.length - 1])
                   .range([padding, w - padding]);

  const yScale = d3.scaleLinear()
                   .domain([0, d3.max(dataset, (d) => parseFloat(d[adjCloseColumn]))])
                   .range([h - padding, padding]);

  const svg = d3.select("svg")
                // Add your code below this line
                .attr("width", w)
                .attr("height", h);

  // add scatter plot
  svg.selectAll("circle")
     .data(dataset)
     .enter()
     .append("circle")
     // Add your code below this line
     .attr("cx", (d, i) => xScale(i) )
     .attr("cy", (d, i) => yScale(parseFloat(d[adjCloseColumn])))
     .attr("r", 2);

   // add labels
   svg.selectAll("text")
      .data(dataset)
      .enter()
      .append("text")
      // Add your code below this line
      .text((d, i) => {
        if (i==0 || i == dataset.length - 1){
          return parseInt(d[adjCloseColumn]);
        }
      })
      .attr("x", (d, i) => xScale(i + 5))
      .attr("y", (d, i) => yScale(parseFloat(d[adjCloseColumn])));

   // add x and y axes
   const xAxis = d3.axisBottom(xScale);
   // Add your code below this line
   const yAxis = d3.axisLeft(yScale);
   // Add your code above this line

   svg.append("g")
      .attr("transform", "translate(0," + (h - padding) + ")")
      .call(xAxis);

   // Add your code below this line
   svg.append("g")
      .attr("transform", "translate(" + padding + ", 0)")
      .call(yAxis);
}

processData();
