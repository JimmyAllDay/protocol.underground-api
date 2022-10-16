const { mkdir, writeFile, unlink } = require('node:fs/promises');
const fs = require('fs');
const MP3Cutter = require('mp3-cutter');

async function cutFile(src, target, secs) {
  console.log('5. CutFile');
  let num = 0;
  let end = 15;

  function delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async function recursiveCut(src, target, secs) {
    if (num > secs) {
      return;
    }

    await delay(1000); //included to 'space out' recursions of the function call

    await MP3Cutter.cut({
      src: src,
      target: `${target}-${num}-${end}.mp3`,
      start: num,
      end: end,
    });

    await fs.exists(`${target}-${num}-${end}.mp3`, async (e) => {
      console.log(
        e ? `${target}-${num}-${end}.mp3 exists` : `file doesn't exist`
      );
      num += 60;
      end += 60;
      await recursiveCut(src, target, secs);
    });
  }
  return recursiveCut(src, target, secs);
}

const filePath =
  './public/uploads/1665795089236-167173848-15972862_Rubadub_(VIP)/enc-15972862_Rubadub_(VIP).mp3';
const outputPath =
  './public/uploads/1665795089236-167173848-15972862_Rubadub_(VIP)/';

cutFile(filePath, outputPath, 300);
