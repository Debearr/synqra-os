import { FusionEntry, PipelineTarget } from './types';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { google } from 'googleapis';

// --- Retry Helper ---

async function withRetry(
    operation: () => Promise<boolean>,
    attempts: number = 3,
    delayMs: number = 1000,
    targetName: string
): Promise<boolean> {
    for (let i = 1; i <= attempts; i++) {
        try {
            const success = await operation();
            if (success) return true;
            throw new Error('Operation returned false');
        } catch (error) {
            if (i === attempts) {
                console.error(`[Pipeline] Failed to write to ${targetName} after ${attempts} attempts. Error: ${error}`);
                return false;
            }
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
    return false;
}

// --- Target Implementations ---

class LocalJsonTarget implements PipelineTarget {
    name = 'Local JSON';
    private basePath = path.join(process.cwd(), 'synqra', 'intake');

    async write(entry: FusionEntry): Promise<boolean> {
        try {
            await fs.mkdir(this.basePath, { recursive: true });
            // Use timestamp in filename
            const safeTimestamp = entry.timestamp.replace(/:/g, '-');
            const filename = `${safeTimestamp}_${entry.id}.json`;
            const filePath = path.join(this.basePath, filename);

            await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
            return true;
        } catch (error) {
            throw error;
        }
    }
}

class GoogleSheetsTarget implements PipelineTarget {
    name = 'Google Sheets';
    async write(entry: FusionEntry): Promise<boolean> {
        // Placeholder
        return true;
    }
}

class SupabaseTarget implements PipelineTarget {
    name = 'Supabase';
    private client;

    constructor() {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_KEY;
        if (url && key) {
            this.client = createClient(url, key);
        }
    }

    async write(entry: FusionEntry): Promise<boolean> {
        if (!this.client) return true;

        const { error } = await this.client
            .from('synqra_intake')
            .insert(entry);

        if (error) throw error;
        return true;
    }
}

class RailwayPostgresTarget implements PipelineTarget {
    name = 'Railway Postgres';
    private pool;

    constructor() {
        if (process.env.POSTGRES_CONNECTION_STRING) {
            this.pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING });
        }
    }

    async write(entry: FusionEntry): Promise<boolean> {
        if (!this.pool) return true;

        const query = `
      INSERT INTO synqra_intake (id, raw_data, insight, processed_at)
      VALUES ($1, $2, $3, $4)
    `;
        await this.pool.query(query, [
            entry.id,
            entry.raw,
            entry.insights,
            entry.timestamp // Using timestamp as processed_at
        ]);
        return true;
    }
}

class CentralMemoryBusTarget implements PipelineTarget {
    name = 'Synqra Central Memory Bus';
    private busPath = path.join(process.cwd(), 'synqra', 'memory-bus.log');

    async write(entry: FusionEntry): Promise<boolean> {
        try {
            const line = JSON.stringify({ type: 'FUSION_EVENT', ...entry }) + '\n';
            await fs.appendFile(this.busPath, line);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

// --- Pipeline Orchestrator ---

export class SynqraPipeline {
    private targets: PipelineTarget[] = [
        new LocalJsonTarget(),
        new GoogleSheetsTarget(),
        new SupabaseTarget(),
        new RailwayPostgresTarget(),
        new CentralMemoryBusTarget()
    ];

    async distribute(entry: FusionEntry): Promise<void> {
        const results = await Promise.allSettled(
            this.targets.map(async (target) => {
                const success = await withRetry(
                    () => target.write(entry),
                    3,
                    1000,
                    target.name
                );
                if (success) {
                    console.log(`✅ [${target.name}] Write success`);
                }
                return success;
            })
        );
    }
}
