/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatabaseService } from '@app/services/database/database.service';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { DATABASE_COLLECTION_VIRTUAL_PLAYER_NAME } from '@app/utils/score-database-contant';
import { VirtualPlayerName } from '@common/player';
import { VirtualPlayerType } from '@common/virtualPlayer';
import { Collection } from 'mongodb';
import { Container, Service } from 'typedi';

const DEFAULT_VIRTUAL_PLAYER_NAMES: VirtualPlayerName[] = [
    { name: 'Maximus', type: VirtualPlayerType.debutant, isReadonly: true },
    { name: 'Krim', type: VirtualPlayerType.debutant, isReadonly: true },
    { name: 'BIGO', type: VirtualPlayerType.debutant, isReadonly: true },
    { name: 'Wantz', type: VirtualPlayerType.expert, isReadonly: true },
    { name: 'Ivan-Ivanov-Ivanov', type: VirtualPlayerType.expert, isReadonly: true },
    { name: 'Thanos', type: VirtualPlayerType.expert, isReadonly: true },
];
@Service()
export class AdminService {
    constructor(private readonly db: DatabaseService) {}
    async init(): Promise<void> {
        if ((await this.collection.countDocuments()) === 0) {
            await this.collection.insertMany(DEFAULT_VIRTUAL_PLAYER_NAMES);
        }
    }

    async getVirtualPlayerNames(): Promise<VirtualPlayerName[]> {
        return (await this.collection.find({}).toArray()).map((virtualPlayer) => ({
            name: virtualPlayer.name,
            type: virtualPlayer.type,
            isReadonly: virtualPlayer.isReadonly,
        }));
    }
    async getRandomVirtualPlayerName(gameMode: VirtualPlayerType): Promise<string> {
        const virtualPlayerNames: VirtualPlayerName[] = await this.getVirtualPlayerNames();
        let virtualPlayerName: VirtualPlayerName[];
        if (gameMode === VirtualPlayerType.debutant) {
            virtualPlayerName = virtualPlayerNames.filter((p) => p.type === VirtualPlayerType.debutant);
        } else {
            virtualPlayerName = virtualPlayerNames.filter((p) => p.type === VirtualPlayerType.expert);
        }
        const randomIndex = Math.floor(Math.random() * virtualPlayerName.length);
        return virtualPlayerName[randomIndex].name;
    }

    addVirtualPlayer(name: string, type: VirtualPlayerType): void {
        this.collection.insertOne({ name, type, isReadonly: false }).then(() => {
            this.emitVirtualPlayerchange();
        });
    }

    deleteVirtualPlayer(name: string, type: VirtualPlayerType): void {
        this.collection.findOneAndDelete({ name, isReadonly: false, type }).then(() => {
            this.emitVirtualPlayerchange();
        });
    }
    renameVirtualPlayer(oldName: string, newName: string, type: VirtualPlayerType): void {
        this.collection
            .findOneAndUpdate({ name: oldName, type, isReadonly: false }, { $set: { name: newName, type, isReadonly: false } })
            .then(() => {
                this.emitVirtualPlayerchange();
            });
    }

    async reset(): Promise<void> {
        if ((await this.collection.countDocuments()) > 0) {
            await this.collection.drop();
        }

        this.collection.insertMany(DEFAULT_VIRTUAL_PLAYER_NAMES).then(() => {
            this.emitVirtualPlayerchange();
        });
    }

    private get collection(): Collection<VirtualPlayerName> {
        return this.db.database.collection(DATABASE_COLLECTION_VIRTUAL_PLAYER_NAME);
    }

    private async emitVirtualPlayerchange() {
        const virtualPlayerNames: VirtualPlayerName[] = await this.getVirtualPlayerNames();
        Container.get(WebsocketService).io.emit('virtualPlayerChange', virtualPlayerNames);
    }
}
