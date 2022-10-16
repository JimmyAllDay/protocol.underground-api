//Node
const { mkdir, writeFile, unlink } = require('node:fs/promises');
const fs = require('fs');

const { resolve, join } = require('node:path');

//Express
const express = require('express');
const routes = express.Router();
const cors = require('cors');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
routes.use(express.json({ limit: '200mb' }));
routes.use(
  express.urlencoded({
    extended: true,
    limit: '200mb',
    parameterLimit: 1000000,
  })
);

//TODO: When you refactor, the fluent version of ffmpeg might be appropriate: https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
//Axios
const axios = require('axios');

//Audio processing
const MP3Cutter = require('mp3-cutter');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const Lame = require('node-lame').Lame;
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({
  log: true,
  logger: ({ message }) => console.log(message),
  progress: (p) => console.log(p),
});

// Route
routes.post('/', upload.array('audio'), async function (req, res, next) {
  const fileName = req.files[0].originalname;
  const unspaceName = fileName.replace(/\s/g, '');
  const nameNoExt = unspaceName.substring(0, unspaceName.lastIndexOf('.'));
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const path = './public/uploads/' + uniquePrefix;
  const filePath = path + '-' + nameNoExt;
  const unprocFileName = 'unproc' + '-' + unspaceName;
  const encFileName = 'enc' + '-' + unspaceName;
  const cutFileName = 'cut' + '-' + unspaceName;

  console.log('fileName: ', fileName);
  console.log('unspaceName: ', unspaceName);
  console.log('nameNoExt: ', nameNoExt);
  console.log('uniquePrefix: ', uniquePrefix);
  console.log('path: ', path);
  console.log('filePath: ', filePath);
  console.log('unprocFileName: ', unprocFileName);
  console.log('encFileName: ', encFileName);
  console.log('cutFileName: ', cutFileName);

  // 1.
  async function makeDir() {
    console.log('1. Make directory');
    const createDir = await mkdir(filePath);
    return createDir;
  }
  //2.
  async function saveFile(name) {
    console.log('2. Save file');
    const write = await writeFile(name, req.files[0].buffer);
    return write;
  }
  //3.
  async function encodeFile(input, output) {
    console.log('3. Reduce mp3 bitrate');
    const encoder = new Lame({
      output: output,
      bitrate: 16,
    }).setFile(input);
    const encodedFile = await encoder.encode();
    return encodedFile;
  }

  //4.
  async function getDuration(filePath) {
    console.log('4. Get file duration');
    return await new Promise((resolve, reject) => {
      const duration = getAudioDurationInSeconds(filePath)
        .then((time) => resolve(time))
        .catch((err) => reject(err));
    });
  }

  //5.
  async function cutFile(src, target, secs) {
    console.log('5. CutFile');
    let num = 0;
    let end = num + 15;

    async function recursiveCut(secs) {
      if (num > secs - 30) {
        console.log('exiting');
        await process.exit(0);
        return;
      }

      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }

      ffmpeg.FS(
        'writeFile',
        unspaceName,
        await fetchFile(`${filePath}/${encFileName}`)
      );

      await ffmpeg.run(
        '-i',
        unspaceName,
        '-ss',
        `${num}`,
        '-to',
        `${end}`,
        '-b:a',
        '16k',
        '-f',
        'mp3',
        '-vn',
        '-acodec',
        'copy',
        `${num}-${cutFileName}`
      );

      fs.promises.writeFile(
        filePath + '/' + `${num}-${cutFileName}`,
        ffmpeg.FS('readFile', `${num}-${cutFileName}`),
        ['-b:a', '16k', '-f', 'mp3']
      );

      num += 60;
      end += 60;
      recursiveCut(src, target, secs);
    }

    return recursiveCut(src, target, secs);
  }

  //7.
  async function cleanUpDir(file1, file2) {
    console.log('6. clean up dir');
    const cleanUp = await fs.rm(file1, async (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log('File 1 deleted');
        await fs.rm(file2, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log('File 2 deleted');
          }
        });
      }
    });
    return cleanUp;
  }

  async function getFiles() {
    fs.readdir(dir, (err, files) => {
      if (err) {
        throw err;
      }
      // files object contains all files names
      // log them on console
      files.forEach((file) => {
        console.log(file);
      });
    });
  }

  //6.
  async function getApiData(path) {
    //fs.createReadStream on all files in directory
    console.log('7. Send API request');
    const data = {
      api_token: process.env.AUDD_TOKEN,
      // file: fs.createReadStream(path),
    };
    // const response = await axios({
    //   method: 'post',
    //   url: 'https://api.audd.io/',
    //   data: data,
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // });
    const response = { data: 'req data' };
    return response;
  }

  makeDir()
    .then(() => saveFile(filePath + '/' + unprocFileName))
    .then(() =>
      encodeFile(filePath + '/' + unprocFileName, filePath + '/' + encFileName)
    )
    .then(() => getDuration(filePath + '/' + unprocFileName))
    .then(async (length) => await cutFile(length))
    .then(
      async () =>
        await cleanUpDir(
          filePath + '/' + encFileName,
          filePath + '/' + unprocFileName
        )
    )
    // .then(() => getInfo(filePath + '/' + cutFileName))
    .then((response) => {
      // fs.rm(filePath, { recursive: true }, (err) => console.log(err));
      res.send('response.data');
    })
    .catch(console.error);
});

module.exports = routes;
