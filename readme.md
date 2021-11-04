## CashCats generation

This tool has been used to generate the CashCats NFTs. The tool uses a pseudo random number generator to randomize the set. This allows the images to be reproduced based on the seed that was used to generate the CashCats. The tool will generate both images and metadata jsons.

The seed used in the generator is a combination of:
- a hash of the stringified optionMap. The optionMap will be stored inside the NFT contract as a constant.
- a hash of the blockhash in which the last cat was pre-minted

This ensures that:
- It can be proven devs had no chance to influence the final generated set without investing a lot of fees in the form of gas. For each attempt to create a favourable set, 10.000 new NFTs would have to be minted. The complete seed is determined after all 10K cats are created.
- Anyone can regenerate and verify the set.

# Settings

- ASSETS_PATH
Specifies the path to input assets. Each attribute group should have its own folder.

- OUTPUT_PATH
Specifies output path where generated images are saved. At the beginning of the generation all files present will be removed without warning

- OUTPUT_PATH_META
Specifies the output path where the generated metadata JSON files are saved. At the beginning of the generation all files present will be removed without warning

- SEED
Input seed to be used for the RNG thats used to select and shuffle the available options array, which defines which combinations will be generated. A hash of the optionmap combined with SEED will define the seed used in the algorithm.

- MAX_GEN
How many cats you want to generate. 

- EXTERNAL_URL
URL that will be set on the `external_image` property in the metadata.

- IMAGE_URL
URL that will be set on the `image` property in the metadata.

# Installation

- run `npm i`

# Generate

- overwrite assets folder with your assets. Place each attribute in it own folder. first folder should be named `0`.

- to generate cats run `npm start`. Images, metadata, and an index.html will be generated in ouput folder!

- as long as the SEED and optionMap are unchanged, the generated result will always be the same.