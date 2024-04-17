import { lex, types, value } from "csslex";
import { nativeSelectors } from './utils';
/*
    https://github.com/keithamus/csslex
*/
type Token = [type: typeof types[keyof typeof types], start: number, end: number]

export const tokenTypes = Object.fromEntries(
    Object.entries(types).map(([key, value]) => [value, key])
);

/*
    > selector block
        > nested selector block
        > nested @query block
    > @query block 
        > selector block
            > nested selector block
            > @query block 
        > @query block 
            > selector bloclk
            > nested selector block
        
*/

type Block = {
    parent: undefined | Block;
    selector: string;
    properties: Array<{ name: string; value: string; }>;
    children: BlockTree;
}

interface BlockTree {
    [key: string]: Block;
}

export function parseCSS(source:string) {
    

    let blockTree:BlockTree = {}

    // Remove comments from source string
    source = source.replace(/\/\*[\s\S]*?\*\//g, ''); 
    const tokens: Token[] = Array.from( lex(source) ) 
    
    let at = 0
    let currentBlock: undefined | Block = undefined;
    let inProperty = false;

    const find_custom_property = (token: Token, index: number): boolean => { 
        return token[0] === 2 && source.slice(token[1],token[2]).slice(0, 2) === '--' 
    }

    const is_native_selector = (identifier:string):boolean => {
        return nativeSelectors.includes(identifier)
    }

    const setBlock = (selector:string) => {
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

    const addPropertyToBlock = () => {

    }

    const chomp = () => {

        const token = tokens[at];
        const type = token[0]

        console.log(`at:${at}`,tokenTypes[type], source.slice(token[1], token[2]))

        if (type === 17 && currentBlock) {
            inProperty = true
        }
        
        else if (type === 18) {
            inProperty = false
        }

        // handle HASH '#somestring' or '#FFF'
        else if (type === 5 && !inProperty) {
            setBlock(source.slice(token[1], token[2]))
        }

        // handle delim ('.' or '&' or '*')
        else if (type === 10 || is_native_selector(source.slice(token[1], token[2]))) {
            for (let i = at+1; i < tokens.length; i++) {
                const successiveToken = tokens[i];
                if (successiveToken[0] === 24) { // found left curly 
                    at = i;
                    setBlock(source.slice(token[1], successiveToken[1]))
                    break;
                }
            }
        }

        else if (type === 25) { // found right curly
            currentBlock = currentBlock?.parent;
        }


       
        
        // if( currentBlock)  console.log(currentBlock)
        

        at++;

        if (at < tokens.length) chomp()
    }; chomp()
    

    console.log(blockTree)

    return []
}