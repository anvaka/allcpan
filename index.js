var rp = require('request-promise');
var fs = require('fs');
var page = 0;
var outFile = 'cpan_dist.json';
var perPage = 5000;
var url = 'http://api.metacpan.org/v0/distribution/_search?q=name:*&size=' + perPage + '&fields=name&from=';
var results = [];

getDistributions(0);

function getDistributions(page) {
  var from = (perPage * page);
  console.log("getting page " + page + ', starting from ' + from);
  rp(url + from)
    .then(save);

  function save(res) {
    res = JSON.parse(res);
    var total = parseInt(res.hits.total, 10);
    var hits = res.hits.hits.map(toId);
    for (var i = 0; i < hits.length; ++i) {
      results.push(hits[i]);
    }

    if (total - from > perPage) {
      getDistributions(page + 1)
    } else {
      fs.writeFileSync(outFile, JSON.stringify(results), 'utf8');
      console.log('Done. Saved ' + results.length + ' getDistributions');
    }
  }
}


function toId(x) {
  return x._id;
}
