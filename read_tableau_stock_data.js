const url = 'https://query.data.world/s/m532vzhcaksmm3dbtbt3vqwpgo275f';

fetch(url)
  .then(function(data) {
    console.log(data);
    var new_url = data.url;
    console.log("fetching: " + new_url);
    fetch(new_url)
      //.then((resp) => resp.json())
      .then(function(data) {
        return data.text();
      })
      .then(function(data) {
        var allTextLines = data.split(/\r\n|\n/);
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
      })
    })
  .catch(function(error) {
    console.log(error);
  });
