export const timeFormat = (minutes) => {
const hours  = Math.floor(minutes / 60);
const min = minutes % 60;
return `${hours}h ${min}m`
};