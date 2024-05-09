import { lex, types } from "csslex";
import { elementSelectors, pseudoSelectors, standalonePseudoSelectors } from './utils';
/*
    https://github.com/keithamus/csslex
*/
type Token = [type: typeof types[keyof typeof types], start: number, end: number]

interface BlockTree {
    [key: string]: Block;
}

type Property = { name: string; value: string; }

type Block = {
    parent: undefined | Block;
    selector: string;
    properties: Array<Property>;
    children: BlockTree;
}

export const tokenTypes = Object.fromEntries(
    Object.entries(types).map(([key, value]) => [value, key])
);

export function parseCSS(source:string) {
    source = source.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove comments from source string
    
    const blockTree: BlockTree = {};

    const tokens: Token[] = Array.from(lex(source)); 
    
    let at: number = 0;
    let currentBlock: undefined | Block;
    let currentProperty: undefined | Property;
    
    const 
    tokenValue = (token:Token): string => {
        return source.slice(token[1], token[2]);
    },
    is_at_keyword = (token: Token): boolean => {
        return token[0] === 4;
    },
    is_star = (token: Token): boolean => {
        return token[0] === 10 && tokenValue(token) === '*';
    },
    is_amp = (token: Token): boolean => {
        return token[0] === 10 && tokenValue(token) === '&';
    },
    is_dot = (token: Token): boolean => {
        return token[0] === 10 && tokenValue(token) === '.';
    },
    is_class_selector = (token: Token): boolean => {
        return is_dot(token) && tokens[at+1][0] === 2;
    },
    is_id_selector = (token: Token): boolean => {
        return token[0] === 5 && !currentProperty;
    },
    is_native_selector = (token: Token):boolean => {
        return token[0] === 2 && elementSelectors.includes(tokenValue(token));
    },
    is_pseudo_selector = (token: Token):boolean => {
        if (token[0] !== 17) return false;
        
        let itIs = false
        for (let i = at+1; i < tokens.length; i++) {
            const successiveToken = tokens[i];
            if (successiveToken[0] !== 2 
                && successiveToken[0] !== 3 
                && successiveToken[0] !== 17) break;

            if (successiveToken[0] === 3) {
                return true;
            }

            else if (successiveToken[0] === 2 ) {
                itIs = pseudoSelectors.includes(tokenValue(successiveToken));
                break;
            } else {
                itIs = tokens[i+1][0] === 2 && pseudoSelectors.includes(tokenValue(tokens[i+1]))
                break;
            }
        }
        return itIs;
    }

    const findOpeningCurlyAndsetSelectorBlock = (token:Token) => {
        for (let i = at+1; i < tokens.length; i++) {
            const successiveToken = tokens[i];
            if (successiveToken[0] === 24) { // found left curly 
                at = i;
                setSelectorBlock(source.slice(token[1], successiveToken[1]))
                break;
            }
        }
    }

    const setSelectorBlock = (selector:string) => {
        selector = selector.trim()
        if (!currentBlock) {
            if( !blockTree.hasOwnProperty(selector)) {
                blockTree[selector] = {
                    parent: undefined,
                    selector,
                    properties: [],
                    children: {},
                }
                currentBlock = blockTree[selector]
            }
        }
        else if (!currentBlock.children.hasOwnProperty(selector)) {
            currentBlock.children[selector] = {
                parent: currentBlock,
                selector,
                properties: [],
                children: {},
            }
            currentBlock = currentBlock.children[selector]
        }
    }

    const findAndParseProperty = (token:Token) => {

        if (token[0] !== 2) return; 
        
        let property;

        let sliceStart;
        let sliceEnd;
        
        let next = at+1

        for (next; next < tokens.length; next++) {

            if (tokens[next][0] === 14) continue;
            
            else if (tokens[next][0] === 17)  {
                sliceStart = tokens[next][2]
                property = { name: tokenValue(token), value: ''}
                break
            }
        }
        
        if (!property) return;

        
        for (next; next < tokens.length; next++) {
            
            const successiveToken = tokens[next];

            console.log(`%c ${property.name} value at:${at} | ${tokenTypes[successiveToken[0]]} | ${tokenValue(successiveToken)}`, 'color: coral')

            if (successiveToken[0] === 18) { // Semicolon closes this property fo sho
                sliceEnd = successiveToken[1]
                break;
            }

            //found another left curly? not good...
            else if (successiveToken[0] === 24) {
                at = next
                return;
            }
        }
        
        property.value = source.slice(sliceStart, sliceEnd).trim();
        
        if( property.name.slice(0, 2) === '--' ) {
            currentBlock?.properties.push(property)
        }

        at = next

    }

    const chomp = () => {

        const token = tokens[at];
        const type = token[0]

        console.log(`%c chomp at:${at} | ${tokenTypes[type]} | ${tokenValue(token)}`, 'color: green')

        if (
            currentBlock && is_amp(token)
            || is_star(token) 
            || is_id_selector(token)
            || is_native_selector(token)
            || is_pseudo_selector(token)
            || is_class_selector(token)
            || is_at_keyword(token)
        ) {
            findOpeningCurlyAndsetSelectorBlock(token)
        }
     
        if (currentBlock) findAndParseProperty(token);
        
        // RIGHT CURLY
        if (type === 25) currentBlock = currentBlock?.parent;

        at++; if (at < tokens.length) chomp();
        
    }; chomp();


    console.log({blockTree})
    return []
}