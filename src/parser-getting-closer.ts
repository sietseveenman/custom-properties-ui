import { lex, types } from "csslex";
import { elementSelectors, pseudoSelectors, standalonePseudoSelectors } from './utils';
/*
    https://github.com/keithamus/csslex
*/
type Token = [type: typeof types[keyof typeof types], start: number, end: number]


interface BlockTree {
    [key: string]: Block;
}


type Block = {
    parent: undefined | Block;
    selector: string;
    properties: Array<{ name: string; value: string; }>;
    children: BlockTree;
}


export const tokenTypes = Object.fromEntries(
    Object.entries(types).map(([key, value]) => [value, key])
);


/*
    NOTE:
        Might need to keep track of more specific current "context" to handle DELIM is a specific way
        For example At root level a selector can only begin with the DELIM value of . or a COLON directly followed by an ident
        Right now currentBlock keeps track of this 

        currentProperty could keep track of state where DELIM has a different meaning all over again?

*/

export function parseCSS(source:string) {
    
    let blockTree:BlockTree = {}

    // Remove comments from source string
    source = source.replace(/\/\*[\s\S]*?\*\//g, ''); 
    const tokens: Token[] = Array.from( lex(source) ) 
    
    let at = 0
    let currentBlock: undefined | Block;
    let currentProperty: undefined | string;

    const is_custom_property = (token: Token): boolean => { 
        return token[0] === 2 && source.slice(token[1],token[2]).slice(0, 2) === '--' ;
    }

    const is_native_selector = (identifier:string):boolean => {
        return elementSelectors.includes(identifier);
    }

    const is_standalone_pseudo_selector = (identifier:string):boolean => {
        return standalonePseudoSelectors.includes(identifier);
    }

    const is_pseudo_selector = (identifier:string):boolean => {
        return pseudoSelectors.includes(identifier);
    }

    const is_start_of_selector = (token: Token, index:number): boolean => {
        const is_delim = token[0] === 10;
        const is_colon = token[0] === 17;
        const successiveToken = tokens[index+1] ?? undefined

        // at root level
        if ( !currentBlock ) {
            if (is_delim && source.slice(token[1], token[2]) === '.' ) {
                return true;
            }
            if (is_colon) {
                
                // check if following token is identifier with specific allowed value
                return false;
            }
        }

        // inside a selector block
        else {
            // if delim value is a specific allowed character
        }

        return false
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

    const chomp = () => {

        const token = tokens[at];
        const type = token[0]

        console.log(`at:${at}`,tokenTypes[type], source.slice(token[1], token[2]))

        if (type === 17 /* COLON */ && currentBlock) currentProperty = '';
        
        else if (currentProperty && (type === 5 || type === 10 || type === 18)) {
            currentProperty = undefined;
        }
        

        // handle HASH '#somestring' or '#FFF'
        else if (type === 5 && !currentProperty) {
            setBlock(source.slice(token[1], token[2]))
        }

        // handle DELIM ('.' or '&' or '*')
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

        // RIGHT CURLY
        else if (type === 25) {
            // TODO: remove block from tree if it has no children and custom properties
            currentBlock = currentBlock?.parent;
        }
        
        // else if (is_custom_property(token)) {

        //     /*
        //         TODO: this needs a lot of work. after successive token type === 17 (COLON)

        //         HASH -> is the value
        //         URL || BAD_URL -> is the value
        //         FUNCTION -> find closing parenthesis type === 23 (RIGHT_PAREN), might have nested functions
        //         DELIM -> should directly be followed by a number indicating a 0.1 value
        //         NUMBER -> could be a set of numbers so keep checking for next selector or ;

        //     */
            
        //     console.log('custom property', source.slice(token[1], token[2]))
            
        //     let propertyValue
        //     let start
        //     let end

        //     // parse successive tokens
        //     for (let si = at+1; si < tokens.length; si++) {

        //         const successiveToken = tokens[si];
        //         console.log('find value:', si, tokenTypes[successiveToken[0]], source.slice(successiveToken[1], successiveToken[2]))

        //         // URL or BAD_URL
        //         if (successiveToken[0] === 8 || successiveToken[0] === 9) {
        //             propertyValue = source.slice(successiveToken[1], successiveToken[2]);
        //             // at = si;
        //             break;
        //         }
                
        //         // Continue on WHITESPACE
        //         if (successiveToken[0] === 14) continue;

        //         // COLON :
        //         if (successiveToken[0] === 17) {
        //             if (!start) start = successiveToken[2];
        //             // console.log(start)
        //             continue;
        //         }

        //         // HASH
        //         if (successiveToken[0] === 5 && !propertyValue) {
        //             propertyValue = source.slice(successiveToken[1], successiveToken[2]);
        //             // at = si;
        //             break;
        //         }

        //         // DELIM '.' or '&' or '*' or '+' or '>'
        //         if (successiveToken[0] === 10) {
        //             const char = source.slice(successiveToken[1], successiveToken[2]);

        //             // If this is a point '.' followed by a NUMBER
        //             if (char === '.' && tokens[si+1][0] === 11) continue;

        //             // Otherwise its a new selector 
        //             propertyValue = source.slice(start, successiveToken[2]);
        //             // at = si;
        //             break;

        //         }
                

        //         // SEMICOLON ; FO SHO this is the end of the value 
        //         else if (successiveToken[0] === 18) {
        //             propertyValue = source.slice(start, successiveToken[1]);
        //             // at = si;
        //             break;
        //         }
        //     }

        //     currentBlock?.properties.push({
        //         name: source.slice(token[1], token[2]).trim(),
        //         value: (propertyValue ?? '').trim()
        //     })

        //     propertyValue = undefined;
        //     start = undefined;
            
        // }

        at++;

        if (at < tokens.length) chomp()
        
    }; chomp()

    console.log(blockTree)

    return []
}