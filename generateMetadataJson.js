const fs = require('fs');
const {EXTERNAL_URL, IPFS_URL} = require("./settings");
const _ = require('lodash');
const optionMap = require('./optionMap/optionMap.json');
const optionPatch = require('./optionMap/duplicateOptionPatch.json');

const generateMetadata = async function(path, id, options, rarityMap) {
  const metadata = {
    id,
    description: "CashCats",
    name: `Cat # ${id}`,
    image: `${IPFS_URL}${id}.png`,
    external_url: `${EXTERNAL_URL}${id}.png`,
    traits: []
  }

  for(let i = 0; i < options.length; i++) {
    // const attributeName = optionNames[i] ?? i;
    const attributeId = parseInt(options[i].split('-')[0], 10);
    const optionId = parseInt(options[i].split('-')[1], 10);

    let attribute = _.find(optionMap, {attributeId: attributeId});
    let option = _.find(attribute.optionValues, {optionId: optionId});

    // options 5 and up are the extra added background that were patched in after discovering the duplicate cats. 
    if(attributeId === 0 && optionId > 4)  {
      attribute = _.find(optionPatch, {attributeId: attributeId});
      option = _.find(attribute.optionValues, {optionId: optionId});
    }

    const rarity = _.find(rarityMap, {key: options[i]});

    if(option.name !== 'None') {

      let optionName = option.name;
      let optionId = option.optionId;
      let attributeName = attribute.name;
      // let traitCount = rarity.count;
      
      // we made a mistake in the optionMap. Emerald and Ruby have been swapped. Since we cant change the optionMap we correct it here..
      if(optionName === "Emerald" ) {
        optionName = "Ruby";
      } else if(optionName === "Ruby") {
        optionName = "Emerald";
      }

      // in order to address the duplicate cats issue, here we map the newly introducted backgrounds. (#5-#9)



      const entry = {}
      entry.trait_type = attribute.name;
      entry.option_id = option.optionId;
      entry.value = optionName;
      entry.trait_count = rarity.count;

      metadata.traits.push(entry)
    }
  }

  await fs.writeFileSync(`${path}${id}`, JSON.stringify(metadata, null, 4), function(err) {
    if(err) {
      console.log(err);
    }
  });
}

module.exports = generateMetadata;