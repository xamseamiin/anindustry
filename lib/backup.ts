import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function createBackup(name: string, type: string = 'full') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${name.replace(/\s+/g, '_')}-${timestamp}.json.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    try {
        const dbData: Record<string, any> = {};
        
        // Dynamically fetch all models from Prisma DMMF
        const models = Prisma.dmmf.datamodel.models.map(m => m.name);
        
        // Fetch data for all models
        for (const modelName of models) {
            // Lowercase first letter to match Prisma client property (e.g., 'User' -> 'user')
            const propertyName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
            if ((prisma as any)[propertyName] && typeof (prisma as any)[propertyName].findMany === 'function') {
                const data = await (prisma as any)[propertyName].findMany();
                dbData[modelName] = data;
            }
        }

        // Compress JSON string to GZIP and write to file
        const jsonString = JSON.stringify(dbData);
        const compressedData = zlib.gzipSync(jsonString);
        fs.writeFileSync(filepath, compressedData);
        
        const stats = fs.statSync(filepath);

        return {
            success: true,
            filename,
            filepath,
            size: stats.size,
            stdout: 'GZIP Backup created successfully.',
            stderr: ''
        };
    } catch (error: any) {
        console.error('Backup failed:', error);
        throw new Error(`Backup creation failed: ${error.message}`);
    }
}

export function listBackups() {
    if (!fs.existsSync(BACKUP_DIR)) {
        return [];
    }

    const files = fs.readdirSync(BACKUP_DIR).filter(file => file.endsWith('.json') || file.endsWith('.sql'));

    return files.map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
            name: file,
            size: stats.size,
            createdAt: stats.birthtime,
            path: path.join(BACKUP_DIR, file)
        };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
