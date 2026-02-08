# UI Conventions & Design System

## Core Design Principles
 - **Light/Dark Mode Support**: All UI elements support both modes using Tailwind's `dark:` modifier.
 - **Semantic Coloring**: Colors are used strictly to convey the nature of financial data (positive, negative, neutral, or status-based).
 - **Visual Hierarchy**: 
   - **Primary Text**: `slate-800` (Light) / `slate-100` (Dark)
   - **Secondary Text**: `slate-500` (Light) / `slate-400` (Dark)
   - **Borders/Dividers**: `slate-200`/`slate-300` (Light) / `slate-600`/`slate-700` (Dark)

## Color System (Semantic)

### Financial Flows
| Concept | Color Family | Example Classes (Light / Dark) | Usage |
| :--- | :--- | :--- | :--- |
| **Income / Gain** | **Green** | `text-green-600` / `text-green-400`<br>`bg-green-100` / `bg-green-500/20` | Income transactions, profitable investments, settled debts (positive state). |
| **Expense / Loss** | **Red** | `text-red-600` / `text-red-400`<br>`bg-red-100` / `bg-red-500/20` | Expense transactions, investment losses, deletion actions. |
| **Transfer** | **Blue** | `text-blue-500` / `text-blue-400`<br>`bg-blue-100` / `bg-blue-500/20` | Wallet-to-wallet transfers. |
| **Adjustment** | **Indigo** | `text-indigo-500` / `text-indigo-400`<br>`bg-indigo-100` / `bg-indigo-500/20` | Balance reconciliation adjustments. |
| **Future / Planned**| **Cyan** | `text-cyan-800` / `text-cyan-300`<br>`bg-cyan-100` / `bg-cyan-900/50` | Transactions scheduled for a future date. |

### Debt Management
| Concept | Color Family | Usage |
| :--- | :--- | :--- |
| **Lent (Money Out)**| **Blue** | Money you lent to others (Asset). `border-blue-400`. |
| **Borrowed (Money In)**| **Orange** | Money you owe to others (Liability). `border-orange-400`, `text-orange-500`. |
| **Settled / Closed**| **Slate** | Debts that are fully paid or forgiven using `slate-500` (dimmed/neutral). |
| **Outstanding** | **Yellow** | Badge background `bg-yellow-100` / `text-yellow-800`. |

### Investments
| Concept | Color Family | Usage |
| :--- | :--- | :--- |
| **Active** | **Purple** | Active investments use `border-purple-300`. |
| **Contribution** | **Blue** | Adding money to an investment (`text-blue-600`). |
| **Withdrawal** | **Orange** | Taking money out (`text-orange-600`). distinct from pure "Expense". |

## Component Patterns

### Lists & Items
- **Cards**: Items (Transactions, Debts) are displayed as cards with a colored left-border (`border-l-4`) indicating their type.
- **Icons**: Rounded icon containers (`rounded-full`) with semi-transparent backgrounds matching the item's color theme.
- **Animations**: 
  - Entry: `animate-fadeInUp`
  - Exit: `animate-fadeOutDown`

### Interactive Elements
- **Buttons**:
  - Primary Action: `bg-indigo-600` text white.
  - Danger Action: `text-red-600` or `bg-red-600`.
  - Secondary/Neutral: `text-slate-500` hover `bg-slate-100`.
- **Modals**:
  - Backdrop: `bg-slate-900/80 backdrop-blur-sm`.
  - Container: `bg-white dark:bg-slate-800 rounded-2xl`.

## Typography
- **Numbers**: Generally formatted with `Intl.NumberFormat` for currency ('en-IN').
- **Dates**: `en-GB` format (DD MMM YYYY).
