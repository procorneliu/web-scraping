import { type ProductField } from './jobService';
import { Parser } from '@json2csv/plainjs';

// Convert JSON data into CSV format
const convertToCSV = (data: ProductField[], fields: string[]): string => {
  // Options for CSV formatting
  const parserOptions = {
    fields,
    quote: '"',
    escapedQuote: '""',
    delimiter: ';',
    eol: '\n',
    header: true,
  };

  const parser = new Parser(parserOptions);

  return parser.parse(data);
};

export default convertToCSV;
