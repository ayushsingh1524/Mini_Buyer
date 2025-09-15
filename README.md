
# Buyer Lead Intake App

A comprehensive Next.js application for managing buyer leads with validation, search, filtering, and CSV import/export functionality.

## Features

- **Lead Management**: Create, view, edit, and delete buyer leads
- **Advanced Search & Filtering**: Search by name, phone, email with URL-synced filters
- **CSV Import/Export**: Bulk import with validation and error reporting, export filtered data
- **Real-time Validation**: Client and server-side validation using Zod
- **Authentication**: Simple demo authentication system
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form
- **Testing**: Jest

## Data Model

### Buyers Table
- `id` (UUID, Primary Key)
- `fullName` (string, 2-80 chars)
- `email` (string, optional)
- `phone` (string, 10-15 digits)
- `city` (enum: Chandigarh|Mohali|Zirakpur|Panchkula|Other)
- `propertyType` (enum: Apartment|Villa|Plot|Office|Retail)
- `bhk` (enum: 1|2|3|4|Studio, required for Apartment/Villa)
- `purpose` (enum: Buy|Rent)
- `budgetMin` (integer, optional)
- `budgetMax` (integer, optional, must be >= budgetMin)
- `timeline` (enum: 0-3m|3-6m|>6m|Exploring)
- `source` (enum: Website|Referral|Walk-in|Call|Other)
- `status` (enum: New|Qualified|Contacted|Visited|Negotiation|Converted|Dropped)
- `notes` (text, optional, max 1000 chars)
- `tags` (string array, optional)
- `ownerId` (UUID, foreign key to users)
- `createdAt`, `updatedAt` (timestamps)

### Buyer History Table
- `id` (UUID, Primary Key)
- `buyerId` (UUID, foreign key)
- `changedBy` (UUID, foreign key to users)
- `changedAt` (timestamp)
- `diff` (JSON object with field changes)

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### 1. Clone and Install
```bash
git clone <repository-url>
cd buyer-lead-intake
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/buyer_leads"

# App
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup
```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (for development)
npm run db:push
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Usage

### Authentication
- Enter any email address to sign in (demo authentication)
- The system will create a user account automatically

### Managing Leads
1. **Create Lead**: Click "New Lead" button and fill out the form
2. **View/Edit**: Click "View/Edit" on any lead in the list
3. **Search**: Use the search bar to find leads by name, phone, or email
4. **Filter**: Use dropdown filters for city, property type, status, and timeline
5. **Export**: Click "Export CSV" to download filtered results
6. **Import**: Click "Import CSV" to upload a CSV file with leads

### CSV Import Format
The CSV should have these headers:
```
fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status
```

### Validation Rules
- **Full Name**: 2-80 characters, required
- **Phone**: 10-15 digits, required
- **Email**: Valid email format, optional
- **BHK**: Required for Apartment and Villa properties
- **Budget**: Max must be >= Min when both provided
- **Notes**: Maximum 1000 characters

## API Endpoints

- `GET /api/buyers` - List buyers with pagination and filters
- `POST /api/buyers` - Create new buyer
- `GET /api/buyers/[id]` - Get buyer details with history
- `PUT /api/buyers/[id]` - Update buyer
- `DELETE /api/buyers/[id]` - Delete buyer
- `POST /api/buyers/import` - Import CSV file
- `GET /api/buyers/export` - Export CSV file
- `POST /api/auth/login` - User authentication
- `DELETE /api/auth/login` - User logout

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Design Decisions

### Validation Strategy
- **Client-side**: React Hook Form with Zod resolver for immediate feedback
- **Server-side**: Zod validation in API routes for security
- **CSV Import**: Row-by-row validation with detailed error reporting

### Data Fetching
- **SSR**: Initial page load with server-side data fetching
- **Client-side**: Real-time search and filtering with URL synchronization
- **Pagination**: Server-side pagination for performance

### Ownership & Security
- **Authentication**: Simple demo system (replace with proper auth in production)
- **Authorization**: Users can only edit/delete their own leads
- **Rate Limiting**: Per-user rate limiting on create/update operations
- **Concurrency**: Optimistic locking with updatedAt timestamps

### Error Handling
- **Form Validation**: Field-level error messages
- **API Errors**: Structured error responses with appropriate HTTP status codes
- **CSV Import**: Detailed error reporting with row numbers
- **Concurrency**: Friendly error messages for stale data conflicts

## What's Implemented vs Skipped

### ✅ Implemented
- Complete CRUD operations with validation
- Advanced search and filtering with URL sync
- CSV import/export with error handling
- Real-time form validation
- Responsive design with accessibility
- Rate limiting and basic security
- Unit tests for validation logic
- Database migrations and schema management

### ⏭️ Skipped (Nice-to-haves)
- Tag chips with typeahead (basic tag input implemented)
- Status quick-actions in table (full edit form available)
- Full-text search on notes (basic search implemented)
- Optimistic updates with rollback (standard form submission)
- File upload for attachments (not in requirements)
- Admin role for editing all leads (ownership-based access)

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Ensure database is accessible from production environment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request


# Mini_Buyer
Buyer Lead Intake App built with Next.js &amp; TypeScript for managing real estate leads. Features include lead capture, validation, CSV import/export, search with filters, pagination, history tracking, and secure user-based editing.

