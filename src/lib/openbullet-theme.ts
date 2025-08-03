import { PrismTheme } from 'prism-react-renderer';

const openBulletTheme: PrismTheme = {
  plain: {
    color: 'hsl(210, 20%, 95%)',
    backgroundColor: 'hsl(220, 13%, 18%)',
  },
  styles: [
    {
      // Comments
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: 'hsl(220, 10%, 45%)',
        fontStyle: 'italic',
      },
    },
    {
      // Keywords like BLOCK, IF, JUMP
      types: ['keyword', 'tag', 'atrule'],
      style: {
        color: 'hsl(200, 80%, 65%)', // A distinct blue
      },
    },
    {
      // Strings like "hello"
      types: ['string', 'char', 'inserted'],
      style: {
        color: 'hsl(100, 50%, 60%)', // A greenish color
      },
    },
    {
      // Variables like @myVar or data.RESPONSECODE
      types: ['variable', 'attr-name', 'constant'],
      style: {
        color: 'hsl(35, 95%, 65%)', // An amber/orange color
      },
    },
    {
      // Functions and class names
      types: ['function', 'class-name'],
      style: {
        color: 'hsl(45, 90%, 65%)', // A gold color
      },
    },
    {
      // Punctuation and Operators
      types: ['punctuation', 'operator'],
      style: {
        color: 'hsl(210, 20%, 80%)',
      },
    },
    {
      // Numbers, booleans
      types: ['boolean', 'number', 'symbol'],
      style: {
        color: 'hsl(300, 70%, 70%)', // A purplish color
      },
    },
    {
      types: ['namespace'],
      style: {
        opacity: 0.7,
      },
    },
    {
      // Important/Regex
      types: ['regex', 'important'],
      style: {
        color: '#fde047', // Yellow 300
      },
    },
  ],
};

export default openBulletTheme;
