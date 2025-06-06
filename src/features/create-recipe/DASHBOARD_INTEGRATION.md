# 🎯 Dashboard Integration Guide

## ✅ **Ready to Use!**

The Essential Oil Recipe Creator is **100% ready** for dashboard integration. Here's exactly how to use it:

## 🚀 **Quick Start**

### **Option 1: Full Dashboard Layout (Recommended)**
```typescript
import { WizardContainer } from '@/features/create-recipe/components/wizard-container';

export function DashboardRecipePage() {
  return (
    <WizardContainer layout="dashboard" />
  );
}
```

### **Option 2: Custom Dashboard Integration**
```typescript
import { WizardContainer } from '@/features/create-recipe/components/wizard-container';

export function CustomDashboardRecipePage() {
  return (
    <WizardContainer 
      layout="dashboard"
      showBreadcrumbs={true}
      showProgress={true}
      className="max-w-6xl mx-auto"
    />
  );
}
```

### **Option 3: Minimal Integration**
```typescript
import { WizardContainer } from '@/features/create-recipe/components/wizard-container';

export function MinimalRecipePage() {
  return (
    <WizardContainer 
      layout="standalone"
      className="p-6"
    />
  );
}
```

## 📁 **Where to Add It**

### **1. Create a Dashboard Page**
Create a new file: `src/app/dashboard/create-recipe/page.tsx`

```typescript
import { WizardContainer } from '@/features/create-recipe/components/wizard-container';

export default function CreateRecipePage() {
  return (
    <WizardContainer layout="dashboard" />
  );
}
```

### **2. Add to Dashboard Navigation**
Update your dashboard navigation to include:

```typescript
// In your dashboard navigation component
const navigationItems = [
  // ... other items
  {
    name: 'Create Recipe',
    href: '/dashboard/create-recipe',
    icon: '🌿'
  }
];
```

### **3. Add Route Protection (if needed)**
```typescript
// In your dashboard layout or middleware
import { auth } from '@/lib/auth'; // Your auth system

export default function CreateRecipePage() {
  // Add authentication check if needed
  return (
    <WizardContainer layout="dashboard" />
  );
}
```

## 🎨 **Layout Options**

### **Available Layouts**
- ✅ **`dashboard`** - Full dashboard integration with sidebar and progress
- ✅ **`mobile`** - Mobile-first layout (default)
- ✅ **`standalone`** - Minimal wrapper for custom layouts

### **Configuration Props**
```typescript
interface WizardContainerProps {
  layout?: 'mobile' | 'dashboard' | 'standalone';
  showBreadcrumbs?: boolean;    // Show navigation breadcrumbs
  showProgress?: boolean;       // Show progress sidebar (dashboard only)
  className?: string;           // Custom CSS classes
  currentStep?: RecipeStep;     // Override current step
}
```

## 🔧 **Dashboard Layout Features**

When using `layout="dashboard"`, you get:

### **✅ Dashboard Header**
- Page title and description
- Current step badge
- Breadcrumb navigation

### **✅ Progress Sidebar**
- Step-by-step progress tracking
- Completion percentage
- Visual step indicators
- Quick action buttons

### **✅ Responsive Design**
- Desktop: 3-column layout (content + sidebar)
- Mobile: Stacked layout with collapsible sidebar

### **✅ Dashboard Integration**
- Consistent styling with your dashboard theme
- Proper spacing and typography
- Card-based layout

## 📱 **Mobile Responsiveness**

The dashboard layout is fully responsive:

- **Desktop (lg+)**: 3-column grid with sidebar
- **Tablet (md)**: 2-column layout
- **Mobile (sm)**: Single column with collapsible progress

## 🎯 **Complete Example**

Here's a complete example of dashboard integration:

```typescript
// src/app/dashboard/create-recipe/page.tsx
'use client';

import { WizardContainer } from '@/features/create-recipe/components/wizard-container';
import { useAuth } from '@/hooks/use-auth'; // Your auth hook

export default function CreateRecipePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to create recipes.</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <WizardContainer 
        layout="dashboard"
        showBreadcrumbs={true}
        showProgress={true}
        className="max-w-7xl mx-auto"
      />
    </div>
  );
}
```

## 🔄 **Migration from Standalone**

If you're currently using the recipe creator standalone:

### **Before (Standalone)**
```typescript
<WizardContainer />
```

### **After (Dashboard)**
```typescript
<WizardContainer layout="dashboard" />
```

That's it! **One prop change** and you're done! 🎉

## 🛠️ **Advanced Customization**

### **Custom Dashboard Layout**
If you need a completely custom layout, use the standalone option:

```typescript
export function CustomRecipeLayout() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Your custom sidebar */}
      <div className="xl:col-span-1">
        <CustomSidebar />
      </div>
      
      {/* Recipe creator */}
      <div className="xl:col-span-3">
        <WizardContainer 
          layout="standalone"
          className="bg-card rounded-lg border p-6"
        />
      </div>
    </div>
  );
}
```

### **Modal Integration**
```typescript
export function RecipeModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <WizardContainer 
        layout="standalone"
        className="max-h-[80vh] overflow-y-auto"
      />
    </Modal>
  );
}
```

## 🎉 **You're Ready!**

The Essential Oil Recipe Creator is now **fully ready** for dashboard integration. Just:

1. ✅ Import `WizardContainer`
2. ✅ Set `layout="dashboard"`
3. ✅ Add to your dashboard route
4. ✅ Enjoy the seamless integration!

No additional setup or configuration required! 🌿✨
