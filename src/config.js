const { MODE } = require("./blendMode.js");
const description =
  "NFT colection of Pocket Cards";
const baseUri = "ipfs://QmNfPMWLPTEbFpBtPFy4wkYEHRVWcz8dzjziTcPbebzF53";

const layerConfigurations = [
  {
    growEditionSizeTo: 52,
    layersOrder: [
      { name: "Front Card" },
      { name: "Holster" }
    ],
  },
];

const format = {
  width: 800,
  height: 800,
};

const background = {
  generate: true,
  brightness: "80%",
};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 1000000000;

module.exports = {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
};