import { type ProductField } from './jobService';
import { Parser } from '@json2csv/plainjs';

const convertToCSV = (data: ProductField[]): string => {
  const parserOptions = {
    fields: ['url', 'title', 'description', 'image'],
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
