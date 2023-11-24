#!/usr/bin/env node

const md = require('markdown-it')({}).use(require('@digitalocean/do-markdownit'), {});
const fs = require('fs');
const WebSocketServer = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');
const commander = require('commander');
const { version } = require('../package.json');

var _fileNAme = undefined;

const options = commander
      .version(version, '-v, --version')
      .usage('[OPTIONS]...', '-u', '--usage')
      .argument('[fileName]', 'File name')
      .option('-p, --port <value>', 'Port', 0)
      .option('--hot-reload', 'Enable hot reload', false)
      .option('--disable-open-browser', false)
      .action((fileName) => { _fileName = fileName; })
      .parse(process.argv)
      .opts();

const isHotReloadActive = options.hotReload;
const httpServerPort = (options.port ? options.port : 0);
const openBrowser = !options.disableOpenBrowser;
const fileName = _fileName;

function readAdnRenderMarkdownFile(fileName) {
    let data = fs.readFileSync(fileName, "utf8");
    return md.render(data);
}

function prepareForWebSocket(htmlBody) {
    return `<div><span id='position-percentage'>5</span><div id='content'>${htmlBody}</div></div>`;
}

function createExpressApp(webSocketUrl) {
    var app = express();
    app.get('/', (req, res) => {
        let index = fs.readFileSync(path.join(__dirname, '../public/index.html'), "utf8");
        res.send(index.replace('__WEB_SOCKET_URL_', webSocketUrl));
    })
    app.use('/static', express.static(path.join(__dirname, '../public/static')));
    return app
}

function runExpressServer(app, openBrowser) {
    let server = app.listen(httpServerPort, function() {
        let port = server.address().port;
        let url = `http://localhost:${port}`;

        console.log("Open following url from browser: ");
        console.log(url);

        if (openBrowser) {
            require("openurl").open(url, () => {});
        }
    });
}

if (process.stdin.isTTY) {
    if (!fileName) {
        console.error("No file specified to read!!!");
        return;
    }

    if (isHotReloadActive) {
        const server = http.createServer();
        const wss = new WebSocketServer.Server({server: server})

        wss.on('connection', function connection(ws) {
            ws.on('message', function message(data) {
                ws.send(prepareForWebSocket(readAdnRenderMarkdownFile(fileName)));
            });

            fs.watchFile(fileName, {
                bigint: false, persistent: true, interval: 4000,
            }, (curr, prev) => {
                ws.send(prepareForWebSocket(readAdnRenderMarkdownFile(fileName)));
            });
        });

        server.listen(0, '127.0.0.1', () => {
            let host = server.address().address;
            let port = server.address().port;
            var app = createExpressApp(`ws://${host}:${port}`)
            runExpressServer(app, openBrowser)
        });
    } else {
        let rendered = readAdnRenderMarkdownFile(fileName)
        process.stdout.write(rendered);
    }
} else {
    let data = "";
    process.stdin.on("readable", () => {
        let chunk;
        while (null !== (chunk = process.stdin.read())) {
            data += chunk;
        }
    });

    process.stdin.on("end", () => {
        let rendered = md.render(data);
        process.stdout.write(rendered);
    });
}
