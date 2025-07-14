# Tab Man - Bill Splitting App Documentation

## Project Overview

**Tab Man** is a mobile-first web application designed to simplify bill splitting for group outings. The app allows users to create "tabs" for group activities, scan receipts using OCR technology, and automatically itemize expenses for easy splitting among friends.

## Core Concept

The app solves the universal problem of splitting bills after group outings by:

- Eliminating manual calculations and awkward money conversations
- Providing real-time collaboration on expense tracking
- Automating receipt processing through photo scanning
- Streamlining payment coordination between friends

## User Flow

### 1. Tab Creation

- User clicks "Create New Tab" on home screen
- Enters tab name (e.g., "Dinner at Mario's", "Coffee Run")
- Optionally invites friends to join the tab immediately
- Tab is created and ready for use

### 2. Adding Places/Venues

- User adds venues to the tab (restaurants, bars, arcades, etc.)
- Each venue becomes a separate "place" within the tab
- Multiple receipts can be added per place if needed

### 3. Receipt Scanning

- User takes photo of receipt/bill at each venue
- App uses OCR to automatically itemize the bill
- Items are extracted with names and prices
- Manual editing available for OCR corrections

### 4. Collaborative Item Assignment

- Friends join the tab via invitation
- Each person marks which items they purchased/consumed
- Items can be shared between multiple people
- Real-time updates show everyone's selections

### 5. Automatic Calculation

- App calculates each person's total automatically
- Includes tax and tip distribution
- Shows itemized breakdown for transparency
- Generates payment requests to tab creator

## Technical Architecture

### Frontend

- **Framework**: SvelteKit
- **Styling**: CSS with modern design principles
- **State Management**: Svelte stores for tab data
- **Routing**: File-based routing with dynamic tab pages

### Key Features to Implement

#### Phase 1 - Core Functionality

- [ ] Tab creation and management
- [ ] Basic user interface and navigation
- [ ] Tab sharing/invitation system
- [ ] Manual bill entry (before OCR)

#### Phase 2 - Receipt Processing

- [ ] Camera integration for photo capture
- [ ] OCR implementation for receipt scanning
- [ ] Item extraction and parsing
- [ ] Manual editing interface for corrections

#### Phase 3 - Collaboration

- [ ] Real-time collaboration features
- [ ] Item assignment interface
- [ ] User management within tabs
- [ ] Notification system for updates

#### Phase 4 - Payments

- [ ] Payment integration (Venmo, PayPal, etc.)
- [ ] Payment request generation
- [ ] Transaction tracking
- [ ] Settlement notifications

## Data Models

### Tab

```typescript
interface Tab {
	id: string;
	name: string;
	createdBy: string;
	createdAt: Date;
	members: User[];
	places: Place[];
	status: 'active' | 'completed' | 'archived';
	totalAmount: number;
}
```

### Place

```typescript
interface Place {
	id: string;
	name: string;
	address?: string;
	receipts: Receipt[];
	addedAt: Date;
}
```

### Receipt

```typescript
interface Receipt {
	id: string;
	placeId: string;
	imageUrl: string;
	items: Item[];
	subtotal: number;
	tax: number;
	tip: number;
	total: number;
	processedAt: Date;
}
```

### Item

```typescript
interface Item {
	id: string;
	name: string;
	price: number;
	quantity: number;
	assignedTo: string[]; // User IDs who claimed this item
	category?: string;
}
```

### User

```typescript
interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	paymentMethods: PaymentMethod[];
}
```

## User Experience Considerations

### Mobile-First Design

- Touch-friendly interface elements
- Optimized for one-handed use
- Fast loading and responsive design
- Camera integration for receipt scanning

### Accessibility

- Screen reader compatible
- High contrast mode support
- Large touch targets
- Clear visual hierarchy

### Performance

- Offline capability for basic features
- Image compression for receipt photos
- Efficient state management
- Fast navigation between screens

## Potential Challenges

### Technical Challenges

1. **OCR Accuracy**: Restaurant receipts vary widely in format and quality
2. **Real-time Sync**: Ensuring all users see updates simultaneously
3. **Image Processing**: Optimizing photo capture and processing
4. **Cross-platform Compatibility**: Ensuring consistent experience across devices

### User Experience Challenges

1. **Adoption Friction**: All group members need the app
2. **Privacy Concerns**: Some users uncomfortable with spending tracking
3. **Payment Integration**: Supporting multiple payment platforms
4. **Edge Cases**: Handling shared items, discounts, complex receipts

### Business Challenges

1. **Monetization Strategy**: How to generate revenue sustainably
2. **User Retention**: Keeping users engaged between group outings
3. **Competition**: Differentiating from existing solutions
4. **Scalability**: Handling growth in users and data

## Success Metrics

### User Engagement

- Monthly active users
- Average tabs created per user
- Time spent in app per session
- User retention rates

### Feature Usage

- Receipt scanning success rate
- Manual vs. automated item entry
- Collaboration participation rates
- Payment completion rates

### Business Metrics

- User acquisition cost
- Revenue per user
- Customer lifetime value
- App store ratings and reviews

## Development Roadmap

### Sprint 1 (Weeks 1-2)

- Set up basic SvelteKit project structure
- Create tab creation flow
- Implement basic navigation
- Design core UI components

### Sprint 2 (Weeks 3-4)

- Add user management system
- Implement tab sharing/invitation
- Create place management interface
- Add manual bill entry

### Sprint 3 (Weeks 5-6)

- Integrate camera functionality
- Implement basic OCR processing
- Create item assignment interface
- Add collaborative features

### Sprint 4 (Weeks 7-8)

- Polish user experience
- Add payment integration
- Implement notifications
- Conduct user testing

## Notes and Ideas

### Future Enhancements

- **AI-Powered Suggestions**: Learn user preferences for faster item assignment
- **Location Integration**: Automatically detect venue information
- **Social Features**: Share tabs on social media, group statistics
- **Advanced Analytics**: Spending patterns, favorite venues, group insights
- **Subscription Model**: Premium features for power users

### Technical Improvements

- **Progressive Web App**: Offline functionality and app-like experience
- **Push Notifications**: Real-time updates and reminders
- **API Integration**: Connect with restaurant POS systems
- **Machine Learning**: Improve OCR accuracy over time

---

_Last Updated: July 13, 2025_
_Version: 1.0_
