# Tab Man - Collaborative Expense Tracking

A modern, mobile-first collaborative expense tracking application built with SvelteKit and Supabase. Split bills, track shared expenses, and manage group tabs with real-time collaboration.

## ✨ Features

### ✅ Implemented

- **🔐 Authentication**: Complete Supabase authentication with email/password
- **👤 User Profiles**: Automatic profile creation with display names and avatars
- **📱 Mobile-First Design**: Responsive UI optimized for mobile devices
- **📊 Tab Management**: Create and manage shared expense tabs
- **👥 Membership System**: Role-based access (owner/member) with secure permissions
- **🛡️ Security**: Row Level Security (RLS) policies for data protection
- **🎨 Modern UI**: Clean, intuitive interface with Lucide icons

### 🚧 Coming Soon

- Add expenses/items to tabs
- Real-time collaboration
- Invite system via email/links
- Expense splitting calculations
- Member management
- Offline support

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 2.0, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Custom CSS with CSS variables
- **Icons**: Lucide Svelte
- **Testing**: Vitest, Testing Library

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm/pnpm/yarn
- Supabase account

### Installation

1. **Clone and install dependencies**

```bash
git clone <repo-url>
cd svelte-dash
npm install
```

2. **Set up Supabase**
   - Create a new Supabase project
   - Run the database schema from `supabase-schema.sql`
   - Get your project URL and anon key

3. **Configure environment**

```bash
cp .env.example .env.local
# Add your Supabase credentials
```

4. **Start development server**

```bash
npm run dev
```

## 📂 Project Structure

```
src/
├── lib/
│   ├── supabase.ts          # Supabase client and types
│   └── components/          # Reusable UI components
│       ├── Sidebar.svelte
│       └── TabCard.svelte
├── routes/
│   ├── +layout.svelte       # Main app layout
│   ├── +layout.server.ts    # Session management
│   ├── +page.svelte         # Dashboard/home page
│   ├── new-tab/             # Tab creation flow
│   │   ├── +page.svelte
│   │   └── +page.server.ts
│   └── tab/[id]/            # Individual tab pages
│       ├── +page.svelte
│       └── +page.server.ts
└── app.html                 # HTML template
```

## 🗄️ Database Schema

The app uses a robust PostgreSQL schema with the following key tables:

- **`profiles`**: User profile information
- **`tabs`**: Shared expense tabs
- **`tab_members`**: Tab membership with roles
- **`tab_invitations`**: Pending invitations
- **`places`**: Tab items/expenses (planned)

All tables include Row Level Security (RLS) policies for secure multi-tenant access.

## 🔑 Authentication Flow

1. Users sign up/login via Supabase Auth
2. Profile automatically created via database trigger
3. Session managed server-side with secure cookies
4. RLS policies enforce data access permissions

## 🛡️ Security Features

- **Row Level Security**: Database-level access control
- **Server-side Session Management**: Secure session handling
- **Type Safety**: Full TypeScript coverage
- **Input Validation**: Server-side form validation
- **CSRF Protection**: Built-in SvelteKit CSRF protection

## 📱 Mobile-First Design

The UI is designed mobile-first with:

- Touch-friendly interface
- Responsive layouts
- Optimized for small screens
- Progressive enhancement for desktop

## 🧪 Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Testing

```bash
npm run test         # Unit tests with Vitest
npm run test:ui      # Interactive test UI
```

## 🚀 Deployment

### Building

```bash
npm run build
```

### Environment Variables

Required for production:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Deployment Options

- **Vercel**: Zero-config deployment
- **Netlify**: Static site generation
- **Node.js**: Full-stack deployment
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Lucide Icons](https://lucide.dev/)

---

Built with ❤️ using SvelteKit and Supabase
