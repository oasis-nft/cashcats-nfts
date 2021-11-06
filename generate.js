const seededRandom = require("./seeded-random");
const generateCatImage = require("./generateCatImage");
const generateMetadata = require("./generateMetadataJson");
const {genHtml, genRarityMap} = require("./buildHtml");
const {ASSETS_PATH, OUTPUT_PATH, OUTPUT_PATH_META, OUTPUT_PATH_ROOT, SEED, MAX_GEN} = require("./settings");
const fs = require('fs');
const _ = require('lodash');
const web3 = require('web3');
const optionMap = require('./optionMap/optionMap.json');

const optionHash = web3.utils.soliditySha3(JSON.stringify(optionMap));

// the seed used is a combination of a hash of the optionMap and the blockhash of the block in which the last NFT was minted. The optionHash is stored as a constant inside the NFT contract (OPTION_HASH).
const randomSeed = web3.utils.soliditySha3(optionHash, SEED)

const {
  rnd, rndInt, shuffle
} = seededRandom({seed: randomSeed});

generate();

async function generate() {
  const files = await fs.readdirSync(ASSETS_PATH);
  let totalOptions = 1;
  const catAssets = [];
  for(let i = 0; i < files.length; i++) {
    const filePath = `${ASSETS_PATH}${files[i]}/`
    const stat = await fs.statSync(filePath);
    const attributes = _.find(optionMap, { attributeId: i})

    if(stat.isDirectory()) {

      const assetsFiles = await fs.readdirSync(filePath);
      const assets = [];
      let totalWeight = 0;

      for(let j = 0; j < assetsFiles.length; j++) {
        const assetPath = `${filePath}${assetsFiles[j]}`;
        const assetStat = await fs.statSync(assetPath);

        const option = _.find(attributes.optionValues, {optionId: j});

        totalWeight += option.rarity;

        if(assetStat.isFile()) {
          assets.push({
            index: j,
            file: assetsFiles[j],
            rarity: option.rarity,
            name: option.name
          });
        }
      }
      totalOptions *= assets.length;

      catAssets.push({
        index: i,
        path: filePath,
        assets,
        attributes,
        totalWeight
      });
    }
  }

  console.log('Available attribute and options mapped!');

  let assetIds = [];
  for(let i = 0; i < catAssets.length; i++) {

    assetIds.push(_.flatten(_.map(catAssets[i].assets, (asset) => {
      const options = []
        options.push(`${catAssets[i].index}-${asset.index}`)
      return options;

    })));
  }

  let nftSet = [];

  while(nftSet.length < MAX_GEN) {
    nftSet = uniqueSet(nftSet);
    const amountToSelect = MAX_GEN - nftSet.length;
    nftSet = nftSet.concat(selectCandidate(amountToSelect, catAssets))
  }

  shuffle(nftSet);

  console.log(`Unique options mapped! Selected ${nftSet.length} out of ${totalOptions} unique options available`);

  const setSize = nftSet.length > MAX_GEN ? MAX_GEN : nftSet.length;
  nftSet = nftSet.slice(0, setSize)

  const rarityMap = []

  optionMap.forEach( (attribute) => {
    attribute.optionValues.forEach( option => {
      const match = _.filter(nftSet, nft => nft.includes(`${attribute.attributeId}-${option.optionId}`))

      rarityMap.push({
        key: `${attribute.attributeId}-${option.optionId}`,
        count: match.length,
        rarity: ((match.length / setSize) * 100).toFixed(2),
      })
    })
  });

  const dirExists = await fs.existsSync(OUTPUT_PATH);
  if(!dirExists) {
    await fs.mkdirSync(OUTPUT_PATH);
  }

  // cleanup gen directory
  console.log('Clearing out output directory');
  const oldFiles = await fs.readdirSync(OUTPUT_PATH);

  for (const file of oldFiles) {
    await fs.unlinkSync(`${OUTPUT_PATH}${file}`);
  }

  const max = nftSet.length > MAX_GEN ? MAX_GEN : nftSet.length;

  console.log(`Start generating ${max} cats`);

  //options hash
  await fs.writeFileSync(`${OUTPUT_PATH_ROOT}optionHash.json`, JSON.stringify(optionHash, null, 4), function(err) {
    if(err) {
      console.log(err);
    }
  });

  for(let i = 0; i < max; i++) {
    // generate json metadata
    await generateMetadata(OUTPUT_PATH_META, i, nftSet[i], rarityMap);
    // generate the cats (id = i+1)
    await generateCatImage(ASSETS_PATH, OUTPUT_PATH, i, nftSet[i]);

  }

  // generate simple html index page
  genHtml(nftSet);
  genRarityMap(rarityMap, optionMap)
}

function uniqueSet(set) {
  var uniqObj = {};
  set.forEach(function (item) {
      uniqObj[JSON.stringify(item)] = 1;
  });

  var uniqArray = [];
  for(var key in uniqObj) {
      if (uniqObj.hasOwnProperty(key)) {
          uniqArray.push(JSON.parse(key))
      }
  }
  return uniqArray;
};

function selectCandidate(count, catAssets) {
  const selectedNftSet = [];
  for(let i = 0; i < count; i++) {

    const optionCandidate = [];
    catAssets.forEach( attribute => {
      let randomOption = rndInt(1, attribute.totalWeight);

      for(let j = attribute.assets.length - 1; j >= 0; j-- ) {
        randomOption -= attribute.assets[j].rarity;
        if(randomOption < 0) {
          optionCandidate.push(`${attribute.index}-${attribute.assets[j].index}`);
          break;
        }
      }

    });

    selectedNftSet.push(optionCandidate);
  }

  return selectedNftSet;
}