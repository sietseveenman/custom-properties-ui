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
            step=".1" 
            on:input={handleChange}
        />
        <select bind:value={parsedProperty.unit} on:change={handleChange}>
            {#each lengthUnits as unit }
                <option value={unit} selected={unit === parsedProperty.unit}>{ unit }</option>
            {/each}
        </select>
    </div>
{:else}
    <input bind:value={property.value} />
{/if}

<style scoped>
    .parsed {
        display: flex;
        gap: 4px;

        input {
            margin: 0;
            height: 20px;
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 4px;
            font-size: 11px;
            padding-inline: .5em;
            width: 7ch;
            &::-webkit-outer-spin-button,
            &::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
        }

        select {
            height: 20px;
            cursor: pointer;
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 4px;
            font-size: 11px;
            padding-inline: .5em;
            appearance: none;
            width: auto;
            text-align: center;
        }
    }
</style>