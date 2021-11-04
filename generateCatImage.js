const mergeImages = require('merge-images');
const { Canvas, Image } = require('canvas');
const fs = require('fs');
const _ = require('lodash');

const generateCatImage = async function(assetsPath, outputPath, id, options) {
  const optionImagePaths = _.map(options, option => {
    const splitId = option.split('-');
    const trait_id = parseInt(splitId[0], 10);
    const option_id = parseInt(splitId[1], 10);
    return `${assetsPath}${trait_id}/${option_id}.png`
  });

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