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

function outputDate(dt){
  // create a date string like Monday, December 3, 2018 from Date dt
  var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var month = ["January", "February", "March", "April", "May", "June", "July",
               "August", "September", "October", "November", "December"];
  var dateString =
      weekday[dt.getDay()] + ", " +
      month[dt.getMonth()] + " " +
      dt.getDate() + ", " +
      dt.getFullYear();
  return dateString;
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
  const maxY = d3.max(dataset, (d) => d["Close"]);
  const maxIntraDayRange = d3.max(dataset, (d) => d["High"] - d["Low"]);

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

   // define gradients
   svg.append("linearGradient")
       .attr("id", "temperature-gradient")
       .attr("gradientUnits", "userSpaceOnUse")
       .attr("x1", 0)
       .attr("y1", yScale(0))
       .attr("x2", 0)
       .attr("y2", yScale(avgClose))
     .selectAll("stop")
       .data([
         {offset: "0%", color: "Salmon"},
         {offset: "100%", color: "Salmon"},
         {offset: "100%", color: "SteelBlue"}
       ])
     .enter().append("stop")
       .attr("offset", function(d) { return d.offset; })
       .attr("stop-color", function(d) { return d.color; });

 // prepare tooltip to display for scatterplot
 var tooltip = d3.select("body")
                 .append("div")
                 .attr("class", "tooltip")
                 .text("a simple tooltip");

  // add scatter plot
  g.selectAll("circle")
     .data(dataset)
     .enter()
     .append("circle")
     .attr("cx", (d, i) => xScale(d["Date"]) )
     .attr("cy", (d, i) => yScale(d["Close"]))
     .attr("r", 2)
     .attr("class", "gradient-fill")
     .on("mouseover", function(d){
       var html = "<span style='font-size: 1.2em;'>" + outputDate(d["Date"]) + "</span>" + "<br/>" +
                  "High: " + d["High"].toFixed(2) + "<br/>" +
                  "Low: " + d["Low"].toFixed(2) + "<br/>" +
                  "Close: " + d["Close"].toFixed(2) + "<br/>";

       var tooltipWidth = Math.round(Number(
                                  tooltip.style('width')
                                         // take of 'px'
                                         .slice(0, -2)));
       var barWidth = 50;
       var maxBarHeight = 200;
       var barTopMargin = 20;

       // create the bar representing intra day price range and the scale
       var bars = [{"top":maxY, "bottom": 0, "color": "white", "stroke": "gray"},
                   {"top":d["High"], "bottom": d["Low"], "color": "#D3D3D3", "stroke": "none"}];

       var tooltip_svg = tooltip.html(html)
              .append("svg")
              .attr("transform",
                    "translate(0, " + barTopMargin + ")")
              .attr("height", 500);
       tooltip_svg.selectAll("rect")
              .data(bars)
              .enter()
              .append("rect")
              .attr("x", tooltipWidth/2 - barWidth/2)
              .attr("y", (dt, i) => yScale(dt["top"]))
              .attr("width", barWidth)
              .attr("height", (dt, i) => yScale(dt["bottom"]) - yScale(dt["top"]))
              .attr("fill", (dt, i) => dt["color"])
              .attr("stroke", (dt, i) => dt["stroke"])
              ;

       var curCircle = d3.select(this);

       // create the circle representing closing price
       tooltip.select("svg")
              .append("circle")
              .attr("class", "gradient-fill")
              .attr("cx", tooltipWidth/2)
              .attr("cy", yScale(d["Close"]))
              .attr("r", 2)
              .attr("fill", curCircle.attr("fill"));

       tooltip.style("left", (d3.event.pageX + 15) + "px")
              .style("top", (d3.event.pageY - 28) + "px")
              .style("opacity", 0.9);

     })
     .on("mouseout", function(d){
       tooltip.style("opacity", 0);
     });

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

   // draw the line path with different colors compared to the selected threshold value



   var line = d3.line()
                .x(function(d) { return xScale(d["Date"])})
                .y(function(d) { return yScale(d["Close"])});
   g.append("path")
    .datum(dataset)
    .attr("fill", "none")
    .attr("class", "gradient")
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
     .attr("stroke-width", 0.9)
     .style("stroke-dasharray", ("3, 1"))
     .attr("d", referenceLine);

}

processData();
