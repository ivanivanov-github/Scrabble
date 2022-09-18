import { Trie } from '@app/classes/trie/trie';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { DictHeaders, Dictionary } from '@common/dictionary';
import * as fs from 'fs';
import * as path from 'path';
import { Service } from 'typedi';

@Service()
export class DictionaryService {
    defaultDict: Dictionary;
    dictionaries: Dictionary[];
    numberDictUser: Map<string, number>;
    dictTrie: Map<string, Trie>;
    constructor(private readonly ws: WebsocketService) {}

    async init(): Promise<void> {
        this.dictionaries = [];
        this.dictTrie = new Map();
        this.numberDictUser = new Map();
        const files = await fs.promises.readdir(path.join(process.cwd(), 'assets'));
        for (const file of files) {
            const dictionary = await this.parseDictionary(file);
            this.dictionaries.push(dictionary);
            if (file === 'dictionary.json') this.defaultDict = dictionary;
            this.createDictTrie(dictionary);
        }
    }

    getDictionary(title: string): Dictionary | undefined {
        return this.dictionaries.find((dictionary) => dictionary.title === title);
    }

    getDictionnariesHeaders(): DictHeaders[] {
        return this.dictionaries.map((dictionary) => {
            return { title: dictionary.title, description: dictionary.description };
        });
    }
    async addDictionary(dictionary: Dictionary): Promise<void> {
        const existingDictionary = this.getDictionary(dictionary.title);
        if (existingDictionary) throw new Error('Le dictionnaire existe déjà');
        this.dictionaries.push(dictionary);
        await this.writeFile(dictionary, dictionary.title);
        this.emitNewDict();
    }

    async modifyDictionary(oldTitle: string, newTitle: string, newDescription: string): Promise<Dictionary> {
        const existingDictionary = this.getDictionary(oldTitle);
        if (!existingDictionary) throw new Error("Le dictionnaire n'existe pas");
        if (existingDictionary.title === this.defaultDict.title) throw new Error('Vous ne pouvez pas modifier le dictionnaire par défaut');
        if (!newTitle) newTitle = existingDictionary.title;
        if (!newDescription) newDescription = existingDictionary.description;
        existingDictionary.title = newTitle;
        existingDictionary.description = newDescription;
        await this.deleteFile(`${oldTitle}.json`);
        await this.writeFile(existingDictionary, newTitle);
        this.emitNewDict();
        return existingDictionary;
    }

    async deleteDictionary(title: string): Promise<void> {
        if (title === this.defaultDict.title) throw new Error('Vous ne pouvez pas supprimer le dictionnaire par défaut');
        await this.deleteFile(`${title}.json`);
        this.dictionaries = this.dictionaries.filter((dictionary) => dictionary.title !== title);
        this.emitNewDict();
    }

    async reset(): Promise<void> {
        const files = await fs.promises.readdir(path.join(process.cwd(), 'assets'));
        for (const file of files) {
            if (file !== 'dictionary.json') {
                await this.deleteFile(file);
            }
        }
        this.dictionaries = [this.defaultDict];
        this.emitNewDict();
    }

    async parseDictionary(title: string): Promise<Dictionary> {
        const data = await fs.promises.readFile(path.join(process.cwd(), 'assets', title), 'utf-8');
        return JSON.parse(data);
    }
    verifyWord(dictTitle: string, word: string): boolean {
        return (this.dictTrie.get(dictTitle) as Trie).search(word);
    }

    updateNumberOfUserOfDictTrie(gameDict: string) {
        const numberOfCurrentdictionnaryUser = this.numberDictUser.get(gameDict) as number;
        if (numberOfCurrentdictionnaryUser > 0) {
            this.numberDictUser.set(gameDict, numberOfCurrentdictionnaryUser - 1);
        } else {
            this.dictTrie.delete(gameDict);
        }
    }

    private createDictTrie(dict: Dictionary): void {
        const trie = new Trie();
        for (const word of dict.words) {
            trie.insert(word);
        }
        this.dictTrie.set(dict.title, trie);
        this.numberDictUser.set(dict.title, 0);
    }

    private async writeFile(dictionary: Dictionary, title: string): Promise<void> {
        fs.promises.writeFile(path.join(process.cwd(), 'assets/', `${title}.json`), JSON.stringify(dictionary));
        this.createDictTrie(dictionary);
    }

    private async deleteFile(name: string): Promise<void> {
        fs.promises.unlink(path.join(process.cwd(), 'assets/', name));
    }

    private async emitNewDict() {
        this.ws.io.emit('newDict', this.getDictionnariesHeaders());
    }
}
