import { lex, types, value } from "csslex";

/*
    https://github.com/keithamus/csslex
*/
type Token = [type: typeof types[keyof typeof types], start: number, end: number]

export const tokenTypes = Object.fromEntries(
    Object.entries(types).map(([key, value]) => [value, key])
);

export function parseCSS(source:string) {

    // Remove comments from source string
    source = source.replace(/\/\*[\s\S]*?\*\//g, ''); 

    const tokens: Token[] = Array.from( lex(source) ) 

    let 
    currentSelector,
    at = 0

    const pseudos = [
        "active",
        "after",
        "before",
        "checked",
        "disabled",
        "empty",
        "enabled",
        "first-child",
        "first-of-type",
        "focus",
        "hover",
        "in-range",
        "invalid",
        "lang",
        "last-child",
        "last-of-type",
        "link",
        "not",
        "nth-child",
        "nth-last-child",
        "nth-last-of-type",
        "nth-of-type",
        "only-of-type",
        "only-child",
        "optional",
        "out-of-range",
        "placeholder-shown",
        "read-only",
        "read-write",
        "required",
        "root",
        "target",
        "valid",
        "visited",
        "has",
        "is",
    ];  

    
    const psuedo = (token: Token, i:number) => {
        const nextToken = tokens[i+1]
        
        if( !nextToken ) return false
        
        else if( token[0] === 17 && nextToken[0] === 17 ) return true
        
        else if( 
            (token[0] === 17 && nextToken[0] === 2) 
            && pseudos.includes(source.slice(nextToken[0][1], nextToken[0][2]))
        ) return token[0] === 17;
        
        else return false
    }

    const chomp = () => {

        const token = tokens[at];
        console.log(tokenTypes[token[0]], source.slice(token[1], token[2]))

        console.log(psuedo(token, at))

        currentSelector = find_next_root_selector(at)
        
        if (currentSelector) {
            parseBlock(currentSelector)
        }
        
        at++;
        if (at < tokens.length) chomp()
    }; chomp()
    

    function parseBlock(selector) {
        let i = selector.blockStartTokenIndex
        
        let endBlock
        let block: {
            selector: string;
            properties: Object[];
            children: Object[];
        } = {
            selector: selector.value,
            properties: [],
            children: [],
        } 

        while(!endBlock) {
            i++
            const token = tokens[i]
            

            // if closing curly: end of block
            if (token[0] === 25) endBlock = {
                index: i,
                token
            }

            // if left curly (means there is a nested block)
            else if (token[0] === 24) {
                // let nestedSelector = // reverse trace tokens to find start of selector
                // return the nested parsed nested block and set i to the end of the nexted block
            }

            else if (is_custom_prop(token)) {
                block.properties.push({
                    name: source.slice(token[1], token[2]),
                    value: find_custom_prop_value(i)
                })
            }
        }
        // console.log(block)
        return block
    }


    function is_custom_prop(token: Token){ 
        // console.log('is_custom_prop', )
        return token[0] === 2 && source.slice(token[1],token[2]).slice(0, 2) === '--' 
    }

    function find_custom_prop_value (fromIndex:number): undefined | string {
        let safeEnd = (fromIndex+200)
        let i = fromIndex
        
        let startIndex
        let endIndex
        
        let val

        while ( !val && i < safeEnd ) {
            const token = tokens[i]
       
            if ( token[0] === 17 ) {
                startIndex = token[2]+1
            }
            else if ( token[0] === 18 || token[0] === 25) {
                endIndex = token[1]
            }
            if ( startIndex && endIndex ) {
                val = source.slice(startIndex, endIndex)
            }
            i++
        }

        return val;
    }

    function is_amp(token: Token){ return source.slice(token[1], token[2]) === '&' }

    function is_dot(token: Token) { return source.slice(token[1], token[2]) === '.' }

    function is_star(token: Token) { return source.slice(token[1], token[2]) === '*' }

    function is_start_of_selector(type:number) { return [10, 17, 20].includes(type) }

    function is_start_of_nested_selector(type:number, index:number) {
        return type === 10 || type === 5
    }

    function find_next_root_selector(fromIndex:number) {
        // console.log('find_root from', fromIndex)
        let i = fromIndex
        let start
        let end
        let blockStartTokenIndex = 0
        let stop
        while ((!start && !end) && !stop) {
            const token = tokens[i];
            if (!token) stop = true;
            else if (is_start_of_selector(token[0])) start = token[1]
            else if (token[0] === 24) {
                end = token[1]
                blockStartTokenIndex = i
            }
            i++
        }
        return {
            value: source.slice(start, end).trimEnd(),
            blockStartTokenIndex: blockStartTokenIndex
        }
    }

    const find_next_nested_selector = (fromIndex:number) => {
        let i = fromIndex
        let openingCurly 
        while (!openingCurly) {

        }

    }

    return []
}