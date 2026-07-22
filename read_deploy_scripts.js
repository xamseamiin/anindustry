// read_deploy_scripts.js
const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('cat /root/revlo/fast_deploy.js', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('fast_deploy.js content:\n' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '81.0.248.108',
  port: 22,
  username: 'root',
  password: '172885Moalin'
});
