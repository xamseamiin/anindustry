// list_revlo_files.js
const { exec } = require('child_process');
const host = "81.0.248.108";
// Let's run a quick ssh command to list the files
const Client = require('ssh2').Client;
const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('ls -la /root/revlo', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: host,
  port: 22,
  username: 'root',
  password: '172885Moalin'
});
