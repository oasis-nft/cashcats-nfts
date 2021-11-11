const seededRandom = require("./seeded-random");
const generateCatImage = require("./generateCatImage");
const generateMetadata = require("./generateMetadataJson");
const {genHtml, genRarityMap, genPatchOverview} = require("./buildHtml");
const {ASSETS_PATH, PATCHED_ASSETS_PATH, BURNED_CAT_PATH, OUTPUT_PATH, OUTPUT_PATH_META, OUTPUT_PATH_ROOT, SEED, MAX_GEN} = require("./settings");
const fs = require('fs');
const _ = require('lodash');
const web3 = require('web3');
const optionMap = require('./optionMap/optionMap.json');
const optionMapDuplicatePatch = require('./optionMap/duplicateOptionPatch.json');
const oasisUnsoldCats = require('./optionMap/undistributedCats.json');

const { find, map, filter, compact, clone, reverse, uniq, split } = require("lodash");

const optionHash = web3.utils.soliditySha3(JSON.stringify(optionMap));

// the seed used is a combination of a hash of the optionMap and the blockhash of the block in which the last NFT was minted. The optionHash is stored as a constant inside the NFT contract (OPTION_HASH).
const randomSeed = web3.utils.soliditySha3(optionHash, SEED)

const {
  rnd, rndInt, shuffle
} = seededRandom({seed: randomSeed});

generate();

async function generate() {
  // First we map all the possible options based on the original set.
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
  // make a flat map for the possible options
  let assetIds = [];
  for(let i = 0; i < catAssets.length; i++) {

    assetIds.push(_.flatten(_.map(catAssets[i].assets, (asset) => {
      const options = []
        options.push(`${catAssets[i].index}-${asset.index}`)
      return options;

    })));
  }

  // select collection based on RNG
  let nftSet = [];

  while(nftSet.length < MAX_GEN) {
    // line of code that caused duplicates. This method should've been ran after selecting the candidates. Copycats slipped in...
    nftSet = uniqueSet(nftSet); 
    const amountToSelect = MAX_GEN - nftSet.length;
    nftSet = nftSet.concat(selectCandidate(amountToSelect, catAssets))
  }
  shuffle(nftSet);

  // map all the duplicate cats
  const affectedIds = [];
  const allDuplicates = findDuplicates(nftSet)
  findDuplicates(nftSet).forEach( duplicate => {
    duplicate.forEach( value => {
      affectedIds.push(value.id);
    });
  })

  console.log(`A total of ${uniq(affectedIds).length} cats are copycats`);

  let toBurn = [];
  let complete = false;
  // find and fix all the duplicates. Any cat that is currently in OASIS supply will be excluded from fixing and burned.
  while(!complete) {
    // get a map of all the dupes in the set.
    const duplicates = findDuplicates(nftSet);

    // find all options that need to be fixed, but excluding any pairs where we can burn from OASIS stack
    const duplicatesToFix = filter(duplicates, duplicate => {
      // if we have a pair, and one of the items is in the OASIS stack, we don't have to fix it as we will burn one of them.
      if(duplicate.length === 2) {
        if( oasisUnsoldCats.includes(duplicate[0].id) ) {
          toBurn.push(duplicate[0].id);
          return false;
        } else if( oasisUnsoldCats.includes(duplicate[1].id)) {
          toBurn.push(duplicate[1].id);
          return false;
        }     
      }

      return true;
    });
    
    //when all dupes are fixed, we are done.
    if(duplicatesToFix.length === 0) {
      complete = true;
    }

    // fix duplicates by giving all but the first in the duplicate combination a new background
    nftSet = fixDuplicates(nftSet, duplicatesToFix);
  }

  // now that we have have unique set (when excluding burned cats), lets identify all changed cats in OASIS stash. All cats that have been changed will be added to the burn set
  let oasisChangedCatsCount = 0;
  uniqueSet(nftSet).forEach( (nft, id) => {
    const backgroundOptionId = nft[0].split('-')[1];
    if(backgroundOptionId > 4 && oasisUnsoldCats.includes(id)) {
      toBurn.push(id);
      oasisChangedCatsCount++
    }
  });

  toBurn = uniq(toBurn);
  toBurnCount = toBurn.length;


  console.log(`The set contains ${toBurnCount} copycats (will be burned) and ${nftSet.length - (toBurnCount)} unique cats.`);

  console.log(`Options mapped! Selected ${nftSet.length} out of ${totalOptions} unique options available`);

  const setSize = uniqueSet(nftSet).length;
  nftSet = nftSet.slice(0, nftSet.length)

  // calculate rarities, excluding burned cats
  const rarityMap = [];
  // rarities for the original optionMap
  optionMap.forEach( (attribute) => {
    attribute.optionValues.forEach( option => {
      const match = _.filter(nftSet, (nft, id) => !toBurn.includes(id) && nft.includes(`${attribute.attributeId}-${option.optionId}`))

      rarityMap.push({
        key: `${attribute.attributeId}-${option.optionId}`,
        count: match.length,
        rarity: ((match.length / setSize) * 100).toFixed(2),
      })
    })
  });

  // rarities for the extended patched optionMap
  optionMapDuplicatePatch.forEach( (attribute) => {
    attribute.optionValues.forEach( option => {
      const match = _.filter(nftSet, (nft, id) => !toBurn.includes(id) && nft.includes(`${attribute.attributeId}-${option.optionId}`))

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

  //burned cats
  await fs.writeFileSync(`${OUTPUT_PATH_ROOT}burnedCats.json`, JSON.stringify(_.sortBy(toBurn), null, 4), function(err) {
    if(err) {
      console.log(err);
    }
  });

  // identify all the changes made by the dupe patch and map them
  const patchMap = [];
  let changeCount = 0;
  
  _.uniqWith(allDuplicates, _.isEqual).forEach(dupedPair => {
    const pair = {
      count: dupedPair.length,
      tokens: []
    }

    dupedPair.forEach( token => {
      let action = 'unchanged';
      if(toBurn.includes(token.id)) {
        action = 'burned';
      }

      const backgroundOptionId = Number(nftSet[token.id][0].split('-')[1]);
      if(action !== 'burned' && backgroundOptionId > 4) {
        action = `changed background (${backgroundOptionId})`;
        changeCount++;
      }
    
      pair.tokens.push({
        id: token.id,
        option: nftSet[token.id],
        action
      })
    });

    patchMap.push(pair);
  })

  console.log('PATCHED CATS', changeCount);
  //fixed cats
  await fs.writeFileSync(`${OUTPUT_PATH_ROOT}fixedCats.json`, JSON.stringify(patchMap, null, 4), function(err) {
    if(err) {
      console.log(err);
    }
  });

  for(let i = 0; i < max; i++) {
    // generate json metadata
    await generateMetadata(OUTPUT_PATH_META, i, nftSet[i], rarityMap);
    // generate the cats
    await generateCatImage(ASSETS_PATH, PATCHED_ASSETS_PATH, OUTPUT_PATH, i, nftSet[i], toBurn, BURNED_CAT_PATH);
    
  }
  
  // generate simple html index page, rarity page and patch overview
  genHtml(nftSet);
  genRarityMap(rarityMap, optionMap, optionMapDuplicatePatch)
  // generate patch overview
  genPatchOverview(patchMap);
}

// make the set unique by removing doubles.
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

// select a candidate cat at random
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

function findDuplicates(nftSet) {
  // helper function that will find duplicate options
  const findDupes = (arr) => {
    let sorted_arr = arr.slice().sort();
    let results = [];
    for (let i = 0; i < sorted_arr.length - 1; i++) {
      if (sorted_arr[i + 1] == sorted_arr[i]) {
        results.push(sorted_arr[i]);
      }
    }
    return results;
  }
  // find all the duped cats from the set passed to this method
  const stringArray = map(nftSet, item => JSON.stringify(item));
  const dupedCats = findDupes(stringArray);
  const dupedSet = [];

  // for each duped cat, find its clones and add it to the dupedset. It will cause multiple copies of duped sets, we will filter them out below..
  dupedCats.forEach((cat, index) => {
    let amount = 0;
    
    let dupes = map(stringArray, (item, key) => {
      if(item === cat) {
        return {
          id: key,
          option: item
        }
      } 

      return undefined;
    });

    dupes = compact(dupes);
    dupedSet.push(compact(dupes));
  });

  return dupedSet;
}

// for all the duplicates, excluding the first, we will update the background with a new version at random.
function fixDuplicates(nftSet, dupedSet) {
  dupedSet.forEach( dupedOptions => {
    dupedOptions.forEach( (dupedOption, index) => {
      if(index > 0) {
        // for each copycat, we take a random ID among the new background (5-9)
        const newBackgroundId = rndInt(5,10);
        
        const fixedOption = JSON.parse(dupedOption.option);
        fixedOption[0] = `0-${newBackgroundId}`;

        // update the options in the full set
        nftSet[dupedOption.id] = fixedOption
      }
    });
  }); 
  return nftSet
}
