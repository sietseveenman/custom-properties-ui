<script lang="ts">
    import { parseValueWithUnit, lengthUnits } from '../utils'
    import { type CustomProperty } from '../types'
    
    let { property } : { property: CustomProperty } = $props();

    let parsedProperty = $derived( parseValueWithUnit(property.value) );
  
    function handleChange () {
        if ( ! parsedProperty ) return;
        if ( ! parsedProperty.value ) parsedProperty.value = 0 // Make sure input can not be null
        console.log()
        property.value = `${parsedProperty.value}${parsedProperty.unit}`
    }

</script>
{#if parsedProperty }
    <div class="parsed">
        <input bind:value={parsedProperty.value} 
            type="number" 
            step={1}
            on:input={handleChange}
            style={`width: ${String(parsedProperty.value).length}ch`}
        />
        <span class="length-unit">
            <span class="">{ parsedProperty.unit }</span>
            <select bind:value={parsedProperty.unit} on:change={handleChange}>
                {#each lengthUnits as unit }
                    <option value={unit} selected={unit === parsedProperty.unit}>{ unit }</option>
                {/each}
            </select>
        </span>
    </div>
{:else}
    <input bind:value={property.value} />
{/if}

<style scoped>
    .parsed {
        display: flex;
        /* align-items: center; */
        gap: 4px;

        input {
            background-color: transparent;
            color: inherit;
            margin: 0;
            font-size: 11px;
            max-width: 4ch;
            border: none;
            line-height: .5;
            &::-webkit-outer-spin-button,
            &::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            &:focus, 
            &:hover {
                cursor: pointer;
                outline: none;
                text-decoration: underline;
            }
            &:hover {
                font-weight: 500;
                color: blue;
            }

        }
        .length-unit {
            position: relative;
            font-size: 11px;
            span{
                font-family: sans-serif;
           
                &::after {
                    opacity: 0;
                    content: '⌄';
                    display: inline-block;
                    padding-left: 0.2em;
                    transform: translateY(-.2em);
                }
            }
            &:has(select:hover, select:focus) {
                span {
                    font-weight: 500;
                    color: blue;
                    text-decoration: underline;
                    &:after {
                        opacity: 1;
                    }
                }
            }
            select {
                opacity: 0;
                height: 1em;
                position: absolute;
                left: 0;
                right: 0;
                width: 100%;
                height: 100%;
                bottom: 0;
                top: 0;
                cursor: pointer;
                border: none;
                font-size: 11px;
                appearance: none;
                width: auto;
                text-align: left;
    
                &:focus, 
                &:hover {
                    outline: none;
                }
            }
        }
    }
</style>