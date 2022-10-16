// 5. Recursion
async function cutFile(src, target, secs) {
  console.log('5. CutFile');
  let num = 0;
  async function recursiveCut(src, target, secs) {
    if (num > secs - 60) {
      return;
    }

    await MP3Cutter.cut({
      src: src,
      target: `${target}-${num}.mp3`,
      start: num,
      end: num + 15,
    });

    num += 60;
    console.log('num: ', num);
    recursiveCut(src, target, secs);
  }
  return recursiveCut(src, target, secs);
}

// 5. Recursion with promise
async function cutFile(src, target, secs) {
  console.log('5. CutFile');
  let num = 0;
  async function recursiveCut(src, target, secs) {
    if (num > secs - 60) {
      return;
    }

    function slice() {
      return new Promise((resolve, reject) => {
        try {
          resolve(
            MP3Cutter.cut({
              src: src,
              target: `${target}-${num}.mp3`,
              start: num,
              end: num + 15,
            })
          );
        } catch (err) {
          reject(err);
        }
      });
    }
    slice();
    num += 60;
    console.log('num: ', num);
    recursiveCut(src, target, secs);
  }
  return recursiveCut(src, target, secs);
}

//5. For Loop
async function cutFile(src, target, secs) {
  console.log('5. Slice file', 'secs: ', secs);
  const divSecs = secs / 60;
  const increments = Math.floor(divSecs);

  for (let i = 1; i <= increments; i++) {
    await console.log(
      'file slice: ',
      i,
      '|',
      'time range: ',
      i * 60,
      '-',
      i * 60 + 15
    );

    await MP3Cutter.cut({
      src: src,
      target: `${target}-${i}.mp3`,
      start: i * 60,
      end: i * 60 + 15,
    });
  }
}

// Recursion with fs.exists check
async function recursiveCut(src, target, secs) {
  if (num > secs) {
    return;
  }

  await MP3Cutter.cut({
    src: src,
    target: `${target}-${num}.mp3`,
    start: num,
    end: num + 15,
  });

  fs.exists(`${target}-${num}.mp3`, (e) => {
    console.log(e ? `${target}-${num}.mp3 exists` : `file doesn't exist`);
    console.log('num: ', num);
    num += 60;
    recursiveCut(src, target, secs);
  });
}

//ffmpeg - output not working
async function cutFile(src, target, secs) {
  console.log('5. CutFile');
  let num = 0;

  async function recursiveCut(src, target, secs) {
    if (num > secs) {
      return;
    }
    (async () => {
      await ffmpeg.load();
      ffmpeg.FS(
        'writeFile',
        unspaceName, //
        await fetchFile(`${filePath}/${encFileName}`)
      );
      await ffmpeg.run(
        '-i',
        unspaceName,
        '-ss',
        `0`,
        '-to',
        `15`,
        '-b:a',
        '16k',
        '-f',
        'mp3',
        '-vn',
        '-acodec',
        'copy',
        `${num}-${cutFileName}`
      );
      await fs.promises.writeFile(
        filePath + '/' + `${num}-${cutFileName}`,
        ffmpeg.FS('readFile', `${num}-${cutFileName}`),
        ['-b:a', '16k', '-f', 'mp3']
      );
      await process.exit(0);
    })();

    num += 60;
    recursiveCut(src, target, secs);
  }

  return recursiveCut(src, target, secs);
}
