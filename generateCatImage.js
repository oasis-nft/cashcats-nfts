const mergeImages = require('merge-images');
const { Canvas, Image } = require('canvas');
const fs = require('fs');
const _ = require('lodash');

const generateCatImage = async function(assetsPath, patchedAssetPath, outputPath, id, options, burned, burnPath) {
  
  let optionImagePaths = _.map(options, option => {
    const splitId = option.split('-');
    const trait_id = parseInt(splitId[0], 10);
    const option_id = parseInt(splitId[1], 10);

    let path = assetsPath;

    if(trait_id === 0 && option_id > 4) {
      path = patchedAssetPath;
    }

    return `${path}${trait_id}/${option_id}.png`
  });

  if(burned.includes(id)) {
    optionImagePaths = [`${burnPath}`]
  }

  await mergeImages(optionImagePaths, {
    Canvas: Canvas,
    Image: Image
  })
  .then(async b64 => {
    const base64Data = b64.replace(/^data:image\/png;base64,/, "");
    // const splitId = id.split('-')
    await fs.writeFileSync(`${outputPath}/${id}.png`, base64Data, 'base64', function(err) {
      if(err) {
        console.log(err);
      }
    });
  })
}

module.exports = generateCatImage;