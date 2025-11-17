# Fix for Mitra Avatar Issue in Search Page

## Problem Analysis

When users search for "mitra" type (partners) at `/search?keyword=a&type=mitra`, if a partner doesn't have a profile photo, the system should display their first letter as an avatar with a random background color. Currently, this is not working correctly.

## Root Cause

The issue is in the `getImageUrl` function in `resources/js/Pages/Search/Index.jsx`. The function has special handling for non-mitra types when there's no thumbnail (line 62-63), but it doesn't properly handle the mitra type.

## Current Code Issue

```javascript
const getImageUrl = (thumbnail, type) => {
    console.log(type);
    // Kembalikan null jika tidak ada thumbnail, agar kita bisa render avatar huruf
    if ((!thumbnail || thumbnail === null) && type !== "mitra")
        return `${baseUrl}/storage/default-event-images/dubby.webp`;
    // ... rest of the function
};
```

The problem is that when `type` is "mitra" and there's no thumbnail, the function doesn't return anything (implicitly returns `undefined`), which causes issues in the rendering logic.

## Solution

We need to modify the `getImageUrl` function to explicitly return `null` for mitra type when there's no thumbnail. This will trigger the fallback to show the avatar with initials.

## Fix Implementation

1. Modify the `getImageUrl` function to explicitly handle the mitra type case
2. Ensure that when a mitra has no thumbnail, the function returns `null`
3. This will allow the existing avatar fallback logic (lines 222-234) to work correctly

## Code Changes

In `resources/js/Pages/Search/Index.jsx`, modify the `getImageUrl` function:

```javascript
const getImageUrl = (thumbnail, type) => {
    console.log(type);
    // Kembalikan null jika tidak ada thumbnail, agar kita bisa render avatar huruf
    if (!thumbnail || thumbnail === null) {
        // For mitra type, return null to trigger avatar fallback
        if (type === "mitra") {
            return null;
        }
        // For other types, return default image
        return `${baseUrl}/storage/default-event-images/dubby.webp`;
    }
    if (thumbnail.includes("default-event-images"))
        return `${baseUrl}/storage/${thumbnail}`;
    if (thumbnail.includes("thumbnails"))
        return `${baseUrl}/storage/${thumbnail}`;
    return thumbnail.startsWith("http")
        ? thumbnail
        : `${baseUrl}/storage/thumbnails/${thumbnail}`;
};
```

## Testing

After implementing the fix, test the following scenarios:

1. Search for mitra with a profile photo - should display the photo
2. Search for mitra without a profile photo - should display the first letter with random background color
3. Search for other types (events, buildings, etc.) without photos - should display default images

## Expected Outcome

After the fix, mitra without profile photos will display their first letter in a colored circle with a random background color, as intended.
