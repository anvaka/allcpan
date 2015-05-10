var fs = require('fs');
var Crawler = require('crawler');

var pageSize = 5000;
var chunkSize = 3000;

var outFile = 'cpan_reverse_deps.json';
var inFile = process.argv[2] || './cpan_dist.json';

var index = JSON.parse(fs.readFileSync(inFile)).map(toRequest);

var results = Object.create(null);

var c = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback: indexPackage,
  onDrain: saveAndExit
});

queueChunk();

function queueChunk() {
  if (!index.length) return;
  if (index.length < chunkSize) {
    console.log('Queueing last ' + index.length + ' packages');
    c.queue(index.splice(0, index.length));
  } else {
    console.log('Queueing next ' + chunkSize + ' packages');
    c.queue(index.splice(0, chunkSize));
  }
}

function indexPackage(err, res) {
  if (err) {
    console.log('ERROR: ' + err);
    return;
  }
  var body = JSON.parse(res.body);
  var distName = getName(res);
  if (body.code === 404) {
    console.log('Not found: ' + distName);
    return;
  }
  var hits = body.hits;
  if (!hits) {
    console.log(res.url);
    console.log('No hits. Response: ' + res.body);
  }
  var total = body.hits.total;
  var names = body.hits.hits.map(toName);
  var store = saveHits(distName, names);
  if (store.length < total) {
    // we need to index more for this package:
    console.log('Need more requests for ' + distName);
    c.queue([
      toRequest(distName, store.length)
    ]);
  } else {
    console.log('Found ' + store.length + ' distributions depnding on ' + distName);
  }
}

function saveHits(distName, hits) {
  var store = getStore(distName);
  for (var i = 0; i < hits.length; ++i) {
    store.push(hits[i]);
  }
  return store;
}

function getStore(distName) {
  var store = results[distName];
  if (!store) {
    store = results[distName] = [];
  }
  return store;
}

function toName(x) {
  return x.fields.distribution;
}

function saveAndExit() {
  var totalFound = Object.keys(results).length;
  console.log('Indexed ' + totalFound + ' distributions');
  fs.writeFileSync(outFile, JSON.stringify(results), 'utf8');
  process.exit(0);
}

function getForm(res) {
  return JSON.parse(res.options.form);
}

function getName(res) {
  var uri = res.uri;
  return uri.substr(uri.lastIndexOf('/') + 1);
}

function toRequest(name) {
  return getRequest(name, 0);
}

function getRequest(name, from) {
  return {
    uri: 'https://api.metacpan.org/search/reverse_dependencies/' + name,
    method: 'POST',
    form: '{ "fields": [ "distribution" ], "filter": { "term": { "status": "latest" } }, "size": ' + pageSize + ', "from": ' + from + ' }'
  };
}
