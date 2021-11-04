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

  optionMap.forEach( attribute => {
    // console.log(attribute);
    body = body.concat(
    `<div class="title"><h2>${attribute.name}</h2></div>`
    );

    body = body.concat('<div class="wrapper">')
    attribute.optionValues.forEach( option => {
      // console.log(option)
      const rarity = _.find(rarityMap, {key: `${attribute.attributeId}-${option.optionId}`})

      body = body.concat(`<div class="attribute">`);
      body = body.concat(`<div><img src="../assets/${attribute.attributeId}/${option.optionId}.png" /></div>`);
      body = body.concat(`<div><strong>${option.name}</strong></div>`);
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
