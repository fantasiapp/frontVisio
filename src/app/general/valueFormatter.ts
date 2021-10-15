export function formatStringToNumber(s: string): number {
        return +(s.replace(/\s/g, "").replace(/,/g, '.')); //deletes spaces and replaces , by .
      }
    
export function formatNumberToString(n: number) {
    if(n===0) return ''
    return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }







