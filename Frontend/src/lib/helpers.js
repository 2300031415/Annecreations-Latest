export const getTitleCase = (camelCaseString) => camelCaseString
  .replace(/([A-Z])/g, ' $1')
  .replace(/^./, (str) => { return str.toUpperCase(); });