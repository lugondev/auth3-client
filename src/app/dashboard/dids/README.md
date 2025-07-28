# DID Management Pages Structure

## Overview
This directory contains the DID (Decentralized Identifier) management pages for the Auth3 application. The structure has been organized to provide clear separation of concerns and better user experience.

## Page Structure

### `/dashboard/dids/` - Main Dashboard
- **File**: `page.tsx`
- **Purpose**: Main DID management dashboard with overview and table views
- **Features**:
  - Statistics cards showing DID metrics
  - Overview tab with card-based DID listing
  - Table view with pagination for bulk management
  - Document viewer for selected DIDs
  - DID resolver for testing
  - Quick actions (view, edit, deactivate, revoke)

### `/dashboard/dids/[didId]/` - DID Details
- **File**: `[didId]/page.tsx`
- **Purpose**: Detailed view of a specific DID
- **Features**:
  - Complete DID document display
  - Metadata and status information
  - Download functionality
  - Management actions (edit, deactivate, revoke)
  - History tracking

### `/dashboard/dids/[didId]/edit/` - DID Editor
- **File**: `[didId]/edit/page.tsx`
- **Purpose**: Dedicated editing page for DID documents
- **Features**:
  - Full-screen editing environment
  - Unsaved changes detection
  - Navigation protection
  - Save/cancel functionality
  - Validation and error handling

### `/dashboard/dids/create/` - DID Creation
- **File**: `create/page.tsx`
- **Purpose**: Create new DID documents
- **Features**:
  - Method selection
  - Key generation options
  - Service endpoint configuration

## Navigation Flow

1. **Main Dashboard** → View all DIDs, quick actions
2. **DID Details** → Deep dive into specific DID
3. **DID Editor** → Focused editing experience
4. **Back to Dashboard** → Return to main view

## Edit Functionality Access Points

Users can access the edit functionality from multiple locations:

1. **Main Dashboard**:
   - Header "Edit Document" button (when DID selected)
   - Overview card dropdown menu
   - Table view dropdown menu

2. **DID Details Page**:
   - Header "Edit" button

3. **Direct URL**:
   - `/dashboard/dids/[didId]/edit`

## Benefits of Separate Edit Page

1. **Better UX**: Dedicated editing environment without distractions
2. **Navigation Safety**: Prevents accidental loss of changes
3. **Performance**: Only loads editing components when needed
4. **Maintainability**: Clear separation of concerns
5. **Mobile Friendly**: Full-screen editing on smaller devices

## Technical Notes

- All pages use TypeScript with proper type safety
- Consistent error handling and loading states
- Responsive design for all screen sizes
- Integration with existing DID services
- Proper state management and navigation
