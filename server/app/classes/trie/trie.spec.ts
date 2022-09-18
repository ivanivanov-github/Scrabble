/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable guard-for-in */
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Trie } from './trie';
import { TrieNode } from './trie-node';

describe('TrieNode', () => {
    let nonForgottenTeammate: string[];
    let forgottenTeammate: string;
    let trie: Trie;

    beforeEach(() => {
        nonForgottenTeammate = ['eliott', 'jamesley', 'abdel', 'olivier', 'ivan'];
        forgottenTeammate = 'maxime';
        trie = new Trie();

        for (let i = 0; i < nonForgottenTeammate.length; i++) {
            trie.insert(nonForgottenTeammate[i]);
        }
    });
    it('trie should add teammate', async () => {
        for (let i = 0; i < nonForgottenTeammate.length; i++) {
            expect(trie.search(nonForgottenTeammate[i])).to.equal(true);
        }
    });

    it("call to insert eliopi should add 'pi' to children of 'o' in elio", () => {
        trie = sinon.spy(trie);
        trie.insert('eliopi');
        expect(trie.search('eliopi')).to.equal(true);
    });

    it('forgot to add maxime , oops', async () => {
        expect(trie.search(forgottenTeammate)).to.equal(false);
    });

    it("should return the last trieNode of the word 'to'", () => {
        const trieNode: TrieNode = new TrieNode();
        const childTrieNode: TrieNode = new TrieNode();
        trie.root.children.set('t', trieNode);
        trieNode.children.set('o', childTrieNode);
        expect(trie.getLastTrieNode('to')).to.be.equal(childTrieNode);
    });

    it("getLastTrieNode should return undefined for 'to'", () => {
        const trieNode: TrieNode = new TrieNode();
        const childTrieNode: TrieNode = new TrieNode();
        trie.root.children.set('t', trieNode);
        trieNode.children.set('a', childTrieNode);
        expect(trie.getLastTrieNode('to')).to.be.equal(undefined);
    });
});
