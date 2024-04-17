import { type CustomProperty } from './types'

export function cpParseCSS(cssStr: string) {

    cssStr = cssStr.replace(/\/\*[\s\S]*?\*\//g, '');
    
    const tokenTypes = Object.fromEntries(
        Object.entries(types).map(([key, value]) => [value, key])
    );

    type Token = [type: typeof types[keyof typeof types], start: number, end: number]
    const tokens: Token[] = Array.from(lex(cssStr)) 


    const customProperties = {}

    let currentSelector = ''
    let currentMediaQuery = ''

    let currentProperty = ''

    /*
        TOKEN TYPES
        ________________
        IDENT       : 2
        AT_KEYWORD  : 4
        HASH        : 5
        DELIM       : 10
        WHITESPACE  : 14
        COLON       : 17
        SEMICOLON   : 18
        LEFT_CURLY  : 24
        RIGHT_CURLY : 25
    */

    let cToken = null
    
    const isCurly = (type: number): boolean => type === 24 || type === 25

    const findSelector = (fromIndex: number): null | string => {

        let reachedPrevBlock = false
        let i = fromIndex+1

        let currentIdentifier = ''
        let selector = ''
        

        while( !reachedPrevBlock && i > 0 ) {
            i--;

            const token = tokens[i];

            if (token[0] === 25) reachedPrevBlock = true // }

            if (token[0] === 2 && [10, 17].includes(tokens[i-1][0])) { // Found some sort of identifier with a . or : before it

                selector = `${cssStr.slice(token[1]-1, token[2])} ${selector}`.trimEnd()
                continue;
            }
            // if (currentIdentifier !== '' && [10, 17].includes(token[0])) {
            //     selector+=`${cssStr.slice(token[1], token[2])}${currentIdentifier} `
            //     continue;
            // }
            if (token[0] === 5) { // HASH (includes the currentIdentifier for some reason?)
                selector = `${cssStr.slice(token[1], token[2])} ${selector}`.trimEnd()
                continue;
            }
        }

        return `${selector}`
    }

    const findPropertyValue = (fromIndex:number): undefined | string => {
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
                val = cssStr.slice(startIndex, endIndex)
            }
            i++
        }

        return val;
    }


    for (let i = 0; i < tokens.length; i++) {
        
        cToken = tokens[i]
        const cType = cToken[0]

        console.log(tokenTypes[cToken[0]], cToken, cType === 2, cssStr.slice(cToken[1], cToken[2]))
        
        // if (isCurly(cType)) currentSelector = '';
        
        if ( cType === 24 ) { // LEFT_CURLY {
            const selector = findSelector(i-1)
            currentSelector = selector ?? ''
            // console.log({currentSelector});
            continue;
        }

        else if ( cType === 2 && currentSelector !== '' ) { // IDENT 

            // console.log({currentSelector});

            const property = cssStr.slice(cToken[1], cToken[2])
            
            if ( property.slice(0,2) === '--' ) {
                currentProperty = property
                let unit = {
                    selector: currentSelector,
                    value: findPropertyValue(i+1)
                }
                if (!customProperties[property]) {
                    customProperties[property] = [unit]                 
                } else {
                    customProperties[property].push(unit)
                }
            }

            continue;
        }
        
        else if ( cType === 25 ) { // RIGHT_CURLY }
            currentSelector = ''
            continue;
        } 


        // currentSelector = cssStr.slice(cToken[1], cToken[2])
        //         console.log(`%c ${currentSelector}` , 'background: #222; color: #bada55')

        // if( cType === 14 ) continue // Skip itteration if type = whitespace

        // // Check if token represents a selector
        // // Reset the current selector when entering a new or exiting a rule block
        // if (cType === 24 // LEFT_CURLY
        //     || cType === 25 // RIGHT_CURLY
        // ) {
        //     currentSelector = '';
        // }
        // else if (cType === 2 // IDENT 
        //     && tokens[i + 1] 
        //     && tokens[i + 1][0] === 24 // prev token LEFT_CURLY
        //  ) {
        //     // Store the selector when encountered right after a left curly brace
        //     currentSelector = cssStr.slice(token[1], token[2])
        //     console.log(currentSelector)
        // }
        // console.log(currentSelector)
    }

    console.log(customProperties)
    
    return [];
}






export function parseCustomPropertiesFromComputedStyles( propertyNames:string[] = []): CustomProperty[] {
    return propertyNames.reduce((acc:string[], propertyName) => {
        const cleanName = propertyName.replaceAll(/[\n\s]+/g, '');
        return cleanName === '' || acc.includes(cleanName) ? acc : [...acc, cleanName];
    }, []) // Removes empty entries and duplicates
    .map(propertyName => {
        const 
        name = propertyName.startsWith('--') ? propertyName : '--'+propertyName,
        computedValue = getComputedStyle(document.documentElement).getPropertyValue(name),
        type = getPropertyValueType(computedValue);
        
        // TODO: Check if type is a custom-property and handle that situation
        // Set linked to the name and figure out the correct type by reading the computed style of the linked variable
        
        return {
            key: name,
            initialValue: computedValue,
            value: Object.keys(cssColorsHexValue).includes(computedValue) ? cssColorsHexValue[computedValue] : computedValue,
            type: type
        }
    })
}

// Function to fetch CSS content using fetch API with async/await
export async function fetchCSS(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching CSS:', error);
        return ''; // Return empty string if error occurs
    }
}

export function parseStyleTagElements() {
    let bundledStyles = ''
    const inlineStyleTags = document.querySelectorAll('style:not([data-vite-dev-id])')
    inlineStyleTags.forEach( tag =>  {
        bundledStyles += (' ' + tag.innerText)
    })
    return parseCustomPropertiesFromCssString(bundledStyles)
}

export function parseCustomPropertiesFromCssString(string: string) : CustomProperty[] {
    
    // Remove outcommented properties
    let cssString = string.replace(/\/\*[\s\S]*?\*\//g, '');

    const rootSelectorRegex = /:root\s*{([^}]*)}/;
    const rootSelectorMatch = cssString.match(rootSelectorRegex);
    const customProperties = [];
    
    if (rootSelectorMatch) {
        const rootProperties = rootSelectorMatch[1];

        // Regular expression to match custom property declarations
        const propertyRegex = /--([\w-]+)\s*:\s*([^;]+);/g;

        let match;

        while ((match = propertyRegex.exec(cssString)) !== null) {
            const propertyName = match[1].trim();
            const propertyValue = match[2].trim();
            customProperties.push({
                key: `--${propertyName}`,
                value: propertyValue
            })
        }
    }

    return customProperties.map(property => {
        return {
            key: property.key,
            initialValue: property.value,
            value: Object.keys(cssColorsHexValue).includes(property.value) ? cssColorsHexValue[property.value] : property.value,
            type: getPropertyValueType(property.value)
        };
    });
}

export function getPropertyValueType (value: string): 'color' | 'length' | 'custom-property' | 'unknown' {
    
    const lengthRegex = /^-?\d*\.?\d+(px|em|rem|%|vh|vw|ch|vmin|vmax|svh|svw|cqw|cqh|cqi|cqb|cqmin|cqmax)?$/i; 
    const colorRegex = /^(#([0-9A-Fa-f]{3}){1,2}|rgb(a)?\((\d{1,3}%?,\s*){2,3}\d{1,3}%?\))$/; // Hexadecimal, RGB, RGBA colors
    const cssColorKeywords = Object.keys(cssColorsHexValue);
    const customPropertyRegex = /^var\(--[\w-]+\)$/i;

    if (lengthRegex.test(value)) {
        return 'length';
    } 
    if (value === 'transparent' || cssColorKeywords.includes(value) || colorRegex.test(value)) {
        return 'color';
    }
    if (customPropertyRegex.test(value)) {
        return 'custom-property';
    }

    return 'unknown';
}

type ValueWithUnit = {
    value: number;
    unit: string;
};

export function parseValueWithUnit(valueString: string): ValueWithUnit | null {
    // const match = valueString.match(/^([\d.]+)(\D+)?$/);
    const match = valueString.match(/^(-?[\d.]+)(\D+)?$/);
 
    if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2] || '';
        return { value, unit };
    }
    return null;
}

export const lengthUnits = [
    'px',
    'em',
    'rem',
    '%',
    'vh',
    'vw',
    'ch',
    'vmin',
    'vmax',
    'svh',
    'svw',
    'cqw',
    'cqh',
    'cqi',
    'cqb',
    'cqmin',
    'cqma'
];

type CssColorHexMap = {
    [colorName: string]: string;
};

export const cssColorsHexValue: CssColorHexMap = {
    aliceblue: '#F0F8FF',
    antiquewhite: '#FAEBD7',
    aqua: '#00FFFF',
    aquamarine: '#7FFFD4',
    azure: '#F0FFFF',
    beige: '#F5F5DC',
    bisque: '#FFE4C4',
    black: '#000000',
    blanchedalmond: '#FFEBCD',
    blue: '#0000FF',
    blueviolet: '#8A2BE2',
    brown: '#A52A2A',
    burlywood: '#DEB887',
    cadetblue: '#5F9EA0',
    chartreuse: '#7FFF00',
    chocolate: '#D2691E',
    coral: '#FF7F50',
    cornflowerblue: '#6495ED',
    cornsilk: '#FFF8DC',
    crimson: '#DC143C',
    cyan: '#00FFFF',
    darkblue: '#00008B',
    darkcyan: '#008B8B',
    darkgoldenrod: '#B8860B',
    darkgray: '#A9A9A9',
    darkgreen: '#006400',
    darkgrey: '#A9A9A9',
    darkkhaki: '#BDB76B',
    darkmagenta: '#8B008B',
    darkolivegreen: '#556B2F',
    darkorange: '#FF8C00',
    darkorchid: '#9932CC',
    darkred: '#8B0000',
    darksalmon: '#E9967A',
    darkseagreen: '#8FBC8F',
    darkslateblue: '#483D8B',
    darkslategray: '#2F4F4F',
    darkslategrey: '#2F4F4F',
    darkturquoise: '#00CED1',
    darkviolet: '#9400D3',
    deeppink: '#FF1493',
    deepskyblue: '#00BFFF',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1E90FF',
    firebrick: '#B22222',
    floralwhite: '#FFFAF0',
    forestgreen: '#228B22',
    fuchsia: '#FF00FF',
    gainsboro: '#DCDCDC',
    ghostwhite: '#F8F8FF',
    gold: '#FFD700',
    goldenrod: '#DAA520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#ADFF2F',
    grey: '#808080',
    honeydew: '#F0FFF0',
    hotpink: '#FF69B4',
    indianred: '#CD5C5C',
    indigo: '#4B0082',
    ivory: '#FFFFF0',
    khaki: '#F0E68C',
    lavender: '#E6E6FA',
    lavenderblush: '#FFF0F5',
    lawngreen: '#7CFC00',
    lemonchiffon: '#FFFACD',
    lightblue: '#ADD8E6',
    lightcoral: '#F08080',
    lightcyan: '#E0FFFF',
    lightgoldenrodyellow: '#FAFAD2',
    lightgray: '#D3D3D3',
    lightgreen: '#90EE90',
    lightgrey: '#D3D3D3',
    lightpink: '#FFB6C1',
    lightsalmon: '#FFA07A',
    lightseagreen: '#20B2AA',
    lightskyblue: '#87CEFA',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#B0C4DE',
    lightyellow: '#FFFFE0',
    lime: '#00FF00',
    limegreen: '#32CD32',
    linen: '#FAF0E6',
    magenta: '#FF00FF',
    maroon: '#800000',
    mediumaquamarine: '#66CDAA',
    mediumblue: '#0000CD',
    mediumorchid: '#BA55D3',
    mediumpurple: '#9370DB',
    mediumseagreen: '#3CB371',
    mediumslateblue: '#7B68EE',
    mediumspringgreen: '#00FA9A',
    mediumturquoise: '#48D1CC',
    mediumvioletred: '#C71585',
    midnightblue: '#191970',
    mintcream: '#F5FFFA',
    mistyrose: '#FFE4E1',
    moccasin: '#FFE4B5',
    navajowhite: '#FFDEAD',
    navy: '#000080',
    oldlace: '#FDF5E6',
    olive: '#808000',
    olivedrab: '#6B8E23',
    orange: '#FFA500',
    orangered: '#FF4500',
    orchid: '#DA70D6',
    palegoldenrod: '#EEE8AA',
    palegreen: '#98FB98',
    paleturquoise: '#AFEEEE',
    palevioletred: '#DB7093',
    papayawhip: '#FFEFD5',
    peachpuff: '#FFDAB9',
    peru: '#CD853F',
    pink: '#FFC0CB',
    plum: '#DDA0DD',
    powderblue: '#B0E0E6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#FF0000',
    rosybrown: '#BC8F8F',
    royalblue: '#4169E1',
    saddlebrown: '#8B4513',
    salmon: '#FA8072',
    sandybrown: '#F4A460',
    seagreen: '#2E8B57',
    seashell: '#FFF5EE',
    sienna: '#A0522D',
    silver: '#C0C0C0',
    skyblue: '#87CEEB',
    slateblue: '#6A5ACD',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#FFFAFA',
    springgreen: '#00FF7F',
    steelblue: '#4682B4',
    tan: '#D2B48C',
    teal: '#008080',
    thistle: '#D8BFD8',
    tomato: '#FF6347',
    turquoise: '#40E0D0',
    violet: '#EE82EE',
    wheat: '#F5DEB3',
    white: '#FFFFFF',
    whitesmoke: '#F5F5F5',
    yellow: '#FFFF00',
    yellowgreen: '#9ACD32'
};


export const nativeSelectors: string[] = [
    'a',
    'abbr',
    'address',
    'area',
    'article',
    'aside',
    'audio',
    'b',
    'base',
    'bdi',
    'bdo',
    'blockquote',
    'body',
    'br',
    'button',
    'canvas',
    'caption',
    'cite',
    'code',
    'col',
    'colgroup',
    'data',
    'datalist',
    'dd',
    'del',
    'details',
    'dfn',
    'dialog',
    'div',
    'dl',
    'dt',
    'em',
    'embed',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'head',
    'header',
    'hr',
    'html',
    'i',
    'iframe',
    'img',
    'input',
    'ins',
    'kbd',
    'label',
    'legend',
    'li',
    'link',
    'main',
    'map',
    'mark',
    'meta',
    'meter',
    'nav',
    'noscript',
    'object',
    'ol',
    'optgroup',
    'option',
    'output',
    'p',
    'param',
    'picture',
    'pre',
    'progress',
    'q',
    'rb',
    'rp',
    'rt',
    'rtc',
    'ruby',
    's',
    'samp',
    'script',
    'section',
    'select',
    'slot',
    'small',
    'source',
    'span',
    'strong',
    'style',
    'sub',
    'summary',
    'sup',
    'svg',
    'table',
    'tbody',
    'td',
    'template',
    'textarea',
    'tfoot',
    'th',
    'thead',
    'time',
    'title',
    'tr',
    'track',
    'u',
    'ul',
    'var',
    'video',
    'wbr'
  ];