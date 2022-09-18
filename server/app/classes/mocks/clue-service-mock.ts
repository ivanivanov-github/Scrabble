import { TrieNode } from '@app/classes/trie/trie-node';

export const trieMock = {
    search: (word: string) => {
        if (word !== 'test') return true;
        return false;
    },

    getLastTrieNode: (word: string) => {
        if (word !== 'test') return new TrieNode();
        return;
    },
};
export const defaultDictMock = {
    get: () => {
        return trieMock;
    },
    set: () => {
        return trieMock;
    },
    delete: () => {
        return;
    },
};

export const defaultNumberDictUser = {
    get: () => {
        return 1;
    },
    set: () => {
        return 2;
    },
    delete: () => {
        return 1;
    },
};
