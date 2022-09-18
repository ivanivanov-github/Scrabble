import { Application } from '@app/app';
import { environment } from '@app/environments/environment';
import { DatabaseService } from '@app/services/database/database.service';
import { ScoreDatabaseService } from '@app/services/database/score-database-service/score-database.service';
import * as http from 'http';
import { AddressInfo } from 'net';
import { Service } from 'typedi';
import { AdminService } from './services/database/admin-service/admin.service';
import { DictionaryService } from './services/dictionary/dictionary.service';
import { WebsocketService } from './services/socket/websocket.service';

@Service()
export class Server {
    private static readonly appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3000');
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private static readonly baseDix: number = 10;
    private server: http.Server;

    constructor(
        private readonly application: Application,
        public wsService: WebsocketService,
        public dbService: DatabaseService,
        public scoreService: ScoreDatabaseService,
        public admins: AdminService,
        public dictionaryService: DictionaryService,
    ) {}

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, this.baseDix) : val;
        if (isNaN(port)) {
            return val;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    }
    async init(): Promise<void> {
        this.application.app.set('port', Server.appPort);

        this.server = http.createServer(this.application.app);

        this.wsService.startServer(this.server);

        this.server.listen(Server.appPort);
        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => this.onListening());
        await this.dictionaryService.init();
        this.dbService.connectToServer(environment.dbUrl).then(async () => {
            await this.scoreService.populateDb();
            await this.admins.init();
        });
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                // eslint-disable-next-line no-console
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
            // eslint-disable-next-line no-fallthrough
            case 'EADDRINUSE':
                // eslint-disable-next-line no-console
                console.error(`${bind} is already in use`);
                process.exit(1);
            // eslint-disable-next-line no-fallthrough
            default:
                throw error;
        }
    }

    /**
     * Se produit lorsque le serveur se met à écouter sur le port.
     */
    private onListening(): void {
        const addr = this.server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        // eslint-disable-next-line no-console
        console.log(`Listening on ${bind}`);
    }
}
