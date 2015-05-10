var fs = require('fs');
var getGraph = require('./convertToGraph.js');

module.exports = loadGraph;

function loadGraph() {
  var index = getJSON(process.argv[2] || './cpan_dist.json');
  var revDeps = getJSON(process.argv[3] || './cpan_reverse_deps.json');
  return getGraph(index, revDeps);
}

function getJSON(name) {
  return JSON.parse(fs.readFileSync(name, 'utf8'));
}
