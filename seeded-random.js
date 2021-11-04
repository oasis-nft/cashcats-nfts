// https://github.com/bryc/code/blob/master/jshash/PRNGs.md
// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316#47593316

const seededRandom = ({rng = null, seed = "apples"} = {}) => {
  rng = rng || mulberry32(xmur3(seed)());

  const rnd = (lo, hi, defaultHi=1) => {
    if (hi === undefined) {
      hi = lo === undefined ? defaultHi : lo;
      lo = 0;
    }

    return rng() * (hi - lo) + lo;
  };

  const rndInt = (lo, hi) => Math.floor(rnd(lo, hi, 2));

  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = rndInt(i + 1);
      const x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
  };

  return {rnd, rndInt, shuffle};
};

function xmur3(str) {
  for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
      h = h << 13 | h >>> 19;
  return function() {
      h = Math.imul(h ^ h >>> 16, 2246822507);
      h = Math.imul(h ^ h >>> 13, 3266489909);
      return (h ^= h >>> 16) >>> 0;
  }
}

// js implementation of https://gist.github.com/tommyettinger/46a874533244883189143505d203312c

// Mulberry32 is minimalistic generator utilizing a 32-bit state, originally intended for embedded applications. It appears to be very good; the author states it passes all tests of gjrand, and this JavaScript implementation is very fast. But since the state is 32-bit like Xorshift, it's period (how long the random sequence lasts before repeating) is significantly less than those with 128-bit states, but it's still quite large, at around 4 billion.
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

module.exports = seededRandom;


// USAGE EXAMPLE
// const {
//   rnd, rndInt, shuffle
// } = seededRandom({seed: SEED});
// const a = [...Array(5)].map((_, i) => i);
// shuffle(a);

// // comments assume mulberry32 and xmur3 from
// // https://stackoverflow.com/a/47593316/6243352
// console.log(a); // => always [ 2, 0, 3, 1, 4 ]
// console.log(rnd()); // => always 0.8192486129701138
// console.log(rndInt(42)); // => always 41