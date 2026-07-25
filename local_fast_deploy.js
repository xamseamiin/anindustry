// local_fast_deploy.js
const { Client } = require('ssh2');
const fs = require('fs');
const { execSync } = require('child_process');

const VPS_HOST = '81.0.248.108';
const VPS_USER = 'root';
const VPS_PASS = '172885Moalin';
const REMOTE_DIR = '/root/an-industory';
const LOCAL_TARBALL = 'an_industory_deploy.tar.gz';

console.log('1. Creating local tarball an_industory_deploy.tar.gz...');
try {
  if (fs.existsSync(LOCAL_TARBALL)) {
    fs.unlinkSync(LOCAL_TARBALL);
  }
  execSync('tar --exclude=node_modules --exclude=.git --exclude=.next --exclude=dist -czf an_industory_deploy.tar.gz .', { stdio: 'inherit' });
  console.log('Tarball created successfully!');
} catch (err) {
  console.error('Failed to create tarball:', err);
  process.exit(1);
}

const conn = new Client();
console.log('2. Connecting to VPS via SSH...');

conn.on('ready', () => {
  console.log('SSH Connection established. Opening SFTP...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    console.log('Uploading .env to /root/an-industory/.env...');
    sftp.fastPut('.env', `${REMOTE_DIR}/.env`, (err) => {
      if (err) console.error('Error uploading .env:', err);
      else console.log('.env uploaded successfully!');

      console.log('Uploading an_industory_deploy.tar.gz...');
      sftp.fastPut(LOCAL_TARBALL, `/root/${LOCAL_TARBALL}`, (err) => {
        if (err) {
          console.error('Error uploading tarball:', err);
          conn.end();
          process.exit(1);
        }
        console.log('Upload complete. Executing remote build/restart commands...');

        const deployCommands = [
          'echo "Starting An Industry Deployment & Balance Audit on Port 3001..."',
          'rm -rf /root/an-industory/app /root/an-industory/components /root/an-industory/contexts /root/an-industory/lib /root/an-industory/prisma /root/an-industory/types /root/an-industory/hooks /root/an-industory/scripts',
          'find /root/an-industory/public -mindepth 1 -maxdepth 1 ! -name \'uploads\' -exec rm -rf {} + || true',
          'tar -xzf /root/an_industory_deploy.tar.gz -C /root/an-industory',
          'cd /root/an-industory && npm install --legacy-peer-deps',
          'cd /root/an-industory && npx prisma generate',
          'cd /root/an-industory && npx prisma db push --accept-data-loss',
          'cd /root/an-industory && export NODE_OPTIONS="--max-old-space-size=4096" && npm run build',
          'cd /root/an-industory && cp -r public .next/standalone/ || true',
          'cd /root/an-industory && cp -r .next/static .next/standalone/.next/ || true',
          'pm2 delete an-industory-nextjs || true',
          'cd /root/an-industory && PORT=3001 pm2 start .next/standalone/server.js --name "an-industory-nextjs"',
          'pm2 restart an-industory-bot || true',
          'pm2 save',
          'pm2 status'
        ];

        let cmdIndex = 0;
        function runNextCommand() {
          if (cmdIndex >= deployCommands.length) {
            console.log('Deployment completed successfully!');
            if (fs.existsSync(LOCAL_TARBALL)) fs.unlinkSync(LOCAL_TARBALL);
            conn.end();
            return;
          }

          const cmd = deployCommands[cmdIndex++];
          console.log(`\nExecuting: ${cmd}`);
          conn.exec(cmd, (err, stream) => {
            if (err) {
              console.error(`Execution error for command "${cmd}":`, err);
              conn.end();
              process.exit(1);
            }
            stream.on('close', (code, signal) => {
              if (code !== 0 && !cmd.includes('|| true')) {
                console.error(`Command failed with code ${code}`);
              }
              runNextCommand();
            }).on('data', (data) => {
              process.stdout.write(data.toString());
            }).stderr.on('data', (data) => {
              process.stderr.write(data.toString());
            });
          });
        }

        runNextCommand();
      });
    });
  });
}).connect({
  host: VPS_HOST,
  port: 22,
  username: VPS_USER,
  password: VPS_PASS
});
