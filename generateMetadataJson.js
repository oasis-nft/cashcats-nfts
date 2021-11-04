const fs = require('fs');
const {EXTERNAL_URL, IPFS_URL} = require("./settings");
const _ = require('lodash');
const optionMap = require('./optionMap/optionMap.json');

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

    const attribute = _.find(optionMap, {attributeId: attributeId});
    const option = _.find(attribute.optionValues, {optionId: optionId});

    const rarity = _.find(rarityMap, {key: options[i]});

    if(option.name !== 'None') {
      const entry = {}
      entry.trait_type = attribute.name;
      entry.option_id = option.optionId;
      entry.value = option.name;
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