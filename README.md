# Custom property UI

A UI tool that lists and enables live updates of all custom properties set on the :root selector. You can provide handpicked properties to show in the UI. If you don't provide any properties, all properties found inside inline style tags and link tags will be parsed and used automaticaly.

## Roadmap

-   Scrollbar styling to fit the dark theme.
-   Draggable ui window.
-   Settings / info button to open a modal.
-   Link properties by dragging.
-   Change number input values by scrolling and or dragging.
-   UI to to vissualy outline elements on the page that use a specific property.
-   UI to show if the property is used on the current page.
-   UI for property overwrites in nested selectors. Option to change value per selector level. 
-   Options to save to local storage.
-   History in top bar 'undo' and 'redo'.
-   Exclude commented css lines

-   Handle Nummeric values (sets) without unit, example: '255, 255, 255' or '1.05'.
-   Handle Angle values: deg and turn.
-   Handle values that use the calc() function.
-   Handle values that use min(), max() and or clamp() functions.
-   Handle values that use trig functions, sin() and cos().
-   Handle situation where a custom property is used inside a function,
    example: rgb(var(--some-rgb))
-   Color length toggling (hex, rgb, etc).
-   If value is a custom property, find the related property and 
    set linked and type props accordingly. 
-   Basic text input for properties of type 'unknown'. Maybe even 
    add UI to toggle any property its input to a basic text input?
-   Option to group properties when defining them trough the options
    example: '[group:Colors]primary, secondary, tertiary[/group]'.

-   Cleanup codebase, split into components.
