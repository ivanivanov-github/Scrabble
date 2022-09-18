import { PlayerScore } from '@common/player-score';
import { Db, MongoClient, MongoClientOptions } from 'mongodb';
import { Service } from 'typedi';

const DATABASE_NAME = 'Log2990DB';

@Service()
export class DatabaseService {
    private db: Db;
    private client: MongoClient;
    private options: MongoClientOptions = {};

    async connectToServer(url: string): Promise<MongoClient | null> {
        try {
            this.client = await MongoClient.connect(url, this.options);
            this.db = this.client.db(DATABASE_NAME);
            // eslint-disable-next-line no-console
            console.log('Successfully connected to MongoDB.');
        } catch {
            await this.closeConnection();
            throw new Error('Database connection error');
        }
        return this.client;
    }

    async populateDb(collectionName: string, data: PlayerScore[]) {
        const collection = this.db.collection(collectionName);
        const isEmpty = (await collection.countDocuments()) === 0;
        if (isEmpty) {
            await collection.insertMany(data);
        }
    }

    async closeConnection(): Promise<void> {
        if (!this.client) return;
        return this.client.close();
    }

    get database(): Db {
        return this.db;
    }
}
