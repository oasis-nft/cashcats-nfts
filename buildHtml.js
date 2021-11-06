var fs = require('fs');
const _ = require('lodash');

const {OUTPUT_PATH_ROOT} = require("./settings");
function genHtml(nfts) {
  var fileName = `${OUTPUT_PATH_ROOT}index.html`;
  var stream = fs.createWriteStream(fileName);

  stream.once('open', function(fd) {
    var html = buildHtml(nfts);

    stream.end(html);
  });
}

function genRarityMap(rarityMap, optionMap) {
  var fileName = `${OUTPUT_PATH_ROOT}rarity.html`;
  var stream = fs.createWriteStream(fileName);

  stream.once('open', function(fd) {
    var html = buildRarityHtml(rarityMap, optionMap);

    stream.end(html);
  });
}

function buildRarityHtml(rarityMap, optionMap) {
  let header = '';
  let body = '';
  let style = `
    .title { width: 100% }
    .wrapper { display: flex; flex-wrap: wrap; width: 100% }
    .wrapper img { width: 150px; margin: 5px; }
    .attribute {
      border: 1px solid black;
      margin: 5px;
      padding: 5px;
      text-align: center;
    }
  `;

  body = body.concat(
    `
      <div style="width: 100%"><h1>CashCats NFT Option Map</h1></div>
      <div style="width: 50%">
        <p>With the optionmap below, a total of 1,232,000 unique cats can be created. 10,000 cats have been selected randomly using a seeded pseudorandom number generator. </p>
        <p>The weight of the attribute determines the chance an attribute will be selected by the generator. Due to the randomnes of the selection process the actual selected amount will deviate. </p>
      </div>
    `
  );

  optionMap.forEach( attribute => {
    // console.log(attribute);
    
    body = body.concat(
    `<div class="title"><h2>${attribute.name}</h2></div>`
    );

    body = body.concat('<div class="wrapper">')
    attribute.optionValues.forEach( option => {
      const rarity = _.find(rarityMap, {key: `${attribute.attributeId}-${option.optionId}`})
      
      // we made a mistake in the optionMap. The name labels Emerald and Ruby have been swapped. Since we cant change the optionMap we correct it here..
      let name = option.name;

      if(name === "Emerald" ) {
        name = "Ruby";
      } else if(name === "Ruby") {
        name = "Emerald";
      }

      body = body.concat(`<div class="attribute">`);
      body = body.concat(`<div><img src="https://raw.githubusercontent.com/oasis-nft/cashcats-nfts/master/assets/${attribute.attributeId}/${option.optionId}.png" /></div>`);
      body = body.concat(`<div><strong>${name}</strong></div>`);
      body = body.concat(`<div><strong>${rarity.count} cats</strong></div>`);
      body = body.concat(`<div><strong>${rarity.rarity}%</strong></div>`);
      body = body.concat(`<div>Weight: ${option.rarity}</div>`);
      body = body.concat(`</div>`);
    })
    body = body.concat(`</div>`);
  })

  return '<!DOCTYPE html>'
       + `<html><style>${style}</style><head>` + header + '</head><body><div class="wrapper">' + body + '</div></body></html>';
}


function buildHtml(nfts) {
  let header = '';
  let body = '';

  let style = `
    .wrapper { display: flex; flex-wrap: wrap }
    .wrapper img { width: 200px; margin: 5px; }
  `;

  nfts.forEach( (nft, index) => {
    body = body.concat(`
<div>
    <a href="./data/${index}">
      <img src="./images/${index}.png" />
    </a>
</div>
    `);
  });

  return '<!DOCTYPE html>'
       + `<html><style>${style}</style><head>` + header + '</head><body><div class="wrapper">' + body + '</div></body></html>';
};

module.exports = { genHtml, genRarityMap };
