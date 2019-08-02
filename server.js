#!/usr/bin/env node

const watchify = require('watchify')
const appendify = require('appendify')
const serve = require('serve-handler')
const browserify = require('browserify')
const http = require('http')
const fs   = require('fs')
const path   = require('path')
const argv = require('minimist')(process.argv.slice(2));
const SseStream = require('./ssestream.js')
const clients = new Map()

async function copy(file, dest) {
  return new Promise(function (resolve, reject) {
    fs.createReadStream(`${__dirname}/test/${file}`)
    .on('end', resolve)
    .on('error', reject)
    .pipe(fs.createWriteStream(`${dest}/${file}`))
  })
}

async function template(dest) {
  try {
    await copy('index.html', dest)
    await copy('.babelrc', dest)
    await copy('index.js', dest)
    await copy('style.css', dest)
    process.exit(0)
  } catch(err) {
    console.error(err)
    process.exit(1)
  }
}

function send(data) {
  for (let [,client] of clients) {
    client.write(data)
  }
}

function bundle() {
  const write = fs.createWriteStream('bundle.js')
  b.bundle()
    .on('error', (err) => {
      console.error('Bundle error:')
      console.error(err)
      send({event: 'builderror', data: err})
    })
    .on('end', () => {
      console.log('Bundled')
      send({event: 'reload', data: {}})
    })
    .pipe(write)
}

function onRequest(req, res) {
  if (req.url == '/events') {
    const sse = new SseStream(req);
    sse.pipe(res);
    clients.set(req, sse)
    res.socket.on('close', function () {
      clients.delete(req)
    })
    return
  }

  return serve(req, res);
}

if (argv._[0] === 'template') {
  const dest = path.resolve(process.cwd(), argv._[1] || '.')
  template(dest)
  return
}

const PORT = process.env.PORT || 8080
const HOST = process.env.HOST || 'localhost'
const entries = argv._.length ? argv._ : [path.join(process.cwd(), 'index.js')];
console.log('Starting browserify on %s', entries)
const b = browserify({
  entries,
  cache: {},
  packageCache: {},
  debug: true, //enables source maps
  plugin: [watchify]
})
.transform('babelify')
.transform(appendify, {
  glob: 'index.js',
  string: `
const es = new EventSource(window.location.origin + '/events')
es.addEventListener('reload', function(e) {
  window.location.reload()
})

es.addEventListener('builderror', function(e) {
  console.error(e.data)
})

es.onopen = function() {
  console.log('Communication with development server is open.')
}`
});

b.on('update', bundle);
bundle();

http.createServer(onRequest).listen(PORT, HOST, function() {
  console.log(`Development server started on ${HOST}:${PORT}`)
});
