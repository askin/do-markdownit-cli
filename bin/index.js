#!/usr/bin/env node

const md = require('markdown-it')({}).use(require('@digitalocean/do-markdownit'), {});
const fs = require('fs');
const WebSocketServer = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');
const commander = require('commander');
const openurl = require('openurl');
const { version } = require('../package.json');

let tmpFileName;

const options = commander
  .version(version, '-v, --version')
  .usage('[OPTIONS]...', '-u', '--usage')
  .argument('[fileName]', 'File name')
  .option('-p, --port <value>', 'Port', 0)
  .option('--hot-reload', 'Enable hot reload', false)
  .option('--disable-open-browser', false)
  .action((fileName) => { tmpFileName = fileName; })
  .parse(process.argv)
  .opts();

const isHotReloadActive = options.hotReload;
const httpServerPort = (options.port ? options.port : 0);
const openBrowser = !options.disableOpenBrowser;
const fileName = tmpFileName;

function readAndRenderMarkdownFile() {
  const data = fs.readFileSync(fileName, 'utf8');
  return md.render(data);
}

function prepareForWebSocket(htmlBody) {
  return `<div><span id='position-percentage'>5</span><div id='content'>${htmlBody}</div></div>`;
}

function createExpressApp(webSocketUrl) {
  const app = express();
  app.get('/', (req, res) => {
    const index = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    res.send(index.replace('__WEB_SOCKET_URL_', webSocketUrl));
  });
  app.use('/static', express.static(path.join(__dirname, '../public/static')));
  return app;
}

function runExpressServer(app) {
  const server = app.listen(httpServerPort, () => {
    const url = `http://localhost:${server.address().port}`;

    process.stdout.write('Open following url from browser: \n');
    process.stdout.write(`${url}\n`);

    if (openBrowser) {
      openurl.open(url, () => {});
    }
  });
}

if (process.stdin.isTTY) {
  if (!fileName) {
    process.error.write('No file specified to read!!!\n');
    process.exit(1);
  }

  if (isHotReloadActive) {
    const server = http.createServer();
    const wss = new WebSocketServer.Server({ server });

    wss.on('connection', (ws) => {
      ws.on('message', () => {
        ws.send(prepareForWebSocket(readAndRenderMarkdownFile()));
      });

      fs.watchFile(fileName, {
        bigint: false, persistent: true, interval: 4000,
      }, () => {
        ws.send(prepareForWebSocket(readAndRenderMarkdownFile()));
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const { port, address } = server.address();
      const app = createExpressApp(`ws://${address}:${port}`);
      runExpressServer(app, openBrowser);
    });
  } else {
    const rendered = readAndRenderMarkdownFile();
    process.stdout.write(rendered);
  }
} else {
  let data = '';
  process.stdin.on('readable', () => {
    let chunk = process.stdin.read();
    while (chunk !== null) {
      data += chunk;
      chunk = process.stdin.read();
    }
  });

  process.stdin.on('end', () => {
    const rendered = md.render(data);
    process.stdout.write(rendered);
  });
}
