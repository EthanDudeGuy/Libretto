# Libretto Project Rules & Guidelines

This document outlines the coding standards, best practices, and rules for Libretto - a
sophisticated literary companion that understands exactly where you are in any book and can discuss
it without spoiling future events.

## 🌟 Project Vision

Libretto is designed to feel like having a sophisticated literary companion that understands exactly
where you are in any book and can discuss it without spoiling future events. It's like chatting with
an enthusiastic book club member who has perfect spoiler discipline.

### Core Experience

- **Premium Reading Companion**: Elegant, functional, and deeply respectful of the reading
  experience
- **Spoiler-Free AI Discussions**: Powered by Claude API with perfect spoiler discipline
- **Glassmorphism Interface**: Visually stunning with rich purple gradient backgrounds
- **Smart Bookmark System**: Intelligent page/chapter parsing and progress tracking
- **Responsive Design**: Perfect experience across mobile, tablet, and desktop

### Key Features

- **Book Library Management**: Beautiful cards showing reading progress
- **Smart Bookmark Controls**: Left/right arrow controls that intelligently increment page/chapter
  numbers
- **AI Literary Analysis**: Contextual discussions about characters, themes, plot points, and
  literary devices
- **Progress Visualization**: Dynamic progress bars that update in real-time
- **Smooth Animations**: Micro-interactions throughout the interface

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development Scripts

```bash
npm start          # Start Expo development server
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues automatically
npm run format     # Format code with Prettier
npm run test       # Run tests
npm run clean      # Clean and reinstall dependencies
```

## 📋 Code Quality Rules

### ESLint Configuration

- **File**: `.eslintrc.js`
- **Purpose**: Enforces code quality and consistency
- **Key Rules**:
  - React Native specific linting
  - TypeScript support
  - React Hooks rules
  - Accessibility checks
  - Performance optimizations

### Prettier Configuration

- **File**: `.prettierrc.js`
- **Purpose**: Automatic code formatting
- **Settings**:
  - Single quotes
  - Semicolons
  - 2-space indentation
  - 80 character line width

### TypeScript

- **File**: `tsconfig.json`
- **Purpose**: Type safety and better IDE support
- **Features**:
  - Strict mode enabled
  - Path mapping for imports
  - React Native JSX support

## 🎨 Design System Rules

### Glassmorphism Design Philosophy

Libretto uses a sophisticated glassmorphism design system that creates depth, elegance, and a
premium reading experience. The interface should feel like frosted glass floating over rich purple
gradients.

### Core Design Principles

- **Frosted Glass Effects**: Semi-transparent elements with blur backgrounds
- **Rich Purple Gradients**: Premium purple color schemes throughout
- **Depth and Layering**: Multiple visual levels with proper shadows and elevation
- **Smooth Animations**: Every interaction should feel fluid and purposeful
- **Responsive Beauty**: Adapts beautifully across all screen sizes

### Theme Usage

- **Always use** the centralized theme from `src/constants/theme.js`
- **Colors**: Use semantic color names (e.g., `colors.textPrimary`, `colors.background`)
- **Spacing**: Follow the 8px grid system (`spacing.x1`, `spacing.x2`, etc.)
- **Typography**: Use the defined font families and sizes
- **Border Radius**: Use consistent radius values (`radii.sm`, `radii.md`, etc.)
- **Glassmorphism**: Implement frosted glass effects with blur and transparency

### Component Guidelines

```javascript
// ✅ Good: Using theme system
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.x2,
    borderRadius: radii.lg,
  },
});

// ❌ Bad: Hardcoded values
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f1419',
    padding: 16,
    borderRadius: 12,
  },
});
```

## 📁 File Organization Rules

### Directory Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # API and external services
├── utils/          # Utility functions
├── constants/      # Theme, styles, and constants
└── context/        # React Context providers
```

### Naming Conventions

- **Components**: PascalCase (`BookCard.js`, `AddBookModal.js`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase (`userName`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Functions**: camelCase (`fetchBooks`, `validateInput`)

## 🔧 Development Rules

### Component Development

1. **Use functional components** with hooks
2. **Implement proper prop validation**
3. **Use StyleSheet.create()** for performance
4. **Follow single responsibility principle**
5. **Use React.memo()** when appropriate

### State Management

1. **Local state** for component-specific data
2. **Context** for global state (AuthContext pattern)
3. **AsyncStorage** for persistence
4. **Proper error handling** for all state operations

### API Integration

1. **Use service layer** pattern (`src/services/`)
2. **Implement proper error handling**
3. **Use loading states** appropriately
4. **Follow existing API patterns**

## 🤖 AI Literary Discussion Rules

### Spoiler-Free AI Implementation

The core feature of Libretto is its ability to provide spoiler-free literary discussions. This
requires careful implementation and strict adherence to spoiler discipline.

### Key Requirements

- **Perfect Spoiler Discipline**: AI must never reveal future plot points
- **Contextual Awareness**: AI knows exactly where the user is in the book
- **Literary Analysis**: Discuss characters, themes, plot points, and literary devices
- **Enthusiastic Tone**: Feel like chatting with a knowledgeable book club member
- **Progress Integration**: Use current reading position to limit discussion scope

### Implementation Guidelines

```javascript
// ✅ Good: Spoiler-aware AI interaction
const getSpoilerFreeResponse = async (question, book, currentPosition) => {
  const context = {
    bookTitle: book.title,
    currentPage: currentPosition.page,
    currentChapter: currentPosition.chapter,
    spoilerBoundary: currentPosition,
  };

  return await claudeAPI.analyzeLiteraryElement(question, context);
};

// ❌ Bad: No spoiler protection
const getResponse = async question => {
  return await claudeAPI.analyze(question); // No context about user's position
};
```

### Claude API Integration

- **Use ClaudeAPI service** for all AI interactions
- **Implement spoiler boundaries** in API requests
- **Handle rate limits** gracefully
- **Provide fallback responses** for API failures
- **Cache responses** when appropriate to reduce API calls

## 📖 Smart Bookmark System Rules

### Intelligent Page/Chapter Parsing

The bookmark system must intelligently understand and increment page/chapter numbers in various
formats.

### Supported Formats

- **Page Numbers**: "Page 150", "p. 150", "150"
- **Chapter Numbers**: "Chapter 5", "Ch. 5", "Chapter Five"
- **Combined**: "Chapter 5, Page 150", "Ch. 5, p. 150"
- **Custom Formats**: Handle various book-specific formats

### Implementation Guidelines

```javascript
// ✅ Good: Smart bookmark parsing
const parseBookmark = bookmarkString => {
  const patterns = {
    page: /(?:page|p\.?)\s*(\d+)/i,
    chapter: /(?:chapter|ch\.?)\s*(\d+|[ivxlcdm]+)/i,
  };

  return {
    page: extractNumber(bookmarkString, patterns.page),
    chapter: extractNumber(bookmarkString, patterns.chapter),
  };
};

// ✅ Good: Intelligent increment
const incrementBookmark = (currentBookmark, direction) => {
  const { page, chapter } = parseBookmark(currentBookmark);

  if (page) {
    return direction === 'next' ? `Page ${page + 1}` : `Page ${Math.max(1, page - 1)}`;
  }

  if (chapter) {
    return direction === 'next' ? `Chapter ${chapter + 1}` : `Chapter ${Math.max(1, chapter - 1)}`;
  }

  return currentBookmark;
};
```

### User Experience

- **Arrow Controls**: Left/right arrows for intuitive navigation
- **Real-time Updates**: Progress bars update immediately
- **Visual Feedback**: Smooth animations for bookmark changes
- **Error Handling**: Graceful handling of invalid bookmark formats

## 🧪 Testing Rules

### Test Structure

- **Unit tests** for utility functions
- **Component tests** for UI components
- **Integration tests** for API services
- **Test files** should be co-located with source files

### Test Naming

```javascript
// ✅ Good
describe('BookStorage', () => {
  it('should save book data correctly', () => {
    // test implementation
  });
});

// ❌ Bad
describe('test', () => {
  it('works', () => {
    // test implementation
  });
});
```

## 🔒 Security Rules

### Data Protection

- **Never commit** API keys or sensitive data
- **Use environment variables** for configuration
- **Validate all user inputs**
- **Implement proper authentication checks**

### Code Security

- **Sanitize inputs** before processing
- **Use HTTPS** for all API calls
- **Implement proper error handling** without exposing internals

## 🚀 Performance Rules

### React Native Optimization

- **Use FlatList** for large lists
- **Implement proper image optimization**
- **Avoid inline functions** in render methods
- **Use useCallback and useMemo** when appropriate
- **Minimize re-renders**

### Bundle Optimization

- **Use dynamic imports** for large components
- **Optimize images** and assets
- **Remove unused dependencies**
- **Use proper tree shaking**

## 📱 Platform Rules

### iOS Guidelines

- **Follow Apple Human Interface Guidelines**
- **Test on physical devices**
- **Handle safe areas properly**
- **Use proper navigation patterns**

### Android Guidelines

- **Follow Material Design principles**
- **Handle different screen sizes**
- **Test on various Android versions**
- **Use proper back button handling**

## 🔄 Git Workflow Rules

### Commit Messages

```
type(scope): description

Examples:
feat(auth): add login functionality
fix(ui): resolve button alignment issue
docs(readme): update installation instructions
```

### Branch Naming

- **Feature branches**: `feature/description`
- **Bug fixes**: `bugfix/description`
- **Hotfixes**: `hotfix/description`
- **Release**: `release/version`

## 🛠️ Tool Configuration

### Pre-commit Hooks

- **ESLint** runs automatically on staged files
- **Prettier** formats code automatically
- **Tests** run for modified files
- **Type checking** validates TypeScript

### IDE Setup

- **VS Code** recommended with React Native extensions
- **ESLint** and **Prettier** extensions required
- **TypeScript** support enabled
- **Auto-format on save** recommended

## 📚 Documentation Rules

### Code Documentation

- **Comment complex logic**
- **Use JSDoc** for function documentation
- **Keep README files updated**
- **Document API changes**

### Component Documentation

```javascript
/**
 * BookCard component displays book information in a card format
 * @param {Object} book - Book object with title, author, cover, etc.
 * @param {Function} onPress - Callback function when card is pressed
 * @param {boolean} isLoading - Whether the card is in loading state
 */
const BookCard = ({ book, onPress, isLoading }) => {
  // component implementation
};
```

## 🚨 Error Handling Rules

### Consistent Error Handling

- **Use ErrorHandler utility** for all errors
- **Provide meaningful error messages** to users
- **Log errors** for debugging purposes
- **Implement fallback UI** for error states

### API Error Handling

```javascript
try {
  const response = await api.getBooks();
  return response.data;
} catch (error) {
  ErrorHandler.handle(error, 'Failed to fetch books');
  throw error;
}
```

## 🎯 Accessibility Rules

### Accessibility Guidelines

- **Use proper accessibility labels**
- **Ensure sufficient color contrast**
- **Implement keyboard navigation**
- **Test with screen readers**
- **Provide alternative text** for images

## 📊 Monitoring & Analytics

### Error Tracking

- **Implement error boundaries**
- **Use proper logging**
- **Monitor performance metrics**
- **Track user interactions**

---

## 📞 Support

For questions about these rules or the project:

1. Check existing documentation
2. Review similar implementations in the codebase
3. Ask team members for clarification
4. Update this document if rules change

Remember: **Consistency is key**. Follow these rules to maintain code quality and team productivity.
