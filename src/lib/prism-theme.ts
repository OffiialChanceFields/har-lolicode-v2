import { PrismTheme } from 'prism-react-renderer';

const loliScriptV2Theme: PrismTheme = {
  plain: {
    color: 'hsl(220, 9%, 95%)',
    backgroundColor: 'hsl(220, 13%, 8%)',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: 'hsl(220, 9%, 55%)',
        fontStyle: 'italic',
      },
    },
    {
      types: ['punctuation'],
      style: {
        color: 'hsl(220, 9%, 75%)',
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
        color: '#a3e635', // Lime 400
      },
    },
    {
      types: ['selector', 'attr-name', 'string', 'char', 'builtin', 'inserted'],
      style: {
        color: '#fde047', // Yellow 300
      },
    },
    {
      types: ['operator', 'entity', 'url'],
      style: {
        color: '#67e8f9', // Cyan 300
      },
    },
    {
      types: ['atrule', 'attr-value', 'keyword'],
      style: {
        color: '#fda4af', // Rose 300
      },
    },
    {
      types: ['function', 'class-name'],
      style: {
        color: '#d8b4fe', // Purple 300
      },
    },
    {
      types: ['regex', 'important', 'variable'],
      style: {
        color: '#fbbf24', // Amber 400
      },
    },
  ],
};

export default loliScriptV2Theme;
