const fs = require("fs");
const path = require("path");
const sha1 = require("sha1");
const { createCanvas, loadImage } = require("canvas");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const buildDir = `${basePath}/build`;
const layersDir = `${basePath}/layers`;
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
} = require(path.join(basePath, "/src/config.js"));
const console = require("console");
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
var metadataList = [];
var attributesList = [];
var attributesList_tmp = [];
var dnaList = [];
var meta_dat =[];
var jsdom = require("jsdom");
var JSDOM = jsdom.JSDOM;
global.document = new JSDOM('localhost').window.document;

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(`${buildDir}/json`);
  fs.mkdirSync(`${buildDir}/images`);
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 0;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  var dna = Number(_str.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    name: layerObj.name,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    blendMode:
      layerObj["blend"] != undefined ? layerObj["blend"] : "source-over",
    opacity: layerObj["opacity"] != undefined ? layerObj["opacity"] : 1,
  }));
  return layers;
};

const saveImage = (_editionCount,_data) => {
  meta_dat = _data.find((meta) => meta.edition == _editionCount);
  if (!fs.existsSync(`${buildDir}/images/front(${meta_dat.attributes['1']['value']})`)){
    fs.mkdirSync(`${buildDir}/images/front(${meta_dat.attributes['1']['value']})`);
}
  fs.writeFileSync(
    `${buildDir}/images/front(${meta_dat.attributes['1']['value']})/${_editionCount - 1}.png`,
    //`${buildDir}/images/front(${meta_dat.attributes['1']['value']})/${meta_dat.attributes['1']['value'].replace(/[^a-zA-Z]+/g, '')} - ${meta_dat.attributes['0']['value'].replace(/[^a-zA-Z]+/g, ' ')} - ${_editionCount - 1}.png`,
    canvas.toBuffer("image/png")
  );
};

const drawBackground = (_newDna) => {
  var fileName = _newDna['1'].substring(3);
  var thenum = fileName.match(/\d+/)[0]
  var loadingImage = loadImage(
    `D:/Git/NFT-Genarator/layers/Bg/bg(${thenum})#1.png`,
    function (img) {
      document.body.appendChild(img)
    }
  )

  loadingImage.then((loadingImage) => {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(loadingImage, 0, 0, format.width, format.height);
  });

};

const addMetadata = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    name: `${attributesList['1']['value'].match(/\d+/g)} - ${attributesList['0']['value'].match(/\d+/g)}`,
    symbol : 'HH',
    description: 'Created by Holdem Hype. HH is composed of 999 unique playing cards and jokers. This NFT gives you a portion of HH`s revenue.',
    seller_fee_basis_points : 500,
    image: `${_edition-1}.png`,
    edition: _edition,
    attributes: attributesList_tmp,
    properties : {
      creators : [{
        address : '3jaeziauVwiX1iMgPPWcMAW1sYZXWFywejg51pwhB41q',
        share : 100
      }],
      files : [{
        uri : `${_edition-1}.png`,
        type : "image/png"
      }]
    },
    collection : {
      name : 'Holdem Hype',
      family : 'Holdem Hype'
    }
  };
  metadataList.push(tempMetadata);
  attributesList = [];
  attributesList_tmp = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name,
  });
  attributesList_tmp.push({
    trait_type: _element.layer.name,
    value: selectedElement.name.replace(/[^a-zA-Z]+/g, ' '),
  });
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const drawElement = (_renderObject) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blendMode;
  ctx.drawImage(_renderObject.loadedImage, 0, 0, format.width, format.height);
  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = [], _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna[index])
    );
    return {
      name: layer.name,
      blendMode: layer.blendMode,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

const isDnaUnique = (_DnaList = [], _dna = []) => {
  let foundDna = _DnaList.find((i) => i.join("") === _dna.join(""));
  return foundDna == undefined ? true : false;
};

const createDna = (_layers) => {
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}`
        );
      }
    }
  });
  return randNum;
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount - 1}.json`,
    JSON.stringify(
      metadataList.find((meta) => meta.edition == _editionCount),
      null,
      2
    )
  );
};

const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(layers);
      if (isDnaUnique(dnaList, newDna)) {
        let results = constructLayerToDna(newDna, layers);
        let loadedElements = [];

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer,newDna));
        });
        
        drawBackground(newDna);

        await Promise.all(loadedElements).then((renderObjectArray) => {
         //ctx.clearRect(0, 0, format.width, format.height);
          renderObjectArray.forEach((renderObject) => {
            drawElement(renderObject);
          });
          addMetadata(newDna, editionCount);
          saveMetaDataSingleFile(editionCount);
          saveImage(editionCount,metadataList);
          console.log(
            `Created edition: ${editionCount}, with DNA: ${sha1(
              newDna.join("")
            )}`
          );
        });
        dnaList.push(newDna);
        editionCount++;
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
      }
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };