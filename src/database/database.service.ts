import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { URL } from 'node:url';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
    constructor() {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL environment variable is missing.');
        }

        const parsedUrl = new URL(dbUrl);
        const adapter = new PrismaMariaDb({
            host: parsedUrl.hostname || 'localhost',
            port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
            user: parsedUrl.username,
            password: decodeURIComponent(parsedUrl.password),
            database: parsedUrl.pathname.substring(1),
            connectionLimit: 10,
        });

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }  
}
