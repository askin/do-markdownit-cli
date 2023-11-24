#!/usr/bin/env node

const md = require('markdown-it')({}).use(require('@digitalocean/do-markdownit'), {});
const fs = require('fs');
const WebSocketServer = require('ws');
const express = require('express');
const path = require('path');
const commander = require('commander');

const wsServerPort = 8181;
const { version } = require('../package.json');

var fileNAme = undefined;

const options = commander
      .version(version, '-v, --version')
      .usage('[OPTIONS]...', '-u', '--usage')
      .argument('[fileNameArg]', 'File name')
      .option('-p, --port <value>', 'Port', 0)
      .option('--hot-reload', 'Enable hot reload', false)
      .option('--disable-open-browser', false)
      .action((fileNameArg) => { fileName = fileNameArg; })
      .parse(process.argv)
      .opts();

const isHotReloadActive = options.hotReload
const httpServerPort = (options.port ? options.port : 0)
const openBrowser = !options.disableOpenBrowser

function readAdnRenderMarkdownFile(fileName) {
    let data = fs.readFileSync(fileName, "utf8")
    return md.render(data);
}

function prepareForWebSocket(htmlBody) {
    return `<div><span id='position-percentage'>5</span><div id='content'>${htmlBody}</div></div>`;
}

if (process.stdin.isTTY) {
    if (!fileName) {
        console.error("No file specified to read!!!");
        return;
    }

    if (isHotReloadActive) {
        const wss = new WebSocketServer.Server({ port: wsServerPort })
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

        var app = express();
        app.use('/', express.static(path.join(__dirname, '../public')));
        let server = app.listen(httpServerPort, function() {
            let port = server.address().port;
            let url = `http://localhost:${port}`

            console.log("Open following url from browser: ")
            console.log(url)

            if (openBrowser) {
                require("openurl").open(url, () => {});
            }
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
