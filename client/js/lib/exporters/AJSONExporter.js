var FileUtil = require('io/FileUtil');
var Object3DUtil = require('geo/Object3DUtil');

/**
 * Export a mesh in Assimp json format
 * @param options
 * @param options.fs File system to use for exporting (defaults to FileUtil)
 * @constructor
 * @memberOf exporters
 */
function JSONExporter(options) {
  options = options || {};
  this.__fs = options.fs || FileUtil;
}

JSONExporter.prototype.export = function(obj, opts) {
  var fileutil = this.__fs;
  opts = opts || {};
  opts.name = opts.name || 'scene';
  opts.dir = opts.dir ? opts.dir + '/' : '';
  var filename = opts.dir + opts.name + '.ajson';
  var callback = opts.callback;

  // Linearize nodes and put meshes into an array
  var indexed = Object3DUtil.getIndexedNodes(obj);
  var nodes = _.map(indexed.nodes, function(node) {
    var meshIds = undefined;
    var childids = undefined;
    if (node instanceof THREE.Mesh) {
      meshIds = [node.geometry.index];
      childIds = undefined;
    } else {
      meshIds = undefined;
      childIds = _.map(node.children, function(x) { return x.index; });
    }
    return {
      id: node.index,
      name: node.name || (node.userData && node.userData.id) || ("node" + node.index),
      transformation: node.matrix.toArray(),
      meshes: meshIds,
      children: childIds
    }
  });
  // TODO: Export meshes and materials
  var meshes;
  // var meshes = _.map(indexed.geometries, function(geometry) {
  //
  // });
  var json = { nodes: nodes, meshes: meshes };
  if (opts.json) {
    _.merge(json, opts.json);
  }
  function finishFile() {
    fileutil.fsExportFile(filename, filename);
    console.log('finished exporting mesh data to ' + filename);
    var leafNodes = _.filter(indexed.nodes, function(x) { return x instanceof THREE.Mesh; });
    json.leafIds = _.map(leafNodes, function(x) { return x.index; });
    if (callback) { callback(null, { indexed: indexed, json: json }); }
  }
  var blob = JSON.stringify(json, null, 2);
  fileutil.fsWriteToFile(filename, blob, finishFile);
};

module.exports = JSONExporter;