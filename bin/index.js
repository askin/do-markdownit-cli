#!/usr/bin/env node

const md = require('markdown-it')({}).use(require('@digitalocean/do-markdownit'), {});
const fs = require('fs');
const WebSocketServer = require('ws');
const express = require('express');
const path = require('path');
const httpServerPort = 8080;
const wsServerPort = 8181;

function readGenerateHtmlBody(fileName) {
    let data = fs.readFileSync(fileName, "utf8")
    let rendered = md.render(data);
    return "<div><span id='position-percentage'>5</span><div id='content'>" + rendered + "</div></div>";
}

if (process.stdin.isTTY) {
    let fileName = "";
    let isHotReloadActive = false;

    for(i = 2; i < process.argv.length; i++) {
        if (process.argv[i] == "--hot-reload") {
            isHotReloadActive = true;
        } else {
            fileName = process.argv[i];
        }
    }

    if (!fileName) {
        console.error("No file specified to read!!!");
        return;
    }

    if (isHotReloadActive) {
        const wss = new WebSocketServer.Server({ port: wsServerPort })
        wss.on('connection', function connection(ws) {
            ws.on('message', function message(data) {
                ws.send(readGenerateHtmlBody(fileName));
            });

            fs.watchFile(fileName, {
                bigint: false, persistent: true, interval: 4000,
            }, (curr, prev) => {
                ws.send(readGenerateHtmlBody(fileName));
            });
        });

        var server = express();
        server.use('/', express.static(path.join(__dirname, '../public')));
        server.listen(httpServerPort);
        console.log("Open following url from browser: ")
        console.log('http://localhost:' + httpServerPort)
    } else {
        fs.readFile(fileName, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }

            let rendered = md.render(data);
            process.stdout.write(rendered);
        });
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
