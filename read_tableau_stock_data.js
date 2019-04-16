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

}

processData();
