export class TrieNode {
    isEndOfWord: boolean;
    children: Map<string, TrieNode>;

    constructor() {
        this.isEndOfWord = false;
        this.children = new Map();
    }
}
