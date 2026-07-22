// local_fast_deploy.js
const { exec } = require('child_process');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const deployCommands = [
  'echo "Starting Fast Deployment on Server..."',
  'rm -rf /root/revlo/app /root/revlo/components /root/revlo/contexts /root/revlo/lib /root/revlo/prisma /root/revlo/types /root/revlo/hooks',
  'find /root/revlo/public -mindepth 1 -maxdepth 1 ! -name \'uploads\' -exec rm -rf {} + || true',
  'tar -xzf /root/revlo_deploy.tar.gz -C /root/revlo',
  'cd /root/revlo && npm install --legacy-peer-deps',
  'cd /root/revlo && npx prisma generate',
  'cd /root/revlo && npx prisma db push --accept-data-loss',
  'cd /root/revlo && export NODE_OPTIONS="--max-old-space-size=4096" && npm run build',
  'cd /root/revlo && cp -r public .next/standalone/ || true',
  'cd /root/revlo && cp -r .next/static .next/standalone/.next/ || true',
  'pm2 delete revlo || true',
  'cd /root/revlo && pm2 start .next/standalone/server.js --name "revlo"',
  'pm2 save',
  'pm2 status'
];

console.log('1. Creating local tarball revlo_deploy.tar.gz...');
const tarCmd = 'tar --exclude=node_modules --exclude=.git --exclude=.next --exclude=dist -czf revlo_deploy.tar.gz .';

exec(tarCmd, (err, stdout, stderr) => {
    if (err) {
        console.error('Failed to create tarball:', err);
        process.exit(1);
    }
    console.log('Tarball created successfully!');

    console.log('2. Connecting to VPS via SSH...');
    const conn = new Client();
    conn.on('ready', () => {
        console.log('SSH Connection established. Opening SFTP...');
        conn.sftp((err, sftp) => {
            if (err) {
                console.error('SFTP Error:', err);
                conn.end();
                process.exit(1);
            }

            console.log('Uploading .env...');
            sftp.fastPut('.env', '/root/revlo/.env', (err) => {
                if (err) console.error('Error uploading .env (skipping):', err);
                else console.log('.env uploaded successfully!');

                console.log('Uploading revlo_deploy.tar.gz (this may take a moment)...');
                sftp.fastPut('revlo_deploy.tar.gz', '/root/revlo_deploy.tar.gz', { concurrency: 1 }, (err) => {
                    if (err) {
                        console.error('Error uploading tarball:', err);
                        conn.end();
                        process.exit(1);
                    }
                    console.log('Upload complete. Executing remote build/restart commands...');
                    execCommandList(conn, deployCommands, () => {
                        console.log('Fast deployment completed successfully!');
                        
                        // Clean up local tarball
                        try {
                            fs.unlinkSync('revlo_deploy.tar.gz');
                            console.log('Cleaned up local revlo_deploy.tar.gz');
                        } catch (e) {}

                        conn.end();
                    });
                });
            });
        });
    }).connect({
        host: HOST,
        port: 22,
        username: USERNAME,
        password: PASSWORD
    });
});

function execCommandList(conn, cmds, callback) {
  let i = 0;
  function next() {
    if (i >= cmds.length) return callback();
    const cmd = cmds[i++];
    console.log(`\nExecuting: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) {
          console.error(`Command execution error for "${cmd}":`, err);
          return next();
      }
      stream.on('close', (code, signal) => {
        next();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }
  next();
}
