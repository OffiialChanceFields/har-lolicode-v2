import { PrismTheme } from 'prism-react-renderer';

const redTheme: PrismTheme = {
  plain: {
    color: 'hsl(0, 60%, 90%)',
    backgroundColor: 'hsl(0, 40%, 12%)',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: 'hsl(0, 20%, 55%)',
        fontStyle: 'italic',
      },
    },
    {
      types: ['punctuation'],
      style: {
        color: 'hsl(0, 40%, 75%)',
      },
    },
    {
      types: ['namespace'],
      style: {
        opacity: 0.8,
      },
    },
    {
      types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol', 'deleted'],
      style: {
        color: '#ff8a80', // Light Red A100
      },
    },
    {
      types: ['selector', 'attr-name', 'string', 'char', 'builtin', 'inserted'],
      style: {
        color: '#ff5252', // Red A200
      },
    },
    {
      types: ['operator', 'entity', 'url'],
      style: {
        color: '#ff1744', // Red A400
      },
    },
    {
      types: ['atrule', 'attr-value', 'keyword'],
      style: {
        color: '#d50000', // Red A700
      },
    },
    {
      types: ['function', 'class-name'],
      style: {
        color: '#ff8a80', // Light Red A100
      },
    },
    {
      types: ['regex', 'important', 'variable'],
      style: {
        color: '#ff5252', // Red A200
      },
    },
  ],
};

export default redTheme;
