# Book Collection App - Style Guide

## Design System Overview

This style guide recreates the clean, modern aesthetic of the "My Book Collection" interface with a
dark theme, geometric sans-serif typography, and a cohesive blue accent system.

## Typography

### Font Stack

```css
--font-primary:
  'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial,
  sans-serif;
```

### Font Weights

```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Font Sizes

```css
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
```

## Color Palette

### Primary Colors

```css
--color-primary-bg: #0f1419; /* Main background */
--color-secondary-bg: #1a1f2e; /* Secondary background */
--color-card-bg: #232937; /* Card backgrounds */
--color-accent-blue: #4285f4; /* Primary blue accent */
--color-accent-blue-hover: #3367d6; /* Blue hover state */
--color-accent-blue-light: rgba(66, 133, 244, 0.1); /* Blue with opacity */
```

### Text Colors

```css
--color-text-primary: #ffffff; /* Primary white text */
--color-text-secondary: #a8b3cf; /* Secondary gray text */
--color-text-muted: #6b7280; /* Muted gray text */
--color-text-inverse: #000000; /* Text on light backgrounds */
```

### Status & Utility Colors

```css
--color-border: rgba(255, 255, 255, 0.1); /* Subtle borders */
--color-border-hover: rgba(255, 255, 255, 0.2); /* Border hover */
--color-success: #10b981; /* Success/positive actions */
--color-warning: #f59e0b; /* Warning states */
--color-error: #ef4444; /* Error/destructive actions */
```

## Spacing Scale

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
```

## Border Radius

```css
--radius-sm: 0.375rem; /* 6px */
--radius-md: 0.5rem; /* 8px */
--radius-lg: 0.75rem; /* 12px */
--radius-xl: 1rem; /* 16px */
--radius-2xl: 1.5rem; /* 24px */
```

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

## Component Styles

### Base Styles

```css
body {
  font-family: var(--font-primary);
  background-color: var(--color-primary-bg);
  color: var(--color-text-primary);
  font-weight: var(--font-regular);
  line-height: 1.5;
}
```

### Cards

```css
.card {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: border-color 0.2s ease;
}

.card:hover {
  border-color: var(--color-border-hover);
}
```

### Buttons

```css
.btn-primary {
  background-color: var(--color-accent-blue);
  color: var(--color-text-primary);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--color-accent-blue-hover);
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}
```

### Typography Classes

```css
.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.heading-2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.heading-3 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.text-secondary {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.text-muted {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}
```

### Genre Tags

```css
.genre-tag {
  background-color: var(--color-accent-blue);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  display: inline-block;
}
```

## Implementation Instructions for Cursor

When working with Cursor, use this prompt:

**"Implement a dark-themed book collection app using these design specifications:**

1. **Typography**: Use Inter font stack with the defined font weights and sizes
2. **Color Scheme**: Dark navy background (#0f1419) with blue accents (#4285f4)
3. **Layout**: Card-based design with rounded corners and subtle borders
4. **Components**: Modern buttons, tags, and interactive elements
5. **Spacing**: Consistent 8px grid system for all spacing
6. **Hover States**: Subtle transitions and border color changes

**Apply these CSS variables throughout the app and maintain consistency with the component styles
defined above. Focus on creating a clean, modern interface that matches the reference design.**"

## CSS Variables Import

```css
:root {
  /* Typography */
  --font-primary:
    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial,
    sans-serif;
  --font-light: 300;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Font Sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  /* Colors */
  --color-primary-bg: #0f1419;
  --color-secondary-bg: #1a1f2e;
  --color-card-bg: #232937;
  --color-accent-blue: #4285f4;
  --color-accent-blue-hover: #3367d6;
  --color-text-primary: #ffffff;
  --color-text-secondary: #a8b3cf;
  --color-text-muted: #6b7280;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-hover: rgba(255, 255, 255, 0.2);

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
}
```
