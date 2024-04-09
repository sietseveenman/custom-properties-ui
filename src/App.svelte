<script lang="ts">
  import { tick } from 'svelte';
	import ColorPicker, { ChromeVariant } from 'svelte-awesome-color-picker';
  import LengthInput from './lib/inputs/LengthInput.svelte';
  import Unknown from './lib/inputs/Unknown.svelte';
  
  import { type Props, type CustomProperty } from './types';
  
  let { customProperties, initOpen, initVisible } : Props = $props();

  let isVisible = $state(initVisible)
  let isOpen = $state(initOpen)

  let style = $derived(
  `<style type="text/css" data-ignore="ignore">
    :root { 
        ${ customProperties.map(property => {
          const value = property.linked ? `var(${property.linked})` : property.value
          return property.value ? `${ property.key }:${ value };\n\t\t` : ''
        }).join('') }
    }
  </style>`)

  let pressedKeys = <string[]>[];

  document.addEventListener('keydown', function(event) {
    if ( event.repeat ) return;
    if ( ! pressedKeys.includes(event.key) ){
      pressedKeys.push(event.key)
    }
    if (pressedKeys.includes('c') && pressedKeys.includes('u')) {
      isVisible =! isVisible
    }
  });

  document.addEventListener('keyup', function(event) {
    pressedKeys = pressedKeys.filter(key => key !== event.key)
  });

  function handleLink(event:Event, property:CustomProperty) {
    const selectedValue: string = (event.target as HTMLSelectElement).value;
    property.linked = selectedValue
  }

  let colorPickerProps: {
    property : null | CustomProperty ;
    position: {x:number, y:number};
  }= $state({
    property: null,
    position: {x:10, y:15}
  });

  let floatingPicker: HTMLElement;

  function openColorPicker(property: CustomProperty, positionElement: null | Element) {
    const positionElementRect = positionElement?.getBoundingClientRect()
    colorPickerProps.property = property
  
    if ( positionElementRect ) {
      let {x, y} = positionElementRect;
      tick().then(() => {
        let floatingWidth = floatingPicker?.getBoundingClientRect()?.width ?? 150
        if (x + floatingWidth > window.innerWidth) {
           x += window.innerWidth - (floatingWidth + x)
        }
        colorPickerProps.position = {x: x, y: y+15} 
      })
    }
  }
  
  document.body.addEventListener('click', event => {
    if( ! (event.target as HTMLElement)?.closest('.floating-picker') ) {
      colorPickerProps.property = null
    }
  }, true)

</script>

<div class={ `cp-ui ${isOpen ? 'is-open' : ''}` } style="{ isVisible ? '' : 'display: none;'}">

  <div class="top-bar">
    <button class="toggle-btn" on:click={()=>isOpen = !isOpen}>
      {#if isOpen}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minimize-2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize-2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
      {/if}
    </button>
  </div>

  {#if isOpen}
    <div class="properties">

      {#each customProperties as property }

        {#if property.initialValue !== ''}
          <div class="property">

            <div class="property__name">
              <span>{ property.key.slice(2) }</span>
              <label class="property__link">
                {#if property.linked }
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-2"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
                {:else }
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-unlink-2"><path d="M15 7h2a5 5 0 0 1 0 10h-2m-6 0H7A5 5 0 0 1 7 7h2"/></svg>
                {/if }
                <select on:change={(event)=>handleLink(event, property)}>
                  <option value=''>{ property.linked ? 'unlink' : 'unlinked'}</option>
                  {#each customProperties as otherProperty }
                    {#if property.key !== otherProperty.key && property.type === otherProperty.type }
                      <option value={otherProperty.key}>{otherProperty.key }</option>
                    {/if }
                  {/each }
                </select>
              </label>
            </div>
            
            <div class="property__value">
              {#if property.linked }
  
                <div class="linked">var({property.linked})</div>
  
              {:else if property.type === 'color' }
  
                <button class="color-picker" on:click={(e)=>openColorPicker(property, e.target)}>
                  <span class="color-picker__preview" style={`background: ${property.value}`}></span>
                  <span class="color-picker__value">{ property.value }</span>
                </button>
  
              {:else if property.type === 'length'}
    
                <LengthInput property={property}/>
        
              {:else if property.type === 'custom-property'}
                
                Custom property

              {:else if property.type === 'unknown'}
      
                <Unknown property={property} />
      
              {/if}
            </div>
          </div>

        {:else}

          <div class="property">
            <span class="name">{ property.key.slice(2) }</span>
            <small class="err">property is not defined in css</small>
          </div>

        {/if}

      {/each}

    </div>
  {/if}
</div>

<div class="floating-picker" bind:this={floatingPicker}
  style={`position: absolute; top: ${ colorPickerProps.position.y }px; left: ${ colorPickerProps.position.x }px;`}>
  {#if colorPickerProps?.property }
    <ColorPicker bind:hex={colorPickerProps.property.value}
      isDialog={false}
      --picker-height="100px"
      --picker-width="130px"
      --picker-indicator-size="12px"
      --slider-width="12px"
      --focus-color="#fbbd2e"         
    />
    {/if}
</div>

{@html style}

<style>
  .floating-picker {
    --cp-bg-color: #1e2021;
		--cp-border-color: #665c54;
		--cp-input-color: #1e2021;
		--cp-button-hover-color: #1e2021;
  }
  .floating-picker :global(input),
  .floating-picker :global(button){
    font-size: 10px;
    color: #eadbb3;
    border: 1px solid #665c54;
    padding: .2em .3em;
    margin: 0;
    height: 17px;
  }
  .floating-picker :global(.text-input){
    display: grid;
    gap: 8px;
  }

  .cp-ui {
    --font-size: 10px;
    --bg: #1e2021;
    --lines: #665c54;
    --text: #eadbb3;
    --highlight: #8dc07c;
    --highlight-sec:  #fbbd2e;

    border-bottom-right-radius: 5px;
    
    font-family: sans-serif, monospace;
    font-size: var(--font-size);
    color: var(--text);
    background-color: var(--bg,);
    padding: 4px 4px 4px 2px;
    
    &:not(.is-open) {
      width: 23px!important;
      height: 23px!important;
    }

    &.is-open {

      /* padding: 20px 0 0 0; */
      padding: 4px 0 0 0;
      resize: both;
      overflow: auto;
      min-height: 96px;
      max-height: calc(100vh - 50px);
      
      min-width: 180px;
      width: calc(220px * 3);
      max-width: calc(100vw - 15px);
    }
  }
  .top-bar {
    padding: 2px 2px 6px 4px;
    display: flex;
    justify-content: space-between;
  }

  .toggle-btn {
    transition: .12s ease-in-out;
    opacity: .6;
    appearance: none;
    background: transparent;
    border: none;
    cursor: pointer;
    width: 13px;
    
    svg {
      width: 100%;
      height: auto;
      display: block;
    }

    &:hover, 
    &:focus-visible {
      outline: none;
      opacity: 1;
      color: var(--highlight-sec)
    }
  }

  .properties {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .property {
    height: 70px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: .35em;
    padding: 11px 13px;
    border: 1px solid var(--lines);
    margin-top: -1px;
    margin-left: -1px;
    
  }
  .property__name {
    display: flex;
    gap: .6em;
    align-items: center;

    &:has(select:focus) {
      .property__link {
        color: var(--highlight-sec);
      }
    }
    svg {
      display: block;
      height: 1.3em;
      width: auto;
    }
    .property__link {
      cursor: pointer;
      position: relative;
      transform: translateY(.02em);
      &:hover {
        color: var(--highlight-sec);
      }

      select {
        opacity: 0;
        cursor: pointer;
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
      }
    }
  }
  .property__value {
  }
  .color-picker {
    display: flex;
    appearance: none;
    background-color: transparent;
    border: none;
    font-size: inherit;
    font-family: monospace;
    color: var(--highlight);
    align-items: center;
    gap: 8px;
    transform: translateX(-1px);
    cursor: pointer;
    &:is(:focus, :hover) {
      outline: none;
      .color-picker__value {
        color: var(--highlight-sec);
      }
    }
  }
  .color-picker__preview {
    width: 1.35em;
    height: 1.35em;
    border-radius: 10000px;
    border: 1px solid rgba(255,255,255,0.2);
  }
  .color-picker__value {
    letter-spacing: 0.035em;
    transform: translateY(.065em);
    text-transform: uppercase;
  }
  .linked {
    padding: .4em 0;
  }
  .err {
    opacity: .9;
    max-width: 100px;
    line-height: 1.35;
  }
 
</style>