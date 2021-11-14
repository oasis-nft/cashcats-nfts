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

function genRarityMap(rarityMap, optionMap, optionMapPatch) {

  var fileName = `${OUTPUT_PATH_ROOT}rarity.html`;
  var stream = fs.createWriteStream(fileName);

  stream.once('open', function(fd) {
    var html = buildRarityHtml(rarityMap, optionMap, optionMapPatch);

    stream.end(html);
  });
}

function genPatchOverview(patchMap) {

  var fileName = `${OUTPUT_PATH_ROOT}patch.html`;
  var stream = fs.createWriteStream(fileName);

  stream.once('open', function(fd) {
    var html = buildPatchOverview(patchMap);

    stream.end(html);
  });
}

function buildRarityHtml(rarityMap, optionMap, optionMapPatch) {
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
        <p>10,000 cats have been selected randomly using a seeded pseudorandom number generator. </p>
        <p>In minting proces 358 cats have been burned. The total circulating supply of cats is 9642</p>
        <p>The weight of the attribute determines the chance an attribute will be selected by the generator. Due to the randomnes of the selection process the actual selected amount will deviate. </p>
      </div>
    `
  );

  // Add the patched backgrounds to the full map
  const fullMap = optionMap;
  const backgrounds = _.find(optionMap, {attributeId: 0});
  const patchBackgrounds = _.find(optionMapPatch, {attributeId: 0});
  backgrounds.optionValues = backgrounds.optionValues.concat(patchBackgrounds.optionValues)


  fullMap.forEach( attribute => {
    body = body.concat(
    `<div class="title"><h2>${attribute.name}</h2></div>`
    );

    body = body.concat('<div class="wrapper">')
    attribute.optionValues.forEach( option => {
      const rarity = _.find(rarityMap, {key: `${attribute.attributeId}-${option.optionId}`});

      // we made a mistake in the optionMap. The name labels Emerald and Ruby have been swapped. Since we cant change the optionMap we correct it here..
      let name = option.name;

      if(name === "Emerald" ) {
        name = "Ruby";
      } else if(name === "Ruby") {
        name = "Emerald";
      }

      body = body.concat(`<div class="attribute">`);
      body = body.concat(`<div><img src="./assets/${attribute.attributeId}/${option.optionId}.png" /></div>`);
      body = body.concat(`<div><strong>${name}</strong></div>`);
      body = body.concat(`<div><strong>${rarity.count} cats</strong></div>`);
      body = body.concat(`<div><strong>${rarity.rarity}%</strong></div>`);
      if(option.rarity > 0) {
        body = body.concat(`<div>Weight: ${option.rarity}</div>`);
      }
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

function buildPatchOverview(patchMap) {
  // console.log(patchMap);
  let header = '';
  let body = '';

  let style = `

  `;

  body = body.concat(`
<h1>CashCat NFTs Patch Overview</h1>
<div style="width: 50%">
<p>
  There are a total of 549 duplicate sets. A total of 1223 cats are affected.
  <div>- 449 cats that exist 2x</div>
  <div>- 84 cats that exist 3x</div>
  <div>- 16 cats that exist 4x</div>
  <div>- 3 cats that exist 5x</div>

  <p>We will make all cats unqiue again by:</p>
  <ul>
    <li>Burn all affected cats that are undistributed as of 11-11-2021 (undistributed: 3741 cats). A total of 358 cats will be burned.</li>
    <li>All burned cats will be sent to cat heaven at 0x000000000000000000000000000000000000dEaD</li>
    <li>After burning, all remaining duplicates (except for the one with the lowest ID) will receive a new unique background (random out of 5 available). A total of 375 cats will get the new backgrounds.</li>
    <li>The generation script has been appended with this fix. It is still verifiable using the original seed.</li>
    <li>All cats are now unique!</li>
  </ul>
</p>

<p>Below you will find a list of all affected cats and what action has been taken within each set of duplicates.</p>
</div>
  `)

  patchMap.forEach( (pair, index) => {
    let duplicateHtml = '';
    pair.tokens.forEach( token => {
      let action = token.action;

      if(action === 'unchanged') {
        action = 'no visual change. added OG (original) trait.'
      }

      // console.log(token);
      duplicateHtml = duplicateHtml.concat(`
<div style="display: flex; width: 100%">
  <div style="width: 20%">TokenID: #${token.id}</div>

  <div style="width: 80%">Action:  ${action}</div>
</div>
      `)
    });


    body = body.concat(`
<div style="width:100%">
    <h3>Duplicates ${index + 1} (${pair.count})</h3>
    ${duplicateHtml}

</div>
    `);
  });

  return '<!DOCTYPE html>'
       + `<html><style>${style}</style><head>` + header + '</head><body><div class="wrapper">' + body + '</div></body></html>';
}

module.exports = { genHtml, genRarityMap, genPatchOverview};
