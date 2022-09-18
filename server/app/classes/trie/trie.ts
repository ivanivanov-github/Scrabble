import { TrieNode } from '@app/classes/trie/trie-node';

export class Trie {
    root: TrieNode;
    constructor() {
        this.root = new TrieNode();
    }

    insert(words: string): void {
        let curr: TrieNode = this.root;
        for (const word of words) {
            if (!curr.children.has(word)) {
                curr.children.set(word, new TrieNode());
            }
            curr = curr.children.get(word) as TrieNode;
        }
        curr.isEndOfWord = true;
    }

    search(words: string): boolean {
        let curr = this.root;
        for (const word of words) {
            if (!curr.children.has(word)) {
                return false;
            }
            curr = curr.children.get(word) as TrieNode;
        }
        return curr.isEndOfWord;
    }

    getLastTrieNode(word: string): TrieNode | undefined {
        let curr = this.root;
        for (const letter of word) {
            if (!curr.children.has(letter)) {
                return undefined;
            }
            curr = curr.children.get(letter) as TrieNode;
        }
        return curr;
    }
}
