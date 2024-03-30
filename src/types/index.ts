export type CustomProperty = { 
    key: string;
    initialValue: string;
    value: string;
    type: 'color' | 'length' | 'custom-property' | 'unknown';
    linked?: string;
    // unit?: undefined | string;
}

export type Props = { 
    customProperties: CustomProperty[];
    initOpen: boolean;
    initVisible: boolean; 
};