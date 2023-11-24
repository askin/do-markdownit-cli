# do-markdownit-cli
CLI for do-markdownit

This tool is created to use with `markdown-preview-mode` on `emacs`. But it can be used standalone for any other editors.

## Install
```shell
npm install @askinozgur/do-markdownit-cli -g
```

## Usage

```shell
# Redirect markdown content
cat README.md | do-markdownit-cli

# Or
do-markdownit-cli < README.md

# Read from file
do-markdownit-cli README.md

# Read from file with hot reload
do-markdownit-cli README.md --hot-reload
```

Hot reload use a random port but you can give a port

```shell
do-markdownit-cli README.md --hot-reload --port 8080
```

Use `--help` or `-h` to all parameters.

Disable open browser
```shell
do-markdownit-cli README.md  --hot-reload --disable-open-browser
```
