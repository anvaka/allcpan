var createGraph = require('ngraph.graph');

module.exports = convertToGraph;

function convertToGraph(dist, reverseDeps) {
 var graph = createGraph({ uniqueLinkIds: false });
 for (var i = 0; i < dist.length; ++i) {
   var name = dist[i];
   graph.addNode(name);
 }

 var revNames = Object.keys(reverseDeps);

 for (i = 0; i < revNames.length; ++i) {
   var depName = revNames[i];
   var dependants = reverseDeps[depName];

   for (var j = 0; j < dependants.length; j++) {
     graph.addLink(dependants[j], depName);
   }
 }

 return graph;
}
