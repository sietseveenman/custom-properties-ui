<script lang="ts">
    import { parseValueWithUnit, lengthUnits } from '../../utils'
    import { type CustomProperty } from '../../types'
    
    let { property } : { property: CustomProperty } = $props();

    let parsedProperty = $derived( parseValueWithUnit(property.value) );
  
    function handleChange () {
        if ( ! parsedProperty ) return;
        if ( ! parsedProperty.value ) parsedProperty.value = 0 // Make sure input can not be null
        property.value = `${parsedProperty.value}${parsedProperty.unit}`
    }
    
    let stepSize: string | number = $state('any')

    document.addEventListener('keydown',(e) => {
        if (e.altKey || e.metaKey) stepSize = .1;
        else if (e.shiftKey) stepSize = 10;
    })

    document.addEventListener('keyup',(e) => {
        stepSize = 'any'
    })
</script>
{#if parsedProperty }
    <div class="parsed">
        <input bind:value={parsedProperty.value} 
            type="number" 
            step={stepSize}
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
        --color: var(--highlight);
        display: flex;
        gap: 4px;
        color: var(--color);
        width: fit-content;
        border-bottom: 1px solid currentColor;
        
        &:has(:is(input, select):is(:hover, :focus) ){
            --color: var(--highlight-sec);
        }

        input {
            background-color: transparent;
            color: inherit;
            margin: 0;
            max-width: 16ch;
            border: none;
            line-height: .5;
            font-family: monospace;
            font-size: var(--font-size);
            

            &::-webkit-outer-spin-button,
            &::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            &:focus, 
            &:hover {
                outline: none;
                background: transparent;
                color: var(--color);
            }
            &:hover {
                font-weight: 500;
            }

        }
        .length-unit {
            position: relative;
            line-height: 1;
            
            span{
                font-family: monospace;
                color: var(--hover);
                &::after {
                    content: '⌄';
                    display: inline-block;
                    padding-left: 0.1em;
                    padding-right: 3px;
                    transform: translateY(-.2em);
                }
            }
            &:has(select:hover, select:focus) {
                span {
                    font-weight: 500;
                    color: var(--color);
                }
            }
            select {
                opacity: 0;
                position: absolute;
                left: 0;
                right: 0;
                width: 100%;
                height: 100%;
                bottom: 0;
                top: 0;
                cursor: pointer;
                border: none;
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