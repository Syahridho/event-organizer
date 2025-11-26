# Icon Optimization Migration Guide

## Problem
React-icons causing 19MB payload due to importing entire icon libraries.

## Solution Implemented
Created optimized Icon component with:
1. **Pre-loaded critical icons** (no lazy loading delay)
2. **Lazy loaded non-critical icons** (code splitting)
3. **Vite code splitting** for each icon library

## How to Use

### Option 1: Pre-loaded Icons (Recommended for Critical Path)
```jsx
import Icon, { IoCart, IoPersonCircle } from '@/components/Icon';

// Direct use (no lazy loading)
<IoCart className="w-5 h-5" />
<IoPersonCircle className="w-6 h-6" />
```

### Option 2: Lazy Loaded Icons (For Non-Critical)
```jsx
import Icon from '@/components/Icon';

// Lazy loaded with Suspense
<Icon name="FaMoneyBillTransfer" library="fa6" className="w-5 h-5" />
<Icon name="MdOutlineEmail" library="md" className="w-5 h-5" />
```

## Pre-loaded Icons List
Currently pre-loaded (no lazy loading):
- `IoCart` (io5)
- `IoPersonCircle` (io5)
- `IoTicket` (io5)
- `FaBuilding` (fa)
- `FaShoppingCart` (fa)
- `FaMapMarkerAlt` (fa)
- `GiMicrophone` (gi)
- `GrFanOption` (gr)

## Icon Library Codes
- `io5` - Ionicons 5
- `io` - Ionicons
- `fa` - Font Awesome
- `fa6` - Font Awesome 6
- `gi` - Game Icons
- `gr` - Grommet Icons
- `md` - Material Design
- `hi` - Hero Icons
- `tb` - Tabler Icons
- `pi` - Phosphor Icons
- `ti` - Typicons

## Migration Steps for Other Files

### Files to Update:
1. ✅ `Pages/Welcome.jsx` - DONE
2. `Pages/Purchase/Index.jsx`
3. `Pages/Mitra/Withdraw/Index.jsx`
4. `Pages/Home/DetailEvent.jsx`
5. `Pages/Home/DetailService.jsx`
6. `Pages/Home/DetailProperty.jsx`
7. `Pages/Home/DetailBuilding.jsx`
8. `Pages/Checkout/Index.jsx`
9. `Layouts/App/AppSidebarLayout.jsx`
10. `Components/paymentSheet.jsx`
11. `Components/footer.jsx`
12. `Components/address-manager.jsx`

### Migration Pattern:

#### Before:
```jsx
import { IoCart, IoPersonCircle } from "react-icons/io5";
import { FaBuilding } from "react-icons/fa";
import { GiMicrophone } from "react-icons/gi";

<IoCart className="w-5 h-5" />
<FaBuilding className="w-6 h-6" />
```

#### After (Critical Icons):
```jsx
import Icon, { IoCart, FaBuilding } from "@/components/Icon";

<IoCart className="w-5 h-5" />
<FaBuilding className="w-6 h-6" />
```

#### After (Non-Critical Icons):
```jsx
import Icon from "@/components/Icon";

<Icon name="FaMoneyBillTransfer" library="fa6" className="w-5 h-5" />
<Icon name="MdOutlineEmail" library="md" className="w-5 h-5" />
```

## Adding More Pre-loaded Icons

If you need to add more critical icons to pre-load:

1. Edit `resources/js/components/Icon.jsx`
2. Add import at top:
```jsx
import { YourIcon } from 'react-icons/xx';
```
3. Add to preloadedIcons object:
```jsx
const preloadedIcons = {
    // ... existing
    YourIcon,
};
```
4. Export it:
```jsx
export {
    // ... existing
    YourIcon,
};
```

## Expected Performance Improvement

### Before:
- Initial bundle: ~19 MB
- react-icons_gi.js: 6.8 MB
- react-icons_md.js: 5.2 MB
- react-icons_fa6.js: 4.1 MB

### After:
- Initial bundle: ~200-300 KB (only critical icons)
- Icon libraries: Lazy loaded on demand
- Each icon library: Separate chunk (100-500 KB each)
- **Total reduction: ~95%** 🚀

## Testing

### 1. Build Production
```bash
npm run build
```

### 2. Check Bundle Sizes
```bash
# Check icon chunks
ls -lh public/build/assets/js/icons-*.js
```

### 3. Test Performance
```
1. Stop npm run dev
2. Clear cache
3. Open incognito
4. Run Lighthouse
5. Expected score: 85-95
```

## Troubleshooting

### Icon not showing
1. Check icon name spelling
2. Verify library code is correct
3. Check browser console for errors

### Still large bundle
1. Verify you're using production build
2. Check if icons are imported directly elsewhere
3. Run build and check bundle analyzer

### Lazy loading delay
1. Add icon to pre-loaded list if critical
2. Or accept small delay for non-critical icons
3. Skeleton loader shows during load

## Next Steps

1. ✅ Welcome.jsx updated
2. ⏳ Update other 11 files (see list above)
3. ⏳ Build production
4. ⏳ Test performance
5. ⏳ Verify bundle size reduction

## Automation Script (Optional)

To update all files at once, you can use find/replace:

**Find:**
```
import { (.*) } from "react-icons/(.*)";
```

**Replace:**
```
import Icon from "@/components/Icon";
// Use: <Icon name="IconName" library="xx" />
```

Then manually update each icon usage based on whether it's critical or not.
