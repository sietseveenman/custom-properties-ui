import { lex, types, value } from "csslex";

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
    selector: string;
    properties: Array<{ name: string; value: string; }>;
    children: Block;
}

export function parseCSS(source:string) {
    

    let blockPropTree = {}

    // Remove comments from source string
    source = source.replace(/\/\*[\s\S]*?\*\//g, ''); 
    const tokens: Token[] = Array.from( lex(source) ) 
    
    let at = 0
    let selector;

    const find_custom_property = (token: Token, index: number): boolean => { 
        return token[0] === 2 && source.slice(token[1],token[2]).slice(0, 2) === '--' 
    }

    const find_selector = (token: Token, index: number): undefined | string  => {
        const tType = token[0]
        // Type = HASH
        if (tType === 5) return source.slice(token[1], token[2]);
        // Type = DELIM . or & or *
        // if (tType === 10)

        return undefined;
    }

    const chomp = () => {

        const token = tokens[at];
        console.log(tokenTypes[token[0]], source.slice(token[1], token[2]))

        selector = find_selector(token, at)
        console.log(selector)
        at++;

        if (at < tokens.length) chomp()
    }; chomp()
    


    return []
}