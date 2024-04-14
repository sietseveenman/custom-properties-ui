import App from './App.svelte'
import { mount } from 'svelte'
import { type Props, type CustomProperty } from './types'
import { parseCustomPropertiesFromComputedStyles, parseStyleTagElements, parseCustomPropertiesFromCssString, fetchCSS } from './utils'
import { parseCSS } from './parser'
// import { colord } from "colord";
// import { getFormat } from "colord";

//@ts-expect-error
window.initCpUi = (opts = {}) => {

    if (typeof opts !== 'object') {
        console.warn('Expected an object with options, Example: ', {
            properties: 'Optional | String with comma separated property names',
            initOpen: false,
            initVisible: true,
        })
        return
    }

    const options = {
        properties: '',
        initOpen: false,
        initVisible: true,
        initPosition: 'top-left',
        ...opts,
    }    

    const uiContainer = document.createElement('DIV')
    uiContainer.style.position = 'fixed'
    uiContainer.style.zIndex = '99999'
    uiContainer.style.top = '0'
    uiContainer.style.left = '0'
    
    document.body.append(uiContainer)
    
    const props : Props = $state({
        customProperties: [],
        initOpen: options.initOpen,
        initVisible: options.initVisible,
    })

    if ( options.properties && typeof options.properties === 'string' ) {
        props.customProperties = parseCustomPropertiesFromComputedStyles(options.properties.split(','))
    } 
    else {
        props.customProperties = parseStyleTagElements()
        const linkTags = document.querySelectorAll('link[rel="stylesheet"]')
        linkTags.forEach(link => {
            fetchCSS(link.href).then(text => props.customProperties = [
                ...props.customProperties,
                ...parseCSS(text)
            ])
        })
    }
    
    mount(App, {
        target: uiContainer,
        props: props, 
    })
}

//@ts-ignore
window.initCpUi({
    initOpen: true
})