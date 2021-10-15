export class ValueFormatted{ 

private trueValue: number;
private displayedValue: string;

    constructor(value: number) {
        this.trueValue = value;
        this.displayedValue = formatNumberToString(this.trueValue);
    }

    getAsNumber() {return this.trueValue}
    getAsString() {return this.displayedValue}
}


export function formatStringToNumber(s: string): number {
    return +(s.replace(/\s/g, "").replace(/,/g, '.')); //deletes spaces and replaces , by .
}

export function formatNumberToString(n: number) {
if(n===0) return ''
return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}






