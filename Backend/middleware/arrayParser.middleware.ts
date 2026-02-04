import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to parse array notation form data
 * Converts options[0].field, options[1].field to options: [{field: value}, {field: value}]
 */
export const parseArrayFormData = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  // Parse array notation in form data
  const parseArrayFields = (body: any): any => {
    const result: any = {};
    const arrayFields: { [key: string]: any[] } = {};

    for (const [key, value] of Object.entries(body)) {
      // Trim the key to remove any trailing/leading spaces
      const trimmedKey = key.trim();

      // Check if key matches array notation pattern like "options[0].field"
      const arrayMatch = trimmedKey.match(/^(\w+)\[(\d+)\]\.(.+)$/);

      if (arrayMatch) {
        const [, arrayName, index, fieldName] = arrayMatch;
        const arrayIndex = parseInt(index, 10);

        if (!arrayFields[arrayName]) {
          arrayFields[arrayName] = [];
        }

        // Ensure the array has enough elements
        while (arrayFields[arrayName].length <= arrayIndex) {
          arrayFields[arrayName].push({});
        }

        // Trim the value if it's a string
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        arrayFields[arrayName][arrayIndex][fieldName] = trimmedValue;
      } else {
        // Trim the value if it's a string
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        result[trimmedKey] = trimmedValue;
      }
    }

    // Add parsed arrays to result
    for (const [arrayName, arrayData] of Object.entries(arrayFields)) {
      result[arrayName] = arrayData;
    }

    return result;
  };

  // Parse the body if it exists
  if (req.body && typeof req.body === 'object') {
    // First, clean up any trailing spaces in field names and values
    const cleanedBody: any = {};
    for (const [key, value] of Object.entries(req.body)) {
      const trimmedKey = key.trim();
      const trimmedValue = typeof value === 'string' ? value.trim() : value;
      cleanedBody[trimmedKey] = trimmedValue;
    }

    // Then parse array fields
    req.body = parseArrayFields(cleanedBody);
  }

  next();
};
