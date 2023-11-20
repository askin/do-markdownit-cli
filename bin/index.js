#!/usr/bin/env node

const md = require('markdown-it')({}).use(require('@digitalocean/do-markdownit'), {});
// const md = require('markdown-it')()
const fs = require('fs');

if (process.stdin.isTTY) {
    if (process.argv.length < 3) {
	console.error("No file specified to read!!!");
	return;
    }

    let fileName = process.argv[2];
    fs.readFile(fileName, 'utf8', (err, data) => {
	if (err) {
	    console.error(err);
	    return;
	}

	let rendered = md.render(data);
	process.stdout.write(rendered);
    });
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
