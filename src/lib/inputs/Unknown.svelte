<div>
    <input
        type="text" 
        bind:value={property.value} 
        style={`width: calc(${property.value.length}ch + 3px);`}
    >
</div>

<script lang="ts">

    import { type CustomProperty } from '../../types'
    
    let { property } : { property: CustomProperty } = $props();
  
    function handleChange () {
      
    }
 
</script>

<style>
    input {
        border: none;
        background: transparent;
        font-size: 10px;
        color: var( --highlight);
        font-family: monospace;
        min-width: 2ch;
        /* text-decoration: underline; */
        /* text-underline-offset: .2em; */
        /* padding-left: 2px; */
        border: 1px solid currentColor;
        padding: .25em 0.4em .2em;
        border-radius: 4px;

        &:is(:focus, :hover) {
            outline: none;
            color: var( --highlight-sec);
        }
    }
</style>